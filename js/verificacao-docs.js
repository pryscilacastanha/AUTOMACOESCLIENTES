
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
      case 'classificar':return _tabClassificar();
      case 'validar':    return _tabValidar();
      case 'pendencias': return _tabPendencias();
      case 'checklist':  return _tabChecklist();
      case 'relatorio':  return _tabRelatorio();
      default:           return _tabInserir();
    }
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

  return {
    render, init, setCliente, setCompetencia, setTab,
    updateField, adicionarDoc, removerDoc, limparForm,
    exportarChecklist, imprimirRelatorio
  };
})();
