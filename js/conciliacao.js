// ══════════════════════════════════════════════════════════
//  conciliacao.js — Módulo de Conciliação Inteligente
//  Importação OFX/PDF · Amarração Contábil · Export Único
// ══════════════════════════════════════════════════════════

// ─── STATE ───
let concState = {
  view: 'home',        // home | import | grid | export
  modoVisualizacao: 'extrato', // extrato | unico
  clienteId: null,
  transacoes: [],
  amarracoes: {},      // { idx: { contaDebito, contaCredito, historico, norma } }
  bancoInfo: {},
  filtroGrid: '',
  selectedPlan: null,
  colFilters: {data:'',descricao:'',valor:'',debito:'',credito:'',historico:'',conf:''},
  selectedRows: {},
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

// ─── MOTOR DE REGRAS — BASE_REGRAS_CONTABEIS (42 regras) ───
// Nível 1 🟢 Alta = automático confiável
// Nível 2 🟡 Média = histórico / revisar
// Nível 3 🔴 Revisão = exceção / manual
const PADROES_SUGESTAO = [

  // ══════════════════════════════
  // 🟢 RECEITAS / ENTRADAS (Alta)
  // ══════════════════════════════
  { regex: /pix\s*(recebido|rec\b|entrada|cred)/i, tipo: 'credito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Caixa/Bancos (Ativo Circulante)', credito: 'Clientes / Contas a Receber (Ativo Circulante)', historico: 'Recebimento de cliente via PIX' },
    cpc: 'CPC 47', explicacao: 'Liquidação de contas a receber via PIX. Deb. Banco / Cred. Clientes.' },

  { regex: /ted\s*(recebid|entrada|cred)|transferencia\s*(recebid|cred)/i, tipo: 'credito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Caixa/Bancos (Ativo Circulante)', credito: 'Clientes / Contas a Receber (Ativo Circulante)', historico: 'Recebimento de cliente via TED' },
    cpc: 'CPC 47', explicacao: 'Liquidação de AR por TED.' },

  { regex: /doc\s*(recebid|entrada|cred)/i, tipo: 'credito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Caixa/Bancos (Ativo Circulante)', credito: 'Clientes / Contas a Receber (Ativo Circulante)', historico: 'Recebimento de cliente via DOC' },
    cpc: 'CPC 47', explicacao: 'Liquidação de AR por DOC.' },

  { regex: /deposito|dep\s*dinheiro|dep\s*especie/i, tipo: 'credito', confiancaNivel: 'Média',
    sugestao: { debito: 'Caixa/Bancos (Ativo Circulante)', credito: 'Caixa Físico (Ativo Circulante)', historico: 'Depósito em dinheiro' },
    cpc: 'ITG 2000', explicacao: 'Transferência entre disponibilidades. Verificar origem.' },

  { regex: /rend(imento)?s?\s*(poup|aplic|cdb|invest|fi\b)/i, tipo: 'credito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Caixa/Bancos (Ativo Circulante)', credito: 'Receitas Financeiras (Resultado)', historico: 'Rendimento de aplicação financeira' },
    cpc: 'CPC 48', explicacao: 'Rendimento de aplicação — receita financeira pelo regime de competência.' },

  { regex: /resgate\s*(cdb|aplic|invest|poup)/i, tipo: 'credito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Caixa/Bancos (Ativo Circulante)', credito: 'Aplicações Financeiras (Ativo Circulante)', historico: 'Resgate de aplicação financeira' },
    cpc: 'CPC 48', explicacao: 'Retorno de ativo financeiro para disponibilidade.' },

  { regex: /estorno|devoluc/i, tipo: 'credito', confiancaNivel: 'Média',
    sugestao: { debito: 'Caixa/Bancos (Ativo Circulante)', credito: 'Despesas Diversas (Resultado)', historico: 'Estorno / devolução de valor' },
    cpc: 'CPC 23', explicacao: 'Estorno reverte lançamento original — verificar natureza.' },

  { regex: /cheque\s*(compen|deposi|receb)/i, tipo: 'credito', confiancaNivel: 'Média',
    sugestao: { debito: 'Caixa/Bancos (Ativo Circulante)', credito: 'Clientes / Contas a Receber (Ativo Circulante)', historico: 'Recebimento via cheque compensado' },
    cpc: 'CPC 47', explicacao: 'Cheque compensado equivale a recebimento — liquidação de AR.' },

  { regex: /distrib.*lucro|lucro.*distrib|dividendo.*receb/i, tipo: 'credito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Caixa/Bancos (Ativo Circulante)', credito: 'Receitas de Participações Societárias (Resultado)', historico: 'Recebimento de distribuição de lucros' },
    cpc: 'CPC 18', explicacao: 'Dividendos recebidos de coligadas/controladas — receita de participação.' },

  // ═══════════════════════════════════════
  // 🟢 PAGAMENTOS IDENTIFICADOS (Alta)
  // ═══════════════════════════════════════
  { regex: /pix\s*(enviado|env\b|saida|deb\b|pago|pagto)/i, tipo: 'debito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Fornecedores / Contas a Pagar (Passivo Circulante)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento via PIX' },
    cpc: 'CPC 25', explicacao: 'Liquidação de passivo por PIX.' },

  { regex: /ted\s*(enviado|saida|pago)|transferencia\s*(enviada|pago)/i, tipo: 'debito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Fornecedores / Contas a Pagar (Passivo Circulante)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento via TED' },
    cpc: 'CPC 25', explicacao: 'Liquidação de passivo por TED.' },

  { regex: /boleto|pgto\s*boleto|pag.*bol/i, tipo: 'debito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Fornecedores / Contas a Pagar (Passivo Circulante)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento de boleto' },
    cpc: 'CPC 25', explicacao: 'Quitação de boleto — baixa de passivo.' },

  { regex: /cheque\s*(emit|pago|compensado.*debito)/i, tipo: 'debito', confiancaNivel: 'Média',
    sugestao: { debito: 'Fornecedores / Contas a Pagar (Passivo Circulante)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento via cheque' },
    cpc: 'CPC 25', explicacao: 'Cheque emitido — liquidação de obrigação.' },

  // ═══════════════════════════════════════
  // 🟢 ENCARGOS TRABALHISTAS / FOLHA
  // ═══════════════════════════════════════
  { regex: /salario|folha|pgto\s*func|holerite|vencimento\s*func/i, tipo: 'debito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Despesas com Salários (Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento de salários' },
    cpc: 'CPC 33', explicacao: 'Salários — baixa de provisão do mês anterior.' },

  { regex: /inss|gps|previdencia\s*soc/i, tipo: 'debito', confiancaNivel: 'Alta',
    sugestao: { debito: 'INSS a Recolher (Passivo Circulante)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Recolhimento de INSS' },
    cpc: 'CPC 33', explicacao: 'Baixa de encargos sociais provisionados.' },

  { regex: /fgts/i, tipo: 'debito', confiancaNivel: 'Alta',
    sugestao: { debito: 'FGTS a Recolher (Passivo Circulante)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Recolhimento de FGTS' },
    cpc: 'CPC 33', explicacao: 'Baixa de FGTS provisionado.' },

  { regex: /pro.?labore|prolabore/i, tipo: 'debito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Pró-labore dos Sócios (Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento de pró-labore' },
    cpc: 'CPC 33', explicacao: 'Remuneração do sócio administrador — despesa operacional.' },

  { regex: /distrib.*lucro|lucro.*distrib|retirada.*socio|dividend.*pago/i, tipo: 'debito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Lucros a Distribuir (Patrimônio Líquido)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Distribuição de lucros aos sócios' },
    cpc: 'CPC 26', explicacao: 'Redução de lucros acumulados por distribuição. Não é despesa — é movimentação patrimonial.' },

  { regex: /13.*salario|decimo.*terceiro|ferias\s*pgto|rescisao|aviso.*previo/i, tipo: 'debito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Provisão 13º e Férias (Passivo Circulante)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento de 13º salário / férias / rescisão' },
    cpc: 'CPC 33', explicacao: 'Baixa de provisões de encargos trabalhistas.' },

  { regex: /vale\s*(transp|refei|alim|cest)/i, tipo: 'debito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Benefícios a Empregados (Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento de benefícios (VT/VR)' },
    cpc: 'CPC 33', explicacao: 'Benefícios aos trabalhadores — despesa operacional.' },

  // ═══════════════════════════════════════
  // 🟢 TRIBUTOS / IMPOSTOS
  // ═══════════════════════════════════════
  { regex: /das\s|simples\s*nac|pgdas/i, tipo: 'debito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Impostos sobre Receita — DAS (Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento DAS — Simples Nacional' },
    cpc: 'CPC 32', explicacao: 'DAS Simples Nacional — despesa tributária consolidada.' },

  { regex: /darf|irpj|csll/i, tipo: 'debito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Impostos Federais — IRPJ/CSLL (Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento DARF — IRPJ/CSLL' },
    cpc: 'CPC 32', explicacao: 'Tributos sobre lucro recolhidos via DARF.' },

  { regex: /pis\b|cofins\b|irrf\b/i, tipo: 'debito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Impostos sobre Receita — PIS/COFINS/IRRF (Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento DARF — PIS/COFINS/IRRF' },
    cpc: 'CPC 32', explicacao: 'Tributos sobre faturamento e retenções na fonte.' },

  { regex: /icms|issqn|iss\b/i, tipo: 'debito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Impostos sobre Operações — ICMS/ISS (Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento de ICMS/ISS' },
    cpc: 'CPC 32', explicacao: 'Tributos sobre mercadorias/serviços.' },

  // ═══════════════════════════════════════
  // 🟢 DESPESAS OPERACIONAIS IDENTIFICADAS
  // ═══════════════════════════════════════
  { regex: /aluguel|locacao|loc\s/i, tipo: 'debito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Despesas com Aluguéis (Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento de aluguel' },
    cpc: 'CPC 06(R2)', explicacao: 'Aluguel — despesa operacional (ITG 1000/PME) ou ativo de direito de uso (IFRS 16/CPC 06).' },

  { regex: /energia|luz\b|eletric|cemig|cpfl|enel|celesc/i, tipo: 'debito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Despesas com Energia Elétrica (Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento de energia elétrica' },
    cpc: 'CPC 00', explicacao: 'Custo pelo consumo do mês — regime de competência.' },

  { regex: /agua|saneamento|sabesp|corsan|casan|embasa/i, tipo: 'debito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Despesas com Água e Esgoto (Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento de conta de água' },
    cpc: 'CPC 00', explicacao: 'Despesa operacional — regime de competência.' },

  { regex: /telefone|telecom|internet|celular|vivo|claro|tim|oi\s|net\s|sky\s/i, tipo: 'debito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Despesas com Telecomunicações (Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento de telecomunicações / internet' },
    cpc: 'CPC 00', explicacao: 'Despesa operacional fixo — regime de competência.' },

  { regex: /seguro|premio\s*(seguro|apolic)/i, tipo: 'debito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Seguros a Apropriar (Ativo Circulante)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento de prêmio de seguro' },
    cpc: 'CPC 10', explicacao: 'Seguro pago antecipadamente — ativo (despesa antecipada) a apropriar mensalmente pelo prazo coberto.' },

  { regex: /manutenc|conserto|reparo\s|tecnico\s|assist.*tecn/i, tipo: 'debito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Despesas com Manutenção e Reparos (Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento de manutenção / reparo' },
    cpc: 'CPC 27', explicacao: 'Manutenção de rotina — despesa do período. Melhorias que aumentam vida útil podem ser capitalizadas (CPC 27).' },

  { regex: /combustivel|gasolina|etanol|diesel|posto\s/i, tipo: 'debito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Despesas com Combustível (Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Abastecimento de combustível' },
    cpc: 'CPC 00', explicacao: 'Despesa operacional de transporte.' },

  { regex: /publicidade|propaganda|marketing|mkt\s|anuncio|google\s*ads|face.*ads|instagram/i, tipo: 'debito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Despesas com Publicidade e Marketing (Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento de publicidade / marketing' },
    cpc: 'CPC 04', explicacao: 'Gastos com publicidade são despesas do período — não capitalizáveis (CPC 04).' },

  { regex: /curso|treinamento|capacit|formacao|pos.?grad|palestra/i, tipo: 'debito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Despesas com Treinamento e Capacitação (Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento de curso / treinamento' },
    cpc: 'CPC 04', explicacao: 'Custo de treinamento é despesa do período — não ativo intangível.' },

  { regex: /material\s*(escrit|limpez|higien|consum)/i, tipo: 'debito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Despesas com Materiais de Consumo (Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Compra de material de escritório / limpeza' },
    cpc: 'CPC 00', explicacao: 'Materiais consumidos imediatamente — despesa do período.' },

  { regex: /contabilidade|contador|escritorio\s*cont|honorario.*cont/i, tipo: 'debito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Despesas com Serviços Contábeis (Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Honorários de contabilidade' },
    cpc: 'CPC 00', explicacao: 'Serviços profissionais — despesa operacional.' },

  { regex: /advogado|juridico|honorario.*advo/i, tipo: 'debito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Despesas Jurídicas (Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Honorários advocatícios' },
    cpc: 'CPC 25', explicacao: 'Serviços jurídicos — despesa do período ou provisão de passivo contingente.' },

  // ═══════════════════════════════════════
  // 🟢 OPERAÇÕES FINANCEIRAS
  // ═══════════════════════════════════════
  { regex: /tarifa|tar\s*banc|manut.*conta|taxa.*banc|cpmf|pacote\s*serv/i, tipo: 'debito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Despesas Bancárias (Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Tarifa/taxa bancária' },
    cpc: 'CPC 00', explicacao: 'Custo de serviços bancários — despesa operacional.' },

  { regex: /iof/i, tipo: 'debito', confiancaNivel: 'Alta',
    sugestao: { debito: 'IOF — Despesas Financeiras (Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'IOF sobre operação financeira' },
    cpc: 'CPC 48', explicacao: 'IOF — despesa financeira do período.' },

  { regex: /juros\s*(pago|debit|cobr)|encargos|mora\b|multa\s*(pgto|atraso)/i, tipo: 'debito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Juros e Multas — Despesas Financeiras (Resultado)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Juros / multa por atraso' },
    cpc: 'CPC 12', explicacao: 'Encargos financeiros do período — despesa financeira.' },

  { regex: /saque|retirada\s*caixa|levant/i, tipo: 'debito', confiancaNivel: 'Média',
    sugestao: { debito: 'Caixa Físico (Ativo Circulante)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Saque / retirada em espécie' },
    cpc: 'ITG 2000', explicacao: 'Transferência entre disponibilidades. Verificar destino.' },

  { regex: /emprestimo\s*(receb|credit)|financ.*receb|capital.*giro/i, tipo: 'credito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Caixa/Bancos (Ativo Circulante)', credito: 'Empréstimos e Financiamentos (Passivo)', historico: 'Recebimento de empréstimo / capital de giro' },
    cpc: 'CPC 48', explicacao: 'Empréstimo recebido — entrada de caixa com obrigação de devolução (passivo).' },

  { regex: /emprestimo\s*(parcela|pag|amort)|financ.*parcela/i, tipo: 'debito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Empréstimos e Financiamentos (Passivo)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Amortização de empréstimo / financiamento' },
    cpc: 'CPC 48', explicacao: 'Segregar: principal reduz passivo, juros vão para despesa financeira.' },

  { regex: /aplic|invest|cdb\b|rdb\b|lci\b|lca\b|fundo\s*(invest|aplic)/i, tipo: 'debito', confiancaNivel: 'Alta',
    sugestao: { debito: 'Aplicações Financeiras (Ativo Circulante)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Aplicação financeira' },
    cpc: 'CPC 48', explicacao: 'Reclassificação de disponibilidade — não é despesa.' },

  // ═════════════════════════════════════════════════
  // 🟡 TRANSFERÊNCIAS INTERNAS (Média — verificar)
  // ═════════════════════════════════════════════════
  { regex: /transf.*mesma\s*titular|transf.*interna|entre\s*contas/i, tipo: 'debito', confiancaNivel: 'Média',
    sugestao: { debito: 'Caixa/Bancos — Conta Destino (Ativo Circulante)', credito: 'Caixa/Bancos — Conta Origem (Ativo Circulante)', historico: 'Transferência entre contas da empresa' },
    cpc: 'ITG 2000', explicacao: 'Não há receita nem despesa — mera movimentação entre contas do mesmo titular. Confirmar que ambas as contas pertencem à empresa.' },

  { regex: /cartao\s*(cred|visa|master|elo|amex|hipercard)/i, tipo: 'debito', confiancaNivel: 'Média',
    sugestao: { debito: 'Fornecedores / Contas a Pagar (Passivo Circulante)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Pagamento de fatura de cartão de crédito' },
    cpc: 'CPC 25', explicacao: 'Pagamento da fatura liquida o passivo com a operadora. Despesas já foram reconhecidas no momento do uso.' },

  { regex: /adiant.*fornec|fornec.*adiant/i, tipo: 'debito', confiancaNivel: 'Média',
    sugestao: { debito: 'Adiantamentos a Fornecedores (Ativo Circulante)', credito: 'Caixa/Bancos (Ativo Circulante)', historico: 'Adiantamento a fornecedor' },
    cpc: 'CPC 25', explicacao: 'Adiantamento é ativo até entrega do bem/serviço — reclassificar ao receber.' },

];

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

