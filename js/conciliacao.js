// ══════════════════════════════════════════════════════════
//  conciliacao.js — Módulo de Conciliação Inteligente
//  Importação OFX/PDF · Amarração Contábil · Export Único
// ══════════════════════════════════════════════════════════

// ─── STATE ───
let concState = {
  view: 'home',        // home | import | grid | export
  clienteId: null,
  transacoes: [],
  amarracoes: {},      // { idx: { contaDebito, contaCredito, historico, norma } }
  bancoInfo: {},
  filtroGrid: '',
  selectedPlan: null,
};

// ─── REGRAS ITG/CPC PARA SUGESTÃO INTELIGENTE ───
const REGRAS_CPC_ITG = {
  // ITG 2000 — Escrituração Contábil (PME)
  itg2000: {
    norma: 'ITG 2000 (R1)',
    titulo: 'Escrituração Contábil',
    aplicacao: ['Simples Nacional', 'MEI'],
    descricao: 'Norma que estabelece critérios e procedimentos para a escrituração contábil das entidades, incluindo ME e EPP optantes pelo Simples Nacional.',
    obrigacoes: ['Livro Diário', 'Balancete de Verificação', 'Balanço Patrimonial', 'DRE'],
  },
  // ITG 1000 — Contabilidade Simplificada para ME e EPP
  itg1000: {
    norma: 'ITG 1000',
    titulo: 'Modelo Contábil para ME e EPP',
    aplicacao: ['Simples Nacional'],
    descricao: 'Modelo contábil simplificado para microempresas e empresas de pequeno porte.',
    obrigacoes: ['Balanço Patrimonial Simplificado', 'DRE Simplificada'],
  },
  // NBC TG 1000 — PME
  nbctg1000: {
    norma: 'NBC TG 1000 (R1)',
    titulo: 'Contabilidade para PME',
    aplicacao: ['Lucro Presumido'],
    descricao: 'Norma completa para pequenas e médias empresas que não têm obrigação pública de prestação de contas.',
    obrigacoes: ['BP', 'DRE', 'DRA', 'DMPL', 'DFC', 'Notas Explicativas'],
  },
  // NBC TG Geral — Lucro Real / Grande Porte
  nbctgGeral: {
    norma: 'NBC TG (Geral/Full IFRS)',
    titulo: 'Normas Completas (CPC)',
    aplicacao: ['Lucro Real'],
    descricao: 'Conjunto completo de pronunciamentos contábeis (CPC 00 a CPC 50), aplicável a empresas de grande porte e sociedades anônimas.',
    obrigacoes: ['BP', 'DRE', 'DRA', 'DMPL', 'DFC', 'DVA', 'Notas Explicativas'],
  },
};

