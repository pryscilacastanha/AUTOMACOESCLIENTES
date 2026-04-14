/* ═══════════════════════════════════════════════════════
   VÉRTICE — Plataforma Unificada de Gestão
   Main Application Engine v1.1 — UNIFIED
   Integra: Contabilidade + Financeiro + Societário + 
            Revenda SCI + Consultoria + DCC
   ═══════════════════════════════════════════════════════ */

const V = (() => {
  'use strict';

  // ── STATE ──
  let currentPage = 'home';
  
  // ── DB ──
  const DB_KEY = 'vertice_data';
  
  function loadDB() {
    try { return JSON.parse(localStorage.getItem(DB_KEY)) || getDefaultDB(); }
    catch { return getDefaultDB(); }
  }

  function saveDB(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    // Cloud sync
    if (window.CloudDB) window.CloudDB.push(DB_KEY, db);
  }

  function getDefaultDB() {
    return {
      clientes_contab: [
        {
          id: 1,
          razao: 'FORTE GASTRONOMIA LTDA',
          fantasia: '144 Forte - Zona Norte',
          cnpj: '58.468.980/0001-31',
          regime: 'Simples Nacional',
          status: 'Ativo',
          responsavel: 'João Alfredo Bettoni',
          email: '', telefone: '',
          servico: 'Assessoria Contábil',
          origem: 'CrisContab',
          endereco: 'Av. Do Forte, 597 — Cristo Redentor, Porto Alegre/RS — CEP 91360-000',
          ie: '096/4043467',
          data_abertura: '2024-12-16',
          acessos: { decweb: '58468980000131', simples: '421467848028' },
          faturamento_2025: {
            jan: 0, fev: 0, mar: 0, abr: 62969.45, mai: 107954.23,
            jun: 115811.43, jul: 152207.67, ago: 141995.85, set: 108123.59,
            out: 84457.57, nov: 78910.21, dez: 91067.92,
            total: 943497.92, media: 78624.83
          },
          impostos_2025: {
            gps: [
              { ref:'07/2025', valor:860.93, tipo:'Folha normal' },
              { ref:'08/2025', valor:1011.46, tipo:'Folha normal' },
              { ref:'09/2025', valor:1011.46, tipo:'Folha normal' },
              { ref:'10/2025', valor:787.10, tipo:'Folha normal' },
              { ref:'11/2025', valor:958.66, tipo:'Folha normal' },
              { ref:'12/2025', valor:930.53, tipo:'Folha normal' },
              { ref:'12/2025', valor:451.49, tipo:'13º Salário' }
            ],
            fgts: [
              { ref:'07/2025', valor:1026.57 }, { ref:'08/2025', valor:1303.16 },
              { ref:'09/2025', valor:1057.62 }, { ref:'10/2025', valor:890.26 },
              { ref:'11/2025', valor:1065.46 }, { ref:'12/2025', valor:1263.13 },
              { ref:'12/2025', valor:1219.06, tipo:'Complementar' }
            ],
            simples: [
              { ref:'07/2025', valor:7937.00 }, { ref:'08/2025', valor:8879.86 },
              { ref:'09/2025', valor:6586.55 }, { ref:'10/2025', valor:5231.97 },
              { ref:'11/2025', valor:4926.46 }, { ref:'12/2025', valor:5695.63 }
            ]
          },
          capital_social: {
            valor_atual: 100000,
            historico: [
              { data: '2024-12-09', tipo: 'Constituição', valor: 200000, descricao: 'Capital subscrito — 2 sócios' },
              { data: '2025-09-29', tipo: 'Redução', valor: 100000, descricao: 'Saída sócio André — Redução para R$ 100.000' }
            ]
          },
          obrigacoes_por_ano: {
            '2025': {
              'DAS': { jan:true,fev:true,mar:true,abr:false,mai:false,jun:false,jul:true,ago:true,set:true,out:true,nov:true,dez:true },
              'PGDAS': { jan:true,fev:true,mar:true,abr:false,mai:false,jun:false,jul:true,ago:true,set:true,out:true,nov:true,dez:true },
              'DEFIS': { anual: false },
              'DIRF': { anual: false },
              'RAIS': { anual: false },
              'DCTF': { jan:false,fev:false,mar:false,abr:false,mai:false,jun:false,jul:true,ago:true,set:true,out:true,nov:true,dez:true }
            },
            '2024': {
              'DAS': { jan:false,fev:false,mar:false,abr:false,mai:false,jun:false,jul:false,ago:false,set:false,out:false,nov:false,dez:false },
              'PGDAS': { jan:false,fev:false,mar:false,abr:false,mai:false,jun:false,jul:false,ago:false,set:false,out:false,nov:false,dez:false },
              'DEFIS': { anual: false },
              'DIRF': { anual: false },
              'RAIS': { anual: false },
              'DCTF': { jan:false,fev:false,mar:false,abr:false,mai:false,jun:false,jul:false,ago:false,set:false,out:false,nov:false,dez:false }
            },
            '2026': {
              'DAS': { jan:false,fev:false,mar:false,abr:false,mai:false,jun:false,jul:false,ago:false,set:false,out:false,nov:false,dez:false },
              'PGDAS': { jan:false,fev:false,mar:false,abr:false,mai:false,jun:false,jul:false,ago:false,set:false,out:false,nov:false,dez:false },
              'DEFIS': { anual: false },
              'DIRF': { anual: false },
              'RAIS': { anual: false },
              'DCTF': { jan:false,fev:false,mar:false,abr:false,mai:false,jun:false,jul:false,ago:false,set:false,out:false,nov:false,dez:false }
            }
          },
          documentos: {
            societario: [
              { nome:'Contrato Social',tipo:'pdf',status:'ok' },
              { nome:'1ª Alteração Contratual (29/09/2025)',tipo:'pdf',status:'ok' },
              { nome:'CNPJ',tipo:'pdf',status:'ok' },
              { nome:'Inscrição Estadual',tipo:'pdf',status:'ok' },
              { nome:'Inscrição Municipal',tipo:'pdf',status:'ok' },
              { nome:'Alvará/Dispensa',tipo:'pdf',status:'ok' },
              { nome:'QSA',tipo:'pdf',status:'ok' },
              { nome:'PPCI',tipo:'pdf',status:'ok' },
              { nome:'Contrato de Locação',tipo:'pdf',status:'ok' },
              { nome:'Contrato Contábil',tipo:'pdf',status:'ok' },
              { nome:'Certidão Negativa',tipo:'pdf',status:'ok' },
              { nome:'Certidão Dispensa Alvará Saúde',tipo:'pdf',status:'ok' },
              { nome:'Licenciamento PPCI',tipo:'pdf',status:'ok' }
            ],
            fiscal: [
              { nome:'PGDAS-D Jul-Dez/2025', tipo:'declaracao', status:'ok' },
              { nome:'Simples Nacional Jul-Dez/2025', tipo:'guia', status:'ok' }
            ],
            contabil: [
              { nome:'Extratos Banrisul 2025 (Fev-Dez)', tipo:'ofx', status:'ok' },
              { nome:'Extratos Banrisul 2026 (Jan-Mar)', tipo:'pdf', status:'ok' },
              { nome:'Livro Caixa - Reserva', tipo:'xlsx', status:'ok' }
            ],
            trabalhista: [
              { nome:'Folha Jul-Dez/2025 + 13º', tipo:'espelho', status:'ok' },
              { nome:'Folha Jan-Mar/2026', tipo:'espelho', status:'ok' },
              { nome:'GPS Jul-Dez/2025', tipo:'guia', status:'ok' },
              { nome:'FGTS Jul-Dez/2025', tipo:'guia', status:'ok' },
              { nome:'DCTF Web Jul-Dez/2025', tipo:'declaracao', status:'ok' },
              { nome:'Rescisão Bruna Siqueira', tipo:'docs', status:'ok' }
            ]
          }
        }
      ],
      clientes_revenda: [],
      crm: [],
      config: { versao: '1.1', ultimo_acesso: new Date().toISOString() }
    };
  }

  let db = loadDB();

  // ── PAGE DEFS ──
  const PAGES = {
    home:             { title:'Dashboard',               sub:'Visão geral da plataforma Vértice',           render: renderHome },
    crm:              { title:'CRM / Pipeline',           sub:'Consultoria — Gestão comercial',              render: renderCRM },
    planejamento:     { title:'Planejamento Estratégico',  sub:'Consultoria — Metodologia 7 Etapas',          render: renderPlanejamentoConsult },
    contratos:        { title:'Contratos',                sub:'Consultoria — Gestão de contratos',           render: renderContratos },
    carteira:         { title:'Carteira de Clientes',     sub:'Contabilidade — CrisContab & Madeira',        render: renderCarteira },
    escrituracao:     { title:'Escrituração 2025',        sub:'Contabilidade — Diagnóstico e escrituração',  render: renderEscrituracao },
    obrigacoes:       { title:'Obrigações Acessórias',    sub:'Contabilidade — Controle de entregas',        render: renderObrigacoes },
    conciliacao:      { title:'Conciliação Inteligente',  sub:'Contabilidade — Importação e classificação',  render: renderConciliacao },
    educacao:         { title:'Educação Cliente',         sub:'Contabilidade — Base de conhecimento',        render: renderEducacao },
    onboarding:       { title:'Onboarding',               sub:'Contabilidade — Jornada do cliente',          render: renderOnboarding },
    'fin-dashboard':  { title:'Dashboard Financeiro',     sub:'Financeiro — Panorama consolidado',           render: renderFinDash },
    'fin-receber':    { title:'Contas a Receber',         sub:'Financeiro — Receitas e entradas',            render: renderFinReceber },
    'fin-pagar':      { title:'Contas a Pagar',           sub:'Financeiro — Fornecedor · Despesa · Total',   render: renderFinPagar },
    'fin-fluxo':      { title:'Fluxo de Caixa',           sub:'Financeiro — Entradas vs Saídas',             render: renderFinFluxo },
    'fin-despesas':   { title:'Despesas',                 sub:'Financeiro — Controle por classificação',     render: renderFinDespesas },
    'fin-dividas':    { title:'Dívidas & Passivos',       sub:'Financeiro — Mapa de endividamento',          render: renderFinDividas },
    'fin-patrimonio': { title:'Patrimônio',               sub:'Financeiro — Ativos – Passivos',              render: renderFinPatrimonio },
    'fin-dependentes':{ title:'Custos por Dependente',    sub:'Financeiro — Controle para pensão',           render: renderFinDependentes },
    'fin-legal':      { title:'Base Legal',               sub:'Financeiro — Fundamentação jurídica',         render: renderFinLegal },
    'fin-planejamento':{ title:'Planejamento Financeiro', sub:'Financeiro — Curto, médio e longo prazo',     render: renderFinPlanej },
    'soc-diagnostico':{ title:'Diagnóstico Societário',   sub:'Societário — Motor inteligente 3 camadas',    render: renderSocDiagnostico },
    'soc-simulador':  { title:'Simulador Tributário',      sub:'Societário — Compare MEI, Simples, Presumido e Real', render: renderSocSimulador },
    'soc-holdings':   { title:'Holdings',                 sub:'Societário — Gestão de holdings',             render: renderSocHoldings },
    'soc-abertura':   { title:'Abertura de Empresas',     sub:'Societário — Fluxo operacional',              render: renderSocAbertura },
    'rev-carteira':   { title:'Carteira Clientes SCI',    sub:'Revenda SCI — Base de clientes',              render: renderRevCarteira },
    'rev-comercial':  { title:'Gestão Comercial',         sub:'Revenda SCI — Estratégia comercial',          render: renderRevComercial },
    'rev-base':       { title:'Base de Conhecimento',     sub:'Revenda SCI — Documentação técnica',          render: renderRevBase },
    'dcc-sistema':    { title:'Sistema DCC',              sub:'DCC — Sistema público para prefeituras',      render: renderDCC },
    config:           { title:'Configurações',            sub:'Administração do sistema Vértice',            render: renderConfig }
  };

  // ══════════════════════════════════════════════════
  // NAVIGATION
  // ══════════════════════════════════════════════════
  function nav(page) {
    if (!PAGES[page]) return;
    currentPage = page;
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });
    const activeBtn = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (activeBtn) {
      const groupBody = activeBtn.closest('.module-group-body');
      if (groupBody && !groupBody.classList.contains('open')) {
        groupBody.classList.add('open');
        const toggle = groupBody.previousElementSibling;
        if (toggle) toggle.classList.add('open');
      }
    }
    const p = PAGES[page];
    document.getElementById('topbar-title').textContent = p.title;
    document.getElementById('topbar-sub').textContent = p.sub;
    document.getElementById('topbar-actions').innerHTML = '';
    const el = document.getElementById('main-content');
    el.innerHTML = '';
    el.className = 'content animate-in';
    p.render(el);
    db.config.ultimo_acesso = new Date().toISOString();
    saveDB(db);
  }

  function toggleGroup(btn) {
    btn.classList.toggle('open');
    const body = btn.nextElementSibling;
    if (body) body.classList.toggle('open');
  }

  // ══════════════════════════════════════════════════
  // TOAST / MODAL
  // ══════════════════════════════════════════════════
  function toast(msg, icon = '✅') {
    const el = document.getElementById('toast');
    el.innerHTML = `${icon} ${msg}`;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 3000);
  }

  function openModal(html) {
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-overlay').classList.add('open');
  }

  function closeModal() {
    document.getElementById('modal-overlay').classList.remove('open');
  }

  // ══════════════════════════════════════════════════
  // UTILITY
  // ══════════════════════════════════════════════════
  function currency(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
  }

  function pct(v, t) { return t ? Math.round((v / t) * 100) + '%' : '0%'; }

  const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const MESES_KEYS = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

  // ══════════════════════════════════════════════════
  // PAGE: HOME — DASHBOARD UNIFICADO COM DADOS REAIS
  // ══════════════════════════════════════════════════
  function renderHome(el) {
    const totalClientes = db.clientes_contab.length;
    // Dados reais do financeiro
    const receitaTotal = (typeof calcReceitaMedia === 'function') ? calcReceitaMedia('pf') + calcReceitaMedia('pj') : 0;
    const despesaTotal = (typeof calcDespesasMensais === 'function') ? calcDespesasMensais() : 0;
    const parcelasTotal = (typeof calcParcelasMensais === 'function') ? calcParcelasMensais() : 0;
    const saldoMensal = receitaTotal - despesaTotal - parcelasTotal;
    const totalDivPF = (typeof calcTotalDividas === 'function') ? calcTotalDividas('pessoais') : 0;
    const totalDivPJ = (typeof calcTotalDividas === 'function') ? calcTotalDividas('empresariais') : 0;
    const atrasados = (typeof CONTAS_PAGAR !== 'undefined') ? CONTAS_PAGAR.filter(c => c.status === 'atrasado' || c.status === 'em_aberto').length : 0;

    el.innerHTML = `
      <div class="welcome-banner">
        <h2>Bem-vinda ao Vértice, Pry! 🔺</h2>
        <p>Plataforma unificada — Consultoria, Contabilidade, Financeiro, Societário, Revenda SCI e DCC.</p>
      </div>

      ${atrasados > 0 ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px 20px;margin-bottom:18px;display:flex;align-items:center;gap:14px;">
        <span style="font-size:24px">🚨</span>
        <div><div style="font-weight:700;font-size:14px;color:#dc2626">${atrasados} conta(s) em atraso ou em aberto</div>
        <div style="font-size:12px;color:#991b1b">Acesse <a href="#" onclick="V.nav('fin-pagar')" style="color:#6366f1;font-weight:600">Contas a Pagar</a> para ação imediata.</div></div>
      </div>` : ''}

      <div class="kpi-grid">
        <div class="kpi kpi-primary">
          <div class="kpi-icon">💰</div>
          <div class="kpi-label">Receita Média</div>
          <div class="kpi-value" style="font-size:22px">${currency(receitaTotal)}</div>
          <div class="kpi-sub">PF + PJ / mês</div>
        </div>
        <div class="kpi kpi-success">
          <div class="kpi-icon">📋</div>
          <div class="kpi-label">Despesas</div>
          <div class="kpi-value" style="font-size:22px">${currency(despesaTotal)}</div>
          <div class="kpi-sub">Fixas + variáveis</div>
        </div>
        <div class="kpi ${saldoMensal >= 0 ? 'kpi-success' : 'kpi-danger'}">
          <div class="kpi-icon">⚡</div>
          <div class="kpi-label">Saldo Mensal</div>
          <div class="kpi-value" style="font-size:22px">${currency(saldoMensal)}</div>
          <div class="kpi-sub">${saldoMensal >= 0 ? '✅ Positivo' : '❌ Déficit'}</div>
        </div>
        <div class="kpi kpi-danger">
          <div class="kpi-icon">🔴</div>
          <div class="kpi-label">Dívida PF</div>
          <div class="kpi-value" style="font-size:18px">${currency(totalDivPF)}</div>
          <div class="kpi-sub">Passivo pessoal</div>
        </div>
        <div class="kpi kpi-warning">
          <div class="kpi-icon">🏢</div>
          <div class="kpi-label">Dívida PJ</div>
          <div class="kpi-value" style="font-size:18px">${currency(totalDivPJ)}</div>
          <div class="kpi-sub">Passivo empresarial</div>
        </div>
        <div class="kpi kpi-info">
          <div class="kpi-icon">📋</div>
          <div class="kpi-label">Obrigações Pendentes</div>
          <div class="kpi-value">${getObrigacoesPendentes()}</div>
          <div class="kpi-sub">Contabilidade 2025</div>
        </div>
      </div>

      <h3 style="font-size:17px;font-weight:700;margin-bottom:16px;">Módulos do Sistema</h3>
      <div class="module-grid">
        <div class="module-card mc-consultoria" onclick="V.nav('crm')">
          <div class="mc-icon">📊</div>
          <div class="mc-title">Consultoria</div>
          <div class="mc-desc">CRM, Pipeline Comercial, Planejamento Estratégico e Gestão de Contratos.</div>
        </div>
        <div class="module-card mc-contabilidade" onclick="V.nav('carteira')">
          <div class="mc-icon">📁</div>
          <div class="mc-title">Contabilidade</div>
          <div class="mc-desc">Carteira de clientes, escrituração, obrigações acessórias e conciliação.</div>
          <div class="mc-stats"><div><div class="mc-stat-label">Clientes</div><div class="mc-stat-value">${totalClientes}</div></div><div><div class="mc-stat-label">Pendências</div><div class="mc-stat-value">${getObrigacoesPendentes()}</div></div></div>
        </div>
        <div class="module-card mc-financeiro" onclick="V.nav('fin-dashboard')">
          <div class="mc-icon">💰</div>
          <div class="mc-title">Financeiro</div>
          <div class="mc-desc">Contas a receber/pagar, fluxo de caixa, despesas, dívidas e patrimônio.</div>
          <div class="mc-stats"><div><div class="mc-stat-label">Receita</div><div class="mc-stat-value">${currency(receitaTotal)}</div></div><div><div class="mc-stat-label">Parcelas</div><div class="mc-stat-value">${currency(parcelasTotal)}</div></div></div>
        </div>
        <div class="module-card mc-societario" onclick="V.nav('soc-diagnostico')">
          <div class="mc-icon">🏢</div>
          <div class="mc-title">Societário</div>
          <div class="mc-desc">Diagnóstico inteligente, holdings, abertura de empresas e base legal.</div>
        </div>
        <div class="module-card mc-revenda" onclick="V.nav('rev-carteira')">
          <div class="mc-icon">🛒</div>
          <div class="mc-title">Revenda SCI</div>
          <div class="mc-desc">Carteira de clientes SCI, gestão comercial e base de conhecimento.</div>
        </div>
        <div class="module-card mc-dcc" onclick="V.nav('dcc-sistema')">
          <div class="mc-icon">🏛️</div>
          <div class="mc-title">DCC</div>
          <div class="mc-desc">Sistema público para prefeituras — transparência, dados e IA.</div>
        </div>
      </div>
    `;
  }

  function getObrigacoesPendentes() {
    let count = 0;
    const anoAtual = new Date().getFullYear().toString();
    db.clientes_contab.forEach(c => {
      // Support both old format (c.obrigacoes) and new format (c.obrigacoes_por_ano)
      const obAno = c.obrigacoes_por_ano ? c.obrigacoes_por_ano[anoAtual] : c.obrigacoes;
      if (!obAno) return;
      Object.values(obAno).forEach(ob => {
        if (ob.anual !== undefined) { if (!ob.anual) count++; }
        else { MESES_KEYS.forEach(m => { if (ob[m] === false) count++; }); }
      });
    });
    return count;
  }

  // ══════════════════════════════════════════════════
  // FINANCEIRO — Bridge to existing modules
  // ══════════════════════════════════════════════════
  function renderFinEmbed(el, fnName) {
    try {
      const fn = window[fnName];
      if (!fn) { el.innerHTML = `<div class="card card-body"><div class="empty-state"><div class="empty-icon">⚠️</div><h3>Módulo não encontrado</h3><p>Função ${fnName} não disponível.</p></div></div>`; return; }
      el.innerHTML = `<div class="fin-content">${fn()}</div>`;
    } catch (e) {
      console.error('Erro render financeiro:', fnName, e);
      el.innerHTML = `<div class="card card-body"><div style="padding:20px"><h3 style="color:red">⚠️ Erro: ${fnName}</h3><pre style="font-size:.75rem;white-space:pre-wrap;color:red;background:#fff5f5;padding:12px;border-radius:8px">${e.message}\n${e.stack}</pre></div></div>`;
    }
  }

  function renderFinDash(el) { renderFinEmbed(el, 'pgDashboard'); }
  function renderFinReceber(el) { renderFinEmbed(el, 'pgContasReceber'); }
  function renderFinPagar(el) { renderFinEmbed(el, 'pgContasPagar'); }
  function renderFinFluxo(el) { renderFinEmbed(el, 'pgFluxo'); }
  function renderFinDespesas(el) { renderFinEmbed(el, 'pgDespesas'); }
  function renderFinDividas(el) { renderFinEmbed(el, 'pgDividas'); }
  function renderFinPatrimonio(el) { renderFinEmbed(el, 'pgPatrimonio'); }
  function renderFinDependentes(el) { renderFinEmbed(el, 'pgDependentes'); }
  function renderFinLegal(el) { renderFinEmbed(el, 'pgLegal'); }
  function renderFinPlanej(el) { renderFinEmbed(el, 'pgPlanejamento'); }

  // ══════════════════════════════════════════════════
  // CONTABILIDADE — Carteira
  // ══════════════════════════════════════════════════
  function renderCarteira(el) {
    const clientes = db.clientes_contab;
    el.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi kpi-primary"><div class="kpi-icon">🏢</div><div class="kpi-label">Total Clientes</div><div class="kpi-value">${clientes.length}</div></div>
        <div class="kpi kpi-success"><div class="kpi-icon">✅</div><div class="kpi-label">Ativos</div><div class="kpi-value">${clientes.filter(c=>c.status==='Ativo').length}</div></div>
        <div class="kpi kpi-warning"><div class="kpi-icon">📋</div><div class="kpi-label">Obrigações Pendentes</div><div class="kpi-value">${getObrigacoesPendentes()}</div></div>
      </div>
      <div class="card"><div class="card-header"><div class="card-title">Clientes Cadastrados</div><button class="btn btn-primary btn-sm" onclick="V.modalNovoCliente()">+ Novo Cliente</button></div>
      <div class="card-body" style="padding:0"><div class="table-wrap"><table><thead><tr><th>Empresa</th><th>CNPJ</th><th>Regime</th><th>Responsável</th><th>Status</th><th>Ações</th></tr></thead><tbody>
      ${clientes.map(c => `<tr>
        <td><div style="font-weight:600;color:var(--text-1)">${c.fantasia||c.razao}</div><div style="font-size:11px;color:var(--text-3)">${c.razao}</div></td>
        <td style="font-family:monospace;font-size:12px">${c.cnpj}</td>
        <td><span class="badge badge-primary">${c.regime}</span></td>
        <td>${c.responsavel||'—'}</td>
        <td><span class="badge badge-success">${c.status}</span></td>
        <td><button class="btn btn-secondary btn-xs" onclick="V.verCliente(${c.id})">Ver</button> <button class="btn btn-secondary btn-xs" onclick="V.nav('obrigacoes')">Obrigações</button> <button class="btn btn-primary btn-xs" onclick="V.abrirOnboarding(${c.id})">🚀 Onboarding</button></td>
      </tr>`).join('')}
      </tbody></table></div></div></div>
    `;
  }

  // ══════════════════════════════════════════════════
  // CONTABILIDADE — Obrigações Acessórias (multi-year)
  // ══════════════════════════════════════════════════
  let obAnoSel = new Date().getFullYear().toString();
  const OB_ANOS = (() => { const anos = []; for (let y = new Date().getFullYear() + 1; y >= 2010; y--) anos.push(String(y)); return anos; })();

  function migrateObrigacoes(cliente) {
    // Migrate old format (obrigacoes) to new (obrigacoes_por_ano)
    if (cliente.obrigacoes && !cliente.obrigacoes_por_ano) {
      cliente.obrigacoes_por_ano = { '2025': JSON.parse(JSON.stringify(cliente.obrigacoes)) };
      delete cliente.obrigacoes;
      // Create empty entries for other years
      OB_ANOS.forEach(y => {
        if (!cliente.obrigacoes_por_ano[y]) {
          const empty = {};
          Object.keys(cliente.obrigacoes_por_ano['2025']).forEach(k => {
            const ob = cliente.obrigacoes_por_ano['2025'][k];
            if (ob.anual !== undefined) empty[k] = { anual: false };
            else { empty[k] = {}; MESES_KEYS.forEach(m => empty[k][m] = false); }
          });
          cliente.obrigacoes_por_ano[y] = empty;
        }
      });
      saveDB(db);
    }
  }

  function getClienteOb(cliente, ano) {
    migrateObrigacoes(cliente);
    if (!cliente.obrigacoes_por_ano) return {};
    if (!cliente.obrigacoes_por_ano[ano]) {
      // Create empty year from existing template
      const template = Object.values(cliente.obrigacoes_por_ano)[0] || {};
      const empty = {};
      Object.keys(template).forEach(k => {
        const ob = template[k];
        if (ob.anual !== undefined) empty[k] = { anual: false };
        else { empty[k] = {}; MESES_KEYS.forEach(m => empty[k][m] = false); }
      });
      cliente.obrigacoes_por_ano[ano] = empty;
      saveDB(db);
    }
    return cliente.obrigacoes_por_ano[ano];
  }

  function renderObrigacoes(el) {
    const clientes = db.clientes_contab;
    if (!clientes.length) { el.innerHTML = '<div class="card card-body"><div class="empty-state"><div class="empty-icon">📋</div><h3>Nenhum cliente</h3></div></div>'; return; }
    el.innerHTML = `
      <div class="filters" style="gap:14px">
        <select id="ob-cliente-sel" onchange="V.renderObGrid()" style="min-width:200px">${clientes.map(c=>`<option value="${c.id}">${c.fantasia||c.razao}</option>`).join('')}</select>
        <div style="display:flex;align-items:center;gap:8px">
          <label style="font-size:12px;font-weight:600;color:var(--text-2)">Exercício:</label>
          <select id="ob-ano-sel" onchange="V.changeObAno(this.value)" style="min-width:100px;font-weight:700;font-size:14px;padding:6px 12px">
            ${OB_ANOS.map(y=>`<option value="${y}" ${y===obAnoSel?'selected':''}>${y}</option>`).join('')}
          </select>
        </div>
        <div id="ob-stats" style="margin-left:auto;font-size:12px;color:var(--text-3)"></div>
      </div>
      <div class="card"><div class="card-header"><div class="card-title">Controle de Obrigações Acessórias — <span id="ob-ano-label" style="color:var(--accent)">${obAnoSel}</span></div></div>
      <div class="card-body" style="padding:0;overflow-x:auto"><table id="ob-table"><thead><tr><th style="min-width:130px">Obrigação</th>${MESES.map(m=>`<th style="text-align:center;min-width:50px">${m}</th>`).join('')}<th style="text-align:center">Anual</th></tr></thead><tbody id="ob-tbody"></tbody></table></div></div>
    `;
    renderObGrid();
  }

  function changeObAno(ano) {
    obAnoSel = ano;
    const label = document.getElementById('ob-ano-label');
    if (label) label.textContent = ano;
    renderObGrid();
  }

  function renderObGrid() {
    const selId = parseInt(document.getElementById('ob-cliente-sel')?.value || '1');
    const cliente = db.clientes_contab.find(c => c.id === selId);
    if (!cliente) return;
    const tbody = document.getElementById('ob-tbody');
    if (!tbody) return;
    const obData = getClienteOb(cliente, obAnoSel);
    const obKeys = Object.keys(obData);
    let totalCells = 0, doneCells = 0;
    tbody.innerHTML = obKeys.map(key => {
      const ob = obData[key];
      const isAnual = ob.anual !== undefined;
      if (isAnual) {
        totalCells++; if (ob.anual) doneCells++;
        return `<tr><td style="font-weight:600">${key}</td>${MESES_KEYS.map(()=>`<td style="text-align:center;color:var(--text-3)">—</td>`).join('')}<td style="text-align:center"><input type="checkbox" ${ob.anual?'checked':''} style="accent-color:var(--accent);width:18px;height:18px;cursor:pointer" onchange="V.toggleOb(${selId},'${key}','anual',this.checked)"></td></tr>`;
      }
      return `<tr><td style="font-weight:600">${key}</td>${MESES_KEYS.map(m=>{
        totalCells++; if(ob[m]) doneCells++;
        return `<td style="text-align:center"><input type="checkbox" ${ob[m]?'checked':''} style="accent-color:var(--success);width:18px;height:18px;cursor:pointer" onchange="V.toggleOb(${selId},'${key}','${m}',this.checked)"></td>`;
      }).join('')}<td style="text-align:center;color:var(--text-3)">—</td></tr>`;
    }).join('');
    // Stats
    const stats = document.getElementById('ob-stats');
    if (stats) stats.innerHTML = `<span class="badge badge-success">${doneCells}/${totalCells} entregues</span> · <span style="font-weight:700">${totalCells>0?Math.round(doneCells/totalCells*100):0}%</span>`;
  }

  function toggleOb(clienteId, obKey, mesKey, checked) {
    const cliente = db.clientes_contab.find(c => c.id === clienteId);
    if (!cliente) return;
    const obData = getClienteOb(cliente, obAnoSel);
    if (!obData[obKey]) return;
    obData[obKey][mesKey] = checked;
    saveDB(db);
    toast(checked ? `${obKey} ${mesKey.toUpperCase()} ${obAnoSel} — entregue ✅` : `${obKey} ${mesKey.toUpperCase()} ${obAnoSel} — desmarcada`, checked ? '✅' : '⬜');
  }

  // ══════════════════════════════════════════════════
  // CONTABILIDADE — Escrituração 2025
  // ══════════════════════════════════════════════════
  function renderEscrituracao(el) {
    const cliente = db.clientes_contab[0];
    if (!cliente) { el.innerHTML = '<div class="card card-body"><div class="empty-state"><div class="empty-icon">📁</div><h3>Nenhum cliente</h3></div></div>'; return; }
    const docs = cliente.documentos || {};
    const areas = [
      { key:'societario',icon:'🏢',label:'Societário',color:'var(--mod-societario)' },
      { key:'fiscal',icon:'📊',label:'Fiscal',color:'var(--mod-financeiro)' },
      { key:'contabil',icon:'📁',label:'Contábil',color:'var(--mod-contabilidade)' },
      { key:'trabalhista',icon:'👷',label:'Trabalhista',color:'var(--mod-consultoria)' }
    ];
    const totalDocs = areas.reduce((s,a)=>s+(docs[a.key]?.length||0),0);
    const docsOk = areas.reduce((s,a)=>s+(docs[a.key]?.filter(d=>d.status==='ok')?.length||0),0);

    el.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi kpi-primary"><div class="kpi-icon">🏢</div><div class="kpi-label">Cliente</div><div class="kpi-value" style="font-size:18px">${cliente.fantasia}</div><div class="kpi-sub">${cliente.cnpj}</div></div>
        <div class="kpi kpi-success"><div class="kpi-icon">📄</div><div class="kpi-label">Documentos</div><div class="kpi-value">${totalDocs}</div><div class="kpi-sub">${docsOk} verificados</div></div>
        <div class="kpi kpi-warning"><div class="kpi-icon">💰</div><div class="kpi-label">Capital Social Atual</div><div class="kpi-value" style="font-size:20px">${currency(cliente.capital_social?.valor_atual)}</div><div class="kpi-sub">Totalmente integralizado</div></div>
        <div class="kpi kpi-info"><div class="kpi-icon">📊</div><div class="kpi-label">Regime</div><div class="kpi-value" style="font-size:18px">${cliente.regime}</div></div>
      </div>
      <div class="card" style="margin-bottom:20px"><div class="card-header"><div class="card-title">📂 Diagnóstico de Documentação</div><span class="badge badge-success">${pct(docsOk,totalDocs)} completo</span></div><div class="card-body" style="padding:0">
      ${areas.map(area => {
        const items = docs[area.key] || [];
        return `<div class="doc-folder" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'"><span class="doc-folder-icon">${area.icon}</span><span class="doc-folder-name">${area.label}</span><span class="doc-folder-count">${items.length} doc${items.length!==1?'s':''}</span></div>
        <div style="display:${items.length?'block':'none'}">${items.map(d=>`<div class="doc-file"><span class="doc-file-icon">${d.status==='ok'?'✅':'⚠️'}</span><span>${d.nome}</span><span class="badge ${d.status==='ok'?'badge-success':'badge-warning'}" style="margin-left:auto">${d.status==='ok'?'OK':'Pendente'}</span></div>`).join('')}${items.length===0?'<div class="doc-file" style="color:var(--text-3);font-style:italic">Nenhum documento encontrado</div>':''}</div>`;
      }).join('')}
      </div></div>
      <div class="card"><div class="card-header"><div class="card-title">📊 Histórico do Capital Social</div></div><div class="card-body" style="padding:0"><div class="table-wrap"><table><thead><tr><th>Data</th><th>Evento</th><th>Valor</th><th>Descrição</th></tr></thead><tbody>
      ${(cliente.capital_social?.historico||[]).map(h=>`<tr><td>${new Date(h.data).toLocaleDateString('pt-BR')}</td><td><span class="badge ${h.tipo==='Constituição'?'badge-primary':'badge-warning'}">${h.tipo}</span></td><td style="font-weight:700">${currency(h.valor)}</td><td>${h.descricao}</td></tr>`).join('')}
      </tbody></table></div></div></div>
    `;
  }

  // ══════════════════════════════════════════════════
  // CRM
  // ══════════════════════════════════════════════════
  function renderCRM(el) {
    el.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi kpi-primary"><div class="kpi-icon">📊</div><div class="kpi-label">Pipeline Total</div><div class="kpi-value">${db.crm.length||'0'}</div></div>
        <div class="kpi kpi-success"><div class="kpi-icon">✅</div><div class="kpi-label">Fechados</div><div class="kpi-value">—</div></div>
        <div class="kpi kpi-warning"><div class="kpi-icon">⏳</div><div class="kpi-label">Em Negociação</div><div class="kpi-value">—</div></div>
      </div>
      <div class="card card-body"><div class="empty-state"><div class="empty-icon">📊</div><h3>Pipeline CRM</h3><p>Módulo de CRM com Kanban de oportunidades — pronto para dados.</p><button class="btn btn-primary" style="margin-top:16px" onclick="V.toast('CRM — módulo registrado','📊')">Iniciar</button></div></div>
    `;
  }

  // ══════════════════════════════════════════════════
  // PLACEHOLDER PAGES
  // ══════════════════════════════════════════════════
  function renderPlanejamentoConsult(el) { renderPlaceholder(el,'📋','Planejamento Estratégico','Metodologia de 7 Etapas integrada do ERP de Consultoria.'); }
  function renderContratos(el) { renderPlaceholder(el,'📄','Contratos','Gestão de contratos de consultoria — integração com ERP.'); }
  function renderConciliacao(el) { renderPlaceholder(el,'🏦','Conciliação Inteligente','Motor de conciliação bancária com IA — importação de OFX/CSV com classificação automática. Módulo do Criscontab original será integrado.'); }
  function renderEducacao(el) { renderPlaceholder(el,'📖','Educação Cliente','Base de conhecimento para educação contábil e fiscal dos clientes.'); }
  // Onboarding — engine completo
  let _onbClienteId = 1; // default
  function renderOnboarding(el) {
    if (typeof ONBOARDING !== 'undefined') ONBOARDING.render(el, _onbClienteId);
    else renderPlaceholder(el,'🚀','Onboarding','Motor de diagnóstico com 7 etapas para jornada do cliente na escrituração contábil.');
  }
  function abrirOnboarding(clienteId) {
    _onbClienteId = clienteId;
    nav('onboarding');
  }
  // Societário — real engine from soc-engine.js
  function renderSocDiagnostico(el) {
    if (typeof SOC !== 'undefined' && SOC.renderDiagnostico) { SOC.renderDiagnostico(el); SOC.renderDiagStep(el); }
    else renderPlaceholder(el,'🔍','Diagnóstico Societário','Motor inteligente de 3 camadas — dados do sistema Antigravity Societário.');
  }
  function renderSocSimulador(el) {
    if (typeof SOC !== 'undefined' && SOC.renderSimulador) SOC.renderSimulador(el);
    else renderPlaceholder(el,'💰','Simulador Tributário','Compare MEI, Simples Nacional, Lucro Presumido e Lucro Real lado a lado.');
  }
  function renderSocHoldings(el) {
    if (typeof SOC !== 'undefined' && SOC.renderHoldings) SOC.renderHoldings(el);
    else renderPlaceholder(el,'🏢','Holdings','Gestão de holdings — inclusive Vorcon Holding LTDA.');
  }
  function renderSocAbertura(el) {
    if (typeof SOC !== 'undefined' && SOC.renderAbertura) SOC.renderAbertura(el);
    else renderPlaceholder(el,'📝','Abertura de Empresas','Fluxo operacional — JUCIS, Receita Federal, Prefeitura.');
  }
  function renderRevCarteira(el) { renderPlaceholder(el,'👥','Carteira Clientes SCI','Base de clientes da revenda SCI — gestão comercial.'); }
  function renderRevComercial(el) { renderPlaceholder(el,'📊','Gestão Comercial SCI','Estratégia comercial — prospecção, retenção e upsell.'); }
  function renderRevBase(el) { renderPlaceholder(el,'📚','Base de Conhecimento SCI','182 documentos técnicos da SCI — manuais e treinamentos.'); }
  function renderDCC(el) { renderPlaceholder(el,'🏛️','Sistema DCC','Sistema público para prefeituras — dados, transparência e IA.'); }

  function renderPlaceholder(el, icon, title, desc) {
    el.innerHTML = `<div class="card card-body"><div class="empty-state"><div class="empty-icon">${icon}</div><h3>${title}</h3><p>${desc}</p><div style="margin-top:20px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><span class="badge badge-primary">Módulo registrado</span><span class="badge badge-gray">Integração em andamento</span></div></div></div>`;
  }

  // ══════════════════════════════════════════════════
  // CONFIG
  // ══════════════════════════════════════════════════
  function renderConfig(el) {
    const finContas = (typeof CONTAS_PAGAR !== 'undefined') ? CONTAS_PAGAR.length : 0;
    const finReceitas = (typeof RECEITAS !== 'undefined') ? (RECEITAS.pf.length + RECEITAS.pj.length) : 0;
    el.innerHTML = `
      <div class="card"><div class="card-header"><div class="card-title">⚙️ Configurações do Sistema</div></div><div class="card-body">
        <div class="form-grid">
          <div class="form-group form-full"><label>📊 Informações do Sistema</label>
            <div style="background:#f8fafc;padding:16px;border-radius:8px;font-size:13px;color:var(--text-2);line-height:2">
              <strong>Versão:</strong> Vértice v1.1 (Unified)<br>
              <strong>Último acesso:</strong> ${new Date(db.config.ultimo_acesso).toLocaleString('pt-BR')}<br>
              <strong>Clientes Contab:</strong> ${db.clientes_contab.length}<br>
              <strong>Contas Financeiro:</strong> ${finContas} contas · ${finReceitas} receitas<br>
              <strong>Supabase:</strong> ${window.supabaseAPI ? '🟢 Conectado' : '⚪ Offline (localStorage)'}<br>
              <strong>Storage:</strong> ${(JSON.stringify(db).length / 1024).toFixed(1)} KB
            </div>
          </div>
          <div class="form-group"><button class="btn btn-secondary" onclick="V.exportDB()">📥 Exportar Dados</button></div>
          <div class="form-group"><button class="btn btn-danger" onclick="V.resetDB()">🗑️ Resetar Dados</button></div>
          <div class="form-group"><button class="btn btn-primary" onclick="V.syncCloud()">☁️ Sincronizar Nuvem</button></div>
        </div>
      </div></div>
    `;
  }

  // ══════════════════════════════════════════════════
  // CLIENT MODALS
  // ══════════════════════════════════════════════════
  function verCliente(id) {
    const c = db.clientes_contab.find(x => x.id === id);
    if (!c) return;
    const diag = c.diagnostico || {};
    openModal(`
      <h3>🏢 ${c.fantasia||c.razao}</h3>
      <div class="form-grid" style="margin-bottom:16px">
        <div class="form-group"><label>Razão Social</label><input type="text" value="${c.razao}" readonly></div>
        <div class="form-group"><label>CNPJ</label><input type="text" value="${c.cnpj}" readonly></div>
        <div class="form-group"><label>Regime</label><input type="text" value="${c.regime}" readonly></div>
        <div class="form-group"><label>Responsável</label><input type="text" value="${c.responsavel||''}" readonly></div>
        <div class="form-group"><label>Capital Social</label><input type="text" value="${currency(c.capital_social?.valor_atual)}" readonly></div>
        <div class="form-group"><label>Origem</label><input type="text" value="${c.origem||'CrisContab'}" readonly></div>
        <div class="form-group"><label>E-mail</label><input type="text" value="${c.email||'—'}" readonly></div>
        <div class="form-group"><label>Telefone</label><input type="text" value="${c.telefone||'—'}" readonly></div>
      </div>
      ${c.acessos ? `<div style="background:#f0f2ff;padding:14px;border-radius:8px;margin-bottom:16px"><div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:8px">🔑 Acessos</div><div style="font-size:12px;color:var(--text-2);line-height:2"><strong>DecWeb:</strong> ${c.acessos.decweb||'—'}<br><strong>Simples:</strong> ${c.acessos.simples||'—'}</div></div>` : ''}
      ${diag.atividade_principal ? `
      <div style="background:#ecfdf5;padding:14px;border-radius:8px;margin-bottom:16px;border:1px solid #a7f3d0"><div style="font-size:12px;font-weight:700;color:var(--success);margin-bottom:10px">📋 Parecer — Diagnóstico de Onboarding</div>
        <div style="font-size:12px;color:var(--text-2);line-height:2">
          <strong>Atividade principal:</strong> ${diag.atividade_principal||'—'}<br>
          <strong>Nº de funcionários:</strong> ${diag.num_funcionarios||'—'}<br>
          <strong>Faturamento médio:</strong> ${diag.faturamento_medio||'—'}<br>
          <strong>Operações por mês:</strong> ${diag.operacoes_mes||'—'}<br>
          <strong>Sistema ERP/Gestão:</strong> ${diag.sistema_erp||'—'}<br>
          <strong>Contabilidade anterior:</strong> ${diag.contab_anterior||'—'}<br>
          <strong>Pendências fiscais:</strong> ${diag.pendencias_fiscais||'Não informado'}<br>
          <strong>Controle financeiro:</strong> ${diag.controle_financeiro||'—'}<br>
          <strong>Emite NF:</strong> ${diag.emite_nf||'—'}<br>
          <strong>Certificado digital:</strong> ${diag.cert_digital||'—'}<br>
          <strong>Observações:</strong> ${diag.observacoes||'—'}
        </div>
      </div>` : '<div style="background:#fffbeb;padding:12px;border-radius:8px;margin-bottom:16px;border:1px solid #fde68a;font-size:12px;color:#92400e"><strong>⚠️ Diagnóstico pendente</strong> — Edite o cliente para preencher as informações de onboarding.</div>'}
      <div class="modal-footer"><button class="btn btn-secondary" onclick="V.closeModal()">Fechar</button><button class="btn btn-primary" onclick="V.nav('escrituracao');V.closeModal()">Ver Escrituração</button></div>
    `);
  }

  function modalNovoCliente() {
    openModal(`
      <h3>+ Novo Cliente — Onboarding Completo</h3>
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--accent);margin-bottom:10px;letter-spacing:.06em">📋 Dados Gerais</div>
      <div class="form-grid">
        <div class="form-group form-full"><label>Razão Social *</label><input type="text" id="nc-razao" placeholder="EMPRESA LTDA"></div>
        <div class="form-group"><label>Nome Fantasia</label><input type="text" id="nc-fantasia"></div>
        <div class="form-group"><label>CNPJ *</label><input type="text" id="nc-cnpj" placeholder="00.000.000/0000-00"></div>
        <div class="form-group"><label>Regime Tributário</label><select id="nc-regime"><option>Simples Nacional</option><option>Lucro Presumido</option><option>Lucro Real</option><option>MEI</option></select></div>
        <div class="form-group"><label>Responsável</label><input type="text" id="nc-resp"></div>
        <div class="form-group"><label>E-mail</label><input type="email" id="nc-email" placeholder="contato@empresa.com"></div>
        <div class="form-group"><label>Telefone</label><input type="text" id="nc-telefone" placeholder="(51) 99999-0000"></div>
      </div>

      <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--success);margin:20px 0 10px;letter-spacing:.06em">🔍 Diagnóstico do Cliente</div>
      <div class="form-grid">
        <div class="form-group form-full"><label>Atividade principal</label><input type="text" id="nc-atividade" placeholder="ex: Restaurante, Comércio varejista..."></div>
        <div class="form-group"><label>Nº de funcionários</label><input type="number" id="nc-func" placeholder="0" min="0"></div>
        <div class="form-group"><label>Faturamento médio/mês</label><input type="text" id="nc-faturamento" placeholder="R$ 50.000"></div>
        <div class="form-group"><label>Operações bancárias/mês</label><input type="number" id="nc-operacoes" placeholder="30" min="0"></div>
        <div class="form-group"><label>Sistema ERP/Gestão</label><select id="nc-erp"><option value="">Não possui</option><option>SCI</option><option>Domínio</option><option>Outro</option></select></div>
      </div>

      <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--warning);margin:20px 0 10px;letter-spacing:.06em">📁 Controle Interno</div>
      <div class="form-grid">
        <div class="form-group"><label>Contabilidade anterior</label><input type="text" id="nc-contab-ant" placeholder="Nome do escritório"></div>
        <div class="form-group"><label>Pendências fiscais?</label><select id="nc-pendencias"><option value="Não">Não</option><option value="Sim">Sim</option><option value="Não verificado">Não verificado</option></select></div>
        <div class="form-group"><label>Controle financeiro</label><select id="nc-ctrl-fin"><option value="Planilha">Planilha</option><option value="Sistema">Sistema</option><option value="Nenhum">Nenhum</option></select></div>
        <div class="form-group"><label>Emite NF?</label><select id="nc-nf"><option value="Sim">Sim</option><option value="Não">Não</option></select></div>
        <div class="form-group"><label>Certificado digital?</label><select id="nc-cert"><option value="Sim">Sim — A1</option><option value="Sim A3">Sim — A3</option><option value="Não">Não possui</option></select></div>
        <div class="form-group form-full"><label>Observações do diagnóstico</label><textarea id="nc-obs" rows="3" placeholder="Informações relevantes sobre o cliente..."></textarea></div>
      </div>

      <div class="modal-footer"><button class="btn btn-secondary" onclick="V.closeModal()">Cancelar</button><button class="btn btn-primary" onclick="V.salvarNovoCliente()">✅ Salvar Cliente</button></div>
    `);
  }

  function salvarNovoCliente() {
    const razao = document.getElementById('nc-razao')?.value?.trim();
    const cnpj = document.getElementById('nc-cnpj')?.value?.trim();
    if (!razao||!cnpj) { toast('Preencha Razão Social e CNPJ','⚠️'); return; }
    const novo = {
      id: Date.now(), razao, fantasia: document.getElementById('nc-fantasia')?.value?.trim()||'', cnpj,
      regime: document.getElementById('nc-regime')?.value||'Simples Nacional', status:'Ativo',
      responsavel: document.getElementById('nc-resp')?.value?.trim()||'',
      email: document.getElementById('nc-email')?.value?.trim()||'',
      telefone: document.getElementById('nc-telefone')?.value?.trim()||'',
      servico:'Assessoria Contábil', origem:'CrisContab', acessos:{},
      capital_social: { valor_atual:0, historico:[] },
      diagnostico: {
        atividade_principal: document.getElementById('nc-atividade')?.value?.trim()||'',
        num_funcionarios: document.getElementById('nc-func')?.value||'',
        faturamento_medio: document.getElementById('nc-faturamento')?.value?.trim()||'',
        operacoes_mes: document.getElementById('nc-operacoes')?.value||'',
        sistema_erp: document.getElementById('nc-erp')?.value||'',
        contab_anterior: document.getElementById('nc-contab-ant')?.value?.trim()||'',
        pendencias_fiscais: document.getElementById('nc-pendencias')?.value||'',
        controle_financeiro: document.getElementById('nc-ctrl-fin')?.value||'',
        emite_nf: document.getElementById('nc-nf')?.value||'',
        cert_digital: document.getElementById('nc-cert')?.value||'',
        observacoes: document.getElementById('nc-obs')?.value?.trim()||'',
        data_diagnostico: new Date().toISOString()
      },
      obrigacoes_por_ano: { [new Date().getFullYear()]: { 'DAS':{jan:false,fev:false,mar:false,abr:false,mai:false,jun:false,jul:false,ago:false,set:false,out:false,nov:false,dez:false}, 'PGDAS':{jan:false,fev:false,mar:false,abr:false,mai:false,jun:false,jul:false,ago:false,set:false,out:false,nov:false,dez:false}, 'DEFIS':{anual:false} } },
      documentos: { societario:[], fiscal:[], contabil:[], trabalhista:[] }
    };
    db.clientes_contab.push(novo);
    saveDB(db); closeModal(); toast(`${razao} cadastrado com diagnóstico!`); nav('carteira');
  }

  // ══════════════════════════════════════════════════
  // EXPORT / RESET / SYNC
  // ══════════════════════════════════════════════════
  function exportDB() {
    const blob = new Blob([JSON.stringify(db,null,2)], { type:'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vertice_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    toast('Backup exportado!','📥');
  }

  function resetDB() {
    if (!confirm('⚠️ Resetar TODOS os dados do Vértice?')) return;
    if (!confirm('🔴 CONFIRMAÇÃO FINAL: Todos os dados serão perdidos.')) return;
    localStorage.removeItem(DB_KEY);
    db = getDefaultDB(); saveDB(db); nav('home');
    toast('Dados resetados','🔄');
  }

  async function syncCloud() {
    if (!window.CloudDB) { toast('Supabase não conectado','⚠️'); return; }
    try {
      await window.CloudDB.push(DB_KEY, db);
      toast('Dados sincronizados com Supabase!','☁️');
    } catch(e) {
      toast('Erro na sincronização: ' + e.message,'❌');
    }
  }

  // ══════════════════════════════════════════════════
  // INIT
  // ══════════════════════════════════════════════════
  function init() {
    // Try cloud pull
    if (window.CloudDB) window.CloudDB.pullAll().then(() => {
      const cloudDB = loadDB();
      if (cloudDB && cloudDB.config) db = cloudDB;
    }).catch(() => {});
    nav('home');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }

  // ══════════════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════════════
  return {
    nav, toggleGroup, toast, openModal, closeModal,
    verCliente, modalNovoCliente, salvarNovoCliente,
    abrirOnboarding,
    toggleOb, renderObGrid, changeObAno,
    exportDB, resetDB, syncCloud
  };
})();