// ─── SUGERIR CONTA CONTÁBIL (3 níveis: Alta / Média / Revisão) ───
function sugerirConta(descricao, valor, tipo) {
  const desc = (descricao || '').toLowerCase();
  for (const p of PADROES_SUGESTAO) {
    if (p.regex.test(desc)) {
      const nivel = p.confiancaNivel || 'Alta';
      return { ...p.sugestao, cpc: p.cpc, explicacao: p.explicacao,
        confianca: nivel === 'Alta' ? 'Alta' : 'Média',
        confiancaNivel: nivel };
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
    debito: '⚠️ Despesas não identificadas / Pagamentos sem suporte (Resultado)',
    credito: 'Caixa/Bancos (Ativo Circulante)',
    historico: descricao + ' (Valor a regularizar)',
    cpc: 'ITG 2000 / CPC 00 — Primazia da essência sobre a forma',
    explicacao: '⚠️ Saída de recursos sem documento comprobatório. A essência econômica (saída de caixa) prevalece. Classifica-se como despesa/regularizar por prudência e fidedignidade, evitando mascarar a conta contábil de ativos.',
    confianca: 'Baixa — Requer documento hábil',
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

  // Ordenar por código crescente (numérico)
  const ativosOrdenados = [...ativos].sort((a, b) => parseInt(a.id) - parseInt(b.id));

  const selectorOpts = ativosOrdenados.map(c =>
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

  // Recuperar aprendizado prévio do cliente
  const aprendizado = DB.get('aprendizado_conciliacao') || {};
  const regrasCliente = aprendizado[concState.clienteId] || {};

  // Gerar sugestões automáticas mapeando já para o plano de contas atual
  concState.transacoes.forEach((t, idx) => {
    const key = (t.tipo + '|' + t.descricao).toUpperCase().trim();
    if (regrasCliente[key]) {
      // Já sabe fazer pois aprendeu nesta exata descrição antes!
      concState.amarracoes[idx] = {
        debito: regrasCliente[key].debito,
        credito: regrasCliente[key].credito,
        historico: regrasCliente[key].historico || t.descricao,
        confianca: 'Alta',
        explicacao: 'Inteligência mapeou automaticamente com base na última vez que você selecionou esta regra para este histórico exato.',
        cpc: 'Amarrado via Inteligência'
      };
    } else {
      let am = sugerirConta(t.descricao, t.valor, t.tipo);
      am.debito = mapearContaParaPlano(am.debito, t.descricao);
      am.credito = mapearContaParaPlano(am.credito, t.descricao);
      concState.amarracoes[idx] = am;
    }
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
      // Retornar TODAS as contas para manter a estrutura do plano visível
      contas.push({
        codigo: c.codigo || c.classificacao || '',
        cod_interno: c.cod_interno || '',
        descricao: c.descricao || c.nome || '',
        apelido: c.apelido || '',
        grupo: c.grupo || '',
        plano: p.nome || p.id || '',
        natureza: c.natureza || '',
        tipo: c.tipo || '' // preserva o tipo para visualização
      });
    });
  });
  return contas;
}

function mapearContaParaPlano(nomeConta, descOriginal) {
  if (!nomeConta || nomeConta.includes('⚠️')) return nomeConta;
  const contas = getContasAnaliticas();
  if (!contas.length) return nomeConta;

  const baseText = nomeConta.split(' (')[0].toLowerCase();
  const query = baseText.replace(/[^a-záéíóúâêîôûãõüç0-9 ]/g, '').split(/\s+/).filter(x => x.length > 2);
  const descTxn = (descOriginal || '').toLowerCase();

  // Categorias semânticas do baseText — define o "tipo" do que estou procurando
  const buscaBanco = /caixa|banco|disponib/.test(baseText);
  const buscaCliente = /cliente|receber|ar\b/.test(baseText);
  const buscaFornecedor = /fornecedor|pagar|ap\b/.test(baseText);
  const buscaDespesa = /despesa|custo|gasto/.test(baseText);
  const buscaFolha = /salário|salario|folha|inss|fgts|prolabore|férias/.test(baseText);
  const buscaTributo = /imposto|tributo|das|darf|iss|icms|irpj|csll/.test(baseText);
  const buscaReceita = /receita|faturamento/.test(baseText);
  const buscaAplic = /aplicaç|aplicac|investim|cdb|rdb|lci|lca/.test(baseText);

  let bestMatch = null;
  let bestScore = 0;

  for (const c of contas) {
    if (c.tipo === 'T' || c.tipo === 'S') continue;
    const descInfo = ((c.descricao || '') + ' ' + (c.grupo || '') + ' ' + (c.apelido || '')).toLowerCase();
    let score = 0;

    // ── Matches positivos de palavras ──
    score += query.reduce((acc, q) => acc + (descInfo.includes(q) ? 1 : 0), 0);
    if (descInfo.includes(baseText)) score += 5;

    // ── Bônus por categoria certa ──
    if (buscaBanco && (descInfo.includes('banco') || descInfo.includes('banrisul') || descInfo.includes('bradesco') || descInfo.includes('caixa') || descInfo.includes('conta corrente'))) score += 12;
    if (buscaCliente && (descInfo.includes('cliente') || descInfo.includes('a receber') || descInfo.includes('contas a rec'))) score += 12;
    if (buscaFornecedor && (descInfo.includes('fornecedor') || descInfo.includes('a pagar') || descInfo.includes('contas a pag'))) score += 12;
    if (buscaDespesa && (descInfo.includes('despesa') && !descInfo.includes('não ident'))) score += 8;
    if (buscaFolha && (descInfo.includes('salário') || descInfo.includes('salario') || descInfo.includes('folha') || descInfo.includes('inss') || descInfo.includes('fgts'))) score += 12;
    if (buscaTributo && (descInfo.includes('imposto') || descInfo.includes('tributo') || descInfo.includes('das') || descInfo.includes('iss') || descInfo.includes('icms'))) score += 12;
    if (buscaReceita && (descInfo.includes('receita') || descInfo.includes('faturamento'))) score += 12;
    if (buscaAplic && (descInfo.includes('aplicaç') || descInfo.includes('investim') || descInfo.includes('cdb') || descInfo.includes('fundo'))) score += 12;

    // ── Penalizações — evitar falsos positivos ──
    if (buscaBanco && (descInfo.includes('despesa') || descInfo.includes('receita') || descInfo.includes('imposto') || descInfo.includes('aplicaç'))) score -= 8;
    if (buscaCliente && (descInfo.includes('aplicaç') || descInfo.includes('banco') || descInfo.includes('despesa') || descInfo.includes('imposto') || descInfo.includes('fundo'))) score -= 10;
    if (buscaFornecedor && (descInfo.includes('não ident') || descInfo.includes('diversas') || descInfo.includes('receita') || descInfo.includes('banco'))) score -= 10;
    if (buscaDespesa && descInfo.includes('não ident')) score -= 6; // evita "Despesas não identificadas" como padrão
    if (buscaBanco && descInfo.includes('empréstimo')) score -= 6;
    if (buscaReceita && descInfo.includes('despesa')) score -= 8;

    // ── Bônus pelo tipo de transação ──
    if (descTxn && (descTxn.includes('pix') || descTxn.includes('ted')) && buscaBanco) score += 3;

    if (score > bestScore) { bestScore = score; bestMatch = c; }
  }

  // Threshold mínimo de 4 pontos para evitar falsos positivos
  if (bestMatch && bestScore >= 4) {
    const isValido = bestMatch.cod_interno && bestMatch.cod_interno !== '-' && bestMatch.cod_interno !== '0' && bestMatch.cod_interno !== '';
    return isValido
      ? (bestMatch.cod_interno + ' — ' + bestMatch.descricao)
      : (bestMatch.codigo + ' — ' + bestMatch.descricao);
  }
  // Sem match confiável → retorna o label original sem tentar mapear
  return nomeConta;
}


// ─── AUTOCOMPLETE DE CONTA CONTÁBIL ───
let _concAutoOpen = null;

function abrirAutocompleteConta(idx, campo, inputEl) {
  var existingDrop = document.getElementById('conc-ac-dropdown');
  if (existingDrop) existingDrop.remove();
  _concAutoOpen = { idx: idx, campo: campo };

  var contas = getContasAnaliticas();
  var query = (inputEl.value || '').toLowerCase();
  var filtered = query.length < 1 ? contas.slice(0, 900) : contas.filter(function(c) {
    var searchStr = ((c.cod_interno||'') + ' ' + (c.codigo||'') + ' ' + (c.descricao||'') + ' ' + (c.apelido||'') + ' ' + (c.grupo||'')).toLowerCase();
    return query.split(/\s+/).every(function(w) { return searchStr.includes(w); });
  }).slice(0, 900);

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
    var ciNum = (c.cod_interno||'').toString().trim();
    var isValido = ciNum !== '' && ciNum !== '-' && ciNum !== '0';
    var ci = isValido ? ciNum.replace(/'/g, "\\'") : '';
    
    var cc = (c.codigo||'').replace(/'/g, "\\'");
    var cd = (c.descricao||'').replace(/'/g, "\\'");
    
    var primaryCode = c.codigo || '';
    var secondaryCode = isValido ? ('Cód ' + ciNum) : '';
    
    var nat = c.natureza === 'D' ? '⬆D' : (c.natureza === 'C' ? '⬇C' : '');
    var isSintetica = (c.tipo === 'T' || c.tipo === 'S');
    var fontWeight = isSintetica ? '800' : '400';
    var color = isSintetica ? '#1e293b' : '#334155';
    var bgHover = isSintetica ? '#f1f5f9' : '#eff6ff';
    var bgCode = isSintetica ? '#fef3c7' : '#e0f2fe';
    var colorCode = isSintetica ? '#b45309' : '#0369a1';

    return '<div class="conc-ac-item" style="display:flex;align-items:center;gap:8px;padding:7px 12px;cursor:pointer;border-bottom:1px solid #f1f5f9;transition:background .1s"'
      + ' onmouseenter="this.style.background=\'' + bgHover + '\'" onmouseleave="this.style.background=\'\'"'
      + ' onmousedown="event.preventDefault();selecionarContaAuto(\'' + idx + '\',\'' + campo + '\',\'' + ci + '\',\'' + cc + '\',\'' + cd + '\')">'
      + '<span style="font-family:monospace;background:' + bgCode + ';color:' + colorCode + ';padding:2px 8px;border-radius:4px;font-weight:700;font-size:11px;white-space:nowrap">' + primaryCode + '</span>'
      + '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:' + color + ';font-weight:' + fontWeight + '">' + (c.descricao||'') + '</span>'
      + (secondaryCode ? '<span style="font-size:10px;color:#94a3b8;font-family:monospace">[' + secondaryCode + ']</span>' : '')
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
  var isValido = cod_interno && cod_interno !== '-' && cod_interno !== '0';
  // Novo formato: COD_INTERNO — Descricao  (usa o código reduzido como chave principal)
  var label = isValido
    ? (cod_interno + ' — ' + descricao)
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
  var filtered = query.length < 1 ? contas.slice(0, 900) : contas.filter(function(c) {
    var searchStr = ((c.cod_interno||'') + ' ' + (c.codigo||'') + ' ' + (c.descricao||'') + ' ' + (c.apelido||'') + ' ' + (c.grupo||'')).toLowerCase();
    return query.split(/\s+/).every(function(w) { return searchStr.includes(w); });
  }).slice(0, 900);

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
    const indices = concState.currentFilteredIndices || concState.transacoes.map((_, i) => i);
    indices.forEach(i => concState.selectedRows[i] = true);
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

// ─── TELA PRINCIPAL UNIFICADA — Layout Único SCI c/ edição inline ───
function renderTelaPrincipal() {
  const txns = concState.transacoes;
  const clientes = DB.get('clientes') || [];
  const cli = clientes.find(c => c.id === concState.clienteId);
  const filtro = (concState.filtroGrid || '').toLowerCase();

  function extrairCod(label) {
    if (!label || label.includes('⚠️')) return '';
    const m = label.match(/Cód:\s*([^)]+)/i);
    if (m) return m[1].trim();
    const parts = label.split(/\s*[—\-]\s*/);
    const first = (parts[0] || '').trim();
    if (/^[0-9]+$/.test(first)) return first;
    if (/^[0-9.]+$/.test(first)) return first;
    return '';
  }

  // Métricas
  const total = txns.length;
  const amarrs = Object.values(concState.amarracoes);
  const nAlta = amarrs.filter(a => a.confianca === 'Alta' || a.fonte === 'ia').length;
  const nMedia = amarrs.filter(a => a.confianca === 'Média' && a.fonte !== 'ia').length;
  const nPend = total - nAlta - nMedia;
  const pctAuto = total > 0 ? ((nAlta / total) * 100).toFixed(0) : 0;

  // Filtro rápido por descrição/conta/histórico
  const filtered = txns.filter((t, i) => {
    if (!filtro) return true;
    const am = concState.amarracoes[i] || {};
    return t.descricao.toLowerCase().includes(filtro) ||
      (am.debito||'').toLowerCase().includes(filtro) ||
      (am.credito||'').toLowerCase().includes(filtro) ||
      (am.historico||'').toLowerCase().includes(filtro);
  });

  const escHtml = s => (s||'').replace(/"/g,'&quot;').replace(/</g,'&lt;');

  // Helper: extrai código puro (só numérico, sem classificação pontilhada)
  function codLimpo(label) {
    if (!label || label.includes('⚠️')) return '';
    const m = label.match(/Cód:\s*([^)]+)/i);
    if (m) return m[1].trim();
    const parts = label.split(/\s*[—\-]\s*/);
    const first = (parts[0] || '').trim();
    // Só aceita código numérico puro (ex: 122026), rejeita classificação pontilhada (01.1.2.04)
    if (/^[0-9]+$/.test(first)) return first;
    return '';
  }

  // Helper: extrai só o nome da conta (sem código, sem classificação)
  function nomeLimpo(label) {
    if (!label) return '';
    const parts = label.split(/\s*—\s*/);
    if (parts.length >= 2) return parts.slice(1).join(' — ').trim();
    // Fallback: tira a classificação
    return label.replace(/^[0-9.\s]+[\-—]\s*/, '').trim();
  }

  const rows = filtered.map((t, fi) => {
    const idx = txns.indexOf(t);
    const am = concState.amarracoes[idx] || {};
    const debCod = codLimpo(am.debito);
    const credCod = codLimpo(am.credito);
    const debNome = nomeLimpo(am.debito);
    const credNome = nomeLimpo(am.credito);
    const hist = am.historico || t.descricao || '';
    const valor = t.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2});
    const isAlta = am.confianca === 'Alta' || am.fonte === 'ia';
    const isMedia = am.confianca === 'Média';
    const rowBg = !debCod || !credCod ? 'background:#fff1f2;' : (isMedia ? 'background:#fefce8;' : '');
    const status = am.fonte === 'ia'
      ? '<span style="background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;padding:2px 7px;border-radius:4px;font-size:9px;font-weight:700">🤖 IA</span>'
      : isAlta
        ? '<span style="background:#dcfce7;color:#166534;padding:2px 7px;border-radius:4px;font-size:9px;font-weight:700">🟢 Auto</span>'
        : isMedia
          ? '<span style="background:#fef9c3;color:#854d0e;padding:2px 7px;border-radius:4px;font-size:9px;font-weight:700">🟡 Revisar</span>'
          : '<span style="background:#fee2e2;color:#991b1b;padding:2px 7px;border-radius:4px;font-size:9px;font-weight:700">🔴 Pendente</span>';

    // Célula limpa: só código + nome
    const debDisplay = debCod ? `<b style="font-family:monospace;font-size:12px">${debCod}</b> <span style="font-size:11px;color:#475569">${debNome}</span>` : '<span style="color:#ef4444;font-size:10px">— não classificado —</span>';
    const credDisplay = credCod ? `<b style="font-family:monospace;font-size:12px">${credCod}</b> <span style="font-size:11px;color:#475569">${credNome}</span>` : '<span style="color:#ef4444;font-size:10px">— não classificado —</span>';

    return `<tr style="${rowBg}border-bottom:1px solid #e2e8f0">
      <td style="padding:6px 8px;text-align:center;font-size:10px;color:#94a3b8;font-weight:700;width:36px">${idx+1}</td>
      <td style="padding:6px 8px;font-size:11px;white-space:nowrap;color:#64748b;width:88px">${t.data}</td>
      <td style="padding:5px 8px;min-width:200px;position:relative">
        <div style="margin-bottom:2px">${debDisplay}</div>
        <input value="${escHtml(am.debito||'')}" placeholder="🔍 Buscar conta débito..."
          onfocus="abrirAutocompleteConta(${idx},'debito',this)"
          oninput="filtrarAutocompleteConta(${idx},'debito',this)"
          onchange="if(!concState.amarracoes[${idx}])concState.amarracoes[${idx}]={};concState.amarracoes[${idx}].debito=this.value;concState.amarracoes[${idx}].confianca='Alta';render()"
          style="width:100%;border:1px solid #e2e8f0;border-radius:4px;font-size:10px;padding:3px 6px;outline:none;background:#f8fafc;color:#334155">
      </td>
      <td style="padding:5px 8px;min-width:200px;position:relative">
        <div style="margin-bottom:2px">${credDisplay}</div>
        <input value="${escHtml(am.credito||'')}" placeholder="🔍 Buscar conta crédito..."
          onfocus="abrirAutocompleteConta(${idx},'credito',this)"
          oninput="filtrarAutocompleteConta(${idx},'credito',this)"
          onchange="if(!concState.amarracoes[${idx}])concState.amarracoes[${idx}]={};concState.amarracoes[${idx}].credito=this.value;concState.amarracoes[${idx}].confianca='Alta';render()"
          style="width:100%;border:1px solid #e2e8f0;border-radius:4px;font-size:10px;padding:3px 6px;outline:none;background:#f8fafc;color:#334155">
      </td>
      <td style="padding:6px 8px;font-size:12px;font-weight:700;text-align:right;color:${t.tipo==='credito'?'#059669':'#dc2626'};white-space:nowrap;width:100px">${valor}</td>
      <td style="padding:5px 8px;min-width:180px">
        <input value="${escHtml(hist)}" placeholder="Histórico..."
          onchange="if(!concState.amarracoes[${idx}])concState.amarracoes[${idx}]={};concState.amarracoes[${idx}].historico=this.value"
          style="width:100%;border:1px solid #e2e8f0;border-radius:4px;font-size:10px;padding:3px 6px;outline:none;background:#f8fafc;color:#475569">
      </td>
      <td style="padding:6px 8px;text-align:center;width:80px">${status}</td>
    </tr>`;
  }).join('');

  return `
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
  <div style="display:flex;gap:10px;align-items:center">
    <button class="btn btn-ghost btn-sm" onclick="concState.view='home';render()">← Voltar</button>
    <div>
      <span style="font-weight:700;font-size:14px;color:var(--primary-dark)">📋 Lançamentos Contábeis — ${cli?.nome || ''}</span>
      <span style="font-size:11px;color:#64748b;margin-left:8px">${total} lançamentos · Banco ${concState.bancoInfo.banco||'—'} · ${concState.bancoInfo.conta||'—'}</span>
    </div>
  </div>
  <div style="display:flex;gap:8px">
    <button id="btn-ia-classif" class="btn btn-sm" style="background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;border:none;font-weight:700" onclick="window.classificarComIA()">🤖 Classificar com IA</button>
    <button class="btn btn-primary btn-sm" style="background:#059669;border-color:#047857" onclick="exportarLayoutUnico()">⬇️ Exportar Único</button>
  </div>
</div>

<!-- Métricas rápidas -->
<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
  <div style="background:#dcfce7;border-radius:8px;padding:8px 14px;display:flex;align-items:center;gap:6px">
    <span style="font-size:16px">🟢</span><div><div style="font-size:9px;color:#166534;font-weight:700">AUTOMÁTICO</div><div style="font-size:16px;font-weight:900;color:#15803d">${nAlta} <span style="font-size:10px">(${pctAuto}%)</span></div></div>
  </div>
  <div style="background:#fef9c3;border-radius:8px;padding:8px 14px;display:flex;align-items:center;gap:6px">
    <span style="font-size:16px">🟡</span><div><div style="font-size:9px;color:#854d0e;font-weight:700">REVISAR</div><div style="font-size:16px;font-weight:900;color:#b45309">${nMedia}</div></div>
  </div>
  <div style="background:#fee2e2;border-radius:8px;padding:8px 14px;display:flex;align-items:center;gap:6px">
    <span style="font-size:16px">🔴</span><div><div style="font-size:9px;color:#991b1b;font-weight:700">PENDENTE</div><div style="font-size:16px;font-weight:900;color:#dc2626">${nPend}</div></div>
  </div>
  <div style="flex:1;display:flex;align-items:center">
    <input type="text" placeholder="🔍 Filtrar lançamentos..." value="${escHtml(concState.filtroGrid||'')}"
      oninput="concState.filtroGrid=this.value;render()"
      style="width:100%;border:1px solid #e2e8f0;border-radius:8px;padding:8px 12px;font-size:12px">
  </div>
</div>

<!-- Tabela principal -->
<div style="border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,.06)">
  <div style="overflow-x:auto;max-height:65vh">
    <table style="width:100%;border-collapse:collapse;font-size:11px">
      <thead style="position:sticky;top:0;z-index:2">
        <tr style="background:#0f172a;color:#fff">
          <th style="padding:10px 8px;text-align:center;font-size:10px;font-weight:700;width:36px">Nº</th>
          <th style="padding:10px 8px;text-align:left;font-size:10px;font-weight:700;width:88px">DATA</th>
          <th style="padding:10px 8px;text-align:left;font-size:10px;font-weight:700;background:#1e3a8a;min-width:170px">DÉBITO</th>
          <th style="padding:10px 8px;text-align:left;font-size:10px;font-weight:700;background:#78350f;min-width:170px">CRÉDITO</th>
          <th style="padding:10px 8px;text-align:right;font-size:10px;font-weight:700;width:100px">VALOR</th>
          <th style="padding:10px 8px;text-align:left;font-size:10px;font-weight:700;min-width:180px">HISTÓRICO</th>
          <th style="padding:10px 8px;text-align:center;font-size:10px;font-weight:700;width:80px">STATUS</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</div>

${filtered.length < txns.length ? `<div style="margin-top:8px;font-size:11px;color:var(--text-muted);text-align:center">Mostrando ${filtered.length} de ${txns.length} (filtro ativo)</div>` : ''}
<div id="conc-explicacao-modal"></div>`;
}

// ─── GRID DE AMARRAÇÃO (mantido para fallback) ───

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

  concState.currentFilteredIndices = filtered.map(t => txns.indexOf(t));

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
    const isMedia = am.confianca === 'Média';
    const isIA   = am.fonte === 'ia';
    // 🟢 Alta = Automático Confiável | 🟡 Média = Revisar | 🔴 sem classificação = Não Classificado
    const rowBg = isAlta || isMedia ? '' : 'background:#fff1f2;';
    const confBadge = isIA
      ? '<span style="background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700">🤖 IA</span>'
      : isAlta
        ? '<span style="background:#dcfce7;color:#166534;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700">🟢 Automático</span>'
        : isMedia
          ? '<span style="background:#fef9c3;color:#854d0e;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700">🟡 Revisar</span>'
          : '<span style="background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700">🔴 Pendente</span>';
    const isChecked = concState.selectedRows[idx] ? 'checked' : '';


    // ── Helper: extrai código e descrição do label armazenado ──
    function parseLabelCell(label) {
      if (!label) return { cod: '', desc: '', full: '' };
      // Formato novo: "78 — Banco do Brasil" ou "78 — ..."
      // Formato antigo: "01.1.2.001 — Banco (Cód: 78)"
      const codInternoMatch = label.match(/Cód:\s*([^\)]+)/i);
      if (codInternoMatch) {
        // Formato antigo — migra para novo
        const cod = codInternoMatch[1].trim();
        const desc = label.split(/\s*[—-]\s*/)[1]?.replace(/\s*\(Cód:[^)]+\)/i,'').trim() || label;
        return { cod, desc, full: label };
      }
      // Formato novo: primeiro token é o código
      const parts = label.split(/\s*—\s*/);
      const first = (parts[0] || '').trim();
      const isNumericCode = /^[0-9]+$/.test(first);
      if (isNumericCode && parts.length >= 2) {
        return { cod: first, desc: parts.slice(1).join(' — ').trim(), full: label };
      }
      // sem código (classificação pontilhada ainda)
      const isClass = /^[0-9]+\.[0-9]/.test(first);
      return { cod: isClass ? first : '', desc: parts.slice(1).join(' — ').trim() || label, full: label };
    }

    const deb = parseLabelCell(am.debito);
    const cred = parseLabelCell(am.credito);

    // Célula de conta com badge do código + input editavel
    function contaCell(parsed, idxRow, campo) {
      const badge = parsed.cod
        ? `<span style="display:inline-block;font-family:monospace;font-size:11px;font-weight:800;background:${campo==='debito'?'#dbeafe':'#fef9c3'};color:${campo==='debito'?'#1d4ed8':'#92400e'};padding:1px 7px;border-radius:4px;margin-bottom:3px;white-space:nowrap">${parsed.cod}</span>`
        : '';
      const displayVal = parsed.desc || parsed.full || '';
      return `<div style="display:flex;flex-direction:column;gap:2px">
        ${badge}
        <input class="conc-ac-input" value="${escHtml(parsed.full||'')}"
          onfocus="abrirAutocompleteConta(${idxRow},'${campo}',this)"
          oninput="filtrarAutocompleteConta(${idxRow},'${campo}',this)"
          onchange="concState.amarracoes[${idxRow}].${campo}=this.value"
          style="width:100%;border:1px solid #e2e8f0;border-radius:4px;padding:3px 6px;font-size:11px"
          title="${escHtml(parsed.full||'')}"
          placeholder="🔍 ${campo==='debito'?'Conta débito...':'Conta crédito...'}"
        >
      </div>`;
    }

    return `<tr style="${rowBg}border-bottom:1px solid var(--border)">
      <td style="padding:8px;text-align:center"><input type="checkbox" ${isChecked} onchange="toggleConcRow(${idx}, this.checked)" style="transform:scale(1.2)"></td>
      <td style="padding:8px;font-size:12px;text-align:center;color:var(--text-muted)">${t.data}</td>
      <td style="padding:8px;font-size:12px;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escHtml(t.descricao)}">${t.descricao}</td>
      <td style="padding:8px;font-size:12px;text-align:right;font-weight:700;color:${t.tipo==='credito'?'var(--success)':'var(--danger)'}">
        ${t.tipo==='credito'?'+':'−'} R$ ${t.valor.toLocaleString('pt-BR',{minimumFractionDigits:2})}
      </td>
      <td style="padding:6px 8px;font-size:11px;position:relative;min-width:200px">${contaCell(deb, idx, 'debito')}</td>
      <td style="padding:6px 8px;font-size:11px;position:relative;min-width:200px">${contaCell(cred, idx, 'credito')}</td>
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
      <button id="btn-ia-classif" class="btn btn-sm" style="background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;border:none;display:flex;align-items:center;gap:6px;font-weight:700;box-shadow:0 2px 8px rgba(124,58,237,.4)" onclick="window.classificarComIA()">
        🤖 Classificar com IA
      </button>
      <button class="btn btn-primary btn-sm" onclick="exportarLayoutUnico()" style="background:#059669;border-color:#047857">⬇️ Exportar Único</button>
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
          <th style="padding:4px 4px"><input id="filter-data" type="text" placeholder="🔍" value="${escHtml(cf.data)}" onkeyup="concState.colFilters.data=this.value;if(event.key==='Enter')render()" style="width:100%;border:1px solid #cbd5e1;border-radius:4px;padding:3px 5px;font-size:10px;background:#fff" title="Pressione Enter para filtrar"></th>
          <th style="padding:4px 4px"><input id="filter-descricao" type="text" placeholder="🔍 descrição..." value="${escHtml(cf.descricao)}" onkeyup="concState.colFilters.descricao=this.value;if(event.key==='Enter')render()" style="width:100%;border:1px solid #cbd5e1;border-radius:4px;padding:3px 5px;font-size:10px;background:#fff" title="Pressione Enter para filtrar"></th>
          <th style="padding:4px 4px"><input id="filter-valor" type="text" placeholder="🔍" value="${escHtml(cf.valor)}" onkeyup="concState.colFilters.valor=this.value;if(event.key==='Enter')render()" style="width:100%;border:1px solid #cbd5e1;border-radius:4px;padding:3px 5px;font-size:10px;background:#fff" title="Pressione Enter para filtrar"></th>
          <th style="padding:4px 4px;background:#dbeafe"><input id="filter-debito" type="text" placeholder="🔍 conta débito..." value="${escHtml(cf.debito)}" onkeyup="concState.colFilters.debito=this.value;if(event.key==='Enter')render()" style="width:100%;border:1px solid #93c5fd;border-radius:4px;padding:3px 5px;font-size:10px;background:#fff" title="Pressione Enter para filtrar"></th>
          <th style="padding:4px 4px;background:#fef3c7"><input id="filter-credito" type="text" placeholder="🔍 conta crédito..." value="${escHtml(cf.credito)}" onkeyup="concState.colFilters.credito=this.value;if(event.key==='Enter')render()" style="width:100%;border:1px solid #fcd34d;border-radius:4px;padding:3px 5px;font-size:10px;background:#fff" title="Pressione Enter para filtrar"></th>
          <th style="padding:4px 4px"><input id="filter-historico" type="text" placeholder="🔍 histórico..." value="${escHtml(cf.historico)}" onkeyup="concState.colFilters.historico=this.value;if(event.key==='Enter')render()" style="width:100%;border:1px solid #cbd5e1;border-radius:4px;padding:3px 5px;font-size:10px;background:#fff" title="Pressione Enter para filtrar"></th>
          <th style="padding:4px 4px"><input id="filter-conf" type="text" placeholder="🔍" value="${escHtml(cf.conf)}" onkeyup="concState.colFilters.conf=this.value;if(event.key==='Enter')render()" style="width:100%;border:1px solid #cbd5e1;border-radius:4px;padding:3px 5px;font-size:10px;background:#fff" title="Pressione Enter para filtrar"></th>
          <th style="padding:4px 4px;text-align:center">
            ${hasColFilter ? '<button onclick="_limparFiltrosColunas()" style="border:none;background:#ef4444;color:#fff;border-radius:4px;padding:2px 6px;font-size:9px;cursor:pointer" title="Limpar filtros">✕</button>' : '<button onclick="render()" style="border:none;background:#e2e8f0;color:#475569;border-radius:4px;padding:2px 6px;font-size:9px;cursor:pointer" title="Aplicar filtros">🔍</button>'}
          </th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</div>

${filtered.length < txns.length ? `<div style="margin-top:8px;font-size:11px;color:var(--text-muted);text-align:center">Mostrando ${filtered.length} de ${txns.length} transações (filtro ativo)</div>` : ''}

<!-- ── PRÉVIA LAYOUT ÚNICO SCI ── -->
${renderPreviaLayoutUnico(txns)}

<div id="conc-explicacao-modal"></div>`;
}

