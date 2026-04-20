
/* =========================================================
   VERIFICAÇÃO DE DOCUMENTAÇÃO CONTÁBIL — Engine v1.0
   Módulo: análise, classificação e validação de documentos
   para escrituração contábil e fiscal
   ========================================================= */

window.VDOC = (function () {

  /* ── STATE ── */
  let state = {
    cliente: null,
    competencia: null,
    documentos: [],        // itens inseridos
    wizard: { step: 1 },  // wizard de inserção
    activeTab: 'inserir',
    novoDoc: _emptyDoc()
  };

  function _emptyDoc() {
    return {
      id: null,
      tipo: '',
      categoria: '',
      natureza: '',
      periodo: '',
      origem: '',
      obs: '',
      // validação automática
      entregue: null,
      completo: null,
      inconsistencia: null,
      impacto: null,
      obrigacoes: [],
      status: null,   // ✅ ⚠️ ❌ 🔍
      risco: null     // 🔴 🟡 🟢
    };
  }

  /* ── TIPOS PRÉ-DEFINIDOS ── */
  const TIPOS = [
    'Nota Fiscal (NF-e)', 'Nota Fiscal de Serviço (NFS-e)', 'Extrato Bancário',
    'Contrato', 'Comprovante de Pagamento', 'Folha de Pagamento',
    'Pró-labore', 'GPS / DARF', 'Livro Caixa', 'DAS / Simples',
    'Balanço / BP', 'Demonstração de Resultado (DRE)', 'Inventário / Estoque',
    'DEFIS', 'ECD', 'ECF', 'Contrato de Empréstimo', 'Transferência Bancária',
    'Recibo', 'Outros'
  ];

  const CATEGORIAS = ['Contábil', 'Fiscal', 'Financeiro', 'Patrimonial', 'Outros'];
  const NATUREZAS  = ['Receita', 'Despesa', 'Ativo', 'Passivo', 'Movimento sem impacto'];
  const ORIGENS    = ['Cliente', 'Banco', 'Sistema', 'Manual', 'Outro'];
  const OBRIGACOES = ['Contábil', 'Fiscal', 'DEFIS', 'Fluxo de Caixa', 'Outro'];

  /* ── REGRAS AUTOMÁTICAS ── */
  function _autoValidar(doc) {
    const d = { ...doc };

    // 1. Entregue?
    d.entregue = d.tipo && d.periodo ? true : false;

    // 2. Completo?
    const obrigatorios = d.tipo && d.categoria && d.natureza && d.periodo && d.origem;
    d.completo = obrigatorios ? 'sim' : 'parcial';

    // 3. Inconsistências por regra
    let inconsList = [];
    const tipoLower = (d.tipo || '').toLowerCase();

    if (tipoLower.includes('extrato') && d.natureza !== 'Movimento sem impacto') {
      if (d.natureza === 'Receita' || d.natureza === 'Despesa')
        inconsList.push('Extrato bancário não deve ser classificado como Receita/Despesa diretamente');
    }
    if (tipoLower.includes('transferência') && (d.natureza === 'Receita' || d.natureza === 'Despesa')) {
      inconsList.push('Transferências internas não devem ser classificadas como Receita/Despesa');
    }
    if (tipoLower.includes('empréstimo') && !d.obs) {
      inconsList.push('Contrato de empréstimo sem observação/classificação definida');
    }
    if (tipoLower.includes('inventário') || tipoLower.includes('estoque')) {
      inconsList.push('Alerta: verificar se estoque é apurado fisicamente ou apenas estimado');
    }
    if (tipoLower.includes('livro caixa') && !d.entregue) {
      inconsList.push('⚠️ RISCO: Livro Caixa ausente — impacto direto na escrituração');
    }
    if (d.natureza === 'Receita' && !d.origem) {
      inconsList.push('Receita sem origem identificada');
    }

    d.inconsistencia = inconsList.length > 0;
    d.inconsistenciaDetalhe = inconsList;

    // 4. Impacto na escrituração
    d.impacto = ['Receita','Despesa','Ativo','Passivo'].includes(d.natureza);

    // 5. Obrigações impactadas (automático)
    let obs = [];
    if (d.categoria === 'Contábil') obs.push('Contábil');
    if (d.categoria === 'Fiscal') obs.push('Fiscal');
    if (tipoLower.includes('defis')) obs.push('DEFIS');
    if (tipoLower.includes('extrato') || tipoLower.includes('pagamento') || tipoLower.includes('caixa'))
      obs.push('Fluxo de Caixa');
    if (obs.length === 0) obs.push('Outro');
    d.obrigacoes = [...new Set(obs)];

    // 6. Status
    if (!d.entregue) {
      d.status = '❌';
      d.statusLabel = 'Não entregue';
    } else if (d.inconsistencia) {
      d.status = '🔍';
      d.statusLabel = 'Com inconsistência';
    } else if (d.completo === 'parcial') {
      d.status = '⚠️';
      d.statusLabel = 'Incompleto';
    } else {
      d.status = '✅';
      d.statusLabel = 'Entregue e válido';
    }

    // 7. Risco
    if (!d.entregue || d.inconsistencia) {
      d.risco = '🔴';
      d.riscoLabel = 'Alto risco';
    } else if (d.completo === 'parcial') {
      d.risco = '🟡';
      d.riscoLabel = 'Médio risco';
    } else {
      d.risco = '🟢';
      d.riscoLabel = 'Baixo risco';
    }

    return d;
  }

  /* ── RENDER PRINCIPAL ── */
  function render() {
    const clientes = JSON.parse(localStorage.getItem('clientes') || '[]');
    return `
<div class="vdoc-wrap">
  <!-- HEADER -->
  <div class="vdoc-header">
    <div class="vdoc-header-left">
      <div class="vdoc-header-icon">🗂️</div>
      <div>
        <h1 class="vdoc-title">Verificação de Documentação</h1>
        <p class="vdoc-subtitle">Análise, classificação e validação contábil/fiscal por cliente</p>
      </div>
    </div>
    <div class="vdoc-header-right">
      <select id="vdoc-sel-cliente" onchange="VDOC.setCliente(this.value)" class="vdoc-select">
        <option value="">— Selecione o cliente —</option>
        ${clientes.map(c => `<option value="${c.id}" ${state.cliente?.id == c.id ? 'selected':''}>${c.razao || c.nome}</option>`).join('')}
      </select>
      <input type="month" id="vdoc-comp" class="vdoc-select" value="${state.competencia || ''}"
        onchange="VDOC.setCompetencia(this.value)" title="Competência">
    </div>
  </div>

  ${!state.cliente ? _renderSemCliente() : _renderModulo()}
</div>`;
  }

  function _renderSemCliente() {
    return `
<div class="vdoc-empty">
  <div class="vdoc-empty-icon">🔍</div>
  <h2>Selecione um cliente para iniciar</h2>
  <p>Escolha o cliente e a competência no topo para começar a verificação de documentação.</p>
</div>`;
  }

  function _renderModulo() {
    const tabs = [
      { id:'inserir',   icon:'➕', label:'Inserir Documentos' },
      { id:'importar',  icon:'📧', label:'Importar E-mail'   },
      { id:'classificar', icon:'🏷️', label:'Classificar'    },
      { id:'validar',   icon:'✔️', label:'Validar'         },
      { id:'pendencias',icon:'⚠️', label:'Pendências'      },
      { id:'checklist', icon:'📋', label:'Checklist Final'  },
      { id:'relatorio', icon:'📄', label:'Relatório Cliente'},
    ];
    const docs = state.documentos;
    const totals = _totals(docs);

    return `
<!-- KPIs -->
<div class="vdoc-kpis">
  <div class="vdoc-kpi vdoc-kpi-green">
    <div class="vdoc-kpi-num">${totals.validos}</div>
    <div class="vdoc-kpi-label">✅ Válidos</div>
  </div>
  <div class="vdoc-kpi vdoc-kpi-yellow">
    <div class="vdoc-kpi-num">${totals.incompletos}</div>
    <div class="vdoc-kpi-label">⚠️ Incompletos</div>
  </div>
  <div class="vdoc-kpi vdoc-kpi-red">
    <div class="vdoc-kpi-num">${totals.naoEntregues}</div>
    <div class="vdoc-kpi-label">❌ Não entregues</div>
  </div>
  <div class="vdoc-kpi vdoc-kpi-blue">
    <div class="vdoc-kpi-num">${totals.inconsistentes}</div>
    <div class="vdoc-kpi-label">🔍 Com inconsistência</div>
  </div>
  <div class="vdoc-kpi vdoc-kpi-purple">
    <div class="vdoc-kpi-num">${docs.length}</div>
    <div class="vdoc-kpi-label">📁 Total</div>
  </div>
</div>

<!-- TABS -->
<div class="vdoc-tabs">
  ${tabs.map(t => `
    <button class="vdoc-tab ${state.activeTab === t.id ? 'active' : ''}"
      onclick="VDOC.setTab('${t.id}')">
      <span>${t.icon}</span> ${t.label}
    </button>`).join('')}
</div>

<!-- TAB CONTENT -->
<div class="vdoc-content">
  ${_renderTab()}
</div>`;
  }

  function _totals(docs) {
    return {
      validos:       docs.filter(d => d.status === '✅').length,
      incompletos:   docs.filter(d => d.status === '⚠️').length,
      naoEntregues:  docs.filter(d => d.status === '❌').length,
      inconsistentes:docs.filter(d => d.status === '🔍').length,
    };
  }

  function _renderTab() {
    switch (state.activeTab) {
      case 'inserir':    return _tabInserir();
      case 'importar':   return _tabImportarEmail();
      case 'classificar':return _tabClassificar();
      case 'validar':    return _tabValidar();
      case 'pendencias': return _tabPendencias();
      case 'checklist':  return _tabChecklist();
      case 'relatorio':  return _tabRelatorio();
      default:           return _tabInserir();
    }
  }

  /* ─── TAB: IMPORTAR E-MAIL ─── */
  function _tabImportarEmail() {
    return `
<div class="vdoc-form-card">
  <h3 class="vdoc-section-title">📧 Importar Documentação via E-mail / Texto</h3>
  <p style="color:var(--vdoc-muted);font-size:13px;margin-bottom:16px">
    Cole o conteúdo do e-mail do cliente abaixo. O sistema identificará automaticamente
    os documentos mencionados, classificará e criará os registros.
  </p>
  <div class="vdoc-field vdoc-field-full" style="margin-bottom:12px">
    <label>Período de Competência dos Documentos <span class="req">*</span></label>
    <input type="month" id="vdoc-imp-comp" class="vdoc-inp" value="${state.competencia || ''}">
  </div>
  <div class="vdoc-field vdoc-field-full">
    <label>Conteúdo do E-mail</label>
    <textarea id="vdoc-email-texto" class="vdoc-inp" rows="12"
      placeholder="Cole aqui o texto do e-mail recebido do cliente..."></textarea>
  </div>
  <div class="vdoc-form-actions">
    <button class="vdoc-btn vdoc-btn-ghost" onclick="VDOC.setTab('inserir')">← Voltar</button>
    <button class="vdoc-btn vdoc-btn-primary" onclick="VDOC.importarDoEmail()">
      🤖 Analisar e Importar
    </button>
  </div>
</div>`;
  }

  /* ─── PARSER DE E-MAIL ─── */
  function _parseEmail(texto, periodo) {
    const t = texto.toLowerCase();
    const docs = [];
    const add = (tipo, cat, nat, orig, obs, forcar_entregue) => {
      const base = { id: Date.now() + Math.random(), tipo, categoria: cat,
        natureza: nat, periodo, origem: orig, obs: obs || '' };
      // forcar_entregue: null=auto, true=sim, false=nao
      if (forcar_entregue === false) {
        base._forcarNaoEntregue = true;
      } else if (forcar_entregue === true) {
        base._forcarEntregue = true;
      }
      docs.push(base);
    };

    // Livro Caixa
    if (t.includes('livro caixa')) {
      const ausente = t.includes('livro caixa') && (t.match(/livro caixa[^\n]*x\b/i) || t.match(/x\s*\n[^\n]*livro caixa/i));
      add('Livro Caixa','Contábil','Movimento sem impacto','Cliente',
        ausente ? 'Solicitado no e-mail — não entregue (marcado com X)' : 'Mencionado no e-mail', !ausente ? undefined : false);
    }
    // Extratos bancários
    if (t.includes('extrato')) {
      const entregue = t.includes('em anexo') || t.includes('anexo');
      add('Extrato Bancário','Financeiro','Movimento sem impacto','Banco',
        entregue ? 'Entregue em anexo — jan a dez/2025' : 'Solicitado — aguardando', entregue ? true : false);
    }
    // Aplicações financeiras
    if (t.includes('aplicaç') || t.includes('aplicacao')) {
      const entregue = t.includes('em anexo');
      add('Extrato Bancário','Financeiro','Ativo','Banco',
        'Extrato de aplicações financeiras' + (entregue ? ' — entregue em anexo' : ''), entregue ? true : false);
    }
    // Saldo de caixa
    if (t.includes('saldo de caixa') || t.includes('saldo em 31')) {
      const entregue = t.includes('em anexo');
      add('Livro Caixa','Financeiro','Ativo','Cliente',
        'Saldo de caixa em 31/12/2025' + (entregue ? ' — entregue' : ''), entregue ? true : false);
    }
    // Empréstimos
    if (t.includes('empr') && (t.includes('stimo') || t.includes('stimos'))) {
      // Extrai valor se houver
      const matchVal = texto.match(/empr[eé]stimo[^\d]*([\.\d\.]+[,\d]*)/i);
      const valor = matchVal ? matchVal[1] : '';
      const obsEmp = valor
        ? `Empréstimo informado: R$${valor} — conta pessoal para a loja. Verificar contrato e lançamento como Passivo (Mútuo de Sócios).`
        : 'Empréstimo mencionado — solicitar contrato e saldo devedor.';
      add('Contrato de Empréstimo','Financeiro','Passivo','Cliente', obsEmp, true);
    }
    // Lucros distribuídos
    if (t.includes('lucro') && t.includes('distribu')) {
      const ausente = t.match(/lucro[^\n]*x\b/i) || t.match(/x\b[^\n]*lucro/i);
      add('Outros','Contábil','Passivo','Cliente',
        'Valor de lucros distribuídos — ' + (ausente ? 'NÃO informado (marcado com X)' : 'verificar'), ausente ? false : undefined);
    }
    // Bens patrimoniais
    if (t.includes('bem') || t.includes('bens') || t.includes('ve\u00edculo') || t.includes('imóvel')) {
      add('Outros','Patrimonial','Ativo','Cliente',
        'Relação de bens — cliente informou: Não houve alteração em 2025', true);
    }
    // Estoque
    if (t.includes('estoque')) {
      const matchEst = texto.match(/estoque[^\d]*([\.\d]+[,\d]*)/i);
      const vEst = matchEst ? matchEst[1] : '';
      add('Inventário / Estoque','Patrimonial','Ativo','Cliente',
        vEst ? `Estoque estimado em 31/12/2025: R$${vEst} — valor aproximado, sem inventário formal` : 'Estoque mencionado — aguardar posição final', true);
    }
    // Folha de pagamento
    if (t.includes('folha') || t.includes('holerite') || t.includes('prolabore') || t.includes('pró-labore')) {
      add('Folha de Pagamento','Contábil','Despesa','Cliente', 'Mencionado no e-mail', undefined);
    }
    // DEFIS
    if (t.includes('defis')) {
      add('DEFIS','Fiscal','Movimento sem impacto','Sistema',
        'DEFIS obrigatória conforme e-mail — verificar prazo 31/03', true);
    }

    return docs;
  }

  /* ─── SEED DADOS REAIS CLIENTE 84 — FENIX REPRESENTAÇÃO / SILVEIRA & SARAIVA ─── */
  function _seedCliente84() {
    const comp = '2025-12';
    const chave = 'vdoc_84_' + comp;
    const versaoAtual = 'v5'; // incrementar para forçar re-seed
    const versaoKey   = 'vdoc_84_seed_v';
    if (localStorage.getItem(versaoKey) === versaoAtual) return; // já aplicado
    localStorage.removeItem(chave); // remove seed antigo

    // DOCUMENTAÇÃO REAL encontrada na pasta do escritório em 17/04/2026
    const docsRaw = [
      // —— PENDENTES (e-mail marcado com X) ——
      { tipo:'Livro Caixa', categoria:'Contábil', natureza:'Movimento sem impacto', periodo:comp, origem:'Cliente',
        obs:'⚠️ PENDENTE: solicitado no e-mail 23/02/2026, marcado com X pelo cliente. Impacto direto na escrituração 2025.', _forcarNaoEntregue:true },
      { tipo:'Outros', categoria:'Contábil', natureza:'Passivo', periodo:comp, origem:'Cliente',
        obs:'⚠️ PENDENTE: Valor total de lucros distribuídos 2025 — marcado com X. Necessário para DEFIS, ECD e ECF.', _forcarNaoEntregue:true },

      // —— EXTRATOS BANCÁRIOS — BRADESCO ——
      { tipo:'Extrato Bancário', categoria:'Financeiro', natureza:'Movimento sem impacto', periodo:'2025-12', origem:'Banco',
        obs:'✅ ENTREGUE: Bradesco extrato PDF (12/01/2026) + arquivo OFX disponível para importação. Arquivo: Bradesco_12012026_100042 extrato.pdf + .OFX' },

      // —— EXTRATOS BANCÁRIOS — SICREDI (jan-dez 2025) ——
      { tipo:'Extrato Bancário', categoria:'Financeiro', natureza:'Movimento sem impacto', periodo:comp, origem:'Banco',
        obs:'✅ ENTREGUE: Sicredi extratos completos jan-dez/2025 (12 PDFs mensais). Inclui extrato de investimento (XLS) e relatório de investimento PDF.' },

      // —— EXTRATOS — SICOOB ——
      { tipo:'Extrato Bancário', categoria:'Financeiro', natureza:'Movimento sem impacto', periodo:comp, origem:'Banco',
        obs:'✅ ENTREGUE: Sicoob — 12 arquivos PDF (mar/2026). Verificar se são extratos do ano 2025 ou posição atual — conciliar período.' },

      // —— APLICAÇÕES / INVESTIMENTOS ——
      { tipo:'Extrato Bancário', categoria:'Financeiro', natureza:'Ativo', periodo:comp, origem:'Banco',
        obs:'✅ ENTREGUE: Extrato de investimento Sicredi (XLS) + relatório PDF. Verificar saldo em 31/12/2025 para classificação como Ativo Financeiro.' },

      // —— PLANILHAS MENSAIS (xlsx por mês) ——
      { tipo:'Livro Caixa', categoria:'Contábil', natureza:'Movimento sem impacto', periodo:comp, origem:'Cliente',
        obs:'✅ ENTREGUE: 12 planilhas mensais xlsx (Jan-Dez/2025). Verificar se contêm fluxo de caixa completo ou apenas controles parciais.' },

      // —— CONTRATO EMPRÉSTIMO BNDS ——
      { tipo:'Contrato de Empréstimo', categoria:'Financeiro', natureza:'Passivo', periodo:comp, origem:'Cliente',
        obs:'✅ ENTREGUE: CONTRATO EMPRESTIMO BNDS 2025.pdf (2,6MB). Classificar como Financiamento de Longo Prazo — verificar parcelas, saldo devedor e vencimentos.' },

      // —— CONTRATO EMPRÉSTIMO ENERGIA SOLAR ——
      { tipo:'Contrato de Empréstimo', categoria:'Financeiro', natureza:'Passivo', periodo:comp, origem:'Cliente',
        obs:'✅ ENTREGUE: CONTRATO EMPRESTIMO ENERGIA SOLAR.pdf (2,6MB). Verificar se o bem (painel solar) foi ativado no Ativo Imobilizado e se há depreciação.' },

      // —— VEÍCULO FASTBACK ——
      { tipo:'Contrato', categoria:'Patrimonial', natureza:'Ativo', periodo:comp, origem:'Cliente',
        obs:'✅ ENTREGUE: CONTRATO fastback.pdf — Veículo Fastback. Verificar se está no nome da empresa ou do sócio. Classificar em Ativo Imobilizado se empresarial.' },

      // —— CDC VEÍCULOS (Abarth + outro) ——
      { tipo:'Outros', categoria:'Patrimonial', natureza:'Passivo', periodo:comp, origem:'Cliente',
        obs:'⚠️ ATENÇÃO: 2 orçamentos CDC Veículos (Fastback + Abarth) — são orçamentos, não contratos fechados. Verificar se houve efetivação do financiamento. Impacto em Passivo se contratados.' },

      // —— CONSÓRCIO / APÓLICE SILVEIRA SARAIVA ——
      { tipo:'Outros', categoria:'Patrimonial', natureza:'Ativo', periodo:comp, origem:'Cliente',
        obs:'✅ ENTREGUE: Dec. consórcio + apólice seguro (Silveira Saraiva CC 543315). Classificar cota de consórcio como Ativo e seguro como Despesa Pré-paga ou Despesa.' },

      // —— SALDO ESTOQUE ——
      { tipo:'Inventário / Estoque', categoria:'Patrimonial', natureza:'Ativo', periodo:comp, origem:'Cliente',
        obs:'⚠️ Valor estimado R$7.000,00 em 31/12/2025 (informado por e-mail). Sem inventário físico formal. Solicitar confirmação.' },

      // —— EMPRÉSTIMO PESSOAL (conta pessoal → loja) ——
      { tipo:'Transferência Bancária', categoria:'Financeiro', natureza:'Passivo', periodo:comp, origem:'Cliente',
        obs:'⚠️ RISCO: Empréstimo R$14.000 conta pessoal → loja (out: R$8.000 + dez: R$6.000 via Fluxo Caixa). SEM contrato formal. Classificar como Mútuo de Sócios. Risco fiscal de caracterização como receita.' },

      // —— DEFIS ——
      { tipo:'DEFIS', categoria:'Fiscal', natureza:'Movimento sem impacto', periodo:comp, origem:'Sistema',
        obs:'⚠️ DEFIS obrigatória mesmo sem movimentação — prazo 31/03/2026. Verificar se já foi entregue.' },

      // —— TRIBUTOS A RECUPERAR — ACHADO 17/04/2026 ——
      // 1. IRRF retido na fonte (recebimentos de clientes PJ com retenção)
      { tipo:'Comprovante de Pagamento', categoria:'Fiscal', natureza:'Ativo', periodo:comp, origem:'Cliente',
        obs:'🔍 ANÁLISE PENDENTE — IRRF A RECUPERAR: verificar se houve RETENÇÃO DE IRRF por clientes PJ nos recebimentos de 2025. '
          +'Conta contábil: 01.1.2.08.003 (IRRF a Recuperar). Procedimento: levantar todos os comprovantes de retenção (informe de rendimentos, guias, e-mails de clientes). '
          +'Se confirmado, o IRRF retido é Ativo Circulante e pode ser compensado com impostos futuros ou restituído. RISCO: sem controle, o crédito expira e é perdido.', _forcarNaoEntregue:true },

      // 2. INSS retido de terceiros (se a empresa presta serviços com INSS retido pelo tomador)
      { tipo:'GPS / DARF', categoria:'Fiscal', natureza:'Ativo', periodo:comp, origem:'Cliente',
        obs:'🔍 ANÁLISE PENDENTE — INSS RETIDO A RECUPERAR: verificar se tomadores de serviço realizaram retenção de 11% de INSS (art. 31 da Lei 8.212/91). '
          +'Conta contábil: 01.1.2.08.010 (INSS a Recuperar). Procedimento: cruzar notas fiscais emitidas no SPED/portal com GPS recolhidas pelos tomadores. '
          +'Se confirmado, o INSS retido compensa a GPS patronal. RISCO: se não escriturado, a empresa paga em duplicidade.', _forcarNaoEntregue:true },

      // 3. Créditos de tributos de exercícios anteriores (2024 não escriturado)
      { tipo:'Outros', categoria:'Fiscal', natureza:'Ativo', periodo:'2024-12', origem:'Sistema',
        obs:'🔴 RISCO CRÍTICO — TRIBUTOS A RECUPERAR DE 2024 (EXERCÍCIO NÃO ESCRITURADO): existem possíveis créditos de IRRF, INSS e outros tributos do exercício 2024 que não foram mapeados pois 2024 não foi escriturado. '
          +'Procedimento: solicitar ao cliente todos os comprovantes de retenção de 2024 (informes de rendimentos de clientes PJ). '
          +'Prazo de compensação/restituição: 5 anos (art. 168 do CTN). Escriturar via conta 02.3.4.04.003 Ajustes de Exercícios Anteriores.', _forcarNaoEntregue:true },

      // 4. ISS a Recuperar (retenção na fonte pelo tomador do serviço)
      { tipo:'Nota Fiscal de Serviço (NFS-e)', categoria:'Fiscal', natureza:'Ativo', periodo:comp, origem:'Cliente',
        obs:'🔍 ANÁLISE PENDENTE — ISS RETIDO A RECUPERAR: verificar se o município do tomador determina retenção de ISS na fonte. '
          +'Conta contábil: 01.1.2.08.006 (ISS a Recuperar). Procedimento: analisar as NFS-e emitidas — verificar se o ISS está “Retido na Fonte”. '
          +'Simples Nacional: o ISS retido não pode ser compensado no DAS, mas deve constar como crédito na escrituração para evitar pagamento em duplicidade ao município da prestação.', _forcarNaoEntregue:true },

      // 5. Resumo / apontamento geral
      { tipo:'Outros', categoria:'Fiscal', natureza:'Ativo', periodo:comp, origem:'Manual',
        obs:'📊 ACHADO CONTÁBIL 17/04/2026 — SALDO DE TRIBUTOS A RECUPERAR: identificado que a empresa pode possuir saldo de tributos a recuperar não mapeados. '
          +'ITENS A ANALISAR: (1) IRRF retido por clientes PJ — conta 01.1.2.08.003; (2) INSS retido por tomadores — conta 01.1.2.08.010; '
          +'(3) ISS retido na fonte — conta 01.1.2.08.006; (4) Créditos de 2024 não escriturados. '
          +'AÇÃO: Analista deve solicitar Informe de Rendimentos de todos os clientes PJ e cruzar com as notas emitidas. '
          +'Base legal: art. 150, § 7º da CF/88; IN RFB 2.055/2021; art. 168 do CTN (prazo 5 anos). '
          +'Impacto no BP de abertura 2025: caso confirmado, lançar como Ativo Circulante (Tributos a Recuperar).', _forcarNaoEntregue:false },

      // —— EMPRÉSTIMOS A SÓCIO — SALDO INVERTIDO NO PASSIVO — ACHADO 17/04/2026 ——
      // Contexto: o sócio aportou R$14.000 da conta pessoal à empresa (out: R$8.000 + dez: R$6.000)
      // A conta de Mútuo de Sócios (Passivo) foi lançada a DÉBITO — saldo invertido

      // 6. Registro do Mútuo — saldo invertido detectado
      { tipo:'Transferência Bancária', categoria:'Financeiro', natureza:'Passivo', periodo:comp, origem:'Cliente',
        obs:'🔴 SALDO INVERTIDO IDENTIFICADO — MÚTUO DE SÓCIOS (EMPRÉSTIMO DO SÓCIO À EMPRESA): '
          +'O sócio realizou 2 aportes pessoais na empresa: R$8.000 (outubro/2025) + R$6.000 (dezembro/2025) = R$14.000 total. '
          +'A conta está com SALDO DEVEDOR (débito) no Passivo, o que indica lançamento INVERTIDO. '
          +'SITUAÇÃO CORRETA: Conta 02.1.2.02 — Empréstimos de Pessoas Ligadas deve ter saldo CREDOR (não devedor). '
          +'VER REGRA ABAIXO para o lançamento de correção.', _forcarNaoEntregue:true },

      // 7. Regra técnica: como corrigir o lançamento invertido
      { tipo:'Outros', categoria:'Contábil', natureza:'Passivo', periodo:comp, origem:'Manual',
        obs:'📚 REGRA CONTÁBIL — EMPRÉSTIMO DO SÓCIO À EMPRESA (MÚTUO): '
          +'LANÇAMENTO CORRETO quando o sócio empresta à empresa: '
          +'D — Banco/Caixa (Ativo Circulante) R$14.000 | '
          +'C — 02.1.2.02 Empréstimos de Pessoas Ligadas (Passivo Circulante) R$14.000. '
          +'SE o lançamento foi feito ao contrário (D no Passivo / C no Ativo), isso gera SALDO INVERTIDO. '
          +'CORREÇÃO: estornar o lançamento inválido e refazer conforme acima, ou lançar o dobro a crédito para zerar e reposicionar. '
          +'ATENÇÃO ADICIONAL: não há contrato de mútuo formalizado — existe risco fiscal de a Receita caracterizar como RECEITA OMITIDA. '
          +'RECOMENDAÇÃO: formalizar contrato de mútuo retroativamente com taxa de juros mínima (SELIC ou TJLP).', _forcarNaoEntregue:true },

      // 8. Alerta: se o fluxo for invertido (empresa → sócio), trata-se de Ativo e risco de DDL
      { tipo:'Outros', categoria:'Contábil', natureza:'Ativo', periodo:comp, origem:'Manual',
        obs:'⚠️ VERIFICAÇÃO NECESSÁRIA — SE A EMPRESA EMPRESTOU AO SÓCIO (direção inversa): '
          +'Se o fluxo foi EMPRESA → SÓCIO (a empresa tirou recursos para o sócio), o lançamento correto é: '
          +'D — 01.2.1.04 Empréstimos a Pessoas Ligadas (ATIVO NÃO CIRCULANTE) | '
          +'C — Banco/Caixa (Ativo Circulante). '
          +'Neste caso a conta CORRETA é no ATIVO, não no Passivo. '
          +'RISCO FISCAL GRAVE: empréstimos da empresa ao sócio sem contrato e sem juros são qualificados como '
          +'DISTRIBUIÇÃO DISFARÇADA DE LUCROS — art. 464 do RIR/2018 (Decreto 9.580/2018). '
          +'Impacto: incidência de IRPJ + CSLL sobre o valor como se fosse lucro distribuído. '
          +'AÇÃO: confirmar com o cliente a direção real do fluxo (extrato) antes de lançar.', _forcarNaoEntregue:true },

      // —— PASSIVO SICREDI R$500.000 — SALDO INVERTIDO (DÉBITO) — SEM DOCUMENTAÇÃO 2024 ——

      // 9. Achado principal — saldo crítico R$500k
      { tipo:'Contrato de Empréstimo', categoria:'Financeiro', natureza:'Passivo', periodo:'2024-12', origem:'Sistema',
        obs:'🔴 ACHADO CRÍTICO — PASSIVO BANCO SICREDI R$500.000 COM SALDO INVERTIDO (A DÉBITO): '
          +'O Passivo de Empréstimos/Financiamentos Sicredi apresenta SALDO DEVEDOR de R$500.000. '
          +'Passivo tem natureza CREDORA — saldo a débito = CONTA INVERTIDA. '
          +'SEM DOCUMENTAÇÃO disponível para o exercício de 2024. '
          +'IMPACTO: o Balanço Patrimonial de fechamento 2024 e abertura 2025 está INCORRETO — '
          +'o PL está subavaliado ou superavaliado em R$500.000. '
          +'BASE LEGAL DO AJUSTE: NBC TG 23 (Políticas Contábeis, Mudança de Estimativa e Retificação de Erro) '
          +'+ art. 25 da Lei 11.638/07. Conta de ajuste: 02.3.4.04.003 Ajustes de Exercícios Anteriores.', _forcarNaoEntregue:true },

      // 10. Lançamentos de ajuste — 3 cenários possíveis
      { tipo:'Outros', categoria:'Contábil', natureza:'Passivo', periodo:'2024-12', origem:'Manual',
        obs:'📚 LANÇAMENTOS DE AJUSTE NBC TG 23 — PASSIVO SICREDI R$500.000 A DÉBITO: '
          +'[CENÁRIO 1 — Empréstimo já foi quitado mas não baixado] '
          +'Se o financiamento foi pago integralmente e o saldo devedor no passivo é resíduo de pagamentos sem baixa: '
          +'D — 02.1.2.01 Emp. e Fin. Bancários Sicredi (Passivo) R$500.000 | '
          +'C — 02.3.4.04.003 Ajustes de Exercícios Anteriores (PL) R$500.000. '
          +'Efeito: zera o saldo invertido. O lucro acumulado aumenta R$500k. '
          +'[CENÁRIO 2 — Empréstimo ainda existe e o lançamento foi feito ao contrário] '
          +'O débito no passivo ocorreu por inversão de lançamento. O saldo correto deveria ser CREDOR R$500k: '
          +'PASSO 1: D — 02.3.4.04.003 Ajustes Ex. Anteriores (PL) R$1.000.000 | '
          +'C — 02.1.2.01 Emp. Sicredi (Passivo) R$1.000.000. '
          +'Efeito: passa de -R$500k para +R$500k (saldo credor correto). '
          +'[CENÁRIO 3 — Saldo bancário Sicredi classificado errado no Passivo] '
          +'Se o valor R$500k é de conta corrente Sicredi (Ativo) equivocadamente lançado como Passivo: '
          +'D — 01.1.1.02 Bancos — Sicredi (Ativo Circulante) R$500.000 | '
          +'C — Conta erroneamente classificada no Passivo R$500.000. '
          +'AÇÃO IMEDIATA: verificar extrato Sicredi + contrato de financiamento para identificar o cenário correto.', _forcarNaoEntregue:true },

      // 11. Alerta: impacto no fechamento 2024 e abertura 2025
      { tipo:'Balanço / BP', categoria:'Contábil', natureza:'Passivo', periodo:'2024-12', origem:'Manual',
        obs:'⚠️ IMPACTO NO FECHAMENTO 2024 E ABERTURA 2025 — PASSIVO SICREDI R$500.000: '
          +'Sem documentação de 2024, o ajuste via Ajustes de Exercícios Anteriores é OBRIGATÓRIO antes de fechar 2025. '
          +'PROCEDIMENTO PARA O FECHAMENTO SEM DOCUMENTAÇÃO (NBC TG 23): '
          +'1. Verificar extrato Sicredi de 31/12/2024 — saldo disponível online mesmo sem contrato; '
          +'2. Verificar posição de saldo devedor com o banco (carta de saldo devedor); '
          +'3. Definir o cenário correto (quitado / em aberto / conta corrente); '
          +'4. Fazer o lançamento de ajuste conforme cenário (veja REGRA acima); '
          +'5. Elaborar Nota Explicativa no ECD 2024 informando o ajuste retroativo; '
          +'6. Registrar no LALUR o ajuste; '
          +'7. Atualizar o Balanço de Abertura de 2025 com o saldo corrigido. '
          +'ATENÇÃO: R$500.000 É VALOR MATERIAL — não pode ser ignorado ou diferido para exercícios futuros. '
          +'Base: NBC TG 23 item 42 — erros materiais de períodos anteriores devem ser corrigidos retrospectivamente.', _forcarNaoEntregue:true },
    ];



    const validados = docsRaw.map(d => {
      const validado = _autoValidar({ ...d, id: Date.now() + Math.random() });
      if (d._forcarNaoEntregue) {
        validado.entregue = false;
        validado.status = '❌'; validado.statusLabel = 'Não entregue';
        validado.risco  = '🔴'; validado.riscoLabel  = 'Alto risco';
      }
      return validado;
    });

    localStorage.setItem(chave, JSON.stringify(validados));
    localStorage.setItem(versaoKey, versaoAtual); // marca versão aplicada
  }

  /* ─── TAB: INSERIR ─── */
  function _tabInserir() {
    const d = state.novoDoc;
    return `
<div class="vdoc-form-card">
  <h3 class="vdoc-section-title">📥 Inserir Novo Documento</h3>
  <div class="vdoc-form-grid">
    <!-- Tipo -->
    <div class="vdoc-field">
      <label>Tipo de Documento <span class="req">*</span></label>
      <select id="vd-tipo" onchange="VDOC.updateField('tipo',this.value)" class="vdoc-inp">
        <option value="">Selecione...</option>
        ${TIPOS.map(t => `<option value="${t}" ${d.tipo===t?'selected':''}>${t}</option>`).join('')}
      </select>
    </div>
    <!-- Categoria -->
    <div class="vdoc-field">
      <label>Categoria <span class="req">*</span></label>
      <div class="vdoc-radio-group">
        ${CATEGORIAS.map(c => `
          <label class="vdoc-radio ${d.categoria===c?'active':''}">
            <input type="radio" name="vd-categoria" value="${c}" ${d.categoria===c?'checked':''}
              onchange="VDOC.updateField('categoria','${c}')">
            ${c}
          </label>`).join('')}
      </div>
    </div>
    <!-- Natureza -->
    <div class="vdoc-field">
      <label>Natureza <span class="req">*</span></label>
      <div class="vdoc-radio-group">
        ${NATUREZAS.map(n => `
          <label class="vdoc-radio ${d.natureza===n?'active':''}">
            <input type="radio" name="vd-natureza" value="${n}" ${d.natureza===n?'checked':''}
              onchange="VDOC.updateField('natureza','${n}')">
            ${n}
          </label>`).join('')}
      </div>
    </div>
    <!-- Período -->
    <div class="vdoc-field">
      <label>Período de Competência <span class="req">*</span></label>
      <input type="month" id="vd-periodo" class="vdoc-inp" value="${d.periodo}"
        onchange="VDOC.updateField('periodo',this.value)">
    </div>
    <!-- Origem -->
    <div class="vdoc-field">
      <label>Origem <span class="req">*</span></label>
      <select id="vd-origem" onchange="VDOC.updateField('origem',this.value)" class="vdoc-inp">
        <option value="">Selecione...</option>
        ${ORIGENS.map(o => `<option value="${o}" ${d.origem===o?'selected':''}>${o}</option>`).join('')}
      </select>
    </div>
    <!-- Observação -->
    <div class="vdoc-field vdoc-field-full">
      <label>Observação Técnica</label>
      <textarea id="vd-obs" class="vdoc-inp" rows="2"
        onchange="VDOC.updateField('obs',this.value)"
        placeholder="Detalhes, ressalvas técnicas, informações adicionais...">${d.obs}</textarea>
    </div>
  </div>
  <div class="vdoc-form-actions">
    <button class="vdoc-btn vdoc-btn-ghost" onclick="VDOC.limparForm()">🗑️ Limpar</button>
    <button class="vdoc-btn vdoc-btn-primary" onclick="VDOC.adicionarDoc()">✅ Adicionar Documento</button>
  </div>
</div>

${state.documentos.length > 0 ? `
<div class="vdoc-list-card">
  <h3 class="vdoc-section-title">📁 Documentos Inseridos (${state.documentos.length})</h3>
  <div class="vdoc-table-wrap">
    <table class="vdoc-table">
      <thead>
        <tr>
          <th>#</th><th>Tipo</th><th>Categoria</th><th>Natureza</th>
          <th>Período</th><th>Origem</th><th>Status</th><th>Risco</th><th></th>
        </tr>
      </thead>
      <tbody>
        ${state.documentos.map((d, i) => `
        <tr>
          <td>${i+1}</td>
          <td>${d.tipo}</td>
          <td><span class="vdoc-badge vdoc-badge-cat">${d.categoria}</span></td>
          <td><span class="vdoc-badge vdoc-badge-nat">${d.natureza}</span></td>
          <td>${d.periodo || '—'}</td>
          <td>${d.origem || '—'}</td>
          <td><span class="vdoc-status-tag">${d.status} ${d.statusLabel}</span></td>
          <td>${d.risco} <small>${d.riscoLabel}</small></td>
          <td>
            <button class="vdoc-icon-btn vdoc-del" onclick="VDOC.removerDoc(${i})" title="Remover">🗑️</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>
</div>` : ''}`;
  }

  /* ─── TAB: CLASSIFICAR ─── */
  function _tabClassificar() {
    if (state.documentos.length === 0)
      return _emptyTab('Nenhum documento inserido ainda.', 'inserir');

    const grupos = {};
    state.documentos.forEach(d => {
      const g = d.categoria || 'Sem categoria';
      if (!grupos[g]) grupos[g] = [];
      grupos[g].push(d);
    });

    return `
<div class="vdoc-class-wrap">
  <h3 class="vdoc-section-title">🏷️ Documentos por Categoria</h3>
  ${Object.entries(grupos).map(([cat, docs]) => `
  <div class="vdoc-class-group">
    <div class="vdoc-class-header">
      <span class="vdoc-class-cat">${cat}</span>
      <span class="vdoc-class-count">${docs.length} doc(s)</span>
    </div>
    <div class="vdoc-class-items">
      ${docs.map(d => `
      <div class="vdoc-class-item ${_statusClass(d.status)}">
        <div class="vdoc-class-item-left">
          <strong>${d.tipo}</strong>
          <span>${d.natureza} • ${d.origem} • ${d.periodo || 'sem período'}</span>
        </div>
        <div class="vdoc-class-item-right">
          ${d.status} ${d.statusLabel} &nbsp; ${d.risco}
        </div>
      </div>`).join('')}
    </div>
  </div>`).join('')}
</div>`;
  }

  /* ─── TAB: VALIDAR ─── */
  function _tabValidar() {
    if (state.documentos.length === 0)
      return _emptyTab('Nenhum documento inserido ainda.', 'inserir');

    return `
<div class="vdoc-valid-wrap">
  <h3 class="vdoc-section-title">✔️ Validação Técnica por Documento</h3>
  ${state.documentos.map((d, i) => `
  <div class="vdoc-valid-card ${_statusClass(d.status)}">
    <div class="vdoc-valid-top">
      <div class="vdoc-valid-title">
        <span class="vdoc-valid-num">${i+1}</span>
        <strong>${d.tipo}</strong>
        <span class="vdoc-badge vdoc-badge-cat">${d.categoria}</span>
      </div>
      <div>${d.status} ${d.statusLabel} &nbsp; ${d.risco} ${d.riscoLabel}</div>
    </div>
    <div class="vdoc-valid-grid">
      <div class="vdoc-valid-item">
        <span class="vdoc-valid-label">Documento entregue?</span>
        <span class="vdoc-valid-val ${d.entregue ? 'ok' : 'nok'}">${d.entregue ? '✅ Sim' : '❌ Não'}</span>
      </div>
      <div class="vdoc-valid-item">
        <span class="vdoc-valid-label">Está completo?</span>
        <span class="vdoc-valid-val ${d.completo==='sim' ? 'ok' : 'warn'}">${d.completo==='sim' ? '✅ Sim' : '⚠️ Parcial'}</span>
      </div>
      <div class="vdoc-valid-item">
        <span class="vdoc-valid-label">Há inconsistência?</span>
        <span class="vdoc-valid-val ${d.inconsistencia ? 'nok' : 'ok'}">${d.inconsistencia ? '❌ Sim' : '✅ Não'}</span>
      </div>
      <div class="vdoc-valid-item">
        <span class="vdoc-valid-label">Impacta escrituração?</span>
        <span class="vdoc-valid-val ${d.impacto ? 'warn' : 'ok'}">${d.impacto ? '⚠️ Sim' : '✅ Não'}</span>
      </div>
      <div class="vdoc-valid-item vdoc-valid-full">
        <span class="vdoc-valid-label">Obrigações impactadas:</span>
        <span class="vdoc-valid-val">${d.obrigacoes.map(o => `<span class="vdoc-pill">${o}</span>`).join(' ')}</span>
      </div>
      ${d.inconsistenciaDetalhe?.length > 0 ? `
      <div class="vdoc-valid-item vdoc-valid-full">
        <span class="vdoc-valid-label">⚠️ Alertas técnicos:</span>
        <ul class="vdoc-alerts">
          ${d.inconsistenciaDetalhe.map(a => `<li>${a}</li>`).join('')}
        </ul>
      </div>` : ''}
      ${d.obs ? `
      <div class="vdoc-valid-item vdoc-valid-full">
        <span class="vdoc-valid-label">Observação:</span>
        <span class="vdoc-valid-val">${d.obs}</span>
      </div>` : ''}
    </div>
  </div>`).join('')}
</div>`;
  }

  /* ─── TAB: PENDÊNCIAS ─── */
  function _tabPendencias() {
    const pendencias = state.documentos.filter(d => d.status !== '✅');
    if (pendencias.length === 0) {
      return `<div class="vdoc-empty"><div class="vdoc-empty-icon">🎉</div>
        <h2>Nenhuma pendência!</h2>
        <p>Todos os documentos estão válidos e completos.</p></div>`;
    }
    const altoRisco = pendencias.filter(d => d.risco === '🔴');
    const medRisco  = pendencias.filter(d => d.risco === '🟡');

    return `
<div class="vdoc-pend-wrap">
  <h3 class="vdoc-section-title">⚠️ Controle de Pendências (${pendencias.length})</h3>

  ${altoRisco.length > 0 ? `
  <div class="vdoc-pend-section">
    <div class="vdoc-pend-header vdoc-pend-red">🔴 Alto Risco — ${altoRisco.length} item(s)</div>
    ${altoRisco.map((d,i) => _pendCard(d, i)).join('')}
  </div>` : ''}

  ${medRisco.length > 0 ? `
  <div class="vdoc-pend-section">
    <div class="vdoc-pend-header vdoc-pend-yellow">🟡 Médio Risco — ${medRisco.length} item(s)</div>
    ${medRisco.map((d,i) => _pendCard(d, i)).join('')}
  </div>` : ''}
</div>`;
  }

  function _pendCard(d, i) {
    return `
<div class="vdoc-pend-card">
  <div class="vdoc-pend-card-top">
    <strong>${d.tipo}</strong>
    <span>${d.status} ${d.statusLabel}</span>
  </div>
  <div class="vdoc-pend-card-body">
    <span><b>Categoria:</b> ${d.categoria || '—'}</span>
    <span><b>Natureza:</b> ${d.natureza || '—'}</span>
    <span><b>Período:</b> ${d.periodo || '—'}</span>
    <span><b>Origem:</b> ${d.origem || '—'}</span>
  </div>
  ${d.inconsistenciaDetalhe?.length > 0 ? `
  <ul class="vdoc-alerts">
    ${d.inconsistenciaDetalhe.map(a => `<li>${a}</li>`).join('')}
  </ul>` : ''}
</div>`;
  }

  /* ─── TAB: CHECKLIST ─── */
  function _tabChecklist() {
    if (state.documentos.length === 0)
      return _emptyTab('Insira documentos para gerar o checklist.', 'inserir');

    return `
<div class="vdoc-check-wrap">
  <div class="vdoc-check-actions">
    <h3 class="vdoc-section-title">📋 Checklist Final de Documentação</h3>
    <button class="vdoc-btn vdoc-btn-ghost" onclick="VDOC.exportarChecklist()">⬇️ Exportar</button>
  </div>
  <div class="vdoc-table-wrap">
    <table class="vdoc-table vdoc-check-table" id="vdoc-checklist-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Item Solicitado</th>
          <th>Categoria</th>
          <th>Período</th>
          <th>Status</th>
          <th>Evidência / Origem</th>
          <th>Observação Técnica</th>
          <th>Risco</th>
        </tr>
      </thead>
      <tbody>
        ${state.documentos.map((d, i) => `
        <tr class="${_trClass(d.risco)}">
          <td>${i+1}</td>
          <td><strong>${d.tipo}</strong></td>
          <td>${d.categoria || '—'}</td>
          <td>${d.periodo || '—'}</td>
          <td><span class="vdoc-status-tag">${d.status} ${d.statusLabel}</span></td>
          <td>${d.origem || '—'}</td>
          <td class="vdoc-obs-cell">
            ${d.obs || ''}
            ${d.inconsistenciaDetalhe?.length > 0 ? `<ul class="vdoc-alerts-small">${d.inconsistenciaDetalhe.map(a=>`<li>${a}</li>`).join('')}</ul>` : ''}
          </td>
          <td>${d.risco} <small>${d.riscoLabel}</small></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>
</div>`;
  }

  /* ─── TAB: RELATÓRIO ─── */
  function _tabRelatorio() {
    if (state.documentos.length === 0)
      return _emptyTab('Insira documentos para gerar o relatório.', 'inserir');

    const validos    = state.documentos.filter(d => d.status === '✅');
    const incompletos= state.documentos.filter(d => d.status === '⚠️');
    const ausentes   = state.documentos.filter(d => d.status === '❌');
    const inconsist  = state.documentos.filter(d => d.status === '🔍');
    const clienteNome = state.cliente?.razao || state.cliente?.nome || 'Cliente';
    const comp = state.competencia || '—';

    return `
<div class="vdoc-rel-wrap">
  <div class="vdoc-rel-header-bar">
    <div>
      <h3 class="vdoc-section-title" style="margin:0">📄 Relatório para o Cliente</h3>
      <p style="margin:4px 0 0;color:var(--vdoc-muted);font-size:13px">${clienteNome} • Competência: ${comp}</p>
    </div>
    <button class="vdoc-btn vdoc-btn-primary" onclick="VDOC.imprimirRelatorio()">🖨️ Imprimir / PDF</button>
  </div>

  <div class="vdoc-rel-body" id="vdoc-relatorio-body">
    <div class="vdoc-rel-letterhead">
      <div class="vdoc-rel-logo">📊</div>
      <div>
        <div class="vdoc-rel-office">Criscontab &amp; Madeira Contabilidade</div>
        <div class="vdoc-rel-ref">Relatório de Documentação — ${clienteNome} • Competência ${comp}</div>
        <div class="vdoc-rel-date">Emitido em: ${new Date().toLocaleDateString('pt-BR')}</div>
      </div>
    </div>

    ${validos.length > 0 ? `
    <div class="vdoc-rel-section vdoc-rel-ok">
      <div class="vdoc-rel-section-title">✅ Documentos Entregues Corretamente (${validos.length})</div>
      <ul>${validos.map(d => `<li><strong>${d.tipo}</strong> — ${d.natureza} — ${d.periodo || 'sem período'}</li>`).join('')}</ul>
    </div>` : ''}

    ${incompletos.length > 0 ? `
    <div class="vdoc-rel-section vdoc-rel-warn">
      <div class="vdoc-rel-section-title">⚠️ Documentos Incompletos ou que Precisam de Validação (${incompletos.length})</div>
      <ul>${incompletos.map(d => `
        <li>
          <strong>${d.tipo}</strong>${d.periodo ? ` — ${d.periodo}` : ''}
          ${d.obs ? `<br><em>${d.obs}</em>` : ''}
        </li>`).join('')}</ul>
    </div>` : ''}

    ${ausentes.length > 0 ? `
    <div class="vdoc-rel-section vdoc-rel-nok">
      <div class="vdoc-rel-section-title">❌ Documentos Não Entregues (${ausentes.length})</div>
      <ul>${ausentes.map(d => `<li><strong>${d.tipo}</strong>${d.natureza ? ` — ${d.natureza}` : ''}${d.periodo ? ` — ${d.periodo}` : ''}</li>`).join('')}</ul>
    </div>` : ''}

    ${inconsist.length > 0 ? `
    <div class="vdoc-rel-section vdoc-rel-inc">
      <div class="vdoc-rel-section-title">🔍 Documentos que Precisam de Regularização (${inconsist.length})</div>
      <ul>${inconsist.map(d => `
        <li>
          <strong>${d.tipo}</strong>${d.periodo ? ` — ${d.periodo}` : ''}
          ${d.inconsistenciaDetalhe?.length > 0 ? `<ul>${d.inconsistenciaDetalhe.map(a=>`<li>${a}</li>`).join('')}</ul>` : ''}
        </li>`).join('')}</ul>
    </div>` : ''}

    <div class="vdoc-rel-footer">
      <p>Este relatório foi gerado automaticamente com base nos documentos inseridos e validados pelo sistema.
      Qualquer regularização ou complementação deve ser realizada junto ao escritório contábil responsável.</p>
      <p><strong>Criscontab &amp; Madeira Contabilidade</strong> — Sistema de Verificação Documental v1.0</p>
    </div>
  </div>
</div>`;
  }

  /* ── UTILITÁRIOS ── */
  function _emptyTab(msg, goto) {
    return `<div class="vdoc-empty">
      <div class="vdoc-empty-icon">📂</div>
      <p>${msg}</p>
      <button class="vdoc-btn vdoc-btn-primary" onclick="VDOC.setTab('${goto}')">Ir para Inserção</button>
    </div>`;
  }

  function _statusClass(status) {
    if (status === '✅') return 'vdoc-ok';
    if (status === '⚠️') return 'vdoc-warn';
    if (status === '❌') return 'vdoc-nok';
    if (status === '🔍') return 'vdoc-inc';
    return '';
  }

  function _trClass(risco) {
    if (risco === '🔴') return 'tr-red';
    if (risco === '🟡') return 'tr-yellow';
    return '';
  }

  function _rerender() {
    const el = document.getElementById('main-content');
    if (el) el.innerHTML = render();
  }

  /* ── API PÚBLICA ── */
  function setCliente(id) {
    const clientes = JSON.parse(localStorage.getItem('clientes') || '[]');
    state.cliente = clientes.find(c => String(c.id) === String(id)) || null;
    state.documentos = _carregarDocs();
    _rerender();
  }

  function setCompetencia(v) {
    state.competencia = v;
    _rerender();
  }

  function setTab(tab) {
    state.activeTab = tab;
    _rerender();
  }

  function updateField(campo, valor) {
    state.novoDoc[campo] = valor;
  }

  function adicionarDoc() {
    const d = state.novoDoc;
    if (!d.tipo) { alert('Informe o tipo do documento.'); return; }
    if (!d.categoria) { alert('Selecione a categoria.'); return; }
    if (!d.natureza) { alert('Selecione a natureza.'); return; }
    if (!d.periodo) { alert('Informe o período de competência.'); return; }
    if (!d.origem) { alert('Informe a origem do documento.'); return; }

    const validado = _autoValidar({ ...d, id: Date.now() });
    state.documentos.push(validado);
    _salvarDocs();
    state.novoDoc = _emptyDoc();
    _rerender();
  }

  function removerDoc(idx) {
    if (!confirm('Remover este documento?')) return;
    state.documentos.splice(idx, 1);
    _salvarDocs();
    _rerender();
  }

  function limparForm() {
    state.novoDoc = _emptyDoc();
    _rerender();
  }

  function _chaveStorage() {
    return `vdoc_${state.cliente?.id}_${state.competencia}`;
  }

  function _salvarDocs() {
    if (!state.cliente) return;
    localStorage.setItem(_chaveStorage(), JSON.stringify(state.documentos));
  }

  function _carregarDocs() {
    if (!state.cliente) return [];
    const raw = localStorage.getItem(_chaveStorage());
    return raw ? JSON.parse(raw) : [];
  }

  function exportarChecklist() {
    const rows = [['#','Tipo','Categoria','Natureza','Período','Origem','Status','Observação','Risco']];
    state.documentos.forEach((d,i) => {
      rows.push([
        i+1, d.tipo, d.categoria, d.natureza, d.periodo, d.origem,
        `${d.status} ${d.statusLabel}`, d.obs || (d.inconsistenciaDetalhe||[]).join('; '),
        `${d.risco} ${d.riscoLabel}`
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF'+csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `checklist_${state.cliente?.nome || 'cliente'}_${state.competencia || 'comp'}.csv`;
    a.click();
  }

  function imprimirRelatorio() {
    const el = document.getElementById('vdoc-relatorio-body');
    if (!el) return;
    const w = window.open('','_blank');
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
      <title>Relatório Documental</title>
      <style>
        body{font-family:Arial,sans-serif;padding:32px;color:#1e293b;max-width:900px;margin:auto}
        .vdoc-rel-letterhead{display:flex;gap:16px;align-items:center;border-bottom:2px solid #4f46e5;padding-bottom:16px;margin-bottom:24px}
        .vdoc-rel-logo{font-size:40px}
        .vdoc-rel-office{font-size:18px;font-weight:700;color:#4f46e5}
        .vdoc-rel-section{margin-bottom:20px;padding:12px 16px;border-radius:8px}
        .vdoc-rel-ok{background:#f0fdf4;border-left:4px solid #22c55e}
        .vdoc-rel-warn{background:#fffbeb;border-left:4px solid #f59e0b}
        .vdoc-rel-nok{background:#fef2f2;border-left:4px solid #ef4444}
        .vdoc-rel-inc{background:#f0f9ff;border-left:4px solid #06b6d4}
        .vdoc-rel-section-title{font-weight:700;margin-bottom:8px;font-size:15px}
        ul{margin:4px 0;padding-left:20px}
        li{margin:4px 0;font-size:13px}
        .vdoc-rel-footer{margin-top:32px;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:16px}
      </style></head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  }

  /* ── INIT ── */
  function init() {
    // Pré-seed do cliente 84 na primeira vez
    _seedCliente84();
    // Pega competência atual do topbar se disponível
    const topComp = document.getElementById('comp-topbar');
    if (topComp && topComp.value) state.competencia = topComp.value;
    else {
      const now = new Date();
      state.competencia = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    }
    state.documentos = _carregarDocs();
    _rerender();
  }

  function importarDoEmail() {
    const texto = document.getElementById('vdoc-email-texto')?.value || '';
    const comp  = document.getElementById('vdoc-imp-comp')?.value || state.competencia;
    if (!texto.trim()) { alert('Cole o texto do e-mail antes de importar.'); return; }
    if (!state.cliente) { alert('Selecione um cliente primeiro.'); return; }
    if (!comp) { alert('Informe o período de competência.'); return; }

    const novos = _parseEmail(texto, comp);
    if (!novos.length) { alert('Nenhum documento identificado. Verifique o texto.'); return; }

    novos.forEach(d => {
      const validado = _autoValidar({ ...d, id: Date.now() + Math.random() });
      if (d._forcarNaoEntregue) {
        validado.entregue = false; validado.completo = 'parcial';
        validado.status = '❌'; validado.statusLabel = 'Não entregue';
        validado.risco  = '🔴'; validado.riscoLabel  = 'Alto risco';
      } else if (d._forcarEntregue) {
        validado.entregue = true;
      }
      state.documentos.push(validado);
    });
    _salvarDocs();
    state.activeTab = 'inserir';
    _rerender();
    setTimeout(() => alert(`✅ ${novos.length} documento(s) importado(s) com sucesso!`), 100);
  }

  return {
    render, init, setCliente, setCompetencia, setTab,
    updateField, adicionarDoc, removerDoc, limparForm,
    exportarChecklist, imprimirRelatorio, importarDoEmail
  };
})();
