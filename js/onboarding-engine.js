/* ═══════════════════════════════════════════════════════
   ONBOARDING ENGINE — Jornada do Cliente
   Motor de diagnóstico para escrituração contábil
   Baseado em: C-006, Modelo de Diagnóstico, DOCUMENTOS
   ═══════════════════════════════════════════════════════ */

const ONBOARDING = (() => {
  'use strict';

  // ── DEFINIÇÃO DAS ETAPAS (baseado C-006 + PDFs) ──
  const ETAPAS = [
    { id: 'dados_gerais',   icon: '🏢', label: 'Dados Gerais',           color: '#6366f1' },
    { id: 'docs_socio',     icon: '👤', label: 'Documentos do Sócio',    color: '#0ea5e9' },
    { id: 'docs_cnpj',      icon: '📄', label: 'Documentos do CNPJ',     color: '#10b981' },
    { id: 'diagnostico',    icon: '🔍', label: 'Diagnóstico Inicial',    color: '#f59e0b' },
    { id: 'gestao_fin',     icon: '💰', label: 'Gestão Financeira',      color: '#ec4899' },
    { id: 'obrigacoes',     icon: '📋', label: 'Obrigações / Entregas',  color: '#8b5cf6' },
    { id: 'parecer',        icon: '📊', label: 'Parecer Final',          color: '#ef4444' }
  ];

  // ── CHECKLIST COMPLETO (baseado no CSV C-006) ──
  const CHECKLISTS = {
    docs_socio: [
      { cod: '1001', item: 'Certificado Digital (e-CNPJ)', obrigatorio: true },
      { cod: '1002', item: 'CNH e/ou Documento de Identificação com Foto', obrigatorio: true },
      { cod: '1003', item: 'Certidão de Casamento', obrigatorio: false },
      { cod: '1006', item: 'Comprovante de Endereço atualizado', obrigatorio: false },
      { cod: 'GOV1', item: 'Acesso ao Gov.br do Sócio (login + senha)', obrigatorio: true },
      { cod: 'GOV2', item: 'Desativar autenticação 2 fatores do Gov.br', obrigatorio: true },
      { cod: 'GOV3', item: 'Nível da conta Gov.br elevado (Prata/Ouro)', obrigatorio: true },
      { cod: 'PREF', item: 'Acesso ao Portal da Prefeitura', obrigatorio: false },
      { cod: '1200', item: 'IRPF — Recibo (ano anterior)', obrigatorio: false },
      { cod: '1201', item: 'IRPF — Declaração completa (ano anterior)', obrigatorio: false },
      { cod: '1202', item: 'IRPF — Guia de pagamento', obrigatorio: false }
    ],
    docs_cnpj: [
      { cod: '1301', item: 'Contrato Social / Registro MEI', obrigatorio: true, auto: false },
      { cod: '1302', item: 'Última Alteração Contratual', obrigatorio: false, auto: false },
      { cod: '1304', item: 'Alvará de Funcionamento', obrigatorio: true, auto: false },
      { cod: '1305', item: 'Comunicado de Desenquadramento MEI (se houver)', obrigatorio: false, auto: false },
      { cod: '1311', item: 'Comprovante de Inscrição IPTU', obrigatorio: false, auto: false },
      { cod: '1313', item: 'FCN — Ficha Cadastral', obrigatorio: false, auto: false },
      { cod: '1314', item: 'Viabilidade', obrigatorio: false, auto: false },
      { cod: '1315', item: 'DBE — Documento Básico de Entrada', obrigatorio: false, auto: false },
      { cod: '1317', item: 'SST — LTCAT', obrigatorio: false, auto: false },
      { cod: '1318', item: 'SST — PCMSO', obrigatorio: false, auto: false },
      { cod: '1310', item: 'Laudo PGR', obrigatorio: false, auto: false },
      { cod: '1399', item: 'Cartão CNPJ', obrigatorio: true, auto: true },
      { cod: '1306', item: 'Inscrição Municipal', obrigatorio: true, auto: true },
      { cod: '1307', item: 'Situação Fiscal (eCac)', obrigatorio: true, auto: true },
      { cod: '1308', item: 'Comprovante de Opção de Regime (eCac)', obrigatorio: true, auto: true },
      { cod: '1309', item: 'Código de Acesso Simples Nacional', obrigatorio: true, auto: false },
      { cod: '1312', item: 'Inscrição Estadual (SEFAZ)', obrigatorio: false, auto: true },
      { cod: '1316', item: 'Recibo de DTE — Domicílio Tributário Eletrônico', obrigatorio: false, auto: true },
      { cod: '1321', item: 'QSA — Quadro de Sócios (eCac)', obrigatorio: true, auto: true },
      { cod: '1322', item: 'Confirmação de Optante pelo Simples', obrigatorio: true, auto: true },
      { cod: 'CONT', item: 'Contrato de Prestação de Serviço Contábil', obrigatorio: true, auto: false }
    ],
    parcelamentos: [
      { cod: '3502', item: 'Parcelamento MEI' },
      { cod: '3503', item: 'Parcelamento Simples Nacional (RFB)' },
      { cod: '3504', item: 'Parcelamento PJ Geral (RFB)' },
      { cod: '3505', item: 'Parcelamento Procuradoria (PGFN/DAU)' },
      { cod: '3506', item: 'Parcelamento Estadual (SEFAZ)' },
      { cod: '3507', item: 'Parcelamento Municipal (Prefeitura)' }
    ],
    sistema: [
      { cod: '3601', item: 'SCI — Cadastrar empresa no Único' },
      { cod: '3602', item: 'SCI — Cadastrar sócios no Único' },
      { cod: '3603', item: 'SCI — Marcar tecnologias web' },
      { cod: '3604', item: 'TecWeb — Configurar login e senha' },
      { cod: '3605', item: 'TecWeb — Controle de Senhas: Gov.br' },
      { cod: '3606', item: 'TecWeb — Senhas do contador anterior' },
      { cod: '3612', item: 'eCac — Vincular procuração para escritório (PJ)' },
      { cod: '3613', item: 'SAT/SEFAZ — Vincular procuração' },
      { cod: '3614', item: 'Único — Configurar certificado para processos' },
      { cod: '3615', item: 'ISS Legal — Configuração push' }
    ]
  };

  // ── STATUS OPTIONS ──
  const STATUS = [
    { value: 'pendente',   label: '⬜ Pendente',    color: '#94a3b8' },
    { value: 'solicitado', label: '📨 Solicitado',   color: '#3b82f6' },
    { value: 'recebido',   label: '✅ Recebido',     color: '#10b981' },
    { value: 'nao_aplica', label: '➖ Não se aplica', color: '#94a3b8' },
    { value: 'verificar',  label: '⚠️ Verificar',    color: '#f59e0b' }
  ];

  const OBRIG_STATUS = [
    { value: 'regular',   label: '🟢 Regular',    color: '#10b981' },
    { value: 'omissao',   label: '🔴 Omissão',    color: '#ef4444' },
    { value: 'atraso',    label: '🟡 Em atraso',   color: '#f59e0b' },
    { value: 'nao_aplica',label: '➖ N/A',         color: '#94a3b8' },
    { value: 'verificar', label: '⚠️ Verificar',   color: '#f59e0b' }
  ];

  // ── STATE ──
  let currentTab = 'dados_gerais';
  let onbData = {};

  function getOnbKey(clienteId) { return `onb_${clienteId}`; }

  function loadOnb(clienteId) {
    try {
      const raw = localStorage.getItem(getOnbKey(clienteId));
      return raw ? JSON.parse(raw) : getDefaultOnb(clienteId);
    } catch { return getDefaultOnb(clienteId); }
  }

  function saveOnb(clienteId, data) {
    localStorage.setItem(getOnbKey(clienteId), JSON.stringify(data));
  }

  function getDefaultOnb(clienteId) {
    return {
      clienteId,
      etapa_atual: 'dados_gerais',
      data_inicio: new Date().toISOString(),
      // Dados Gerais
      dados_gerais: {
        data_abertura: '', enquadramento: '', cidade_uf: '',
        atividades: '', im: '', ie: '', cod_simples: '',
        faturamento_medio: '', qtd_compras: '', valor_compras: '',
        qtd_vendas: '', valor_vendas: '', qtd_socios: '',
        contab_anterior: '', motivo_troca: ''
      },
      // Checklists
      docs_socio: {},
      docs_cnpj: {},
      parcelamentos: {},
      sistema: {},
      // Diagnóstico
      diagnostico: {
        trabalhista: {
          tem_funcionarios: '', qtd_funcionarios: '',
          dctfweb_omissao: '', sefip_divergencia: '',
          fgts_atraso: '', inss_atraso: '',
          parcelamento_previd: '', funcoes_equiparadas: '',
          sst_contrato: '', prolabore_contrato: ''
        },
        fiscal: {
          sintegra_falta: '', dime_falta: '',
          simples_falta: '', sped_fiscal_falta: '',
          sped_contrib_falta: ''
        },
        contabil: {
          ecd_entregue: '', ecf_entregue: ''
        },
        societario: {
          perdeu_mei: '', perdeu_simples: '',
          melhor_enquadramento: '',
          divida_rfb: '', divida_pgfn: '',
          divida_prefeitura: '', divida_estado: '',
          tem_alvara: ''
        },
        info_gerais: {
          omissao_dasn_mei: '', omissao_defis: '',
          omissao_dctfweb: '', omissao_ecd_ecf: '',
          adesao_dte: '', validade_cert: '',
          sublimite_sn: '', omissao_pgdas: ''
        }
      },
      // Gestão Financeira
      gestao_fin: {
        conta_bancaria: '', agencia: '', banco: '',
        controle_caixa: '', sistema_financeiro: '',
        concilia_extrato: '', frequencia_extrato: '',
        modelo_nf: '', sistema_emissao_nf: ''
      },
      // Obrigações
      obrigacoes: {
        sped_fiscal: 'verificar', sped_contrib: 'verificar',
        ecd: 'verificar', ecf: 'verificar', dctfweb: 'verificar',
        defis: 'verificar', dasnmei: 'verificar',
        pgdas: 'verificar', dime: 'verificar', gia: 'verificar'
      },
      // Parecer
      parecer: { texto: '', risco_global: 'medio', data_emissao: '' }
    };
  }

  // ══════════════════════════════════════════
  // RENDER PRINCIPAL
  // ══════════════════════════════════════════
  function render(el, clienteId) {
    onbData = loadOnb(clienteId);
    const cliente = getCliente(clienteId);
    if (!cliente) { el.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Cliente não encontrado</h3></div>'; return; }

    const progress = calcProgress();

    el.innerHTML = `
      <div class="onb-module">
        <!-- Header -->
        <div class="onb-banner">
          <div class="onb-banner-content">
            <h2>📋 Onboarding — ${cliente.fantasia || cliente.razao}</h2>
            <p>CNPJ: ${cliente.cnpj} · Regime: ${cliente.regime} · Início: ${new Date(onbData.data_inicio).toLocaleDateString('pt-BR')}</p>
            <div class="onb-progress-wrap">
              <div class="onb-progress-bar" style="width:${progress}%"></div>
            </div>
            <div class="onb-progress-text">${progress}% concluído · Etapa: ${ETAPAS.find(e=>e.id===currentTab)?.label || '—'}</div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="onb-tabs" id="onb-tabs">
          ${ETAPAS.map(e => `
            <button class="onb-tab ${currentTab===e.id?'active':''}" data-tab="${e.id}" onclick="ONBOARDING.switchTab('${e.id}',${clienteId})" style="${currentTab===e.id?`border-color:${e.color}; color:${e.color}`:''}">
              <span class="onb-tab-icon">${e.icon}</span>
              <span class="onb-tab-label">${e.label}</span>
            </button>
          `).join('')}
        </div>

        <!-- Tab Content -->
        <div id="onb-content"></div>
      </div>
    `;

    renderTab(document.getElementById('onb-content'), clienteId);
  }

  function switchTab(tabId, clienteId) {
    currentTab = tabId;
    // Update tab styling
    document.querySelectorAll('.onb-tab').forEach(t => {
      const et = ETAPAS.find(e=>e.id===t.dataset.tab);
      if (t.dataset.tab === tabId) {
        t.classList.add('active');
        t.style.borderColor = et.color;
        t.style.color = et.color;
      } else {
        t.classList.remove('active');
        t.style.borderColor = '';
        t.style.color = '';
      }
    });
    renderTab(document.getElementById('onb-content'), clienteId);
  }

  function renderTab(el, clienteId) {
    if (!el) return;
    switch(currentTab) {
      case 'dados_gerais':  renderDadosGerais(el, clienteId); break;
      case 'docs_socio':    renderChecklist(el, clienteId, 'docs_socio', 'Documentos do Sócio', 'Dados do sócio administrador — certificado, identidade, procurações'); break;
      case 'docs_cnpj':     renderChecklist(el, clienteId, 'docs_cnpj', 'Documentos do CNPJ', 'Documentos da empresa — solicitados ou obtidos via eCac/SEFAZ'); break;
      case 'diagnostico':   renderDiagnostico(el, clienteId); break;
      case 'gestao_fin':    renderGestaoFin(el, clienteId); break;
      case 'obrigacoes':    renderObrigacoesCheck(el, clienteId); break;
      case 'parecer':       renderParecer(el, clienteId); break;
    }
  }

  // ══════════════════════════════════════════
  // ABA 1: DADOS GERAIS
  // ══════════════════════════════════════════
  function renderDadosGerais(el, clienteId) {
    const d = onbData.dados_gerais;
    el.innerHTML = `
      <div class="onb-section animate-in">
        <div class="onb-section-header"><span class="onb-sh-icon" style="background:rgba(99,102,241,.1)">🏢</span><div><h3>Informações Gerais</h3><p>Dados cadastrais e operacionais da empresa</p></div></div>
        <div class="onb-form-grid">
          ${field('Data de abertura','date','dg-abertura',d.data_abertura)}
          ${field('Enquadramento tributário','select','dg-enquad',d.enquadramento,['','Simples Nacional','Lucro Presumido','Lucro Real','MEI'])}
          ${field('Cidade / UF','text','dg-cidade',d.cidade_uf,'','ex: Porto Alegre/RS')}
          ${field('Atividades da empresa','text','dg-ativid',d.atividades,'','CNAE principal')}
          ${field('Inscrição Municipal','text','dg-im',d.im)}
          ${field('Inscrição Estadual','text','dg-ie',d.ie)}
          ${field('Cód. Acesso Simples','text','dg-cod-simples',d.cod_simples)}
          ${field('Faturamento médio/mês','text','dg-fat',d.faturamento_medio,'','R$ 50.000')}
          ${field('Qtd. Compras/mês','number','dg-compras',d.qtd_compras)}
          ${field('Valor Compras/mês','text','dg-vcompras',d.valor_compras)}
          ${field('Qtd. Vendas/mês','number','dg-vendas',d.qtd_vendas)}
          ${field('Valor Vendas/mês','text','dg-vvendas',d.valor_vendas)}
          ${field('Qtd. Sócios','number','dg-socios',d.qtd_socios)}
          ${field('Contabilidade anterior','text','dg-contab-ant',d.contab_anterior)}
          ${fieldFull('Motivo da troca de contador','textarea','dg-motivo',d.motivo_troca)}
        </div>
        <div class="onb-actions">
          <button class="btn btn-primary" onclick="ONBOARDING.saveDadosGerais(${clienteId})">💾 Salvar Dados</button>
        </div>
      </div>

      <!-- Info Transição -->
      <div class="onb-info-card animate-in" style="animation-delay:.1s">
        <div class="onb-info-title">📌 Checklist de Transição do Contador</div>
        <div class="onb-info-body">
          <ol class="onb-info-list">
            <li>Enviar formalização de mudança de contador ao escritório anterior</li>
            <li>Receber certificado digital do PJ (primeiro passo obrigatório)</li>
            <li>Incluir procuração eletrônica para CNPJ 54.738.799/0001-47</li>
            <li>Sócio retirar autenticação 2 fatores do Gov.br</li>
            <li>Elevar nível da conta Gov.br para Prata ou Ouro</li>
          </ol>
          <div class="onb-info-dest">
            <strong>Dados do escritório responsável:</strong><br>
            Y. P. M. Castanha · CNPJ: 54.738.799/0001-47<br>
            WhatsApp: (51) 98527-7713 · E-mail: ypcastanha@gmail.com
          </div>
        </div>
      </div>
    `;
  }

  function saveDadosGerais(clienteId) {
    onbData.dados_gerais = {
      data_abertura: gv('dg-abertura'),
      enquadramento: gv('dg-enquad'),
      cidade_uf: gv('dg-cidade'),
      atividades: gv('dg-ativid'),
      im: gv('dg-im'), ie: gv('dg-ie'),
      cod_simples: gv('dg-cod-simples'),
      faturamento_medio: gv('dg-fat'),
      qtd_compras: gv('dg-compras'), valor_compras: gv('dg-vcompras'),
      qtd_vendas: gv('dg-vendas'), valor_vendas: gv('dg-vvendas'),
      qtd_socios: gv('dg-socios'),
      contab_anterior: gv('dg-contab-ant'),
      motivo_troca: gv('dg-motivo')
    };
    saveOnb(clienteId, onbData);
    if (window.V) V.toast('Dados Gerais salvos!', '✅');
  }

  // ══════════════════════════════════════════
  // ABA 2/3: CHECKLISTS DE DOCUMENTOS
  // ══════════════════════════════════════════
  function renderChecklist(el, clienteId, category, title, subtitle) {
    const items = CHECKLISTS[category] || [];
    const data = onbData[category] || {};
    const recebidos = items.filter(i => data[i.cod] === 'recebido').length;
    const total = items.length;
    const pct = total > 0 ? Math.round(recebidos / total * 100) : 0;

    el.innerHTML = `
      <div class="onb-section animate-in">
        <div class="onb-section-header">
          <span class="onb-sh-icon" style="background:rgba(14,165,233,.1)">${category==='docs_socio'?'👤':'📄'}</span>
          <div><h3>${title}</h3><p>${subtitle}</p></div>
          <div class="onb-header-badge"><span class="badge ${pct>=80?'badge-success':pct>=40?'badge-warning':'badge-danger'}">${recebidos}/${total} · ${pct}%</span></div>
        </div>

        <div class="onb-progress-mini">
          <div class="onb-progress-mini-bar" style="width:${pct}%;background:${pct>=80?'var(--success)':pct>=40?'var(--warning)':'var(--danger)'}"></div>
        </div>

        <table class="onb-checktable">
          <thead><tr><th style="width:60px">Cód.</th><th>Documento</th><th style="width:45px;text-align:center">Obr.</th><th style="width:140px">Status</th><th style="width:55px;text-align:center">Auto</th></tr></thead>
          <tbody>
            ${items.map(item => {
              const st = data[item.cod] || 'pendente';
              return `<tr class="onb-checkrow ${st}">
                <td style="font-family:monospace;font-size:11px;color:var(--text-3)">${item.cod}</td>
                <td style="font-weight:500">${item.item}</td>
                <td style="text-align:center">${item.obrigatorio ? '<span style="color:var(--danger);font-weight:700">*</span>' : ''}</td>
                <td><select class="onb-status-sel" onchange="ONBOARDING.setDocStatus(${clienteId},'${category}','${item.cod}',this.value)" style="border-color:${STATUS.find(s=>s.value===st)?.color||'#e2e8f0'}">
                  ${STATUS.map(s => `<option value="${s.value}" ${s.value===st?'selected':''}>${s.label}</option>`).join('')}
                </select></td>
                <td style="text-align:center">${item.auto ? '<span title="Obtido automaticamente via eCac/SEFAZ" style="cursor:help">🤖</span>' : ''}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>

        ${category === 'docs_cnpj' ? `
          <div style="margin-top:20px;border-top:1px solid #f1f5f9;padding-top:16px">
            <div style="font-size:12px;font-weight:700;color:var(--text-1);margin-bottom:10px">📦 Parcelamentos em Andamento</div>
            <table class="onb-checktable">
              <thead><tr><th style="width:60px">Cód.</th><th>Parcelamento</th><th style="width:140px">Status</th></tr></thead>
              <tbody>
                ${CHECKLISTS.parcelamentos.map(item => {
                  const st = (onbData.parcelamentos||{})[item.cod] || 'pendente';
                  return `<tr class="onb-checkrow ${st}">
                    <td style="font-family:monospace;font-size:11px;color:var(--text-3)">${item.cod}</td>
                    <td style="font-weight:500">${item.item}</td>
                    <td><select class="onb-status-sel" onchange="ONBOARDING.setDocStatus(${clienteId},'parcelamentos','${item.cod}',this.value)">
                      ${STATUS.map(s => `<option value="${s.value}" ${s.value===st?'selected':''}>${s.label}</option>`).join('')}
                    </select></td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>

          <div style="margin-top:20px;border-top:1px solid #f1f5f9;padding-top:16px">
            <div style="font-size:12px;font-weight:700;color:var(--text-1);margin-bottom:10px">⚙️ Parametrização do Sistema (SCI)</div>
            <table class="onb-checktable">
              <thead><tr><th style="width:60px">Cód.</th><th>Tarefa</th><th style="width:140px">Status</th></tr></thead>
              <tbody>
                ${CHECKLISTS.sistema.map(item => {
                  const st = (onbData.sistema||{})[item.cod] || 'pendente';
                  return `<tr class="onb-checkrow ${st}">
                    <td style="font-family:monospace;font-size:11px;color:var(--text-3)">${item.cod}</td>
                    <td style="font-weight:500">${item.item}</td>
                    <td><select class="onb-status-sel" onchange="ONBOARDING.setDocStatus(${clienteId},'sistema','${item.cod}',this.value)">
                      ${STATUS.map(s => `<option value="${s.value}" ${s.value===st?'selected':''}>${s.label}</option>`).join('')}
                    </select></td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
      </div>
    `;
  }

  function setDocStatus(clienteId, category, cod, value) {
    if (!onbData[category]) onbData[category] = {};
    onbData[category][cod] = value;
    saveOnb(clienteId, onbData);
    // Re-render to update progress
    renderTab(document.getElementById('onb-content'), clienteId);
    updateProgress();
  }

  // ══════════════════════════════════════════
  // ABA 4: DIAGNÓSTICO INICIAL
  // ══════════════════════════════════════════
  function renderDiagnostico(el, clienteId) {
    const d = onbData.diagnostico;
    const snOpt = ['','Sim','Não','Verificar','Não se aplica'];
    el.innerHTML = `
      <div class="onb-section animate-in">
        <div class="onb-section-header"><span class="onb-sh-icon" style="background:rgba(245,158,11,.1)">🔍</span><div><h3>Diagnóstico Inicial do Cliente</h3><p>Avaliação completa baseada no modelo C-006 — Trabalhista, Fiscal, Contábil, Societário</p></div></div>

        <div class="onb-diag-group">
          <div class="onb-diag-title" style="color:#6366f1">👷 Trabalhista</div>
          <div class="onb-form-grid">
            ${field('Tem funcionários ativos?','select','dt-func',d.trabalhista.tem_funcionarios, snOpt)}
            ${field('Qtd. funcionários','number','dt-qtd',d.trabalhista.qtd_funcionarios)}
            ${field('DCTF Web com omissão?','select','dt-dctf',d.trabalhista.dctfweb_omissao, snOpt)}
            ${field('SEFIP com divergência?','select','dt-sefip',d.trabalhista.sefip_divergencia, snOpt)}
            ${field('FGTS em atraso?','select','dt-fgts',d.trabalhista.fgts_atraso, snOpt)}
            ${field('INSS em atraso?','select','dt-inss',d.trabalhista.inss_atraso, snOpt)}
            ${field('Parcelamentos previdenciários?','select','dt-parc',d.trabalhista.parcelamento_previd, snOpt)}
            ${field('Funções x salários equiparados?','select','dt-equip',d.trabalhista.funcoes_equiparadas, snOpt)}
            ${field('Contrato SST ativo?','select','dt-sst',d.trabalhista.sst_contrato, snOpt)}
            ${field('Pró-labore no contrato?','select','dt-prolab',d.trabalhista.prolabore_contrato, snOpt)}
          </div>
        </div>

        <div class="onb-diag-group">
          <div class="onb-diag-title" style="color:#10b981">📊 Fiscal</div>
          <div class="onb-form-grid">
            ${field('Falta entrega Sintegra?','select','df-sint',d.fiscal.sintegra_falta, snOpt)}
            ${field('Falta entrega DIME?','select','df-dime',d.fiscal.dime_falta, snOpt)}
            ${field('Falta entrega Simples?','select','df-simples',d.fiscal.simples_falta, snOpt)}
            ${field('Falta SPED Fiscal?','select','df-spedf',d.fiscal.sped_fiscal_falta, snOpt)}
            ${field('Falta SPED Contribuições?','select','df-spedc',d.fiscal.sped_contrib_falta, snOpt)}
          </div>
        </div>

        <div class="onb-diag-group">
          <div class="onb-diag-title" style="color:#0ea5e9">📚 Contábil</div>
          <div class="onb-form-grid">
            ${field('ECD entregue (ano anterior)?','select','dc-ecd',d.contabil.ecd_entregue, snOpt)}
            ${field('ECF entregue (ano anterior)?','select','dc-ecf',d.contabil.ecf_entregue, snOpt)}
          </div>
        </div>

        <div class="onb-diag-group">
          <div class="onb-diag-title" style="color:#f59e0b">🏢 Societário</div>
          <div class="onb-form-grid">
            ${field('Perdeu condição de MEI?','select','ds-mei',d.societario.perdeu_mei, snOpt)}
            ${field('Perdeu condição de Simples?','select','ds-simples',d.societario.perdeu_simples, snOpt)}
            ${field('Melhor enquadramento?','text','ds-enquad',d.societario.melhor_enquadramento)}
            ${field('Dívida s/ parcelamento RFB?','select','ds-rfb',d.societario.divida_rfb, snOpt)}
            ${field('Dívida s/ parcelamento PGFN?','select','ds-pgfn',d.societario.divida_pgfn, snOpt)}
            ${field('Dívida s/ parc. Prefeitura?','select','ds-pref',d.societario.divida_prefeitura, snOpt)}
            ${field('Dívida s/ parc. Estado?','select','ds-est',d.societario.divida_estado, snOpt)}
            ${field('Tem alvará?','select','ds-alv',d.societario.tem_alvara, snOpt)}
          </div>
        </div>

        <div class="onb-diag-group">
          <div class="onb-diag-title" style="color:#8b5cf6">📋 Informações Gerais II</div>
          <div class="onb-form-grid">
            ${field('Omissão DASN MEI?','select','di-dasn',d.info_gerais.omissao_dasn_mei, snOpt)}
            ${field('Omissão DEFIS?','select','di-defis',d.info_gerais.omissao_defis, snOpt)}
            ${field('Omissão DCTF Web?','select','di-dctfw',d.info_gerais.omissao_dctfweb, snOpt)}
            ${field('Omissão ECD/ECF?','select','di-ecd',d.info_gerais.omissao_ecd_ecf, snOpt)}
            ${field('Adesão DTE?','select','di-dte',d.info_gerais.adesao_dte, snOpt)}
            ${field('Validade certificado digital','date','di-cert',d.info_gerais.validade_cert)}
            ${field('Sublimite Simples Nacional?','select','di-sub',d.info_gerais.sublimite_sn, snOpt)}
            ${field('Omissão PGDAS?','select','di-pgdas',d.info_gerais.omissao_pgdas, snOpt)}
          </div>
        </div>

        <div class="onb-actions">
          <button class="btn btn-primary" onclick="ONBOARDING.saveDiagnostico(${clienteId})">💾 Salvar Diagnóstico</button>
        </div>
      </div>
    `;
  }

  function saveDiagnostico(clienteId) {
    onbData.diagnostico = {
      trabalhista: {
        tem_funcionarios: gv('dt-func'), qtd_funcionarios: gv('dt-qtd'),
        dctfweb_omissao: gv('dt-dctf'), sefip_divergencia: gv('dt-sefip'),
        fgts_atraso: gv('dt-fgts'), inss_atraso: gv('dt-inss'),
        parcelamento_previd: gv('dt-parc'), funcoes_equiparadas: gv('dt-equip'),
        sst_contrato: gv('dt-sst'), prolabore_contrato: gv('dt-prolab')
      },
      fiscal: {
        sintegra_falta: gv('df-sint'), dime_falta: gv('df-dime'),
        simples_falta: gv('df-simples'), sped_fiscal_falta: gv('df-spedf'),
        sped_contrib_falta: gv('df-spedc')
      },
      contabil: { ecd_entregue: gv('dc-ecd'), ecf_entregue: gv('dc-ecf') },
      societario: {
        perdeu_mei: gv('ds-mei'), perdeu_simples: gv('ds-simples'),
        melhor_enquadramento: gv('ds-enquad'),
        divida_rfb: gv('ds-rfb'), divida_pgfn: gv('ds-pgfn'),
        divida_prefeitura: gv('ds-pref'), divida_estado: gv('ds-est'),
        tem_alvara: gv('ds-alv')
      },
      info_gerais: {
        omissao_dasn_mei: gv('di-dasn'), omissao_defis: gv('di-defis'),
        omissao_dctfweb: gv('di-dctfw'), omissao_ecd_ecf: gv('di-ecd'),
        adesao_dte: gv('di-dte'), validade_cert: gv('di-cert'),
        sublimite_sn: gv('di-sub'), omissao_pgdas: gv('di-pgdas')
      }
    };
    saveOnb(clienteId, onbData);
    if (window.V) V.toast('Diagnóstico salvo!', '✅');
  }

  // ══════════════════════════════════════════
  // ABA 5: GESTÃO FINANCEIRA
  // ══════════════════════════════════════════
  function renderGestaoFin(el, clienteId) {
    const g = onbData.gestao_fin;
    el.innerHTML = `
      <div class="onb-section animate-in">
        <div class="onb-section-header"><span class="onb-sh-icon" style="background:rgba(236,72,153,.1)">💰</span><div><h3>Gestão Financeira do Cliente</h3><p>Controles bancários, caixa e emissão de notas fiscais</p></div></div>
        <div class="onb-form-grid">
          ${field('Banco principal','text','gf-banco',g.banco,'','ex: Banrisul, Sicredi')}
          ${field('Agência','text','gf-ag',g.agencia)}
          ${field('Conta bancária','text','gf-conta',g.conta_bancaria)}
          ${field('Controle de caixa?','select','gf-caixa',g.controle_caixa,['','Sim — planilha','Sim — sistema','Sim — caderno','Não possui'])}
          ${field('Sistema financeiro','select','gf-sist',g.sistema_financeiro,['','Nenhum','Planilha Excel','SCI','Bling','Outro'])}
          ${field('Concilia extrato?','select','gf-conc',g.concilia_extrato,['','Sim','Não','Parcialmente'])}
          ${field('Freq. envio extratos','select','gf-freq',g.frequencia_extrato,['','Mensal','Semanal','Sob demanda','Não envia'])}
          ${field('Modelo de NF','select','gf-nf',g.modelo_nf,['','NFS-e (Serviço)','NF-e (Produto)','NFC-e (Consumidor)','CT-e','Não emite'])}
          ${field('Sistema emissão NF','text','gf-emissao',g.sistema_emissao_nf,'','ex: Prefeitura, Bling, ERP')}
        </div>
        <div class="onb-actions">
          <button class="btn btn-primary" onclick="ONBOARDING.saveGestaoFin(${clienteId})">💾 Salvar</button>
        </div>
      </div>
    `;
  }

  function saveGestaoFin(clienteId) {
    onbData.gestao_fin = {
      banco: gv('gf-banco'), agencia: gv('gf-ag'), conta_bancaria: gv('gf-conta'),
      controle_caixa: gv('gf-caixa'), sistema_financeiro: gv('gf-sist'),
      concilia_extrato: gv('gf-conc'), frequencia_extrato: gv('gf-freq'),
      modelo_nf: gv('gf-nf'), sistema_emissao_nf: gv('gf-emissao')
    };
    saveOnb(clienteId, onbData);
    if (window.V) V.toast('Gestão Financeira salva!', '✅');
  }

  // ══════════════════════════════════════════
  // ABA 6: OBRIGAÇÕES ACESSÓRIAS
  // ══════════════════════════════════════════
  function renderObrigacoesCheck(el, clienteId) {
    const ob = onbData.obrigacoes;
    const obList = [
      { key: 'sped_fiscal', label: 'SPED Fiscal' },
      { key: 'sped_contrib', label: 'SPED Contribuições' },
      { key: 'ecd', label: 'ECD' },
      { key: 'ecf', label: 'ECF' },
      { key: 'dctfweb', label: 'DCTF Web' },
      { key: 'defis', label: 'DEFIS' },
      { key: 'dasnmei', label: 'DASN MEI' },
      { key: 'pgdas', label: 'PGDAS-D' },
      { key: 'dime', label: 'DIME' },
      { key: 'gia', label: 'GIA' }
    ];

    const criticos = obList.filter(o => ob[o.key] === 'omissao' || ob[o.key] === 'atraso');

    el.innerHTML = `
      <div class="onb-section animate-in">
        <div class="onb-section-header"><span class="onb-sh-icon" style="background:rgba(139,92,246,.1)">📋</span><div><h3>Obrigações Acessórias / Declarações</h3><p>Situação das entregas — pendências elevam o Risco Fiscal global</p></div></div>
        ${criticos.length ? `<div class="onb-alert-danger">⚠️ <strong>${criticos.length} obrigação(ões) com pendência</strong> — ${criticos.map(c=>c.label).join(', ')}</div>` : '<div class="onb-alert-success">✅ Nenhuma pendência crítica identificada</div>'}

        <div class="onb-obrig-grid">
          ${obList.map(o => {
            const st = ob[o.key] || 'verificar';
            const stObj = OBRIG_STATUS.find(s=>s.value===st);
            return `<div class="onb-obrig-card" style="border-left:3px solid ${stObj?.color||'#e2e8f0'}">
              <div class="onb-obrig-label">${o.label}</div>
              <select class="onb-status-sel" onchange="ONBOARDING.setObrigStatus(${clienteId},'${o.key}',this.value)">
                ${OBRIG_STATUS.map(s => `<option value="${s.value}" ${s.value===st?'selected':''}>${s.label}</option>`).join('')}
              </select>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;
  }

  function setObrigStatus(clienteId, key, value) {
    onbData.obrigacoes[key] = value;
    saveOnb(clienteId, onbData);
    renderTab(document.getElementById('onb-content'), clienteId);
    updateProgress();
  }

  // ══════════════════════════════════════════
  // ABA 7: PARECER FINAL
  // ══════════════════════════════════════════
  function renderParecer(el, clienteId) {
    const cliente = getCliente(clienteId);
    const progress = calcProgress();
    const d = onbData.diagnostico;
    const p = onbData.parecer;

    // Auto-calculate risk
    let alertas = [];
    if (d.trabalhista.fgts_atraso === 'Sim') alertas.push('🔴 FGTS em atraso');
    if (d.trabalhista.inss_atraso === 'Sim') alertas.push('🔴 INSS em atraso');
    if (d.trabalhista.dctfweb_omissao === 'Sim') alertas.push('🟡 DCTF Web com omissão');
    if (d.fiscal.sped_fiscal_falta === 'Sim') alertas.push('🔴 SPED Fiscal pendente');
    if (d.fiscal.sped_contrib_falta === 'Sim') alertas.push('🔴 SPED Contribuições pendente');
    if (d.societario.divida_rfb === 'Sim') alertas.push('🔴 Dívida sem parcelamento (RFB)');
    if (d.societario.divida_pgfn === 'Sim') alertas.push('🔴 Dívida sem parcelamento (PGFN)');
    if (d.societario.tem_alvara === 'Não') alertas.push('🟡 Alvará não localizado');
    if (d.info_gerais.omissao_defis === 'Sim') alertas.push('🟡 DEFIS com omissão');
    if (d.info_gerais.omissao_pgdas === 'Sim') alertas.push('🟡 PGDAS com omissão');

    const risco = alertas.filter(a=>a.includes('🔴')).length >= 3 ? 'alto' : alertas.length >= 2 ? 'medio' : 'baixo';
    const riscoLabel = { alto: '🔴 ALTO', medio: '🟡 MÉDIO', baixo: '🟢 BAIXO' }[risco];
    const riscoCor = { alto: '#ef4444', medio: '#f59e0b', baixo: '#10b981' }[risco];

    // Doc stats
    const docSocio = CHECKLISTS.docs_socio.filter(i=>(onbData.docs_socio||{})[i.cod]==='recebido').length;
    const docCnpj = CHECKLISTS.docs_cnpj.filter(i=>(onbData.docs_cnpj||{})[i.cod]==='recebido').length;

    el.innerHTML = `
      <div class="onb-section animate-in">
        <div class="onb-section-header"><span class="onb-sh-icon" style="background:rgba(239,68,68,.1)">📊</span><div><h3>Parecer — Diagnóstico de Onboarding</h3><p>Relatório consolidado da jornada do cliente</p></div></div>

        <div class="onb-parecer-header">
          <div class="onb-parecer-empresa">
            <h2>${cliente?.fantasia || cliente?.razao || '—'}</h2>
            <p>CNPJ: ${cliente?.cnpj || '—'} · Regime: ${cliente?.regime || '—'}</p>
          </div>
          <div class="onb-parecer-risco" style="background:${riscoCor}15;border:1.5px solid ${riscoCor}40;color:${riscoCor}">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase">Risco Fiscal</div>
            <div style="font-size:22px;font-weight:800">${riscoLabel}</div>
          </div>
        </div>

        <!-- KPIs do Parecer -->
        <div class="onb-parecer-kpis">
          <div class="onb-pk"><div class="onb-pk-value">${progress}%</div><div class="onb-pk-label">Onboarding</div></div>
          <div class="onb-pk"><div class="onb-pk-value">${docSocio}/${CHECKLISTS.docs_socio.length}</div><div class="onb-pk-label">Docs Sócio</div></div>
          <div class="onb-pk"><div class="onb-pk-value">${docCnpj}/${CHECKLISTS.docs_cnpj.length}</div><div class="onb-pk-label">Docs CNPJ</div></div>
          <div class="onb-pk"><div class="onb-pk-value">${alertas.length}</div><div class="onb-pk-label">Alertas</div></div>
        </div>

        ${alertas.length ? `
          <div class="onb-parecer-alertas">
            <div style="font-size:13px;font-weight:700;margin-bottom:10px">⚠️ Alertas Identificados</div>
            ${alertas.map(a => `<div class="onb-parecer-alerta-item">${a}</div>`).join('')}
          </div>
        ` : '<div class="onb-alert-success" style="margin-top:16px">✅ Nenhum alerta identificado — Cliente em conformidade</div>'}

        <div class="onb-parecer-obs">
          <label style="font-size:12px;font-weight:700;color:var(--text-2);display:block;margin-bottom:6px">📝 Observações do Parecer</label>
          <textarea id="parecer-texto" rows="5" style="width:100%;padding:12px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:inherit;resize:vertical">${p.texto}</textarea>
        </div>

        <div class="onb-actions" style="margin-top:16px">
          <button class="btn btn-primary" onclick="ONBOARDING.saveParecer(${clienteId})">💾 Salvar Parecer</button>
          <button class="btn btn-success" onclick="ONBOARDING.emitirParecer(${clienteId})">📄 Emitir Parecer</button>
        </div>
      </div>
    `;
  }

  function saveParecer(clienteId) {
    onbData.parecer.texto = gv('parecer-texto');
    onbData.parecer.data_emissao = new Date().toISOString();
    saveOnb(clienteId, onbData);
    if (window.V) V.toast('Parecer salvo!', '✅');
  }

  function emitirParecer(clienteId) {
    saveParecer(clienteId);
    if (window.V) V.toast('Parecer emitido com sucesso!', '📄');
  }

  // ══════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════
  function gv(id) { return document.getElementById(id)?.value?.trim() || ''; }

  function field(label, type, id, value, options, placeholder) {
    if (type === 'select') {
      return `<div class="form-group"><label>${label}</label><select id="${id}">${(options||[]).map(o => `<option value="${o}" ${o===value?'selected':''}>${o||'— Selecionar —'}</option>`).join('')}</select></div>`;
    }
    if (type === 'textarea') {
      return `<div class="form-group"><label>${label}</label><textarea id="${id}" rows="3" placeholder="${placeholder||''}">${value||''}</textarea></div>`;
    }
    return `<div class="form-group"><label>${label}</label><input type="${type}" id="${id}" value="${value||''}" placeholder="${placeholder||''}"></div>`;
  }

  function fieldFull(label, type, id, value, options, placeholder) {
    return `<div class="form-group form-full">${field(label, type, id, value, options, placeholder).replace('<div class="form-group">','')}</div>`;
  }

  function getCliente(id) {
    const db = JSON.parse(localStorage.getItem('vertice_data') || '{}');
    return (db.clientes_contab || []).find(c => c.id === id);
  }

  function calcProgress() {
    let filled = 0, total = 0;
    // Dados gerais
    const dg = onbData.dados_gerais || {};
    const dgKeys = ['data_abertura','enquadramento','cidade_uf','atividades','faturamento_medio','qtd_socios'];
    dgKeys.forEach(k => { total++; if (dg[k]) filled++; });
    // Docs
    ['docs_socio','docs_cnpj'].forEach(cat => {
      (CHECKLISTS[cat]||[]).forEach(item => {
        total++;
        if ((onbData[cat]||{})[item.cod] === 'recebido' || (onbData[cat]||{})[item.cod] === 'nao_aplica') filled++;
      });
    });
    // Diagnostico completeness
    const diag = onbData.diagnostico || {};
    ['trabalhista','fiscal','contabil','societario','info_gerais'].forEach(cat => {
      Object.values(diag[cat]||{}).forEach(v => { total++; if (v && v !== '' && v !== 'Verificar') filled++; });
    });
    return total > 0 ? Math.round(filled / total * 100) : 0;
  }

  function updateProgress() {
    const pct = calcProgress();
    const bar = document.querySelector('.onb-progress-bar');
    const text = document.querySelector('.onb-progress-text');
    if (bar) bar.style.width = pct + '%';
    if (text) text.textContent = `${pct}% concluído · Etapa: ${ETAPAS.find(e=>e.id===currentTab)?.label || '—'}`;
  }

  // ── PUBLIC API ──
  return {
    render, switchTab,
    saveDadosGerais, saveDiagnostico, saveGestaoFin,
    setDocStatus, setObrigStatus,
    saveParecer, emitirParecer,
    loadOnb, calcProgress
  };
})();