// ─── REGRAS DE SUGESTÃO DE CONTAS POR PADRÃO DE DESCRIÇÃO ───
const PADROES_SUGESTAO = [
  // ── RECEITAS / ENTRADAS ──
  { regex: /pix\s*(recebido|rec|entrada|cred)/i, tipo: 'credito',
    sugestao: { debito: 'Caixa/Bancos (Ativo Circulante)', credito: 'Clientes / Contas a Receber (Ativo Circulante)', historico: 'Recebimento de cliente via PIX' },
    cpc: 'CPC 47 — Receita de Contrato com Cliente', explicacao: 'O recebimento via PIX representa a liquidação de um direito a receber. Debita-se Caixa (entrada de recurso) e credita-se Clientes (baixa do direito). A receita já foi reconhecida na emissão da NF pelo regime de competência (CPC 47).' },
  { regex: /ted\s*(recebid|entrada|cred)|transferencia\s*(recebid|cred)/i, tipo: 'credito',
    sugestao: { debito: 'Caixa/Bancos (Ativo Circulante)', credito: 'Clientes / Contas a Receber (Ativo Circulante)', historico: 'Recebimento de cliente via TED' },
    cpc: 'CPC 47 — Receita de Contrato com Cliente', explicacao: 'Idêntico ao PIX: liquidação de contas a receber. Debita Banco, credita Clientes.' },
  { regex: /deposito|dep\s*dinheiro/i, tipo: 'credito',
    sugestao: { debito: 'Caixa/Bancos (Ativo Circulante)', credito: 'Caixa Físico (Ativo Circulante)', historico: 'Depósito em dinheiro — transferência caixa para banco' },
    cpc: 'ITG 2000 — Escrituração Contábil', explicacao: 'Depósito é mera transferência entre contas de disponibilidade. Não gera receita. Se origem desconhecida, classificar como "Valores a Classificar" até identificação.' },
  { regex: /rend(imento)?s?\s*(poup|aplic|cdb|invest)/i, tipo: 'credito',
    sugestao: { debito: 'Caixa/Bancos (Ativo Circulante)', credito: 'Receitas Financeiras (Resultado)', historico: 'Rendimento de aplicação financeira' },
    cpc: 'CPC 48 — Instrumentos Financeiros', explicacao: 'Rendimentos de aplicações financeiras devem ser reconhecidos pelo regime de competência como receita financeira (CPC 48). Debita-se Banco e credita-se Receita Financeira.' },
  { regex: /resgate|aplic.*resgate/i, tipo: 'credito',
    sugestao: { debito: 'Caixa/Bancos (Ativo Circulante)', credito: 'Aplicações Financeiras (Ativo Circulante)', historico: 'Resgate de aplicação financeira' },
    cpc: 'CPC 48 — Instrumentos Financeiros', explicacao: 'Resgate representa conversão de ativo financeiro em disponibilidade. Não é receita — é reclassificação patrimonial.' },
  { regex: /estorno|devoluc/i, tipo: 'credito',
    sugestao: { debito: 'Caixa/Bancos (Ativo Circulante)', credito: 'Despesas Diversas (Resultado)', historico: 'Estorno/devolução de valor' },
    cpc: 'CPC 23 — Políticas Contábeis', explicacao: 'Estornos devem reverter o lançamento original. Verificar a natureza da operação estornada para classificação correta.' },

  // ── DESPESAS / SAÍDAS ──
  { regex: /pix\s*(enviado|env|saida|deb|pago|pagto)/i, tipo: 'debito',
    sugestao: { debito: 'Fornecedores / Contas a Pagar (Passivo Circulante)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento a fornecedor via PIX' },
    cpc: 'CPC 25 — Provisões e Passivos', explicacao: 'Pagamento via PIX liquida uma obrigação. Debita-se Fornecedores (baixa do passivo) e credita-se Banco (saída de caixa). Se for despesa direta sem NF prévia, debitar a conta de despesa correspondente.' },
  { regex: /ted\s*(enviado|saida|pago)|transferencia\s*(enviada|pago)/i, tipo: 'debito',
    sugestao: { debito: 'Fornecedores / Contas a Pagar (Passivo Circulante)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento a fornecedor via TED' },
    cpc: 'CPC 25 — Provisões e Passivos', explicacao: 'Liquidação de passivo por TED. Mesma lógica do pagamento PIX.' },
  { regex: /boleto|pgto\s*boleto|pag.*bol/i, tipo: 'debito',
    sugestao: { debito: 'Fornecedores / Contas a Pagar (Passivo Circulante)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento de boleto' },
    cpc: 'CPC 25 — Provisões e Passivos', explicacao: 'Pagamento de boleto quita obrigação registrada no passivo. Se for despesa nova, reconhecer simultaneamente a despesa.' },
  { regex: /aluguel|locacao|loc\s/i, tipo: 'debito',
    sugestao: { debito: 'Despesas com Aluguéis (Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento de aluguel' },
    cpc: 'CPC 06 (R2) — Arrendamento / IFRS 16', explicacao: 'CPC 06 exige reconhecimento de arrendamento como ativo de direito de uso + passivo de arrendamento para contratos > 12 meses. Para PMEs (ITG 1000), pode-se lançar como despesa diretamente.' },
  { regex: /energia|luz|eletric/i, tipo: 'debito',
    sugestao: { debito: 'Despesas com Energia Elétrica (Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento de conta de energia' },
    cpc: 'CPC 00 — Estrutura Conceitual', explicacao: 'Despesa operacional reconhecida pelo regime de competência. Debitar despesa no mês de consumo, mesmo que paga no mês seguinte.' },
  { regex: /agua|saneamento|sabesp|corsan/i, tipo: 'debito',
    sugestao: { debito: 'Despesas com Água (Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento de conta de água' },
    cpc: 'CPC 00 — Estrutura Conceitual', explicacao: 'Despesa operacional — regime de competência.' },
  { regex: /telefone|telecom|internet|celular|vivo|claro|tim|oi\s/i, tipo: 'debito',
    sugestao: { debito: 'Despesas com Telecomunicações (Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento de telecomunicações' },
    cpc: 'CPC 00', explicacao: 'Despesa operacional reconhecida pelo regime de competência.' },
  { regex: /salario|folha|pgto\s*func|holerite/i, tipo: 'debito',
    sugestao: { debito: 'Despesas com Salários (Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento de salários' },
    cpc: 'CPC 33 — Benefícios a Empregados', explicacao: 'CPC 33 trata do reconhecimento de obrigações trabalhistas. Salários devem ser provisionados no mês de competência e baixados no pagamento.' },
  { regex: /inss|gps|previdencia/i, tipo: 'debito',
    sugestao: { debito: 'INSS a Recolher (Passivo Circulante)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Recolhimento de INSS' },
    cpc: 'CPC 33 — Benefícios a Empregados', explicacao: 'Baixa do passivo de encargos sociais provisionados no mês de competência.' },
  { regex: /fgts/i, tipo: 'debito',
    sugestao: { debito: 'FGTS a Recolher (Passivo Circulante)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Recolhimento de FGTS' },
    cpc: 'CPC 33', explicacao: 'Baixa do passivo de FGTS provisionado.' },
  { regex: /das\s|simples\s*nac|pgdas/i, tipo: 'debito',
    sugestao: { debito: 'Impostos sobre Receita — DAS (Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento DAS — Simples Nacional' },
    cpc: 'CPC 32 — Tributos sobre o Lucro', explicacao: 'DAS unifica tributos do Simples Nacional. Reconhecer como despesa tributária no resultado.' },
  { regex: /darf|irpj|csll|pis|cofins|irrf/i, tipo: 'debito',
    sugestao: { debito: 'Impostos Federais (Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento de imposto federal (DARF)' },
    cpc: 'CPC 32 — Tributos sobre o Lucro', explicacao: 'Tributos federais recolhidos via DARF. Classificar conforme o tributo específico (IRPJ, CSLL, PIS, COFINS).' },
  { regex: /icms|issqn|iss\b/i, tipo: 'debito',
    sugestao: { debito: 'Impostos sobre Serviços/Mercadorias (Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento de imposto estadual/municipal' },
    cpc: 'CPC 32', explicacao: 'Tributos sobre operações. ICMS pode gerar crédito fiscal dependendo do regime.' },
  { regex: /tarifa|tar\s*banc|manut.*conta|taxa.*banc/i, tipo: 'debito',
    sugestao: { debito: 'Despesas Bancárias (Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Tarifa bancária' },
    cpc: 'CPC 00', explicacao: 'Despesas bancárias são custos operacionais reconhecidos no resultado do período.' },
  { regex: /iof/i, tipo: 'debito',
    sugestao: { debito: 'IOF (Despesas Financeiras — Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'IOF sobre operação financeira' },
    cpc: 'CPC 48', explicacao: 'IOF incide sobre operações financeiras e deve ser classificado como despesa financeira.' },
  { regex: /juros|encargos|mora|multa/i, tipo: 'debito',
    sugestao: { debito: 'Juros e Multas (Despesas Financeiras — Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Juros/multa por atraso' },
    cpc: 'CPC 12 — Ajuste a Valor Presente', explicacao: 'Encargos financeiros devem ser reconhecidos no resultado financeiro do período de competência (CPC 12).' },
  { regex: /saque|retirada/i, tipo: 'debito',
    sugestao: { debito: 'Caixa Físico (Ativo Circulante)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Saque/retirada em espécie' },
    cpc: 'ITG 2000', explicacao: 'Transferência entre disponibilidades. Se for retirada do sócio, classificar como "Adiantamento a Sócios" ou "Distribuição de Lucros".' },
  { regex: /pro.?labore|prolabore|retirada.*socio/i, tipo: 'debito',
    sugestao: { debito: 'Pró-labore (Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento de pró-labore ao sócio' },
    cpc: 'CPC 33 — Benefícios a Empregados', explicacao: 'Pró-labore é remuneração do sócio administrador. Reconhecer como despesa no resultado e provisionar INSS.' },
  { regex: /emprestimo|financ/i, tipo: 'debito',
    sugestao: { debito: 'Empréstimos e Financiamentos (Passivo)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento de parcela de empréstimo' },
    cpc: 'CPC 48 — Instrumentos Financeiros', explicacao: 'Parcela de empréstimo: parte principal reduz o passivo, parte juros vai para despesas financeiras. Segregar principal e encargos.' },
  { regex: /aplic|invest|cdb|rdb|lci|lca/i, tipo: 'debito',
    sugestao: { debito: 'Aplicações Financeiras (Ativo Circulante)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Aplicação financeira' },
    cpc: 'CPC 48', explicacao: 'Reclassificação de disponibilidade para aplicação financeira. Não é despesa.' },
];

// ─── PARSER OFX NATIVO ───
function parseOFX(text) {
  const txns = [];
  const bankMatch = text.match(/<BANKID>(\d+)/);
  const acctMatch = text.match(/<ACCTID>([^<\r\n]+)/);
  const banco = bankMatch ? bankMatch[1] : '';
  const conta = acctMatch ? acctMatch[1].trim() : '';

  const stmtMatch = text.match(/<DTSTART>(\d{8})/);
  const stmtEnd = text.match(/<DTEND>(\d{8})/);
  const dtStart = stmtMatch ? stmtMatch[1] : '';
  const dtEnd = stmtEnd ? stmtEnd[1] : '';

  const balMatch = text.match(/<BALAMT>([^<\r\n]+)/);
  const saldo = balMatch ? parseFloat(balMatch[1].trim().replace(',','.')) : 0;

  // Parse transactions
  const stmtTrnBlocks = text.split(/<STMTTRN>/i).slice(1);
  stmtTrnBlocks.forEach((block, idx) => {
    const get = (tag) => {
      const m = block.match(new RegExp(`<${tag}>([^<\\r\\n]+)`, 'i'));
      return m ? m[1].trim() : '';
    };
    const dtPosted = get('DTPOSTED');
    const trnType = get('TRNTYPE');
    const trnAmt = get('TRNAMT');
    const memo = get('MEMO');
    const name = get('NAME');
    const fitId = get('FITID');

    const valor = parseFloat((trnAmt || '0').replace(',', '.'));
    const data = dtPosted.length >= 8
      ? `${dtPosted.slice(6,8)}/${dtPosted.slice(4,6)}/${dtPosted.slice(0,4)}`
      : dtPosted;

    txns.push({
      id: fitId || `txn_${idx}`,
      data,
      dataSort: dtPosted.slice(0,8),
      descricao: (memo || name || '').trim(),
      valor: Math.abs(valor),
      tipo: valor >= 0 ? 'credito' : 'debito',
      tipoOFX: trnType,
      original: valor,
    });
  });

  txns.sort((a, b) => a.dataSort.localeCompare(b.dataSort));

  return {
    banco, conta,
    periodo: dtStart && dtEnd
      ? `${dtStart.slice(6,8)}/${dtStart.slice(4,6)}/${dtStart.slice(0,4)} a ${dtEnd.slice(6,8)}/${dtEnd.slice(4,6)}/${dtEnd.slice(0,4)}`
      : '',
    saldo, transacoes: txns,
  };
}

// ─── IDENTIFICAR ITG APLICÁVEL ───
function identificarITG(clienteId) {
  const clientes = DB.get('clientes') || [];
  const c = clientes.find(x => x.id === clienteId);
  if (!c) return REGRAS_CPC_ITG.itg2000;

  if (c.regime === 'Lucro Real') return REGRAS_CPC_ITG.nbctgGeral;
  if (c.regime === 'Lucro Presumido') return REGRAS_CPC_ITG.nbctg1000;
  if (c.ci_itg_porte === 'Microempresa (ME)' || c.ci_itg_porte === 'Empresa de Pequeno Porte (EPP)') return REGRAS_CPC_ITG.itg1000;
  return REGRAS_CPC_ITG.itg2000;
}

// ─── SUGERIR CONTA CONTÁBIL ───
function sugerirConta(descricao, valor, tipo) {
  const desc = (descricao || '').toLowerCase();
  for (const p of PADROES_SUGESTAO) {
    if (p.regex.test(desc)) {
      return { ...p.sugestao, cpc: p.cpc, explicacao: p.explicacao, confianca: 'Alta' };
    }
  }
  // Fallback
  if (tipo === 'credito') {
    return {
      debito: 'Caixa/Bancos (Ativo Circulante)',
      credito: '⚠️ Valores a Classificar (Passivo Circulante)',
      historico: descricao,
      cpc: 'ITG 2000 — Escrituração Contábil',
      explicacao: '⚠️ Transação não identificada automaticamente. Necessita classificação manual. Conforme ITG 2000, todo fato contábil deve ser escriturado com base em documento hábil.',
      confianca: 'Baixa — Classificação manual necessária',
    };
  }
  return {
    debito: '⚠️ Valores a Classificar (Ativo Circulante)',
    credito: 'Caixa/Bancos (Ativo Circulante)',
    historico: descricao,
    cpc: 'ITG 2000 — Escrituração Contábil',
    explicacao: '⚠️ Transação não identificada automaticamente. Necessita classificação manual.',
    confianca: 'Baixa — Classificação manual necessária',
  };
}

// ─── BUSCAR CONTA NO PLANO IMPORTADO ───
function buscarContaPlano(texto) {
  const planos = DB.get('planos_contas') || [];
  if (!planos.length) return [];
  const termos = texto.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const results = [];
  planos.forEach(p => {
    p.contas.forEach(c => {
      const desc = (c.descricao || '').toLowerCase();
      const score = termos.reduce((s, t) => s + (desc.includes(t) ? 1 : 0), 0);
      if (score > 0 && c.tipo === 'A') results.push({ ...c, plano: p.nome, score });
    });
  });
  return results.sort((a, b) => b.score - a.score).slice(0, 8);
}

// ─── MAPEAMENTO REAL: EMPRESA → PLANO SCI (da base de produção) ───
const PLANOS_SCI = {
  '90011': { nome: 'SCI — Simplificado', contab: 1, contas: 423 },
  '90113': { nome: 'SCI — Departamentalizado', contab: 5, contas: 707 },
  '90135': { nome: 'Associações', contab: 11, contas: 712 },
  '90139': { nome: 'Partido Político', contab: 18, contas: 1113 },
  '90141': { nome: 'Terceiro Setor', contab: 21, contas: 618 },
  '90022': { nome: 'TSE — Trib. Sup. Eleitor', contab: 44, contas: 0 },
};

function getPlanoCliente(clienteId) {
  const mapa = DB.get('mapa_planos_clientes') || {};
  return mapa[clienteId] || null;
}

// ─── RENDER PRINCIPAL ───
function renderConciliacao() {
  const apiKey = getApiKey();
  const clientes = DB.get('clientes') || [];
  const ativos = clientes.filter(c => c.status === 'Ativo');
  const planos = DB.get('planos_contas') || [];

  if (concState.view === 'grid') return renderConcGrid();
  if (concState.view === 'export') return renderConcExport();

  // ── HOME / IMPORT VIEW ──
  const itgInfo = concState.clienteId ? identificarITG(concState.clienteId) : null;
  const cliente = concState.clienteId ? clientes.find(c => c.id === concState.clienteId) : null;
  const planoCliente = concState.clienteId ? getPlanoCliente(concState.clienteId) : null;

  const selectorOpts = ativos.map(c =>
    `<option value="${c.id}" ${concState.clienteId === c.id ? 'selected' : ''}>#${c.id} — ${c.nome}</option>`
  ).join('');

  const planosOpts = planos.map((p,i) =>
    `<option value="${i}" ${concState.selectedPlan === i ? 'selected' : ''}>${p.nome} (${p.contas.length} contas)</option>`
  ).join('');

  const itgPanel = itgInfo ? `
<div class="card mb-4" style="border-left:4px solid #0ea5e9;background:#f0f9ff">
  <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
    <div>
      <div style="font-weight:800;font-size:15px;color:#0369a1">🧠 ${itgInfo.norma} — ${itgInfo.titulo}</div>
      <div style="font-size:12px;color:#475569;margin-top:4px">${itgInfo.descricao}</div>
    </div>
    <div style="background:#0284c7;color:#fff;padding:8px 16px;border-radius:8px;font-size:12px;font-weight:700">
      Regime: ${cliente?.regime || '—'}
    </div>
  </div>
  <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
    ${itgInfo.obrigacoes.map(o => `<span style="background:#e0f2fe;color:#0369a1;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600">${o}</span>`).join('')}
  </div>
  ${planoCliente ? `<div style="margin-top:10px;font-size:12px;color:#065f46;background:#ecfdf5;padding:8px 12px;border-radius:6px">📊 Plano vinculado: <strong>${planoCliente}</strong></div>` : ''}
</div>` : '';

  const apiWarning = !apiKey ? `<div class="card mb-4" style="border-left:4px solid var(--danger)">
    <div class="flex items-center gap-2"><span style="font-size:20px">⚠️</span><div>
      <strong>API Key necessária para PDFs</strong><br>
      <span class="text-muted text-sm">Importação OFX funciona sem API Key. Para PDFs, configure em <button class="btn btn-ghost btn-sm" onclick="navigate('configuracoes')">⚙️ Configurações</button></span>
    </div></div></div>` : '';

  return `
<div class="card mb-4" style="background:linear-gradient(135deg,#0f172a,#1e3a5f);color:#fff;padding:22px 28px;border-radius:14px;position:relative;overflow:hidden">
  <div style="position:absolute;top:-30px;right:-30px;width:120px;height:120px;background:rgba(255,255,255,0.03);border-radius:50%"></div>
  <div style="position:absolute;bottom:-20px;right:60px;width:80px;height:80px;background:rgba(59,130,246,0.08);border-radius:50%"></div>
  <h2 style="font-size:18px;margin-bottom:6px;display:flex;align-items:center;gap:10px">
    🏦 Conciliação Inteligente <span style="background:rgba(16,185,129,0.2);color:#6ee7b7;padding:3px 10px;border-radius:20px;font-size:11px">v1.0</span>
  </h2>
  <p style="opacity:.8;font-size:13px;max-width:700px">
    Importe extratos OFX/PDF → IA sugere lançamentos contábeis com base em CPC/ITG → Exporte para o Sistema Único.
  </p>
</div>

${apiWarning}

<div class="card mb-4">
  <h3 style="font-size:14px;margin-bottom:14px;color:var(--primary-dark)">1️⃣ Selecionar Cliente e Plano</h3>
  <div class="form-grid">
    <div class="form-group">
      <label>Cliente</label>
      <select id="conc-cliente" style="border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:13px" onchange="concState.clienteId=this.value;render()">
        <option value="">— Selecione o cliente —</option>${selectorOpts}
      </select>
    </div>
    <div class="form-group">
      <label>Plano de Contas (para amarração)</label>
      <select id="conc-plano" style="border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:13px" onchange="concState.selectedPlan=parseInt(this.value)||null">
        <option value="">— Usar sugestão automática —</option>${planosOpts}
      </select>
    </div>
  </div>
</div>

${itgPanel}

<div class="card mb-4">
  <h3 style="font-size:14px;margin-bottom:14px;color:var(--primary-dark)">2️⃣ Importar Extrato Bancário</h3>
  <div class="form-grid">
    <div class="form-group form-full">
      <label>Arquivo OFX, OFC ou PDF</label>
      <input type="file" id="conc-file" multiple accept=".ofx,.ofc,.pdf,.txt"
        style="border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:13px;width:100%;background:var(--card)">
    </div>
  </div>
  <div style="margin-top:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
    <button class="btn btn-primary" onclick="importarExtratoConciliacao()">📥 Importar e Analisar</button>
    <span id="conc-status" class="text-muted text-sm"></span>
  </div>
  <div style="margin-top:10px;font-size:11px;color:var(--text-muted);line-height:1.8">
    <strong>Formatos suportados:</strong><br>
    • <strong>OFX/OFC</strong> — Leitura nativa (sem IA) — instantâneo<br>
    • <strong>PDF</strong> — Leitura via Gemini AI (requer API Key) — ~5 segundos
  </div>
</div>

${concState.transacoes.length ? `
<div style="display:flex;gap:10px;margin-bottom:16px">
  <button class="btn btn-primary" onclick="concState.view='grid';render()">📊 Abrir Grid de Amarração (${concState.transacoes.length} transações)</button>
  <button class="btn btn-ghost" onclick="concState.transacoes=[];concState.amarracoes={};render()">🗑️ Limpar</button>
</div>
<div class="card" style="border-left:4px solid var(--success)">
  <div style="font-weight:700;margin-bottom:8px">✅ ${concState.transacoes.length} transações importadas</div>
  <div style="font-size:12px;color:var(--text-muted)">
    Banco: ${concState.bancoInfo.banco || '—'} · Conta: ${concState.bancoInfo.conta || '—'} · Período: ${concState.bancoInfo.periodo || '—'}
  </div>
  <div style="margin-top:8px;display:flex;gap:16px;font-size:13px">
    <span style="color:var(--success)">↑ Créditos: ${concState.transacoes.filter(t=>t.tipo==='credito').length}</span>
    <span style="color:var(--danger)">↓ Débitos: ${concState.transacoes.filter(t=>t.tipo==='debito').length}</span>
    <span>Total mov.: R$ ${concState.transacoes.reduce((s,t)=>s+t.valor,0).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
  </div>
</div>` : `
<div class="empty-state"><div class="empty-icon">🏦</div><p>Selecione um cliente e importe um extrato OFX ou PDF para iniciar a conciliação.</p></div>`}`;
}

// ─── IMPORTAR EXTRATO ───
async function importarExtratoConciliacao() {
  const fileInput = document.getElementById('conc-file');
  const statusEl = document.getElementById('conc-status');
  if (!fileInput?.files?.length) { alert('Selecione um arquivo.'); return; }
  if (!concState.clienteId) { alert('Selecione um cliente primeiro.'); return; }

  concState.transacoes = [];
  concState.amarracoes = {};

  for (const file of fileInput.files) {
    const ext = file.name.split('.').pop().toLowerCase();
    statusEl.textContent = `⏳ Processando ${file.name}...`;

    if (ext === 'ofx' || ext === 'ofc') {
      const text = await file.text();
      const result = parseOFX(text);
      concState.bancoInfo = { banco: result.banco, conta: result.conta, periodo: result.periodo, saldo: result.saldo };
      concState.transacoes.push(...result.transacoes);
    } else if (ext === 'pdf') {
      if (!getApiKey()) { alert('Configure a API Key para leitura de PDFs.'); continue; }
      const clientes = DB.get('clientes') || [];
      const cli = clientes.find(c => c.id === concState.clienteId);
      try {
        const result = await analisarDocumento(file, 'extrato', cli?.nome || '');
        if (result.transacoes) {
          concState.bancoInfo = { banco: result.banco || '', conta: result.conta || '', periodo: result.periodo || '', saldo: result.saldo_final || 0 };
          result.transacoes.forEach((t, i) => {
            concState.transacoes.push({
              id: `pdf_${i}`, data: t.data || '', dataSort: '',
              descricao: t.descricao || t.memo || '', valor: Math.abs(t.valor || 0),
              tipo: t.tipo || (t.valor >= 0 ? 'credito' : 'debito'),
              tipoOFX: '', original: t.valor || 0,
            });
          });
        }
      } catch (e) { alert(`Erro ao processar PDF: ${e.message}`); }
    }
  }

  // Gerar sugestões automáticas
  concState.transacoes.forEach((t, idx) => {
    concState.amarracoes[idx] = sugerirConta(t.descricao, t.valor, t.tipo);
  });

  statusEl.textContent = `✅ ${concState.transacoes.length} transações importadas.`;
  render();
}

// ─── GRID STATE — filtros por coluna ───
if (!concState.colFilters) {
  concState.colFilters = { data: '', descricao: '', valor: '', debito: '', credito: '', historico: '', conf: '' };
}

// ─── OBTER CONTAS DO PLANO (cache para performance) ───
function getContasAnaliticas() {
  const planos = DB.get('planos_contas') || [];
  // Also check the PLANOS_SEED
  const allPlanos = planos.length ? planos : (typeof PLANOS_SEED !== 'undefined' ? PLANOS_SEED : []);
  // Use the selected plan if specified
  let planIdx = concState.selectedPlan;
  let targetPlanos = allPlanos;
  if (planIdx !== null && planIdx !== undefined && allPlanos[planIdx]) {
    targetPlanos = [allPlanos[planIdx]];
  }
  const contas = [];
  targetPlanos.forEach(p => {
    (p.contas || []).forEach(c => {
      // Only analytical accounts (tipo vazio ou undefined = conta analítica; tipo 'A' also)
      if (!c.tipo || c.tipo === 'A' || c.tipo === '' || c.tipo === 'C') {
        contas.push({
          codigo: c.codigo || c.classificacao || '',
          cod_interno: c.cod_interno || '',
          descricao: c.descricao || c.nome || '',
          grupo: c.grupo || '',
          plano: p.nome || p.id || '',
          natureza: c.natureza || '',
        });
      }
    });
  });
  return contas;
}

// ─── AUTOCOMPLETE DE CONTA CONTÁBIL ───
let _concAutoOpen = null;

function abrirAutocompleteConta(idx, campo, inputEl) {
  var existingDrop = document.getElementById('conc-ac-dropdown');
  if (existingDrop) existingDrop.remove();
  _concAutoOpen = { idx: idx, campo: campo };

  var contas = getContasAnaliticas();
  var query = (inputEl.value || '').toLowerCase();
  var filtered = query.length < 1 ? contas.slice(0, 50) : contas.filter(function(c) {
    var searchStr = ((c.cod_interno||'') + ' ' + (c.codigo||'') + ' ' + (c.descricao||'')).toLowerCase();
    return query.split(/\s+/).every(function(w) { return searchStr.includes(w); });
  }).slice(0, 50);

  var rect = inputEl.getBoundingClientRect();
  var dropdown = document.createElement('div');
  dropdown.id = 'conc-ac-dropdown';
  dropdown.style.cssText =
    'position:fixed;top:' + (rect.bottom+2) + 'px;left:' + rect.left + 'px;width:' + Math.max(rect.width,380) + 'px;' +
    'max-height:280px;overflow-y:auto;background:#fff;border:1px solid #cbd5e1;' +
    'border-radius:8px;box-shadow:0 8px 30px rgba(0,0,0,.18);z-index:9999;font-size:12px;';

  dropdown.innerHTML = _buildDropdownHtml(idx, campo, filtered);
  document.body.appendChild(dropdown);

  setTimeout(function() {
    document.addEventListener('mousedown', _fecharAutocompleteFora, true);
  }, 50);
}

function _buildDropdownHtml(idx, campo, filtered) {
  if (filtered.length === 0) {
    return '<div style="padding:12px;color:#94a3b8;text-align:center">Nenhuma conta encontrada</div>';
  }
  return filtered.map(function(c) {
    var ci = (c.cod_interno||'').replace(/'/g, "\\'");
    var cc = (c.codigo||'').replace(/'/g, "\\'");
    var cd = (c.descricao||'').replace(/'/g, "\\'");
    var codBadge = c.cod_interno ? ('Cód: ' + c.cod_interno) : '-';
    var nat = c.natureza === 'D' ? '⬆D' : (c.natureza === 'C' ? '⬇C' : '');
    return '<div class="conc-ac-item" style="display:flex;align-items:center;gap:8px;padding:7px 12px;cursor:pointer;border-bottom:1px solid #f1f5f9;transition:background .1s"'
      + ' onmouseenter="this.style.background='#eff6ff'" onmouseleave="this.style.background=''"'
      + ' onmousedown="event.preventDefault();selecionarContaAuto('' + idx + '','' + campo + '','' + ci + '','' + cc + '','' + cd + '')">'
      + '<span style="font-family:monospace;background:#f1f5f9;color:#64748b;padding:2px 6px;border-radius:4px;font-weight:700;font-size:10px;white-space:nowrap">' + codBadge + '</span>'
      + '<span style="font-family:monospace;background:#e0f2fe;color:#0369a1;padding:2px 6px;border-radius:4px;font-weight:700;font-size:11px;white-space:nowrap">' + (c.codigo||'') + '</span>'
      + '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#334155">' + (c.descricao||'') + '</span>'
      + '<span style="font-size:9px;color:#94a3b8;white-space:nowrap">' + nat + '</span>'
      + '</div>';
  }).join('');
}

function _fecharAutocompleteFora(e) {
  var dd = document.getElementById('conc-ac-dropdown');
  if (dd && !dd.contains(e.target) && !e.target.classList.contains('conc-ac-input')) {
    dd.remove();
    document.removeEventListener('mousedown', _fecharAutocompleteFora, true);
    _concAutoOpen = null;
  }
}

function selecionarContaAuto(idx, campo, cod_interno, codigo, descricao) {
  var label = cod_interno
    ? (codigo + ' — ' + descricao + ' (Cód: ' + cod_interno + ')')
    : (codigo + ' — ' + descricao);

  if (idx === 'bulk') {
    var inputEl = document.getElementById('bulk-' + campo);
    if (inputEl) inputEl.value = label;
  } else {
    var am = concState.amarracoes[idx];
    if (am) { am[campo] = label; am.confianca = 'Alta'; }
  }

  var dd = document.getElementById('conc-ac-dropdown');
  if (dd) dd.remove();
  document.removeEventListener('mousedown', _fecharAutocompleteFora, true);
  _concAutoOpen = null;
  if (idx !== 'bulk') render();
}

function filtrarAutocompleteConta(idx, campo, inputEl) {
  // Atualiza state sem chamar render() para não perder o foco
  if (idx !== 'bulk') {
    var am = concState.amarracoes[idx];
    if (am) am[campo] = inputEl.value;
  }

  // Reutiliza dropdown já aberto — só atualiza o HTML
  var contas = getContasAnaliticas();
  var query = (inputEl.value || '').toLowerCase();
  var filtered = query.length < 1 ? contas.slice(0, 50) : contas.filter(function(c) {
    var searchStr = ((c.cod_interno||'') + ' ' + (c.codigo||'') + ' ' + (c.descricao||'')).toLowerCase();
    return query.split(/\s+/).every(function(w) { return searchStr.includes(w); });
  }).slice(0, 50);

  var dd = document.getElementById('conc-ac-dropdown');
  if (dd) {
    dd.innerHTML = _buildDropdownHtml(idx, campo, filtered);
  } else {
    abrirAutocompleteConta(idx, campo, inputEl);
  }
}
// ─── AÇÕES EM LOTE ───
window.toggleConcRow = function(idx, checked) {
  if (!concState.selectedRows) concState.selectedRows = {};
  if (checked) concState.selectedRows[idx] = true;
  else delete concState.selectedRows[idx];
  render();
};

window.toggleAllConcRows = function(checked) {
  concState.selectedRows = {};
  if (checked) {
    concState.transacoes.forEach((t, i) => concState.selectedRows[i] = true);
  }
  render();
};

window.aplicarEmLote = function() {
  const debVal = document.getElementById('bulk-debito')?.value || '';
  const credVal = document.getElementById('bulk-credito')?.value || '';
  if (!debVal && !credVal) { alert('Informe ao menos a conta a débito ou crédito.'); return; }
  
  const selectedIndices = Object.keys(concState.selectedRows || {});
  if (!selectedIndices.length) return;

  selectedIndices.forEach(idx => {
    const am = concState.amarracoes[idx];
    if (am) {
      if (debVal) am.debito = debVal;
      if (credVal) am.credito = credVal;
      if (debVal || credVal) am.confianca = 'Alta';
    }
  });

  concState.selectedRows = {}; // limpar seleção após aplicar
  render();
  alert(`✅ Lote aplicado a ${selectedIndices.length} registro(s)!`);
};

// ─── GRID DE AMARRAÇÃO ───
function renderConcGrid() {
  const txns = concState.transacoes;
  const cf = concState.colFilters;

  // Filtro combinado: filtro geral + filtros por coluna
  const filtroGeral = concState.filtroGrid.toLowerCase();
  const filtered = txns.filter((t, i) => {
    const am = concState.amarracoes[i] || {};
    // Filtro geral
    if (filtroGeral) {
      const match = t.descricao.toLowerCase().includes(filtroGeral) ||
        (am.debito||'').toLowerCase().includes(filtroGeral) ||
        (am.credito||'').toLowerCase().includes(filtroGeral) ||
        (am.historico||'').toLowerCase().includes(filtroGeral);
      if (!match) return false;
    }
    // Filtros por coluna
    if (cf.data && !t.data.toLowerCase().includes(cf.data.toLowerCase())) return false;
    if (cf.descricao && !t.descricao.toLowerCase().includes(cf.descricao.toLowerCase())) return false;
    if (cf.valor) {
      const vStr = t.valor.toLocaleString('pt-BR',{minimumFractionDigits:2});
      if (!vStr.includes(cf.valor)) return false;
    }
    if (cf.debito && !(am.debito||'').toLowerCase().includes(cf.debito.toLowerCase())) return false;
    if (cf.credito && !(am.credito||'').toLowerCase().includes(cf.credito.toLowerCase())) return false;
    if (cf.historico && !(am.historico||'').toLowerCase().includes(cf.historico.toLowerCase())) return false;
    if (cf.conf) {
      const confLabel = am.confianca === 'Alta' ? 'alta' : 'manual';
      if (!confLabel.includes(cf.conf.toLowerCase())) return false;
    }
    return true;
  });

  const totalCred = txns.filter(t => t.tipo === 'credito').reduce((s, t) => s + t.valor, 0);
  const totalDeb = txns.filter(t => t.tipo === 'debito').reduce((s, t) => s + t.valor, 0);
  const classificados = Object.values(concState.amarracoes).filter(a => a.confianca === 'Alta').length;
  const pendentes = txns.length - classificados;

  if (!concState.selectedRows) concState.selectedRows = {};
  const escHtml = (s) => (s||'').replace(/"/g,'&quot;').replace(/</g,'&lt;');

  const rows = filtered.map((t, fi) => {
    const idx = txns.indexOf(t);
    const am = concState.amarracoes[idx] || {};
    const isAlta = am.confianca === 'Alta';
    const rowBg = isAlta ? '' : 'background:#fffbeb;';
    const confBadge = isAlta
      ? '<span style="background:#dcfce7;color:#166534;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700">✅ Alta</span>'
      : '<span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700">⚠️ Manual</span>';
    const isChecked = concState.selectedRows[idx] ? 'checked' : '';

    return `<tr style="${rowBg}border-bottom:1px solid var(--border)">
      <td style="padding:8px;text-align:center"><input type="checkbox" ${isChecked} onchange="toggleConcRow(${idx}, this.checked)" style="transform:scale(1.2)"></td>
      <td style="padding:8px;font-size:12px;text-align:center;color:var(--text-muted)">${t.data}</td>
      <td style="padding:8px;font-size:12px;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escHtml(t.descricao)}">${t.descricao}</td>
      <td style="padding:8px;font-size:12px;text-align:right;font-weight:700;color:${t.tipo==='credito'?'var(--success)':'var(--danger)'}">
        ${t.tipo==='credito'?'+':'−'} R$ ${t.valor.toLocaleString('pt-BR',{minimumFractionDigits:2})}
      </td>
      <td style="padding:8px;font-size:11px;position:relative">
        <input class="conc-ac-input" value="${escHtml(am.debito||'')}"
          onfocus="abrirAutocompleteConta(${idx},'debito',this)"
          oninput="filtrarAutocompleteConta(${idx},'debito',this)"
          onchange="concState.amarracoes[${idx}].debito=this.value"
          style="width:100%;border:1px solid #e2e8f0;border-radius:4px;padding:4px 6px;font-size:11px" title="Pesquisar conta débito" placeholder="🔍 Pesquisar...">
      </td>
      <td style="padding:8px;font-size:11px;position:relative">
        <input class="conc-ac-input" value="${escHtml(am.credito||'')}"
          onfocus="abrirAutocompleteConta(${idx},'credito',this)"
          oninput="filtrarAutocompleteConta(${idx},'credito',this)"
          onchange="concState.amarracoes[${idx}].credito=this.value"
          style="width:100%;border:1px solid #e2e8f0;border-radius:4px;padding:4px 6px;font-size:11px" title="Pesquisar conta crédito" placeholder="🔍 Pesquisar...">
      </td>
      <td style="padding:8px;font-size:11px">
        <input value="${escHtml(am.historico||'')}" onchange="concState.amarracoes[${idx}].historico=this.value"
          style="width:100%;border:1px solid #e2e8f0;border-radius:4px;padding:4px 6px;font-size:11px">
      </td>
      <td style="padding:8px;text-align:center">${confBadge}</td>
      <td style="padding:8px;text-align:center">
        <button class="btn btn-ghost btn-sm" onclick="mostrarExplicacao(${idx})" title="Ver explicação técnica">📖</button>
      </td>
    </tr>`;
  }).join('');

  // Verifica se algum filtro de coluna está ativo
  const hasColFilter = Object.values(cf).some(v => v);

  // Função global para limpar filtros
  window._limparFiltrosColunas = function() {
    concState.colFilters = {data:'',descricao:'',valor:'',debito:'',credito:'',historico:'',conf:''};
    render();
  };

  const selCount = Object.keys(concState.selectedRows || {}).length;
  const bulkBar = selCount > 0 ? `
    <div style="background:#e0f2fe;border:1px solid #bae6fd;padding:10px 16px;display:flex;gap:12px;align-items:center;border-radius:8px;margin-bottom:12px">
      <span style="font-weight:700;color:#0369a1">${selCount} linha(s) selecionada(s)</span>
      <div style="width:1px;height:24px;background:#bae6fd"></div>
      <div style="flex:1;position:relative">
        <input id="bulk-debito" class="form-input" placeholder="Em Lote: Conta a Débito..." onfocus="abrirAutocompleteConta('bulk','debito',this)" oninput="filtrarAutocompleteConta('bulk','debito',this)" style="width:100%;font-size:12px">
      </div>
      <div style="flex:1;position:relative">
        <input id="bulk-credito" class="form-input" placeholder="Em Lote: Conta a Crédito..." onfocus="abrirAutocompleteConta('bulk','credito',this)" oninput="filtrarAutocompleteConta('bulk','credito',this)" style="width:100%;font-size:12px">
      </div>
      <button class="btn btn-primary" onclick="aplicarEmLote()">🔄 Aplicar Lote</button>
      <button class="btn btn-ghost" onclick="window.toggleAllConcRows(false)">Sair</button>
    </div>
  ` : '';

  return `
<div class="card mb-4" style="background:linear-gradient(135deg,#0f172a,#1e3a5f);color:#fff;padding:18px 24px;border-radius:12px">
  <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
    <div>
      <h3 style="font-size:16px;margin-bottom:4px">📊 Grid de Amarração Contábil</h3>
      <p style="opacity:.8;font-size:12px">${txns.length} transações · Banco: ${concState.bancoInfo.banco||'—'} · Conta: ${concState.bancoInfo.conta||'—'}</p>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-ghost btn-sm" style="color:#fff;border-color:rgba(255,255,255,0.2)" onclick="concState.view='home';render()">← Voltar</button>
      <button class="btn btn-primary btn-sm" onclick="exportarLayoutUnico()">⬇️ Exportar Único</button>
    </div>
  </div>
</div>

<div class="card mb-4" style="display:flex;gap:16px;flex-wrap:wrap;align-items:center">
  <div style="display:flex;gap:16px;flex:1">
    <div style="text-align:center;padding:8px 16px;background:#ecfdf5;border-radius:8px">
      <div style="font-size:10px;color:#065f46;font-weight:700">CRÉDITOS</div>
      <div style="font-size:18px;font-weight:800;color:#059669">R$ ${totalCred.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div>
    </div>
    <div style="text-align:center;padding:8px 16px;background:#fef2f2;border-radius:8px">
      <div style="font-size:10px;color:#991b1b;font-weight:700">DÉBITOS</div>
      <div style="font-size:18px;font-weight:800;color:#dc2626">R$ ${totalDeb.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div>
    </div>
    <div style="text-align:center;padding:8px 16px;background:#f0f9ff;border-radius:8px">
      <div style="font-size:10px;color:#0369a1;font-weight:700">CLASSIFICADOS</div>
      <div style="font-size:18px;font-weight:800;color:#0284c7">${classificados}/${txns.length}</div>
    </div>
    <div style="text-align:center;padding:8px 16px;background:#fffbeb;border-radius:8px">
      <div style="font-size:10px;color:#92400e;font-weight:700">PENDENTES</div>
      <div style="font-size:18px;font-weight:800;color:#d97706">${pendentes}</div>
    </div>
  </div>
  <div class="search-bar" style="width:250px"><span>🔍</span>
    <input type="text" placeholder="Filtrar..." value="${concState.filtroGrid}" oninput="concState.filtroGrid=this.value;render()">
  </div>
</div>

${bulkBar}

<div class="card" style="padding:0;border-radius:12px;overflow:hidden">
  <div class="table-wrap" style="overflow-x:auto;max-height:60vh">
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead style="position:sticky;top:0;z-index:2">
        <tr style="background:#f1f5f9;border-bottom:2px solid #cbd5e1">
          <th style="padding:10px 8px;text-align:center;min-width:30px"><input type="checkbox" onchange="toggleAllConcRows(this.checked)" style="transform:scale(1.2)"></th>
          <th style="padding:10px 8px;text-align:center;font-size:11px;min-width:80px">DATA</th>
          <th style="padding:10px 8px;text-align:left;font-size:11px;min-width:200px">DESCRIÇÃO</th>
          <th style="padding:10px 8px;text-align:right;font-size:11px;min-width:110px">VALOR</th>
          <th style="padding:10px 8px;text-align:center;font-size:11px;min-width:220px;background:#e0f2fe">DÉBITO (CONTA)</th>
          <th style="padding:10px 8px;text-align:center;font-size:11px;min-width:220px;background:#fef9c3">CRÉDITO (CONTA)</th>
          <th style="padding:10px 8px;text-align:center;font-size:11px;min-width:180px">HISTÓRICO</th>
          <th style="padding:10px 8px;text-align:center;font-size:11px;min-width:80px">CONF.</th>
          <th style="padding:10px 8px;text-align:center;font-size:11px;min-width:40px">📖</th>
        </tr>
        <tr style="background:#e8edf3;border-bottom:1px solid #cbd5e1">
          <th style="padding:4px 4px"></th>
          <th style="padding:4px 4px"><input type="text" placeholder="🔍" value="${escHtml(cf.data)}" oninput="concState.colFilters.data=this.value;render()" style="width:100%;border:1px solid #cbd5e1;border-radius:4px;padding:3px 5px;font-size:10px;background:#fff"></th>
          <th style="padding:4px 4px"><input type="text" placeholder="🔍 descrição..." value="${escHtml(cf.descricao)}" oninput="concState.colFilters.descricao=this.value;render()" style="width:100%;border:1px solid #cbd5e1;border-radius:4px;padding:3px 5px;font-size:10px;background:#fff"></th>
          <th style="padding:4px 4px"><input type="text" placeholder="🔍" value="${escHtml(cf.valor)}" oninput="concState.colFilters.valor=this.value;render()" style="width:100%;border:1px solid #cbd5e1;border-radius:4px;padding:3px 5px;font-size:10px;background:#fff"></th>
          <th style="padding:4px 4px;background:#dbeafe"><input type="text" placeholder="🔍 conta débito..." value="${escHtml(cf.debito)}" oninput="concState.colFilters.debito=this.value;render()" style="width:100%;border:1px solid #93c5fd;border-radius:4px;padding:3px 5px;font-size:10px;background:#fff"></th>
          <th style="padding:4px 4px;background:#fef3c7"><input type="text" placeholder="🔍 conta crédito..." value="${escHtml(cf.credito)}" oninput="concState.colFilters.credito=this.value;render()" style="width:100%;border:1px solid #fcd34d;border-radius:4px;padding:3px 5px;font-size:10px;background:#fff"></th>
          <th style="padding:4px 4px"><input type="text" placeholder="🔍 histórico..." value="${escHtml(cf.historico)}" oninput="concState.colFilters.historico=this.value;render()" style="width:100%;border:1px solid #cbd5e1;border-radius:4px;padding:3px 5px;font-size:10px;background:#fff"></th>
          <th style="padding:4px 4px"><input type="text" placeholder="🔍" value="${escHtml(cf.conf)}" oninput="concState.colFilters.conf=this.value;render()" style="width:100%;border:1px solid #cbd5e1;border-radius:4px;padding:3px 5px;font-size:10px;background:#fff"></th>
          <th style="padding:4px 4px;text-align:center">
            ${hasColFilter ? '<button onclick="_limparFiltrosColunas()" style="border:none;background:#ef4444;color:#fff;border-radius:4px;padding:2px 6px;font-size:9px;cursor:pointer" title="Limpar filtros">✕</button>' : ''}
          </th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</div>

${filtered.length < txns.length ? `<div style="margin-top:8px;font-size:11px;color:var(--text-muted);text-align:center">Mostrando ${filtered.length} de ${txns.length} transações (filtro ativo)</div>` : ''}

<div id="conc-explicacao-modal"></div>`;
}

// ─── MOSTRAR EXPLICAÇÃO TÉCNICA ───
function mostrarExplicacao(idx) {
  const t = concState.transacoes[idx];
  const am = concState.amarracoes[idx] || {};
  const itg = concState.clienteId ? identificarITG(concState.clienteId) : null;
  const modal = document.getElementById('conc-explicacao-modal');
  if (!modal) return;

  // Buscar contas do plano importado
  const contasPlano = buscarContaPlano(am.historico || t.descricao);
  const contasHtml = contasPlano.length ? contasPlano.map(c =>
    `<div style="display:flex;justify-content:space-between;padding:6px 8px;border-bottom:1px solid #f1f5f9;font-size:12px;cursor:pointer" onclick="usarContaPlano(${idx},'${(c.codigo||'').replace(/'/g,"\\'")}','${(c.descricao||'').replace(/'/g,"\\'")}')">
      <span style="font-family:monospace;color:var(--primary)">${c.codigo}</span>
      <span style="flex:1;margin-left:10px">${c.descricao}</span>
      <span class="badge badge-blue" style="font-size:10px">${c.plano}</span>
    </div>`
  ).join('') : '<div style="color:var(--text-muted);font-size:12px;padding:8px">Nenhuma conta encontrada. Importe um plano de contas no módulo "Plano de Contas".</div>';

  modal.innerHTML = `
<div class="modal-overlay" onclick="if(event.target===this)this.innerHTML=''">
  <div class="modal" style="max-width:700px">
    <div class="modal-header">
      <h2 style="font-size:15px">📖 Explicação Técnica — Lançamento #${idx+1}</h2>
      <button class="btn btn-ghost btn-sm" onclick="document.getElementById('conc-explicacao-modal').innerHTML=''">✕</button>
    </div>
    <div class="modal-body" style="max-height:70vh;overflow-y:auto">
      <div style="background:#f8fafc;padding:14px;border-radius:8px;margin-bottom:16px">
        <div style="font-size:13px"><strong>Transação:</strong> ${t.descricao}</div>
        <div style="font-size:13px;margin-top:4px"><strong>Valor:</strong> R$ ${t.valor.toLocaleString('pt-BR',{minimumFractionDigits:2})} (${t.tipo})</div>
        <div style="font-size:13px;margin-top:4px"><strong>Data:</strong> ${t.data}</div>
      </div>

      <div style="background:#e0f2fe;padding:14px;border-radius:8px;margin-bottom:16px">
        <div style="font-weight:700;color:#0369a1;margin-bottom:6px">🧾 Lançamento Sugerido</div>
        <div style="display:flex;gap:12px;margin-bottom:8px">
          <div style="flex:1;background:#fff;padding:10px;border-radius:6px;border-left:4px solid #3b82f6">
            <div style="font-size:10px;color:#64748b;font-weight:700">DÉBITO</div>
            <div style="font-size:13px;font-weight:700">${am.debito||'—'}</div>
          </div>
          <div style="flex:1;background:#fff;padding:10px;border-radius:6px;border-left:4px solid #eab308">
            <div style="font-size:10px;color:#64748b;font-weight:700">CRÉDITO</div>
            <div style="font-size:13px;font-weight:700">${am.credito||'—'}</div>
          </div>
        </div>
        <div style="font-size:12px"><strong>Histórico:</strong> ${am.historico||'—'}</div>
      </div>

      <div style="background:#fef9c3;padding:14px;border-radius:8px;margin-bottom:16px">
        <div style="font-weight:700;color:#92400e;margin-bottom:6px">📚 Fundamentação Normativa</div>
        <div style="font-size:13px;font-weight:700;color:#0369a1;margin-bottom:4px">${am.cpc||'—'}</div>
        <div style="font-size:12px;line-height:1.7;color:#44403c">${am.explicacao||'—'}</div>
        ${itg ? `<div style="margin-top:8px;font-size:11px;color:#475569;border-top:1px dashed #d4d4d4;padding-top:8px">
          <strong>Norma base do cliente:</strong> ${itg.norma} — ${itg.titulo}
        </div>` : ''}
      </div>

      <div style="background:#f0fdf4;padding:14px;border-radius:8px">
        <div style="font-weight:700;color:#065f46;margin-bottom:8px">📊 Contas do Plano Importado (clique para usar)</div>
        ${contasHtml}
      </div>
    </div>
  </div>
</div>`;
}

function usarContaPlano(idx, codigo, descricao) {
  const t = concState.transacoes[idx];
  const am = concState.amarracoes[idx];
  if (!am) return;
  const label = `${codigo} — ${descricao}`;
  if (t.tipo === 'credito') am.credito = label;
  else am.debito = label;
  am.confianca = 'Alta';
  document.getElementById('conc-explicacao-modal').innerHTML = '';
  render();
}

// ─── EXPORTAR LAYOUT SISTEMA ÚNICO ───
function exportarLayoutUnico() {
  const txns = concState.transacoes;
  const clientes = DB.get('clientes') || [];
  const cli = clientes.find(c => c.id === concState.clienteId);

  // Lista de contas analíticas disponíveis no plano de contas
  const contas = getContasAnaliticas();

  // Busca o código da conta no plano a partir do label armazenado (ex.: "12345 — Fornecedor a pagar (Cód: 9876)")
  function buscarCodigo(label) {
    if (!label) return '';
    // Primeiro tenta encontrar cod_interno dentro do label
    const internoMatch = label.match(/Cód:\s*(\S+)/i);
    if (internoMatch && internoMatch[1]) {
      // Procura a conta que possua esse cod_interno no plano
      const conta = contas.find(c => c.cod_interno && c.cod_interno.toString() === internoMatch[1]);
      if (conta && conta.codigo) return conta.codigo;
    }
    // Caso não tenha cod_interno ou não encontre, usa o código antes de " — "
    const parts = label.split(' — ');
    if (parts.length >= 2) {
      const possCodigo = parts[0].trim();
      const conta = contas.find(c => c.codigo && c.codigo.toString() === possCodigo);
      if (conta) return conta.codigo;
      // Se não encontrar, devolve o próprio trecho (fallback)
      return possCodigo;
    }
    // Fallback genérico
    return '';
  }

  // Layout: DATA;DEBITO;CREDITO;VALOR;COMPLEMENTO
  function extrairCodigo(contaStr) {
    if (!contaStr) return '';
    // Primeiro tenta encontrar cod_interno dentro do label, ex: "Cód: 12345"
    const internoMatch = contaStr.match(/Cód:\s*(\S+)/i);
    if (internoMatch && internoMatch[1]) return internoMatch[1].trim();
    // Caso não tenha cod_interno, usa o código antes de " — "
    const parts = contaStr.split(' — ');
    if (parts.length >= 2) return parts[0].trim();
    // Fallback: retornar sem parênteses
    return contaStr.split(' (')[0].trim();
  }

  // Layout: DATA;DEBITO;CREDITO;VALOR;COMPLEMENTO
  const header = 'DATA;DEBITO;CREDITO;VALOR;COMPLEMENTO\r\n';
  const rows = txns.map((t, idx) => {
    const am = concState.amarracoes[idx] || {};
    const debCode = buscarCodigo(am.debito);
    const credCode = buscarCodigo(am.credito);
    const valor = t.valor.toFixed(2).replace('.', ',');
    const hist = (am.historico || t.descricao || '').replace(/;/g, ',').replace(/\r?\n/g, ' ').slice(0, 200);
    return `${t.data};${debCode};${credCode};${valor};${hist}`;
  }).join('\r\n');

  const blob = new Blob(['\ufeff' + header + rows], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Lancamentos_Unico_${(cli?.nome||'').replace(/\s/g,'_').slice(0,30)}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  alert('✅ Arquivo CSV gerado no Layout Único!');
}

function renderConcExport() {
  const txns = concState.transacoes;
  const clientes = DB.get('clientes') || [];
  const cli = clientes.find(c => c.id === concState.clienteId);

  function extrairCodigo(contaStr) {
    if (!contaStr) return '';
    const parts = contaStr.split(' — ');
    if (parts.length >= 2) return parts[0].trim();
    return contaStr.split(' (')[0].trim();
  }

  const preview = txns.slice(0, 20).map((t, idx) => {
    const am = concState.amarracoes[idx] || {};
    const debCode = extrairCodigo(am.debito);
    const credCode = extrairCodigo(am.credito);
    return `<tr style="border-bottom:1px solid var(--border)">
      <td style="padding:6px 8px;font-size:11px;text-align:center">${t.data}</td>
      <td style="padding:6px 8px;font-size:11px"><span style="font-family:monospace;background:#e0f2fe;padding:1px 4px;border-radius:3px;font-size:10px">${debCode}</span> ${(am.debito||'').split(' — ')[1] || ''}</td>
      <td style="padding:6px 8px;font-size:11px"><span style="font-family:monospace;background:#fef9c3;padding:1px 4px;border-radius:3px;font-size:10px">${credCode}</span> ${(am.credito||'').split(' — ')[1] || ''}</td>
      <td style="padding:6px 8px;font-size:11px;text-align:right;font-weight:700">R$ ${t.valor.toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
      <td style="padding:6px 8px;font-size:11px">${am.historico||t.descricao}</td>
    </tr>`;
  }).join('');

  const naoClassificados = txns.filter((t,i) => {
    const am = concState.amarracoes[i] || {};
    return !am.debito || !am.credito || am.confianca !== 'Alta';
  }).length;

  return `
<div class="card mb-4" style="background:linear-gradient(135deg,#065f46,#0d9488);color:#fff;padding:20px 28px;border-radius:12px">
  <h3 style="font-size:16px;margin-bottom:4px">⬇️ Exportar para Layout Único</h3>
  <p style="opacity:.8;font-size:12px">Gera arquivo CSV no layout de importação do Domínio Único (SCI). Layout: DATA;DEBITO;CREDITO;VALOR;COMPLEMENTO</p>
</div>

${naoClassificados > 0 ? `<div class="card mb-4" style="border-left:4px solid var(--warning);background:#fffbeb">
  <div style="display:flex;align-items:center;gap:10px">
    <span style="font-size:22px">⚠️</span>
    <div>
      <div style="font-weight:700;color:#92400e">${naoClassificados} lançamento(s) ainda sem classificação completa</div>
      <div style="font-size:12px;color:#78716c">Revise os lançamentos pendentes no Grid antes de exportar.</div>
    </div>
  </div>
</div>` : ''}

<div class="card mb-4" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
  <button class="btn btn-ghost" onclick="concState.view='grid';render()">← Voltar ao Grid</button>
  <button class="btn btn-primary" onclick="exportarLayoutUnico()">📥 Gerar e Baixar CSV</button>
  <button class="btn btn-ghost" onclick="copiarLancamentos()">📋 Copiar Lançamentos</button>
  <div style="flex:1"></div>
  <div style="font-size:12px;color:var(--text-muted)">
    <strong>${txns.length}</strong> lançamentos · <strong>${cli?.nome||'—'}</strong> · ${concState.bancoInfo.periodo||''}
  </div>
</div>

<div class="card mb-4" style="border-left:4px solid var(--primary)">
  <div style="font-weight:700;margin-bottom:8px">📄 Preview do Arquivo — Layout Único</div>
  <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Formato: DATA;DÉBITO(código);CRÉDITO(código);VALOR;COMPLEMENTO</div>
  <div style="background:#f8fafc;padding:10px;border-radius:6px;font-family:monospace;font-size:11px;overflow-x:auto;white-space:pre;max-height:120px;overflow-y:auto;color:#334155">${txns.slice(0,5).map((t,i) => {
    const am = concState.amarracoes[i] || {};
    const dc = (am.debito||'').split(' — ')[0].split(' (')[0].trim();
    const cc = (am.credito||'').split(' — ')[0].split(' (')[0].trim();
    return `${t.data};${dc};${cc};${t.valor.toFixed(2).replace('.',',')};${(am.historico||t.descricao||'').replace(/;/g,',').slice(0,60)}`;
  }).join('\n')}</div>
</div>

<div class="card" style="padding:0;border-radius:10px;overflow:hidden">
  <div class="table-wrap" style="max-height:50vh;overflow:auto">
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#f1f5f9">
        <th style="padding:8px;font-size:11px;text-align:center">DATA</th>
        <th style="padding:8px;font-size:11px">DÉBITO</th>
        <th style="padding:8px;font-size:11px">CRÉDITO</th>
        <th style="padding:8px;font-size:11px;text-align:right">VALOR</th>
        <th style="padding:8px;font-size:11px">HISTÓRICO</th>
      </tr></thead>
      <tbody>${preview}</tbody>
    </table>
  </div>
</div>`;
}

function copiarLancamentos() {
  const txns = concState.transacoes;
  let text = 'DATA\tDÉBITO\tCRÉDITO\tVALOR\tHISTÓRICO\n';
  txns.forEach((t, idx) => {
    const am = concState.amarracoes[idx] || {};
    text += `${t.data}\t${am.debito||''}\t${am.credito||''}\t${t.valor.toFixed(2).replace('.',',')}\t${am.historico||t.descricao}\n`;
  });
  navigator.clipboard.writeText(text);
  alert('✅ Lançamentos copiados para a área de transferência!');
}