// ─── PRÉVIA LAYOUT ÚNICO SCI — Partida Dobrada ───
function renderPreviaLayoutUnico(txns) {
  if (!txns || !txns.length) return '';

  function extrairCod(label) {
    if (!label || label.includes('⚠️')) return '';
    const m = label.match(/Cód:\s*([^)]+)/i);
    if (m) return m[1].trim();
    const parts = label.split(/\s*[—\-]\s*/);
    const first = (parts[0] || '').trim();
    if (/^[0-9]+$/.test(first)) return first;
    if (/^[0-9.]+$/.test(first)) return first;
    return '';
  }

  // Métricas de qualidade
  const total = txns.length;
  const amarrs = Object.values(concState.amarracoes);
  const nAlta = amarrs.filter(a => a.confianca === 'Alta' || a.fonte === 'ia').length;
  const nMedia = amarrs.filter(a => a.confianca === 'Média' && a.fonte !== 'ia').length;
  const nPend = total - nAlta - nMedia;
  const pctAuto = total > 0 ? ((nAlta / total) * 100).toFixed(0) : 0;
  const pctRev = total > 0 ? ((nMedia / total) * 100).toFixed(0) : 0;
  const pctPend = total > 0 ? ((nPend / total) * 100).toFixed(0) : 0;

  const metricsBar = `
<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
  <div style="flex:1;min-width:140px;background:#dcfce7;border-radius:8px;padding:10px 14px;display:flex;align-items:center;gap:8px">
    <span style="font-size:20px">🟢</span>
    <div><div style="font-size:10px;color:#166534;font-weight:700">AUTOMÁTICO</div>
    <div style="font-size:20px;font-weight:900;color:#15803d">${nAlta} <span style="font-size:11px">(${pctAuto}%)</span></div></div>
  </div>
  <div style="flex:1;min-width:140px;background:#fef9c3;border-radius:8px;padding:10px 14px;display:flex;align-items:center;gap:8px">
    <span style="font-size:20px">🟡</span>
    <div><div style="font-size:10px;color:#854d0e;font-weight:700">REVISAR</div>
    <div style="font-size:20px;font-weight:900;color:#b45309">${nMedia} <span style="font-size:11px">(${pctRev}%)</span></div></div>
  </div>
  <div style="flex:1;min-width:140px;background:#fee2e2;border-radius:8px;padding:10px 14px;display:flex;align-items:center;gap:8px">
    <span style="font-size:20px">🔴</span>
    <div><div style="font-size:10px;color:#991b1b;font-weight:700">NÃO CLASSIFICADO</div>
    <div style="font-size:20px;font-weight:900;color:#dc2626">${nPend} <span style="font-size:11px">(${pctPend}%)</span></div></div>
  </div>
  <div style="flex:1;min-width:140px;background:linear-gradient(135deg,#e0f2fe,#dbeafe);border-radius:8px;padding:10px 14px;display:flex;align-items:center;gap:8px">
    <span style="font-size:20px">📊</span>
    <div><div style="font-size:10px;color:#0369a1;font-weight:700">TAXA DE AUTOMAÇÃO</div>
    <div style="font-size:20px;font-weight:900;color:#0284c7">${pctAuto}%</div></div>
  </div>
</div>`;

  // Linhas do preview no formato Único
  const rows = txns.slice(0, 50).map((t, idx) => {
    const am = concState.amarracoes[idx] || {};
    const debCod = extrairCod(am.debito);
    const credCod = extrairCod(am.credito);
    const debDesc = (am.debito || '').split(/\s*[—\-]\s*/).slice(1).join(' — ').trim();
    const credDesc = (am.credito || '').split(/\s*[—\-]\s*/).slice(1).join(' — ').trim();
    const hist = (am.historico || t.descricao || '').slice(0, 60);
    const valor = t.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2});
    const isAlta = am.confianca === 'Alta' || am.fonte === 'ia';
    const isMedia = am.confianca === 'Média';
    const status = am.fonte === 'ia'
      ? '<span style="background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;padding:1px 6px;border-radius:3px;font-size:9px">🤖 IA</span>'
      : isAlta
        ? '<span style="background:#dcfce7;color:#166534;padding:1px 6px;border-radius:3px;font-size:9px">🟢 Auto</span>'
        : isMedia
          ? '<span style="background:#fef9c3;color:#854d0e;padding:1px 6px;border-radius:3px;font-size:9px">🟡 Revisar</span>'
          : '<span style="background:#fee2e2;color:#991b1b;padding:1px 6px;border-radius:3px;font-size:9px">🔴 Pendente</span>';
    const rowBg = !debCod || !credCod ? 'background:#fff1f2;' : (isMedia ? 'background:#fefce8;' : '');

    return `<tr style="${rowBg}border-bottom:1px solid #e2e8f0">
      <td style="padding:5px 8px;text-align:center;font-size:10px;color:#94a3b8;font-weight:600">${idx+1}</td>
      <td style="padding:5px 8px;font-size:11px;white-space:nowrap;color:#64748b">${t.data}</td>
      <td style="padding:5px 8px">
        <div style="font-family:monospace;font-size:14px;font-weight:900;color:#1d4ed8;line-height:1">${debCod || '<span style="color:#ef4444;font-size:10px">— sem código —</span>'}</div>
        <div style="font-size:9px;color:#64748b;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${debDesc}</div>
      </td>
      <td style="padding:5px 8px">
        <div style="font-family:monospace;font-size:14px;font-weight:900;color:#92400e;line-height:1">${credCod || '<span style="color:#ef4444;font-size:10px">— sem código —</span>'}</div>
        <div style="font-size:9px;color:#64748b;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${credDesc}</div>
      </td>
      <td style="padding:5px 8px;font-size:12px;font-weight:700;text-align:right;color:${t.tipo==='credito'?'#059669':'#dc2626'};white-space:nowrap">${valor}</td>
      <td style="padding:5px 8px;font-size:10px;color:#475569;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${hist}">${hist}</td>
      <td style="padding:5px 8px;text-align:center">${status}</td>
    </tr>`;
  }).join('');

  return `
<div class="card" style="margin-top:16px;padding:0;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#1e293b,#0f172a);color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center">
    <div>
      <h3 style="font-size:14px;margin:0;font-weight:700">📋 Prévia — Lançamentos Contábeis (Partida Dobrada)</h3>
      <p style="font-size:11px;opacity:.7;margin:2px 0 0">Formato Layout Único SCI · cod_interno Débito / Crédito · ${total} lançamentos</p>
    </div>
    <div style="font-size:10px;opacity:.6">Mostrando primeiros 50</div>
  </div>
  <div style="padding:14px 16px">${metricsBar}</div>
  <div style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:11px">
      <thead>
        <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0">
          <th style="padding:8px;text-align:center;font-size:10px;color:#64748b;font-weight:700;width:40px">Nº</th>
          <th style="padding:8px;text-align:left;font-size:10px;color:#64748b;font-weight:700;width:90px">DATA</th>
          <th style="padding:8px;text-align:left;font-size:10px;color:#1d4ed8;font-weight:700;background:#dbeafe;min-width:160px">DÉBITO</th>
          <th style="padding:8px;text-align:left;font-size:10px;color:#92400e;font-weight:700;background:#fef9c3;min-width:160px">CRÉDITO</th>
          <th style="padding:8px;text-align:right;font-size:10px;color:#64748b;font-weight:700;width:100px">VALOR</th>
          <th style="padding:8px;text-align:left;font-size:10px;color:#64748b;font-weight:700">HISTÓRICO</th>
          <th style="padding:8px;text-align:center;font-size:10px;color:#64748b;font-weight:700;width:80px">STATUS</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</div>`;
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

// ─── CLASSIFICAÇÃO INTELIGENTE COM GEMINI AI ───
window.classificarComIA = async function() {
  const apiKey = getApiKey();
  if (!apiKey) {
    alert('⚠️ Configure a API Key do Gemini em Configurações antes de usar a IA.\n\nMenu: Configurações → Google Gemini API → Inserir API Key');
    return;
  }

  const txns = concState.transacoes;
  if (!txns.length) { alert('Nenhuma transação para classificar.'); return; }

  // Obter contas analíticas do plano (apenas contas que têm cod_interno preenchido)
  const todasContas = getContasAnaliticas();
  const contasValidas = todasContas.filter(c =>
    c.cod_interno && c.cod_interno !== '' && c.cod_interno !== '-' && c.cod_interno !== '0'
    && c.tipo !== 'T' && c.tipo !== 'C' // apenas analíticas
  );

  if (contasValidas.length === 0) {
    alert('⚠️ Nenhuma conta analítica com Código Interno encontrada.\n\nVá em "Plano de Contas", selecione seu plano e clique em "🔗 Enriquecer CODs" para preencher os códigos.');
    return;
  }

  // Identificar transações pendentes (sem classificação Alta)
  const pendentes = txns.map((t, i) => ({ t, i })).filter(({ i }) => {
    const am = concState.amarracoes[i] || {};
    return am.confianca !== 'Alta' && am.fonte !== 'ia';
  });

  if (pendentes.length === 0) {
    alert('✅ Todas as transações já estão classificadas!\n\nUse o botão "⬇️ Exportar Único" para gerar o arquivo.');
    return;
  }

  // Mostrar modal de progresso
  const modalId = 'ia-progress-modal';
  let modalEl = document.getElementById(modalId);
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = modalId;
    document.body.appendChild(modalEl);
  }
  const showProgress = (msg, pct) => {
    modalEl.innerHTML = `
<div style="position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99999;display:flex;align-items:center;justify-content:center">
  <div style="background:#fff;padding:32px 40px;border-radius:16px;max-width:480px;width:90%;text-align:center;box-shadow:0 25px 50px rgba(0,0,0,.3)">
    <div style="font-size:48px;margin-bottom:16px">🤖</div>
    <div style="font-size:18px;font-weight:700;margin-bottom:8px;color:#1e293b">IA Classificando...</div>
    <div style="font-size:13px;color:#64748b;margin-bottom:20px">${msg}</div>
    <div style="background:#f1f5f9;border-radius:8px;height:8px;overflow:hidden;margin-bottom:12px">
      <div style="background:linear-gradient(90deg,#7c3aed,#4f46e5);height:100%;width:${pct}%;transition:width 0.5s;border-radius:8px"></div>
    </div>
    <div style="font-size:11px;color:#94a3b8">${Math.round(pct)}% concluído</div>
  </div>
</div>`;
  };

  showProgress(`Preparando ${pendentes.length} transações para análise...`, 5);

  try {
    // Montar lista compacta do plano de contas para o prompt (max 200 contas mais relevantes)
    // Priorizar contas analíticas de nível 5 (mais específicas)
    const contasParaPrompt = contasValidas
      .sort((a, b) => (b.nivel || 0) - (a.nivel || 0))
      .slice(0, 250)
      .map(c => `${c.cod_interno}|${c.codigo}|${c.descricao}|${c.grupo}|${c.natureza || ''}`);

    // Montar lista de transações
    const txnsParaPrompt = pendentes.map(({ t, i }) =>
      `${i}|${t.data}|${t.descricao}|${t.tipo === 'credito' ? '+' : '-'}${t.valor.toFixed(2)}`
    );

    const prompt = `Você é um contador brasileiro especializado em classificação contábil pelo regime de competência (CPC/ITG).

PLANO DE CONTAS DISPONÍVEL (formato: cod_interno|classificacao|descricao|grupo|natureza):
${contasParaPrompt.join('\n')}

TRANSAÇÕES BANCÁRIAS A CLASSIFICAR (formato: idx|data|descricao|valor):
${txnsParaPrompt.join('\n')}

REGRAS OBRIGATÓRIAS:
1. Use APENAS os cod_interno do plano de contas listado acima
2. Para cada transação, defina conta DÉBITO e conta CRÉDITO usando os cod_interno
3. A conta bancária (Bancos Conta Movimento ou similar) deve ser usada como contrapartida quando a transação é entrada/saída de caixa
4. Use o código de banco/caixa mais adequado disponível no plano
5. Histórico: texto curto e claro (max 50 chars), sem vírgulas
6. Confiança: 'alta' para certeza, 'media' para incerteza

Retorne JSON válido no formato:
{
  "lancamentos": [
    {
      "idx": número,
      "debito_cod": "cod_interno da conta débito",
      "debito_desc": "descrição curta da conta débito",
      "credito_cod": "cod_interno da conta crédito",
      "credito_desc": "descrição curta da conta crédito",
      "historico": "texto do histórico",
      "confianca": "alta|media"
    }
  ]
}`;

    showProgress('Enviando para o Gemini AI...', 20);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
        maxOutputTokens: 8192,
      }
    };

    showProgress('IA processando as transações...', 40);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `Erro ${res.status} na API Gemini`);
    }

    showProgress('Interpretando resultado da IA...', 70);

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    let resultado;
    try {
      resultado = JSON.parse(rawText);
    } catch {
      // Tentar extrair JSON do texto
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      resultado = jsonMatch ? JSON.parse(jsonMatch[0]) : { lancamentos: [] };
    }

    showProgress('Aplicando classificações...', 85);

    // Montar mapa de cod_interno → conta completa
    const contaMap = {};
    contasValidas.forEach(c => {
      contaMap[String(c.cod_interno)] = c;
    });

    let aplicados = 0;
    const lancamentos = resultado.lancamentos || [];

    lancamentos.forEach(lc => {
      const idx = lc.idx;
      if (idx === undefined || idx === null) return;

      const am = concState.amarracoes[idx];
      if (!am) return;

      // Novo formato: COD — Descricao (código reduzido em destaque)
      const debConta = contaMap[String(lc.debito_cod)];
      const credConta = contaMap[String(lc.credito_cod)];

      const debLabel = debConta
        ? `${lc.debito_cod} — ${debConta.descricao}`
        : (lc.debito_desc ? `${lc.debito_cod} — ${lc.debito_desc}` : '');

      const credLabel = credConta
        ? `${lc.credito_cod} — ${credConta.descricao}`
        : (lc.credito_desc ? `${lc.credito_cod} — ${lc.credito_desc}` : '');

      if (debLabel) {
        am.debito = debLabel;
        am.credito = credLabel;
        am.historico = lc.historico || am.historico;
        am.confianca = 'Alta';
        am.fonte = 'ia';
        am.explicacao = `Classificado automaticamente pelo Gemini AI com base no Plano de Contas importado.`;
        am.cpc = 'Gemini AI — Classificação Automática';
        aplicados++;
      }
    });

    showProgress('Salvando resultado...', 95);

    // Salvar aprendizado
    try {
      const aprendizado = DB.get('aprendizado_conciliacao') || {};
      if (concState.clienteId) {
        if (!aprendizado[concState.clienteId]) aprendizado[concState.clienteId] = {};
        txns.forEach((t, idx) => {
          const am = concState.amarracoes[idx];
          if (am && am.fonte === 'ia' && am.debito && am.credito) {
            const key = (t.tipo + '|' + t.descricao).toUpperCase().trim();
            aprendizado[concState.clienteId][key] = {
              debito: am.debito, credito: am.credito, historico: am.historico
            };
          }
        });
        DB.set('aprendizado_conciliacao', aprendizado);
      }
    } catch(e) { console.warn('Erro ao salvar aprendizado IA', e); }

    modalEl.innerHTML = '';
    render();

    const naoClassif = txns.filter((t, i) => {
      const am = concState.amarracoes[i] || {};
      return am.confianca !== 'Alta' && am.fonte !== 'ia';
    }).length;

    alert(`✅ IA classificou ${aplicados} transações!\n${naoClassif > 0 ? `⚠️ ${naoClassif} transação(ões) ainda pendentes — verifique manualmente.\n` : '✅ Todas classificadas!'}\n\nAgora clique em "⬇️ Exportar Único" para gerar o arquivo TXT.`);

  } catch (err) {
    modalEl.innerHTML = '';
    console.error('[IA Conciliação] Erro:', err);
    alert(`❌ Erro na classificação por IA:\n${err.message}\n\nVerifique a API Key em Configurações.`);
  }
};

// ─── EXPORTAR LAYOUT SISTEMA ÚNICO ───

function exportarLayoutUnico() {
  const txns = concState.transacoes;
  const clientes = DB.get('clientes') || [];
  const cli = clientes.find(c => c.id === concState.clienteId);

  // Lista de contas analíticas disponíveis no plano de contas
  const contas = getContasAnaliticas();

  // Extrai o código reduzido do label - suporta formato novo (78 — Desc) e antigo (01.1.2 — Desc (Cód: 78))
  function extrairCodigoReduzido(label) {
    if (!label || label.includes('⚠️')) return '';
    // Prioridade 1: formato antigo com "Cód: X"
    const internoMatch = label.match(/Cód:\s*([^\)]+)/i);
    if (internoMatch && internoMatch[1]) return internoMatch[1].trim();
    // Prioridade 2: formato novo onde primeiro token é numérico puro = cod_interno
    const parts = label.split(/\s*[—\-]\s*/);
    const first = (parts[0] || '').trim();
    if (/^[0-9]+$/.test(first)) return first;
    // Fallback: classificação pontilhada
    if (/^[0-9.]+$/.test(first)) return first;
    return '';
  }

  const rowsContent = txns.map((t, idx) => {
    const am = concState.amarracoes[idx] || {};
    const debCode = extrairCodigoReduzido(am.debito);
    const credCode = extrairCodigoReduzido(am.credito);
    
    // Converte DD/MM/YYYY para AAAAMMDD
    const dParts = t.data.split('/');
    const dateFormatted = dParts.length === 3 ? `${dParts[2]}${dParts[1]}${dParts[0]}` : t.data.replace(/\D/g, '');
    
    // SCI Leiaute: Valores numéricos separados por ponto (não vírgula)
    const valor = t.valor.toFixed(2);
    
    // SCI Leiaute: Separador por vírgula, logo o histórico não pode conter vírgula!
    const hist = (am.historico || t.descricao || '').replace(/,/g, '').replace(/;/g, ' ').replace(/\r?\n/g, ' ').slice(0, 200).trim();
    
    // 001(Seq), 002(Data), 003(DebCode), 004(CredCode), 005(Valor), 006(CodHist), 007(Comp)
    const seq = String(idx + 1).padStart(6, '0');
    const codHist = '1'; // Padrão Genérico
    
    return `${seq},${dateFormatted},${debCode},${credCode},${valor},${codHist},${hist}`;
  });

  // Validação Crucial de Negócio: Se o código ainda tem PONTO (.) não é o reduzido!
  const rowsComPontos = rowsContent.filter(r => {
     const cols = r.split(',');
     return (cols[2] && cols[2].includes('.')) || (cols[3] && cols[3].includes('.'));
  });

  if (rowsComPontos.length > 0) {
    if (!confirm('🚨 ATENÇÃO CRÍTICA!\n\nAlgumas contas no seu Plano de Contas atual não possuem o "Cód Interno" (ex: 51) registrado. Por isso, a esportação carregará a Classificação Completa (ex: 01.1.1...).\n\nPara o layout "Único" funcionar sem erros no SCI, é OBRIGATÓRIO o Código Curto (Reduzido).\n\nSUGESTÃO: Vá em "Plano de Contas", exclua o plano atual e importe novamente garantindo que a coluna de Código Reduzido seja lida corretamente.\n\nDeseja gerar o arquivo incompleto mesmo assim?')) {
      return;
    }
  }

  const rows = rowsContent.join('\r\n');

  // Gravar regras na memória para automação (Machine Learning Simples)
  try {
    const aprendizado = DB.get('aprendizado_conciliacao') || {};
    if (!aprendizado[concState.clienteId]) aprendizado[concState.clienteId] = {};
    txns.forEach((t, idx) => {
      const am = concState.amarracoes[idx];
      // Se a confiança não for baixa e as contas estiverem preenchidas, ele aprende o padrão exato
      if (am && am.debito && am.credito && !am.debito.includes('⚠️')) {
         const key = (t.tipo + '|' + t.descricao).toUpperCase().trim();
         aprendizado[concState.clienteId][key] = {
           debito: am.debito,
           credito: am.credito,
           historico: am.historico !== t.descricao ? am.historico : ''
         };
      }
    });
    DB.set('aprendizado_conciliacao', aprendizado);
  } catch(e) { console.warn('Erro ao salvar aprendizado', e); }

  const blob = new Blob(['\ufeff' + rows], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Lancamentos_Unico_${(cli?.nome||'').replace(/\s/g,'_').slice(0,30)}_${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  alert('✅ Arquivo TXT gerado no Layout Único!');
}

function renderConcExport() {
  const txns = concState.transacoes;
  const clientes = DB.get('clientes') || [];
  const cli = clientes.find(c => c.id === concState.clienteId);

  function extrairCodigoReduzidoPrev(label) {
    if (!label) return '';
    const internoMatch = label.match(/Cód:\s*([^\)]+)/i);
    if (internoMatch && internoMatch[1]) return internoMatch[1].trim();
    const parts = label.split(/\s*[-—]\s*/);
    if (parts.length >= 2) return parts[0].trim();
    return label.split(' (')[0].trim();
  }

  const preview = txns.slice(0, 20).map((t, idx) => {
    const am = concState.amarracoes[idx] || {};
    const debCode = extrairCodigoReduzidoPrev(am.debito);
    const credCode = extrairCodigoReduzidoPrev(am.credito);
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
  <h3 style="font-size:16px;margin-bottom:4px">⬇️ Exportar Lançamentos Contábeis (Sistema Único)</h3>
  <div style="opacity:.9;font-size:12px;display:flex;align-items:center;gap:6px">
    <span>💡 Modelo de Layout Utilizado:</span>
    <span style="background:rgba(255,255,255,0.2);padding:4px 10px;border-radius:12px;font-family:monospace;font-size:11px;display:flex;align-items:center;gap:6px">
      📄 Leiaute_de_Importacao_TXT_Unico_modulo_contabil
    </span>
  </div>
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
  <button class="btn btn-primary" onclick="if(${naoClassificados}>0){alert('⚠️ Resolve as pendências antes de exportar!\\nO arquivo rejeitaria contas sem código. Volte ao Grid e preencha as contas faltantes ou com Alerta amarelo.');return;} exportarLayoutUnico()" ${naoClassificados > 0 ? 'style="opacity:0.6; cursor:not-allowed"' : 'title="Pronto para exportar!"'}>📥 Gerar e Baixar TXT</button>
  <button class="btn btn-ghost" onclick="copiarLancamentos()">📋 Copiar Lançamentos</button>
  <div style="flex:1"></div>
  <div style="font-size:12px;color:var(--text-muted)">
    <strong>${txns.length}</strong> lançamentos · <strong>${cli?.nome||'—'}</strong> · ${concState.bancoInfo.periodo||''}
  </div>
</div>

<div class="card mb-4" style="border-left:4px solid var(--primary)">
  <div style="font-weight:700;margin-bottom:8px">📄 Preview do Arquivo — Leiaute Único (TXT)</div>
  <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Estrutura oficial SCI Modulo Contabil (Vírgula separando colunas, ponto separando decimal)</div>
  <div style="background:#f8fafc;padding:10px;border-radius:6px;font-family:monospace;font-size:11px;overflow-x:auto;white-space:pre;max-height:120px;overflow-y:auto;color:#334155">${txns.slice(0,5).map((t,i) => {
    const am = concState.amarracoes[i] || {};
    const dParts = t.data.split('/');
    const dateFormatted = dParts.length === 3 ? `${dParts[2]}${dParts[1]}${dParts[0]}` : t.data.replace(/\D/g, '');
    const dc = extrairCodigoReduzidoPrev(am.debito);
    const cc = extrairCodigoReduzidoPrev(am.credito);
    const hist = (am.historico||t.descricao||'').replace(/,/g,'').slice(0,60).trim();
    const seq = String(i + 1).padStart(6, '0');
    return `${seq},${dateFormatted},${dc},${cc},${t.valor.toFixed(2)},1,${hist}`;
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

