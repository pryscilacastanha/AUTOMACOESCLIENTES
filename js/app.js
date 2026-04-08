// ──────────────────────────────────────────────
//  app.js — Sistema de Gestão Contábil
//  Criscontab & Madeira Contabilidade
// ──────────────────────────────────────────────

// ─── STORAGE ───
const DB = {
  get: k => JSON.parse(localStorage.getItem(k) || 'null'),
  set: (k,v) => {
    localStorage.setItem(k, JSON.stringify(v));
    if (window.CloudDB) window.CloudDB.push(k, v);
  }
};

function initDB() {
  // Inicializa apenas as chaves de storage vazias se não existirem.
  // Os clientes serão populados pelo seed.js (initSeed) — fonte única de dados.
  if (!DB.get('clientes'))    DB.set('clientes', []);
  if (!DB.get('checklists'))  DB.set('checklists', {});
  if (!DB.get('auditoria'))   DB.set('auditoria', {});
  if (!DB.get('onboarding'))  DB.set('onboarding', {});
  if (!DB.get('obrigacoes'))  DB.set('obrigacoes', {});
}

// ─── STATE ───
let state = {
  page: 'dashboard',
  competencia: (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  })(),
  clienteId: null,
  filtro: '',
};

// ─── ROUTING ───
function navigate(page, clienteId=null) {
  state.page = page;
  state.clienteId = clienteId;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
  document.querySelectorAll('[data-topbar]').forEach(t => t.classList.toggle('active', t.dataset.topbar === page));
  render();
}

function render() {
  const main = document.getElementById('main-content');
  try {
    const titles = {
      dashboard:'Dashboard', clientes:'Clientes', checklist:'Checklist Mensal',
      onboarding:'Onboarding de Clientes', auditoria:'Auditoria & Apontamentos',
      educacao:'Educação do Cliente', importacao:'Importação com Gemini AI',
      configuracoes:'Configurações', obrigacoes:'Obrigações Acessórias',
      planocontas:'Plano de Contas', treinamento:'Treinamento da Equipe',
      integracao:'Integração — Import & Export',
      painel:'Painel Global — Entrega de Documentos',
      controle:'Controle de Clientes — CM Contabilidade',
      parecer:'Parecer Técnico — Escrituração Contábil'
    };
    document.getElementById('topbar-title').textContent = titles[state.page] || '';
    switch(state.page) {
      case 'dashboard':     main.innerHTML = renderDashboard(); break;
      case 'clientes':      main.innerHTML = renderClientes(); break;
      case 'checklist':     main.innerHTML = renderChecklist(); break;
      case 'onboarding':    main.innerHTML = renderOnboarding(); break;
      case 'auditoria':     main.innerHTML = renderAuditoria(); break;
      case 'educacao':      main.innerHTML = renderEducacao(); break;
      case 'importacao':    main.innerHTML = renderImportacao(); break;
      case 'configuracoes': main.innerHTML = renderConfiguracoes(); break;
      case 'obrigacoes':    main.innerHTML = renderObrigacoes(); break;
      case 'planocontas':   main.innerHTML = renderPlanoContas(); break;
      case 'treinamento':   main.innerHTML = renderTreinamento(); break;
      case 'integracao':    main.innerHTML = renderIntegracao(); break;
      case 'painel':        main.innerHTML = renderPainelGlobal(); break;
      case 'controle':      main.innerHTML = renderClientesAvancado(); break;
      case 'parecer':       main.innerHTML = renderParecerPage(); break;
    }
    attachEvents();
  } catch (err) {
    console.error('[render] Erro ao renderizar página:', state.page, err);
    main.innerHTML = `<div class="card" style="color:var(--danger);padding:24px"><strong>Erro ao carregar:</strong> ${err.message}</div>`;
  }
}

// ─── HELPERS ───
function regimedIcon(r) {
  if (!r || r==='—') return '<span class="badge badge-gray">—</span>';
  if (r==='Simples Nacional') return '<span class="badge badge-green">Simples</span>';
  if (r==='Lucro Presumido')  return '<span class="badge badge-blue">L. Presumido</span>';
  if (r==='Lucro Real')       return '<span class="badge badge-purple">L. Real</span>';
  if (r==='MEI')              return '<span class="badge badge-yellow">MEI</span>';
  return `<span class="badge badge-gray">${r}</span>`;
}
function statusBadge(s) {
  const m = {Ativo:'badge-green',Inativo:'badge-red',Encerrada:'badge-red',Especial:'badge-yellow',Avaliar:'badge-yellow'};
  return `<span class="badge ${m[s]||'badge-gray'}">${s}</span>`;
}
function fmtComp(c) {
  const [y,m] = c.split('-');
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${meses[parseInt(m)-1]}/${y}`;
}
function clienteNome(id) {
  const c = (DB.get('clientes')||[]).find(x=>x.id===id);
  return c ? c.nome : '—';
}

// ─── DASHBOARD (UNIFIED) ───
function renderDashboard() {
  const clientes = DB.get('clientes') || [];
  const checklists = DB.get('checklists') || {};
  const ativos    = clientes.filter(c=>c.status==='Ativo').length;
  const inativos  = clientes.filter(c=>c.status==='Inativo'||c.status==='Encerrada').length;
  const especiais = clientes.filter(c=>c.status==='Especial'||c.status==='Avaliar').length;
  const chkMes    = Object.keys(checklists).filter(k=>k.endsWith('_'+state.competencia)).length;
  const pendObs   = clientes.filter(c=>c.obs && c.obs.trim() && c.status==='Ativo');

  // Filtro de busca
  const filtro = state.filtro ? state.filtro.toLowerCase() : '';
  const lista = clientes.filter(c =>
    !filtro || c.nome.toLowerCase().includes(filtro) || c.cnpj.includes(filtro) || c.id.includes(filtro)
  );

  const rows = lista.map(c => {
    // 1. Checklist progress
    const key = c.id+'_'+state.competencia;
    const chk = checklists[key];
    let progHtml = '<span class="badge badge-gray">Não iniciado</span>';
    if (chk) {
      const items = Object.values(chk);
      const done = items.filter(v=>v==='recebido').length;
      const pct = Math.round((done/items.length)*100);
      progHtml = `<div style="display:flex;align-items:center"><div class="progress-bar" style="width:80px"><div class="progress-fill" style="width:${pct}%"></div></div><span class="text-sm text-muted" style="margin-left:6px">${pct}%</span></div>`;
    }
    
    // 2. Onboarding progress
    const onboarding = DB.get('onboarding') || {};
    const savedObg = onboarding[c.id] || {};
    let totalObg = 0;
    let doneObg = 0;
    if (typeof C006_TEMPLATE !== 'undefined') {
      C006_TEMPLATE.forEach(sec => {
        sec.items.forEach(item => {
          totalObg++;
          const k = sec.section+'_'+item.cod+'_'+item.nome;
          const st = savedObg[k];
          if (st === 'concluido' || st === 'cliente_nao_possui') doneObg++;
        });
      });
    }
    const obgPct = totalObg > 0 ? Math.round((doneObg/totalObg)*100) : 0;
    const obgHtml = `<div style="display:flex;align-items:center"><div class="progress-bar" style="width:80px"><div class="progress-fill" style="width:${obgPct}%"></div></div><span class="text-sm text-muted" style="margin-left:6px">${obgPct}%</span></div>`;

    return `<tr>
      <td><strong>#${c.id}</strong></td>
      <td>${c.nome}</td>
      <td style="font-size:12px;color:var(--text-muted)">${c.cnpj||'—'}</td>
      <td>${regimedIcon(c.regime)}</td>
      <td>${statusBadge(c.status)}</td>
      <td>${progHtml}</td>
      <td>${obgHtml}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-ghost btn-sm" onclick="openModal('edit','${c.id}')" title="Dados do Cliente / Onboarding">✏️</button>
        <button class="btn btn-ghost btn-sm" onclick="emitirParecerAvulso('${c.id}')" title="Gerar Parecer Técnico / Relatório">📋</button>
      </td>
    </tr>`;
  }).join('');

  return `
<div class="cards-grid">
  <div class="card stat-card">
    <div class="stat-icon green">🏢</div>
    <div><div class="stat-label">Clientes Ativos</div><div class="stat-value">${ativos}</div></div>
  </div>
  <div class="card stat-card">
    <div class="stat-icon blue">📋</div>
    <div><div class="stat-label">Checklists ${fmtComp(state.competencia)}</div><div class="stat-value">${chkMes}</div></div>
  </div>
  <div class="card stat-card">
    <div class="stat-icon red">🔴</div>
    <div><div class="stat-label">Inativos / Encerrados</div><div class="stat-value">${inativos}</div></div>
  </div>
  <div class="card stat-card">
    <div class="stat-icon yellow">⚠️</div>
    <div><div class="stat-label">Atenção / Especiais</div><div class="stat-value">${especiais}</div></div>
  </div>
</div>
${pendObs.length ? `<div class="card mb-4" style="border-left:4px solid var(--warning)">
  <div style="font-weight:700;margin-bottom:10px">⚠️ Observações Pendentes</div>
  ${pendObs.map(c=>`<div style="padding:6px 0;border-bottom:1px solid var(--border);font-size:13px">
    <strong>#${c.id} ${c.nome}</strong> — ${c.obs}
  </div>`).join('')}
</div>` : ''}
<div class="card">
  <div class="flex justify-between items-center mb-4" style="flex-wrap:wrap;gap:10px">
    <div style="font-weight:700;font-size:15px">👥 Clientes — ${fmtComp(state.competencia)}</div>
    <div style="display:flex;gap:10px;align-items:center">
      <div class="search-bar" style="width:280px">
        <span>🔍</span>
        <input id="search-input" type="text" placeholder="Buscar nome, CNPJ ou código..." value="${state.filtro||''}" oninput="state.filtro=this.value;render()">
      </div>
      <button class="btn btn-primary btn-sm" onclick="openModal('new')">+ Novo</button>
    </div>
  </div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>#</th><th>Razão Social</th><th>CNPJ</th><th>Regime</th><th>Status</th><th>Checklist Mês</th><th>Onboarding</th><th>Ações</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</div>
<div id="modal-container"></div>`;
}

// ─── CLIENTES ───
let openClienteId = null;
function renderClientes() {
  const clientes = DB.get('clientes') || [];
  const filtro = state.filtro.toLowerCase();
  const lista = clientes.filter(c =>
    !filtro || c.nome.toLowerCase().includes(filtro) || c.cnpj.includes(filtro) || c.id.includes(filtro)
  );
  const rows = lista.map(c => `<tr>
    <td><strong>#${c.id}</strong></td>
    <td>${c.nome}</td>
    <td>${c.cnpj}</td>
    <td>${regimedIcon(c.regime)}</td>
    <td>${statusBadge(c.status)}</td>
    <td>
      <button class="btn btn-ghost btn-sm" onclick="openModal('edit','${c.id}')">✏️ Editar</button>
      <button class="btn btn-ghost btn-sm" onclick="navigate('checklist');openClienteChecklist('${c.id}')">📋 Checklist</button>
      <button class="btn btn-ghost btn-sm" onclick="navigate('onboarding');openClienteOnboarding('${c.id}')">📁 C-006</button>
    </td>
  </tr>`).join('');

  return `
<div class="flex justify-between items-center mb-4">
  <div class="search-bar" style="width:320px">
    <span>🔍</span>
    <input id="search-input" type="text" placeholder="Buscar por nome, CNPJ ou código..." value="${state.filtro}" oninput="state.filtro=this.value;render()">
  </div>
  <button class="btn btn-primary" onclick="openModal('new')">+ Novo Cliente</button>
</div>
<div class="card">
  <div class="table-wrap">
    <table>
      <thead><tr><th>#</th><th>Razão Social</th><th>CNPJ</th><th>Regime</th><th>Status</th><th>Ações</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</div>
<div id="modal-container"></div>`;
}

function openModal(mode, id=null) {
  const clientes = DB.get('clientes') || [];
  const c = id ? clientes.find(x=>x.id===id) : {
    id:'', nome:'', cnpj:'', regime:'Simples Nacional', status:'Ativo', cnae:'',
    tipo_operacao:'Serviço', complexidade:'Intermediário',
    fiscal_integrado:false, folha_integrada:false, financeiro_integrado:false,
    tem_caixa:false, tem_estoque:false, tem_prolabore:true, tem_folha:false,
    bancos:[], parc_federal:false, parc_estadual:false, parc_pref:false, parc_pgfn:false,
    erp:'Manual', responsavel:'', whatsapp:'', email:'',
    im:'', ie:'', fat_medio:'', qtd_socios:'', obs:'', obs_diag:'',
  };
  const title = mode==='new' ? 'Novo Cliente' : `Editar — #${c.id} ${c.nome}`;

  const bancosHtml = BANCOS.map(b => {
    const checked = (c.bancos||[]).includes(b.cod) ? 'checked' : '';
    return `<label class="checkbox-item"><input type="checkbox" name="banco" value="${b.cod}" ${checked}> ${b.cod} — ${b.nome}</label>`;
  }).join('');

  const getDiag = (key) => typeof c[key] === 'object' ? c[key] : { status: c[key] ? 'Pendente' : 'Regular', comp: '' };
  const d_sped_f = getDiag('d_sped_f');
  const d_sped_c = getDiag('d_sped_c');
  const d_ecd = getDiag('d_ecd');
  const d_ecf = getDiag('d_ecf');
  const d_defis = getDiag('d_defis');
  const d_dasnmei = getDiag('d_dasnmei');
  const d_simples = getDiag('d_simples');

  const d_div_rfb = getDiag('d_div_rfb');
  const d_div_pgfn = getDiag('d_div_pgfn');
  const d_div_est = getDiag('d_div_est');
  const d_div_pref = getDiag('d_div_pref');

  const getObj = (key) => typeof c[key] === 'object' && c[key] !== null ? c[key] : {};

  const sumParc = ['parc_mei','parc_sn','parc_rfb','parc_pgfn','parc_est','parc_mun'].reduce((acc,k)=>{
      const s = getObj(k).status||'';
      if(s.includes('Em dia')||s.includes('Atrasado')||s.includes('Risco')) acc.ativos++;
      if(s.includes('Atrasado')||s.includes('Risco')) acc.atraso++;
      const v = parseFloat((getObj(k).valor||'').replace(/[^\\d,]/g,'').replace(',','.')) || 0;
      acc.valor += v;
      return acc;
  }, {ativos:0, atraso:0, valor:0});
  
  const sumDeb = ['deb_rfb','deb_pgfn','deb_est','deb_mun'].reduce((acc,k)=>{
      const v = parseFloat((getObj(k).valor||'').replace(/[^\\d,]/g,'').replace(',','.')) || 0;
      return acc + v;
  }, 0);
  
  const totalValStr = (sumParc.valor + sumDeb).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  let sitGeral = sumDeb > 100000 || sumParc.atraso > 0 ? '🔴 Crítica' : (sumDeb > 0 || sumParc.atraso > 0 ? '🟡 Atenção' : '🟢 Controlada');

  const renderDebito = (key, label) => {
    const o = getObj(key);
    return `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:12px;box-shadow:var(--shadow);font-size:12px;display:flex;flex-direction:column;gap:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f1f5f9;padding-bottom:6px">
        <strong style="color:var(--primary-dark)">${label}</strong>
        <select id="${key}_status" style="padding:2px 6px;border-radius:4px;font-size:11px;font-weight:700;border:1px solid var(--border)">
          ${['🔵 Não avaliado','🔴 Não regularizado','🟡 Em regularização','🟢 Regularizado','🔵 Monitorado','⚫ Não se aplica'].map(x=>`<option ${o.status===x?'selected':''}>${x}</option>`).join('')}
        </select>
      </div>
      <div class="form-grid">
        <div class="form-group"><label>Existe débito?</label><select id="${key}_existe">${['N/A','Sim','Não'].map(x=>`<option ${o.existe===x?'selected':''}>${x}</option>`).join('')}</select></div>
        <div class="form-group"><label>Valor Estimado</label><input id="${key}_valor" value="${o.valor||''}" placeholder="R$"></div>
        <div class="form-group"><label>Origem (Tributo)</label><input id="${key}_origem" value="${o.origem||''}" placeholder="Ex: PIS/COFINS"></div>
        <div class="form-group"><label>Situação</label><select id="${key}_sit">${['N/A','Em aberto','Em cobrança','Inscrito em dívida ativa'].map(x=>`<option ${o.sit===x?'selected':''}>${x}</option>`).join('')}</select></div>
      </div>
      <div style="border-top:1px dashed #e2e8f0;padding-top:8px">
        <label style="font-weight:700;color:var(--text-muted);font-size:10px;text-transform:uppercase">Impacto Contábil e Fiscal</label>
        <div class="form-grid" style="margin-top:6px">
          <div class="form-group"><label>Contabilizado?</label><select id="${key}_contab">${['Não verificado','Sim','Não'].map(x=>`<option ${o.contab===x?'selected':''}>${x}</option>`).join('')}</select></div>
          <div class="form-group"><label>Reconhecimento</label><select id="${key}_tipo">${['N/A','Passivo tributário','Provisão'].map(x=>`<option ${o.tipo===x?'selected':''}>${x}</option>`).join('')}</select></div>
          <div class="form-group"><label>Afeta certidão?</label><select id="${key}_cnd">${['N/A','Sim','Não'].map(x=>`<option ${o.cnd===x?'selected':''}>${x}</option>`).join('')}</select></div>
          <div class="form-group"><label>Risco Fiscal</label><select id="${key}_risco">${['N/A','Baixo','Médio','Alto'].map(x=>`<option ${o.risco===x?'selected':''}>${x}</option>`).join('')}</select></div>
        </div>
      </div>
      <div style="display:flex;gap:6px;margin-top:4px">
         <button type="button" class="btn btn-ghost btn-sm" style="flex:1;font-size:11px" onclick="alert('Funcionalidade de API técnica em elaboração!')">🔍 Consultar</button>
         <button type="button" class="btn btn-ghost btn-sm" style="flex:1;font-size:11px" onclick="alert('Regularização automática em elaboração!')">⚙️ Regularizar</button>
      </div>
    </div>`;
  };

  const renderParcelamento = (key, label) => {
    const o = getObj(key);
    return `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:12px;box-shadow:var(--shadow);font-size:12px;display:flex;flex-direction:column;gap:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f1f5f9;padding-bottom:6px">
        <strong style="color:var(--primary-dark)">${label}</strong>
        <select id="${key}_status" style="padding:2px 6px;border-radius:4px;font-size:11px;font-weight:700;border:1px solid var(--border)">
          ${['🔵 Não avaliado','🟢 Em dia','🟡 Atrasado','🔴 Risco Cancelamento','⚫ Não se aplica'].map(x=>`<option ${o.status===x?'selected':''}>${x}</option>`).join('')}
        </select>
      </div>
      <div class="form-grid">
        <div class="form-group"><label>Nº Parcelamento</label><input id="${key}_num" value="${o.num||''}"></div>
        <div class="form-group"><label>Data Adesão</label><input type="date" id="${key}_data" value="${o.data||''}"></div>
        <div class="form-group"><label>Valor Consol.</label><input id="${key}_valor" value="${o.valor||''}" placeholder="R$"></div>
        <div class="form-group"><label>Parcelas (At/Tot)</label><div style="display:flex;gap:4px"><input id="${key}_p_atual" value="${o.p_atual||''}" style="width:50%" placeholder="Nº"> <input id="${key}_p_total" value="${o.p_total||''}" style="width:50%" placeholder="Tot"></div></div>
      </div>
      
      <div class="form-group" style="margin-top:2px"><label>Pendência de Regularização</label><select id="${key}_pend">
         ${['Nenhuma','Não aderiu ao parcelamento','Parcelamento cancelado','Parcelas em atraso','Divergência de saldo','Débito não identificado'].map(x=>`<option ${o.pend===x?'selected':''}>${x}</option>`).join('')}
      </select></div>

      <div style="border-top:1px dashed #e2e8f0;padding-top:8px">
        <label style="font-weight:700;color:var(--text-muted);font-size:10px;text-transform:uppercase">Impacto Contábil</label>
        <div class="form-grid" style="margin-top:6px">
          <div class="form-group"><label>Contabilizado?</label><select id="${key}_contab">${['Não verificado','Sim','Não'].map(x=>`<option ${o.contab===x?'selected':''}>${x}</option>`).join('')}</select></div>
          <div class="form-group"><label>Reconhecimento</label><select id="${key}_tipo">${['N/A','Parcelamento a pagar','Empréstimos'].map(x=>`<option ${o.tipo===x?'selected':''}>${x}</option>`).join('')}</select></div>
          <div class="form-group"><label>Atualizou Juros?</label><select id="${key}_encargos">${['N/A','Sim','Não'].map(x=>`<option ${o.encargos===x?'selected':''}>${x}</option>`).join('')}</select></div>
          <div class="form-group"><label>Classificação</label><select id="${key}_prazo">${['N/A','Curto Prazo','Longo Prazo','Ambos'].map(x=>`<option ${o.prazo===x?'selected':''}>${x}</option>`).join('')}</select></div>
        </div>
      </div>
      <div style="display:flex;gap:6px;margin-top:4px">
         <button type="button" class="btn btn-ghost btn-sm" style="flex:1;font-size:11px" onclick="alert('Em desenvolvimento via RPA')">📄 Emitir Guias</button>
         <button type="button" class="btn btn-ghost btn-sm" style="flex:1;font-size:11px" onclick="alert('Em desenvolvimento via webhook')">📈 Lançar Contab</button>
      </div>
    </div>`;
  };

  const renderDiagRow = (key, label, obj) => {
    return `<div style="display:flex;gap:4px;align-items:center;margin-bottom:8px">
      <div style="width:130px;font-size:11px;font-weight:600">${label}</div>
      <select id="${key}-st" style="width:120px;font-size:10px;padding:4px;border:1px solid #ccc;border-radius:4px;outline:none">
        <option value="Pendente" ${obj.status==='Pendente'?'selected':''}>🔴 Pendente</option>
        <option value="Em andamento" ${obj.status==='Em andamento'?'selected':''}>🟡 Em andamento</option>
        <option value="Regular" ${obj.status==='Regular'?'selected':''}>🟢 Regular</option>
        <option value="Não se aplica" ${obj.status==='Não se aplica'?'selected':''}>⚫ Não se aplica</option>
      </select>
      <input id="${key}-comp" value="${obj.comp||''}" placeholder="Período/Comp." style="flex:1;font-size:10px;padding:4px;border:1px solid #ccc;border-radius:4px;outline:none">
    </div>`;
  };

  const countPendents = [d_sped_f, d_sped_c, d_ecd, d_ecf, d_defis, d_dasnmei, d_simples, d_div_rfb, d_div_pgfn, d_div_est, d_div_pref].filter(x=>x.status==='Pendente').length;
  const risco = countPendents > 5 ? 'Alto' : countPendents > 0 ? 'Médio' : 'Baixo';
  const riscoColor = risco === 'Alto' ? '#ef4444' : risco === 'Médio' ? '#eab308' : '#22c55e';

  document.getElementById('modal-container').innerHTML = `
<div class="modal-overlay" onclick="if(event.target===this)closeModal()">
  <div class="modal">
    <div class="modal-header">
      <h2>${title}</h2>
      <button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="tabs" id="modal-tabs" style="overflow-x:auto;white-space:nowrap;padding-bottom:5px">
        <button class="tab-btn active" onclick="switchTab(this,'tab-geral')">Dados Gerais</button>
        <button class="tab-btn" onclick="switchTab(this,'tab-controles')">Controles Internos</button>
        <button class="tab-btn" onclick="switchTab(this,'tab-onboarding')">Validação de Documentos</button>
        <button class="tab-btn" onclick="switchTab(this,'tab-bancos')">Bancos</button>
        <button class="tab-btn" onclick="switchTab(this,'tab-parcelamentos')">Situação Fiscal Passivos e Parcelamentos</button>
        <button class="tab-btn" onclick="switchTab(this,'tab-trabalhista')">Trabalhista</button>
        <button class="tab-btn" onclick="switchTab(this,'tab-diagnostico')">Pendências e Regularidade</button>
      </div>
      <form id="form-cliente">
        <input type="hidden" id="f-id" value="${c.id}">

        <div id="tab-geral" class="tab-panel active">
          <div class="form-grid">
            <div class="form-group"><label>Código</label><input id="f-cod" value="${c.id}" placeholder="Auto" ${mode==='new'?'':'readonly'}></div>
            <div class="form-group"><label>Status</label><select id="f-status">
              ${['Ativo','Inativo','Encerrada','Especial','Avaliar'].map(s=>`<option ${c.status===s?'selected':''}>${s}</option>`).join('')}
            </select></div>
            <div class="form-group form-full"><label>Razão Social</label><input id="f-nome" value="${c.nome}" required placeholder="Nome completo da empresa"></div>
            <div class="form-group"><label>CNPJ</label><input id="f-cnpj" value="${c.cnpj}" placeholder="00.000.000/0001-00"></div>
            <div class="form-group"><label>Regime Tributário</label><select id="f-regime">
              ${['Simples Nacional','Lucro Presumido','Lucro Real','MEI','A definir'].map(r=>`<option ${c.regime===r?'selected':''}>${r}</option>`).join('')}
            </select></div>
            <div class="form-group"><label>CNAE</label><input id="f-cnae" value="${c.cnae||''}" placeholder="0000-0/00"></div>
            <div class="form-group"><label>Tipo de Operação</label><select id="f-tipo">
              ${['Serviço','Comércio','Indústria','Misto'].map(t=>`<option ${c.tipo_operacao===t?'selected':''}>${t}</option>`).join('')}
            </select></div>
            <div class="form-group"><label>Complexidade</label><select id="f-comp">
              ${['Simples','Intermediário','Alta'].map(x=>`<option ${c.complexidade===x?'selected':''}>${x}</option>`).join('')}
            </select></div>
            <div class="form-group"><label>Inscrição Municipal</label><input id="f-im" value="${c.im||''}"></div>
            <div class="form-group"><label>Inscrição Estadual</label><input id="f-ie" value="${c.ie||''}"></div>
            <div class="form-group"><label>Faturamento Médio Mensal</label><input id="f-fat" value="${c.fat_medio||''}" placeholder="R$ 0,00"></div>
            <div class="form-group"><label>Qtd. de Funcionários</label><input id="f-qtd-func" type="number" value="${c.qtd_funcionarios||''}"></div>
            <div class="form-group"><label>Qtd. de Sócios</label><input id="f-socios" type="number" value="${c.qtd_socios||''}"></div>
          </div>
          <div class="form-grid form-grid-3 mt-2" style="border-top:1px solid #f1f5f9;padding-top:12px">
            <div class="form-group"><label>Responsável / Sócio</label><input id="f-resp" value="${c.responsavel||''}"></div>
            <div class="form-group"><label>WhatsApp</label><input id="f-wapp" value="${c.whatsapp||''}"></div>
            <div class="form-group"><label>E-mail</label><input id="f-email" value="${c.email||''}"></div>
          </div>
          <div class="form-grid mt-2" style="border-top:1px solid #f1f5f9;padding-top:12px">
            <div class="form-group form-full">
              <label>ERP - Financeiro utilizado pela Empresa</label>
              <div style="display:flex;gap:12px;align-items:center">
                <select id="f-erp" style="flex:1" onchange="document.getElementById('f-erp-nome').style.display=(this.value==='Outro'||this.value==='Manual')?'block':'none'">
                  ${['Domínio','Alterdata','Questor','TecWeb','Conta Azul','Omie','Bling','SCI','Emissão de Nota no Portal da prefeitura','Emissão da Nota no portal Nacional','Manual','Outro'].map(e=>`<option ${c.erp===e||(c.erp==='Domínio Único'&&e==='Domínio')?'selected':''}>${e}</option>`).join('')}
                </select>
                <input id="f-erp-nome" value="${c.erp_nome||''}" placeholder="Nome do sistema / Informação Adicional..." style="flex:1;display:${['Outro','Manual'].includes(c.erp)?'block':'none'};border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-family:inherit;font-size:13px;">
              </div>
            </div>
          </div>
          <div class="form-group form-full mt-2"><label>Observações Gerais</label><textarea id="f-obs">${c.obs||''}</textarea></div>
        </div>

        <div id="tab-controles" class="tab-panel">
          <div style="display:flex;gap:16px;margin-bottom:20px;">
            <!-- ESTOQUE -->
            <div style="flex:1;background:#f8fafc;padding:12px;border-radius:8px;border:1px solid var(--border)">
              <div style="font-weight:700;margin-bottom:8px;font-size:12px;color:var(--primary-dark)">1. Estoque</div>
              <div class="form-group"><label>Possui controle?</label><select id="ci_est_possui">
                ${['Não se aplica','Sim','Não','Parcial'].map(x=>`<option ${c.ci_est_possui===x?'selected':''}>${x}</option>`).join('')}
              </select></div>
              <div class="form-group"><label>Tipo</label><select id="ci_est_tipo">
                ${['N/A','Manual (planilha)','Sistema integrado','Não possui'].map(x=>`<option ${c.ci_est_tipo===x?'selected':''}>${x}</option>`).join('')}
              </select></div>
              <div class="form-group"><label>Inventário periódico?</label><select id="ci_est_inv">
                ${['N/A','Sim','Não'].map(x=>`<option ${c.ci_est_inv===x?'selected':''}>${x}</option>`).join('')}
              </select></div>
              <div class="form-group"><label>Frequência</label><select id="ci_est_freq">
                ${['N/A','Mensal','Trimestral','Anual'].map(x=>`<option ${c.ci_est_freq===x?'selected':''}>${x}</option>`).join('')}
              </select></div>
              <div class="form-group"><label>Integra fiscal/contábil?</label><select id="ci_est_integra">
                ${['N/A','Sim','Não'].map(x=>`<option ${c.ci_est_integra===x?'selected':''}>${x}</option>`).join('')}
              </select></div>
              <div style="font-size:10px;color:var(--danger);margin-top:6px;font-style:italic">👉 Sem controle = Risco SPED Fiscal</div>
            </div>

            <!-- CAIXA -->
            <div style="flex:1;background:#f8fafc;padding:12px;border-radius:8px;border:1px solid var(--border)">
              <div style="font-weight:700;margin-bottom:8px;font-size:12px;color:var(--primary-dark)">2. Caixa e Bancos</div>
              <div class="form-group"><label>Controle de caixa?</label><select id="ci_cx_possui">
                ${['Não se aplica','Sim','Não'].map(x=>`<option ${c.ci_cx_possui===x?'selected':''}>${x}</option>`).join('')}
              </select></div>
              <div class="form-group"><label>Tipo</label><select id="ci_cx_tipo">
                ${['N/A','Caixa diário','Fluxo de caixa projetado','Extrato bancário apenas'].map(x=>`<option ${c.ci_cx_tipo===x?'selected':''}>${x}</option>`).join('')}
              </select></div>
              <div class="form-group"><label>Conciliação bancária?</label><select id="ci_cx_concil">
                ${['N/A','Sim','Não'].map(x=>`<option ${c.ci_cx_concil===x?'selected':''}>${x}</option>`).join('')}
              </select></div>
              <div class="form-group"><label>Frequência</label><select id="ci_cx_freq">
                ${['N/A','Diária','Semanal','Mensal'].map(x=>`<option ${c.ci_cx_freq===x?'selected':''}>${x}</option>`).join('')}
              </select></div>
              <div class="form-group"><label>Separação PF x PJ?</label><select id="ci_cx_sep">
                ${['N/A','Sim','Não'].map(x=>`<option ${c.ci_cx_sep===x?'selected':''}>${x}</option>`).join('')}
              </select></div>
              <div style="font-size:10px;color:var(--danger);margin-top:6px;font-style:italic">👉 Sem separar = Contabilidade vira estimativa</div>
            </div>

            <!-- BENS -->
            <div style="flex:1;background:#f8fafc;padding:12px;border-radius:8px;border:1px solid var(--border)">
              <div style="font-weight:700;margin-bottom:8px;font-size:12px;color:var(--primary-dark)">3. Controle de Bens</div>
              <div class="form-group"><label>Possui controle?</label><select id="ci_bens_possui">
                ${['Não se aplica','Sim','Não'].map(x=>`<option ${c.ci_bens_possui===x?'selected':''}>${x}</option>`).join('')}
              </select></div>
              <div class="form-group"><label>Registro individualizado?</label><select id="ci_bens_reg">
                ${['N/A','Sim','Não'].map(x=>`<option ${c.ci_bens_reg===x?'selected':''}>${x}</option>`).join('')}
              </select></div>
              <div class="form-group"><label>Controla depreciação?</label><select id="ci_bens_depr">
                ${['N/A','Sim','Não'].map(x=>`<option ${c.ci_bens_depr===x?'selected':''}>${x}</option>`).join('')}
              </select></div>
              <div class="form-group"><label>Inventário físico?</label><select id="ci_bens_inv">
                ${['N/A','Sim','Não'].map(x=>`<option ${c.ci_bens_inv===x?'selected':''}>${x}</option>`).join('')}
              </select></div>
              <div class="form-group"><label>Atualização</label><select id="ci_bens_freq">
                ${['N/A','Mensal','Anual','Não atualizado'].map(x=>`<option ${c.ci_bens_freq===x?'selected':''}>${x}</option>`).join('')}
              </select></div>
              <div style="font-size:10px;color:var(--warning);margin-top:6px;font-style:italic">👉 Sem controle = ECD/balanço distorcidos</div>
            </div>
          </div>

          <div style="display:flex;gap:16px;margin-bottom:20px;">
            <!-- DOCS E PROC -->
            <div style="flex:1;background:#f8fafc;padding:12px;border-radius:8px;border:1px solid var(--border);display:flex;flex-direction:column;gap:8px">
              <div style="font-weight:700;font-size:12px;color:var(--primary-dark)">4. Docs e Processos</div>
              <div class="form-group"><label>Doc. Organiz?</label><select id="ci_doc_org">
                ${['Sim','Não','Parcial'].map(x=>`<option ${c.ci_doc_org===x?'selected':''}>${x}</option>`).join('')}
              </select></div>
              <div class="form-group"><label>Formato envio</label><select id="ci_doc_forma">
                ${['Digital','Físico','Ambos'].map(x=>`<option ${c.ci_doc_forma===x?'selected':''}>${x}</option>`).join('')}
              </select></div>
              <div class="form-group"><label>Padrão envio</label><select id="ci_doc_padrao">
                ${['Mensal estruturado','Envio solto'].map(x=>`<option ${c.ci_doc_padrao===x?'selected':''}>${x}</option>`).join('')}
              </select></div>
              <div class="form-group"><label>Checklist do cliente?</label><select id="ci_doc_chk">
                ${['Sim','Não'].map(x=>`<option ${c.ci_doc_chk===x?'selected':''}>${x}</option>`).join('')}
              </select></div>
              <div style="border-top:1px solid var(--border);margin-top:4px;padding-top:8px" class="form-group"><label>Rotina financeira definida?</label><select id="ci_proc_rotina">
                ${['Sim','Não'].map(x=>`<option ${c.ci_proc_rotina===x?'selected':''}>${x}</option>`).join('')}
              </select></div>
              <div class="form-group"><label>Segregação funções?</label><select id="ci_proc_seg">
                ${['Sim','Não'].map(x=>`<option ${c.ci_proc_seg===x?'selected':''}>${x}</option>`).join('')}
              </select></div>
              <div style="font-size:10px;color:var(--warning);margin-top:2px;font-style:italic">👉 Falta segreg = Risco de fraude/desorganização</div>
            </div>

            <!-- MATURIDADE / ITG -->
            <div style="flex:2;background:#f0fdff;border:1px solid #7dd3fc;padding:12px;border-radius:8px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:1px solid #bae6fd;padding-bottom:8px">
                <div style="font-weight:700;font-size:14px;color:#0369a1">🚦 Classificação de Maturidade e Enquadramento (NBC/ITG)</div>
                <div style="background:#0284c7;color:#fff;padding:5px 10px;border-radius:6px;font-size:12px;font-weight:700;min-width:180px;text-align:center" id="ci_nivel_display">Nível: A Calcular</div>
              </div>
              <div class="form-grid">
                <div class="form-group form-full"><label>Norma contábil definida (Obrigatória)</label><select id="ci_norma" onchange="updateCiAlerts()">
                  ${['A Definir','ITG 2002 (Sem fins lucrativos)','ITG 2004 (Cooperativa)','ITG 1000 (Micro/Pequena)','NBC TG 1000 (Pequena/Média)','CPC/IFRS Completos'].map(x=>`<option ${c.ci_norma===x?'selected':''}>${x}</option>`).join('')}
                </select></div>

                <div class="form-group"><label>Complexidade Operacional</label><select id="ci_nivel_complex" onchange="updateCiAlerts()">
                  ${['Baixa (Sem est/imob relevante)','Média (Um ou vários fatores mod.)','Alta (Controles múltiplos)'].map(x=>`<option ${c.ci_nivel_complex===x?'selected':''}>${x}</option>`).join('')}
                </select></div>

                <div class="form-group"><label>Finalidade da Contab.</label><select id="ci_finalidade" onchange="updateCiAlerts()">
                  ${['Fiscal/obrigatória','Fiscal + suporte básico','Gerencial (Apoio à decisão)','Estratégica (Indicadores)'].map(x=>`<option ${c.ci_finalidade===x?'selected':''}>${x}</option>`).join('')}
                </select></div>
              </div>

              <!-- JUSTIFICATIVA -->
              <div style="border-top:1px dashed #7dd3fc;padding-top:12px;margin-top:12px;">
                <label style="font-size:11px;font-weight:700;color:#0ea5e9;display:block;margin-bottom:8px;text-transform:uppercase">🧠 Justificativa Técnica do Enquadramento</label>
                <div class="form-grid">
                  <div class="form-group"><label>Porte da empresa</label><select id="ci_just_porte">
                    ${['ME','EPP','Médio','Grande','Sem fins lucrativos'].map(x=>`<option ${c.ci_just_porte===x?'selected':''}>${x}</option>`).join('')}
                  </select></div>
                  <div class="form-group"><label>Estrutura operacional</label><select id="ci_just_est">
                    ${['Simples','Moderada','Complexa'].map(x=>`<option ${c.ci_just_est===x?'selected':''}>${x}</option>`).join('')}
                  </select></div>
                  <div class="form-group form-full"><label>Obrigatoriedades / Motivo da escolha</label><input id="ci_just_motivo" value="${c.ci_just_motivo||''}" placeholder="Ex: Receita br < 4M, prefere ITG 1000"></div>
                </div>
              </div>

              <!-- ALERTA AUTOMATICO -->
              <div class="form-group form-full mt-4">
                <div id="ci_alerta" style="padding:12px;border-radius:6px;background:#fff;border-left:4px solid var(--warning);font-size:12px;color:var(--text);box-shadow:var(--shadow)">
                  ⚠️ Selecione as classificações acima para conferir os alertas técnicos.
                </div>
              </div>

            </div>
          </div>
        </div>

        <div id="tab-bancos" class="tab-panel">
          <p class="text-muted text-sm mb-4">Selecione todos os bancos que o cliente utiliza. O checklist mensal irá gerar uma linha de extrato por banco.</p>
          <div class="form-group"><label>Bancos (Febraban + Banrisul)</label>
            <div class="checkbox-group">${bancosHtml}</div>
          </div>
          <div class="form-group mt-2"><label>Outro banco (nome)</label><input id="f-banco-outro" value="${c.banco_outro||''}" placeholder="Banco Sicredi, Cresol..."></div>
        </div>

        <div id="tab-parcelamentos" class="tab-panel" style="background:#f1f5f9;padding:12px;border-radius:10px">
          <!-- TOPO RESUMO -->
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-bottom:20px;display:flex;gap:16px;align-items:center;box-shadow:var(--shadow)">
             <div style="flex:1;text-align:center;border-right:1px solid #e2e8f0;padding-right:16px">
                <div style="font-size:10px;text-transform:uppercase;font-weight:700;color:var(--text-muted)">Débitos e Passivos Totais</div>
                <div style="font-size:22px;font-weight:800;color:var(--text)">${totalValStr}</div>
             </div>
             <div style="flex:1;text-align:center;border-right:1px solid #e2e8f0;padding-right:16px">
                <div style="font-size:10px;text-transform:uppercase;font-weight:700;color:var(--text-muted)">Parcelamentos Ativos</div>
                <div style="font-size:22px;font-weight:800;color:var(--primary)">${sumParc.ativos}</div>
             </div>
             <div style="flex:1;text-align:center;border-right:1px solid #e2e8f0;padding-right:16px">
                <div style="font-size:10px;text-transform:uppercase;font-weight:700;color:var(--text-muted)">Parecelamentos em Atraso</div>
                <div style="font-size:22px;font-weight:800;color:var(--warning)">${sumParc.atraso}</div>
             </div>
             <div style="flex:1;text-align:center;">
                <div style="font-size:10px;text-transform:uppercase;font-weight:700;color:var(--text-muted)">Situação Global</div>
                <div style="font-size:16px;font-weight:800;color:${sitGeral.includes('Crítica')?'var(--danger)':(sitGeral.includes('Atenção')?'var(--warning)':'var(--success)')}">${sitGeral}</div>
             </div>
          </div>

          <!-- PATERCER -->
          <div style="border:1px dashed #cbd5e1;background:#fff;border-radius:8px;padding:12px;margin-bottom:20px;">
             <label style="font-weight:700;font-size:12px;color:var(--primary-dark);margin-bottom:8px;display:block">📌 Parecer Estratégico do Escritório</label>
             <textarea id="parc_parecer" style="width:100%;min-height:50px;border:none;resize:none;font-size:13px;color:var(--text-muted);outline:none" placeholder="Situação Atual: Cliente possui débitos em... | Risco: Fiscal Alto... | Recomendação: Regularizar via parcelamento...">${c.parc_parecer||''}</textarea>
          </div>

          <h3 style="font-size:14px;color:var(--text);margin-bottom:12px;border-bottom:2px solid #e2e8f0;padding-bottom:6px">💣 Débitos Identificados (Sem Parcelamento)</h3>
          <div class="cards-grid" style="grid-template-columns:1fr 1fr;gap:12px">
             ${renderDebito('deb_rfb', 'Receita Federal (RFB)')}
             ${renderDebito('deb_pgfn', 'Procuradoria Geral (PGFN)')}
             ${renderDebito('deb_est', 'Receita Estadual (SEFAZ)')}
             ${renderDebito('deb_mun', 'Prefeitura (Município)')}
          </div>

          <h3 style="font-size:14px;color:var(--text);margin-top:24px;margin-bottom:12px;border-bottom:2px solid #e2e8f0;padding-bottom:6px">📦 Parcelamentos Ativos e Encargos</h3>
          <div class="cards-grid" style="grid-template-columns:1fr 1fr;gap:12px">
             ${renderParcelamento('parc_mei', 'MEI')}
             ${renderParcelamento('parc_sn', 'Simples Nacional')}
             ${renderParcelamento('parc_rfb', 'RFB Geral')}
             ${renderParcelamento('parc_pgfn', 'PGFN')}
             ${renderParcelamento('parc_est', 'Estado')}
             ${renderParcelamento('parc_mun', 'Município')}
          </div>
        </div>

        <div id="tab-trabalhista" class="tab-panel">
          <div class="checkbox-group">
            <label class="checkbox-item"><input type="checkbox" id="f-tem-folha" ${c.tem_folha?'checked':''}> Tem funcionários ativos (gera checklist de Folha)</label>
            <label class="checkbox-item"><input type="checkbox" id="f-tem-prol" ${c.tem_prolabore?'checked':''}> Sócios retiram Pró-labore</label>
          </div>
        </div>

        <div id="tab-diagnostico" class="tab-panel">
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:16px;display:flex;gap:20px;align-items:center">
            <div style="min-width:100px;text-align:center;border-right:1px solid #e2e8f0;padding-right:16px">
              <div style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:700">Pendências</div>
              <div style="font-size:22px;font-weight:bold;color:#334155">${countPendents}</div>
            </div>
            <div style="min-width:100px;text-align:center">
              <div style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:700">Risco Fiscal</div>
              <div style="font-size:16px;font-weight:bold;color:${riscoColor}">${risco}</div>
            </div>
            <div style="flex:1;margin-left:20px">
              <div style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:700;margin-bottom:4px">Última Competência Analisada</div>
              <input id="f-ultima-comp" value="${c.d_ultima_comp||''}" placeholder="Ex: Fev/2026" style="width:100%;max-width:200px;font-size:12px;padding:6px;border:1px solid #ccc;border-radius:4px;outline:none">
            </div>
          </div>

          <div style="display:flex;gap:24px">
            <div style="flex:1">
              <h4 style="margin-bottom:12px;font-size:12px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;text-transform:uppercase;color:#475569">Obrigações Acessórias</h4>
              ${renderDiagRow('d_sped_f', 'SPED Fiscal', d_sped_f)}
              ${renderDiagRow('d_sped_c', 'SPED Contribuições', d_sped_c)}
              ${renderDiagRow('d_ecd', 'ECD', d_ecd)}
              ${renderDiagRow('d_ecf', 'ECF', d_ecf)}
              ${renderDiagRow('d_defis', 'DEFIS', d_defis)}
              ${renderDiagRow('d_dasnmei', 'DASNMEI', d_dasnmei)}
              ${renderDiagRow('d_simples', 'PGDAS', d_simples)}
            </div>
            <div style="flex:1">
              <h4 style="margin-bottom:12px;font-size:12px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;text-transform:uppercase;color:#475569">Situação Fiscal / Débitos</h4>
              ${renderDiagRow('d_div_rfb', 'Dívida RFB', d_div_rfb)}
              ${renderDiagRow('d_div_pgfn', 'Dívida PGFN', d_div_pgfn)}
              ${renderDiagRow('d_div_est', 'Dívida Estadual', d_div_est)}
              ${renderDiagRow('d_div_pref', 'Dívida Municipal', d_div_pref)}
            </div>
          </div>

          <div class="form-group mt-4"><label>Observações do Diagnóstico</label><textarea id="f-obs-diag" style="min-height:70px;border-radius:6px">${c.obs_diag||''}</textarea></div>
        </div>

        <div id="tab-onboarding" class="tab-panel">
          <p class="text-muted text-sm mb-4">Checklist de implantação de novos clientes (C-006). As alterações aqui são salvas automaticamente.</p>
          <div id="obg-modal-content"></div>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveCliente('${mode}')">💾 Salvar</button>
    </div>
  </div>
</div>`;

  // Inject Onboarding sections dynamically only if editing an existing client
  if (id) {
    const obgContainer = document.getElementById('obg-modal-content');
    if (obgContainer) {
      const onboarding = DB.get('onboarding') || {};
      const savedObg = onboarding[id] || {};
      const STATUS_OBG = ['pendente','solicitado','verificar','concluido','cliente_nao_possui'];
      const statusLabel = {pendente:'Pendente',solicitado:'Solicitado',verificar:'Verificar',concluido:'Concluído',cliente_nao_possui:'Cliente Não Possui'};

      if (typeof C006_TEMPLATE !== 'undefined') {
        obgContainer.innerHTML = C006_TEMPLATE.map(sec => {
          const itemsHtml = sec.items.map(item => {
            const k = sec.section+'_'+item.cod+'_'+item.nome;
            const val = savedObg[k] || 'pendente';
            return `<div class="doc-item" style="padding:6px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px">
              <div class="doc-code" style="font-size:11px;color:#94a3b8;width:30px">${item.cod}</div>
              <div style="flex:1">
                <div class="doc-name" style="font-size:12px;font-weight:600">${item.nome}</div>
                ${item.obs?`<div class="doc-obs" style="font-size:10px;color:#64748b;margin-top:2px">${item.obs}</div>`:''}
              </div>
              <select style="border:1px solid var(--border);border-radius:6px;padding:5px 8px;font-size:11px;font-family:inherit" onchange="saveObgItem('${id}', '${k}', this.value)">
                ${STATUS_OBG.map(s=>`<option value="${s}" ${val===s?'selected':''}>${statusLabel[s]}</option>`).join('')}
              </select>
            </div>`;
          }).join('');
          const done = sec.items.filter(i=>{const k=sec.section+'_'+i.cod+'_'+i.nome; return savedObg[k]==='concluido';}).length;
          return `<div class="card mb-3" style="background:#f8fafc;padding:12px;border:1px solid #e2e8f0;box-shadow:none">
            <div class="flex justify-between items-center mb-2">
              <strong style="font-size:13px;color:#334155">${sec.section}</strong>
              <span class="badge badge-blue">${done}/${sec.items.length} concluídos</span>
            </div>
            <div>${itemsHtml}</div>
          </div>`;
        }).join('');
      }
    }
  } else {
    const obgContainer = document.getElementById('obg-modal-content');
    if (obgContainer) obgContainer.innerHTML = '<div class="empty-state" style="padding:20px;text-align:center"><div style="font-size:24px;margin-bottom:10px">📁</div><p>Cadastre e salve o cliente primeiro para liberar o checklist de Onboarding.</p></div>';
  }
  
  setTimeout(updateCiAlerts, 50);
}

function closeModal() {
  const mc = document.getElementById('modal-container');
  if (mc) mc.innerHTML = '';
}

function switchTab(btn, panelId) {
  btn.closest('.modal')||document.body;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(panelId).classList.add('active');
}

function saveCliente(mode) {
  const clientes = DB.get('clientes') || [];
  const bancos = [...document.querySelectorAll('input[name=banco]:checked')].map(i=>i.value);
  const novo = {
    id: mode==='new' ? (document.getElementById('f-cod').value || String(Date.now())) : document.getElementById('f-id').value,
    nome: document.getElementById('f-nome').value,
    cnpj: document.getElementById('f-cnpj').value,
    regime: document.getElementById('f-regime').value,
    status: document.getElementById('f-status').value,
    cnae: document.getElementById('f-cnae').value,
    tipo_operacao: document.getElementById('f-tipo').value,
    complexidade: document.getElementById('f-comp').value,
    erp: document.getElementById('f-erp').value,
    erp_nome: (document.getElementById('f-erp-nome')||{}).value||'',
    drive_url: (document.getElementById('f-drive')||{}).value||'',
    responsavel: document.getElementById('f-resp').value,
    whatsapp: document.getElementById('f-wapp').value,
    email: document.getElementById('f-email').value,
    im: document.getElementById('f-im').value,
    ie: document.getElementById('f-ie').value,
    fat_medio: document.getElementById('f-fat').value,
    qtd_socios: document.getElementById('f-socios').value,
    obs: document.getElementById('f-obs').value,
    obs_diag: document.getElementById('f-obs-diag').value,
    tem_prolabore: document.getElementById('f-tem-prol').checked,
    tem_folha: document.getElementById('f-tem-folha').checked,
    bancos, banco_outro: document.getElementById('f-banco-outro').value,
    parc_federal: document.getElementById('f-parc-fed').checked,
    parc_estadual: document.getElementById('f-parc-est').checked,
    parc_pref: document.getElementById('f-parc-pref').checked,
    parc_pgfn: document.getElementById('f-parc-pgfn').checked,
    d_simples: { status: document.getElementById('d_simples-st').value, comp: document.getElementById('d_simples-comp').value },
    d_sped_f: { status: document.getElementById('d_sped_f-st').value, comp: document.getElementById('d_sped_f-comp').value },
    d_sped_c: { status: document.getElementById('d_sped_c-st').value, comp: document.getElementById('d_sped_c-comp').value },
    d_ecd: { status: document.getElementById('d_ecd-st').value, comp: document.getElementById('d_ecd-comp').value },
    d_ecf: { status: document.getElementById('d_ecf-st').value, comp: document.getElementById('d_ecf-comp').value },
    d_defis: { status: document.getElementById('d_defis-st').value, comp: document.getElementById('d_defis-comp').value },
    d_dasnmei: { status: document.getElementById('d_dasnmei-st').value, comp: document.getElementById('d_dasnmei-comp').value },
    d_div_rfb: { status: document.getElementById('d_div_rfb-st').value, comp: document.getElementById('d_div_rfb-comp').value },
    d_div_pgfn: { status: document.getElementById('d_div_pgfn-st').value, comp: document.getElementById('d_div_pgfn-comp').value },
    d_div_est: { status: document.getElementById('d_div_est-st').value, comp: document.getElementById('d_div_est-comp').value },
    d_div_pref: { status: document.getElementById('d_div_pref-st').value, comp: document.getElementById('d_div_pref-comp').value },
    d_ultima_comp: document.getElementById('f-ultima-comp').value,
    qtd_funcionarios: (document.getElementById('f-qtd-func')||{}).value||'',
    sem_fins_lucrativos: false,
    cooperativa: false,

    // -- CONTROLES INTERNOS E ITG --
    ci_est_possui: (document.getElementById('ci_est_possui')||{}).value,
    ci_est_tipo: (document.getElementById('ci_est_tipo')||{}).value,
    ci_est_inv: (document.getElementById('ci_est_inv')||{}).value,
    ci_est_freq: (document.getElementById('ci_est_freq')||{}).value,
    ci_est_integra: (document.getElementById('ci_est_integra')||{}).value,
    ci_cx_possui: (document.getElementById('ci_cx_possui')||{}).value,
    ci_cx_tipo: (document.getElementById('ci_cx_tipo')||{}).value,
    ci_cx_concil: (document.getElementById('ci_cx_concil')||{}).value,
    ci_cx_freq: (document.getElementById('ci_cx_freq')||{}).value,
    ci_cx_sep: (document.getElementById('ci_cx_sep')||{}).value,
    ci_bens_possui: (document.getElementById('ci_bens_possui')||{}).value,
    ci_bens_reg: (document.getElementById('ci_bens_reg')||{}).value,
    ci_bens_depr: (document.getElementById('ci_bens_depr')||{}).value,
    ci_bens_inv: (document.getElementById('ci_bens_inv')||{}).value,
    ci_bens_freq: (document.getElementById('ci_bens_freq')||{}).value,
    ci_doc_org: (document.getElementById('ci_doc_org')||{}).value,
    ci_doc_forma: (document.getElementById('ci_doc_forma')||{}).value,
    ci_doc_padrao: (document.getElementById('ci_doc_padrao')||{}).value,
    ci_doc_chk: (document.getElementById('ci_doc_chk')||{}).value,
    ci_proc_rotina: (document.getElementById('ci_proc_rotina')||{}).value,
    ci_proc_seg: (document.getElementById('ci_proc_seg')||{}).value,
    ci_norma: (document.getElementById('ci_norma')||{}).value,
    ci_just_porte: (document.getElementById('ci_just_porte')||{}).value,
    ci_just_est: (document.getElementById('ci_just_est')||{}).value,
    ci_just_motivo: (document.getElementById('ci_just_motivo')||{}).value,
    ci_nivel_complex: (document.getElementById('ci_nivel_complex')||{}).value,
    ci_finalidade: (document.getElementById('ci_finalidade')||{}).value,
    // --- PARCELAMENTOS E DEBITOS ---
    parc_parecer: (document.getElementById('parc_parecer')||{}).value||'',
    ...(() => {
        const getObjVal = (id) => (document.getElementById(id)||{}).value||'';
        const parc_keys = ['parc_mei','parc_sn','parc_rfb','parc_pgfn','parc_est','parc_mun'];
        let extras = {};
        parc_keys.forEach(k => {
          extras[k] = {
            status: getObjVal(`${k}_status`), num: getObjVal(`${k}_num`), data: getObjVal(`${k}_data`),
            valor: getObjVal(`${k}_valor`), p_atual: getObjVal(`${k}_p_atual`), p_total: getObjVal(`${k}_p_total`),
            pend: getObjVal(`${k}_pend`), contab: getObjVal(`${k}_contab`), tipo: getObjVal(`${k}_tipo`),
            encargos: getObjVal(`${k}_encargos`), prazo: getObjVal(`${k}_prazo`)
          };
        });
        const deb_keys = ['deb_rfb','deb_pgfn','deb_est','deb_mun'];
        deb_keys.forEach(k => {
          extras[k] = {
            status: getObjVal(`${k}_status`), existe: getObjVal(`${k}_existe`), valor: getObjVal(`${k}_valor`),
            origem: getObjVal(`${k}_origem`), sit: getObjVal(`${k}_sit`), contab: getObjVal(`${k}_contab`),
            tipo: getObjVal(`${k}_tipo`), cnd: getObjVal(`${k}_cnd`), risco: getObjVal(`${k}_risco`)
          };
        });
        return extras;
    })(),

    criado_em: new Date().toISOString(),
  };

  if (mode==='new') {
    clientes.push(novo);
  } else {
    const i = clientes.findIndex(x=>x.id===novo.id);
    if (i>=0) clientes[i] = novo;
  }
  DB.set('clientes', clientes);
  closeModal();
  render();
}

window.updateCiAlerts = function() {
  const norma = document.getElementById('ci_norma')?.value || '';
  const complex = document.getElementById('ci_nivel_complex')?.value || '';
  const fin = document.getElementById('ci_finalidade')?.value || '';
  const divAlerta = document.getElementById('ci_alerta');
  const divNivel = document.getElementById('ci_nivel_display');
  if(!divAlerta) return;

  // Nível de Maturidade
  let nivel = '🔴 1 - Informal';
  if (fin.includes('Gerencial') || fin.includes('Estratégica')) {
    nivel = fin.includes('Estratégica') ? '🔵 4 - Estratégico' : '🟢 3 - Estruturado';
  } else if (fin.includes('suporte')) {
    nivel = '🟡 2 - Em estruturação';
  }
  if(divNivel) divNivel.innerHTML = `Maturidade: ${nivel}`;

  // Alerta Coerência
  let msg = `<b>📌 Impactos Gerais da Escolha:</b> Necessidade rigorosa de aderência às orientações da norma ${norma.split(' ')[0]}.`;
  let hasAlert = false;
  if (norma.includes('ITG 1000') && complex.includes('Alta')) {
     msg += `<br><br>⚠️ <b>Aviso de Risco:</b> Empresa de alta complexidade usando ITG 1000 (Simplificado). Recomendada migração para NBC TG 1000.`;
     hasAlert = true;
  }
  if (norma.includes('Completos') && complex.includes('Baixa')) {
     msg += `<br><br>⚠️ <b>Aviso de Risco:</b> Excesso operacional usando exigência IFRS em empresa com estrutura de complexidade baixa.`;
     hasAlert = true;
  }
  if (norma.includes('2002') && fin.includes('Estratégica')) {
     msg += `<br><br>💡 <b>Dica:</b> Entidade sem fins lucrativos estruturada deve apresentar notas explicativas completas.`;
  }
  divAlerta.innerHTML = msg;
  divAlerta.style.borderLeftColor = hasAlert ? 'var(--danger)' : '#0ea5e9';
};

// ─── CHECKLIST ───
let chkClienteId = null;
let chkView = 'checklist'; // 'checklist' | 'kanban'
let chkYear = new Date().getFullYear();
const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function openClienteChecklist(id) { chkClienteId = id; chkView = 'checklist'; render(); }

// ── Custom month picker HTML (inline, no native input[type=month]) ──
function buildMonthPicker(checklists) {
  const [selYear, selMon] = state.competencia.split('-');
  const yr = parseInt(selYear);

  const btns = MESES_LABEL.map((m, i) => {
    const mm = String(i+1).padStart(2,'0');
    const key = chkClienteId ? `${chkClienteId}_${yr}-${mm}` : null;
    const data = key ? checklists[key] : null;
    let cls = 'month-btn';
    const isSelected = (String(yr) === selYear && mm === selMon);
    if (isSelected) cls += ' selected';
    if (data) {
      const vals = Object.values(data);
      const done = vals.filter(v => v === 'recebido').length;
      cls += ' has-data';
      cls += (done === vals.length) ? ' full' : ' partial';
    }
    return `<button class="${cls}" onclick="state.competencia='${yr}-${mm}';chkView='checklist';render()">${m}</button>`;
  }).join('');

  return `<div class="month-picker">
    <div class="month-picker-header">
      <button class="month-picker-nav" onclick="chkYear=${yr-1};state.competencia='${yr-1}-${selMon}';render()">◀</button>
      <span class="month-picker-year">${yr}</span>
      <button class="month-picker-nav" onclick="chkYear=${yr+1};state.competencia='${yr+1}-${selMon}';render()">▶</button>
    </div>
    <div class="month-picker-grid">${btns}</div>
  </div>`;
}

function renderChecklist() {
  const clientes = DB.get('clientes') || [];
  const ativos = clientes.filter(c => c.status === 'Ativo');
  const checklists = DB.get('checklists') || {};

  const selectorOptions = ativos.map(c =>
    `<option value="${c.id}" ${chkClienteId === c.id ? 'selected' : ''}>#${c.id} — ${c.nome}</option>`
  ).join('');

  const topBar = `
<div class="card mb-4" style="padding:14px 20px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
  <span style="font-weight:600;white-space:nowrap">Cliente:</span>
  <select style="flex:1;min-width:250px;border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-family:inherit;font-size:13px"
    onchange="chkClienteId=this.value;chkView='checklist';render()">
    <option value="">— Selecione o cliente —</option>${selectorOptions}
  </select>
  ${chkClienteId ? `
    <button class="btn btn-ghost btn-sm" onclick="chkView='checklist';render()" ${chkView==='checklist'?'style="background:var(--primary);color:#fff;border-color:var(--primary)"':''}>📋 Checklist</button>
    <button class="btn btn-ghost btn-sm" onclick="chkView='kanban';render()" ${chkView==='kanban'?'style="background:var(--primary);color:#fff;border-color:var(--primary)"':''}>🗂️ Histórico</button>
    <button class="btn btn-success btn-sm" onclick="gerarParecer()">📄 Gerar Parecer</button>
  ` : ''}
</div>`;

  if (!chkClienteId) return topBar +
    `<div style="display:flex;gap:20px;align-items:flex-start">
      ${buildMonthPicker(checklists)}
      <div class="empty-state" style="flex:1"><div class="empty-icon">📋</div><p>Selecione um cliente para visualizar o checklist mensal.</p></div>
    </div>`;

  const cliente = clientes.find(c => c.id === chkClienteId);
  if (!cliente) return topBar;

  // ── KANBAN VIEW ──
  if (chkView === 'kanban') {
    const years = [chkYear - 1, chkYear, chkYear + 1];
    const cards = years.flatMap(yr =>
      MESES_LABEL.map((mes, i) => {
        const mm = String(i+1).padStart(2,'0');
        const comp = `${yr}-${mm}`;
        const key  = `${chkClienteId}_${comp}`;
        const saved = checklists[key];
        let pct = 0, done = 0, total = 0, cls = 'k-empty', emoji = '⬜';
        if (saved) {
          const vals = Object.values(saved);
          total = vals.length;
          done  = vals.filter(v => v === 'recebido').length;
          pct   = total ? Math.round(done/total*100) : 0;
          cls   = pct === 100 ? 'k-full' : 'k-partial';
          emoji = pct === 100 ? '✅' : '⚠️';
        }
        return `<div class="kanban-card ${cls}" onclick="state.competencia='${comp}';chkView='checklist';render()">
          <div class="kanban-card-badge">${emoji}</div>
          <div class="kanban-card-month">${mes}/${yr}</div>
          ${saved ? `<div class="kanban-card-pct">${pct}%</div>
          <div class="kanban-card-sub">${done}/${total} documentos</div>
          <div class="kanban-card-bar"><div class="kanban-card-fill" style="width:${pct}%"></div></div>` :
          `<div style="font-size:12px;color:var(--text-muted);margin-top:6px">Sem registros</div>`}
        </div>`;
      })
    );

    return `${topBar}
<div class="card mb-4" style="border-left:4px solid var(--primary);padding:14px 20px">
  <strong>#${cliente.id} — ${cliente.nome}</strong>
  <span class="text-muted text-sm" style="margin-left:12px">${regimedIcon(cliente.regime)}</span>
  <div style="display:flex;gap:8px;margin-left:auto;float:right">
    <button class="btn btn-ghost btn-sm" onclick="chkYear--;render()">◀ ${chkYear-1}</button>
    <strong style="padding:5px 10px">${chkYear}</strong>
    <button class="btn btn-ghost btn-sm" onclick="chkYear++;render()">${chkYear+1} ▶</button>
  </div>
</div>
<div class="kanban-grid">${cards.join('')}</div>`;
  }

  // ── CHECKLIST VIEW ──
  const key = `${chkClienteId}_${state.competencia}`;
  const saved = checklists[key] || {};

  const categorias = CHECKLIST_TEMPLATE.map(cat => {
    const items = cat.items.filter(item => {
      if (item.condicao) {
        if (item.condicao.startsWith('banco_')) {
          const cod = item.condicao.replace('banco_', '');
          if (cod === 'outro') return !!cliente.banco_outro;
          return (cliente.bancos||[]).includes(cod);
        }
        if (item.condicao === 'tem_caixa')       return cliente.tem_caixa;
        if (item.condicao === 'tem_estoque')     return cliente.tem_estoque;
        if (item.condicao === 'tem_folha')       return cliente.tem_folha;
        if (item.condicao === 'tem_prolabore')   return cliente.tem_prolabore;
        if (item.condicao === 'parc_federal')    return cliente.parc_federal;
        if (item.condicao === 'parc_estadual')   return cliente.parc_estadual;
        if (item.condicao === 'parc_pref')       return cliente.parc_pref;
        if (item.condicao === 'parc_pgfn')       return cliente.parc_pgfn;
        if (item.condicao === 'fiscal_integrado') return cliente.fiscal_integrado;
      }
      if (item.regimes && !item.regimes.includes('todos') && !item.regimes.includes(cliente.regime)) return false;
      return true;
    });
    return { ...cat, items };
  }).filter(cat => cat.items.length > 0);

  const totalItems = categorias.reduce((a,c) => a + c.items.length, 0);
  const doneItems  = categorias.reduce((a,c) => a + c.items.filter(i => saved[i.key]==='recebido').length, 0);
  const pct = totalItems ? Math.round((doneItems/totalItems)*100) : 0;

  const catHtml = categorias.map(cat => {
    const catDone = cat.items.filter(i => saved[i.key] === 'recebido').length;
    const itemsHtml = cat.items.map(item => {
      const val = saved[item.key] || 'aguardando';
      return `<div class="checklist-item">
        <div style="flex:1">
          <div class="checklist-item-name">${item.nome}</div>
          ${item.obs ? `<div class="checklist-item-sub">${item.obs}</div>` : ''}
        </div>
        <select class="status-select ${val}" onchange="saveChkItem('${item.key}',this.value,this)">
          <option value="aguardando"  ${val==='aguardando' ?'selected':''}>⏳ Aguardando</option>
          <option value="recebido"    ${val==='recebido'   ?'selected':''}>✅ Recebido</option>
          <option value="incompleto"  ${val==='incompleto' ?'selected':''}>⚠️ Incompleto</option>
          <option value="nao_enviado" ${val==='nao_enviado'?'selected':''}>❌ Não enviado</option>
          <option value="divergente"  ${val==='divergente' ?'selected':''}>🔎 Divergente</option>
        </select>
      </div>`;
    }).join('');
    return `<div class="checklist-category">
      <div class="checklist-header"><span>${cat.cat}</span><span class="cat-count">${catDone}/${cat.items.length}</span></div>
      <div class="checklist-body">${itemsHtml}</div>
    </div>`;
  }).join('');

  return `${topBar}
<div style="display:flex;gap:16px;align-items:flex-start">
  ${buildMonthPicker(checklists)}
  <div style="flex:1">
    <div class="card mb-4" style="padding:14px 18px">
      <div class="flex justify-between items-center mb-2">
        <strong>#${cliente.id} — ${cliente.nome}</strong>
        <span class="text-muted text-sm">${fmtComp(state.competencia)} · ${regimedIcon(cliente.regime)}</span>
      </div>
      <div class="flex items-center gap-3">
        <div class="progress-bar" style="flex:1"><div class="progress-fill" style="width:${pct}%"></div></div>
        <strong>${doneItems}/${totalItems} (${pct}%)</strong>
      </div>
    </div>
    ${catHtml}
    <div id="parecer-area"></div>
  </div>
</div>`;
}

function saveChkItem(key, val, sel) {
  sel.className = `status-select ${val}`;
  const checklists = DB.get('checklists') || {};
  const k = chkClienteId + '_' + state.competencia;
  checklists[k] = checklists[k] || {};
  checklists[k][key] = val;
  DB.set('checklists', checklists);
}

function gerarParecer() {
  const clientes = DB.get('clientes') || [];
  const cliente = clientes.find(c => c.id === chkClienteId);
  const checklists = DB.get('checklists') || {};
  const key = `${chkClienteId}_${state.competencia}`;
  const saved = checklists[key] || {};

  // Coleta status
  const recebidos = [], pendentes = [], incompletos = [], divergentes = [], naoEnviados = [];
  CHECKLIST_TEMPLATE.forEach(cat => cat.items.forEach(item => {
    const v = saved[item.key];
    if (v === 'recebido')    recebidos.push(item.nome);
    if (v === 'nao_enviado') naoEnviados.push(item.nome);
    if (v === 'incompleto')  incompletos.push(item.nome);
    if (v === 'divergente')  divergentes.push(item.nome);
  }));

  const esc = localStorage.getItem('esc_nome') || 'Criscontab & Madeira Contabilidade';
  const hoje = new Date().toLocaleDateString('pt-BR');
  const sep  = '═'.repeat(55);
  const sep2 = '─'.repeat(55);

  // Resumo do cliente
  const bancosList = (cliente.bancos||[]).join(', ') || '—';
  const parcList = [cliente.parc_federal?'RFB':null, cliente.parc_estadual?'Estado':null,
    cliente.parc_pref?'Prefeitura':null, cliente.parc_pgfn?'PGFN':null].filter(Boolean).join(', ') || 'Nenhum';

  let texto = `${sep}\n`;
  texto += `PARECER DE ESCRITURAÇÃO — ${fmtComp(state.competencia).toUpperCase()}\n`;
  texto += `${sep}\n\n`;
  texto += `DADOS DO CLIENTE\n${sep2}\n`;
  texto += `Razão Social : ${cliente.nome}\n`;
  texto += `CNPJ         : ${cliente.cnpj}\n`;
  texto += `Regime       : ${cliente.regime}\n`;
  texto += `Tipo         : ${cliente.tipo_operacao||'—'} | Complexidade: ${cliente.complexidade||'—'}\n`;
  if (cliente.cnae)        texto += `CNAE         : ${cliente.cnae}\n`;
  if (cliente.im)          texto += `Ins. Municipal: ${cliente.im}\n`;
  if (cliente.ie)          texto += `Ins. Estadual : ${cliente.ie}\n`;
  if (cliente.responsavel) texto += `Responsável  : ${cliente.responsavel}\n`;
  if (cliente.whatsapp)    texto += `WhatsApp     : ${cliente.whatsapp}\n`;
  if (cliente.erp)         texto += `Sistema ERP  : ${cliente.erp}\n`;
  texto += `Bancos       : ${bancosList}\n`;
  texto += `Parcelamentos: ${parcList}\n`;
  texto += `\nSITUAÇÃO DOCUMENTOS — ${fmtComp(state.competencia)} | Emitido em: ${hoje}\n${sep2}\n`;

  if (!Object.keys(saved).length) {
    texto += `⚠️  Nenhum documento foi registrado nesta competência.\n`;
  } else if (!naoEnviados.length && !incompletos.length && !divergentes.length) {
    texto += `✅  Toda a documentação foi recebida e está em conformidade.\n`;
    texto += `    Total de itens recebidos: ${recebidos.length}\n`;
  } else {
    texto += `✅  Recebidos   : ${recebidos.length} itens\n`;
    if (naoEnviados.length) {
      texto += `\n❌  NÃO ENVIADOS (${naoEnviados.length}):\n`;
      naoEnviados.forEach(i => texto += `     • ${i}\n`);
    }
    if (incompletos.length) {
      texto += `\n⚠️  INCOMPLETOS (${incompletos.length}):\n`;
      incompletos.forEach(i => texto += `     • ${i}\n`);
    }
    if (divergentes.length) {
      texto += `\n🔎  DIVERGÊNCIAS (${divergentes.length}):\n`;
      divergentes.forEach(i => texto += `     • ${i}\n`);
    }
    texto += `\nSolicitamos providências para regularização dos itens acima.\n`;
    texto += `A ausência ou inconsistência dos documentos pode impactar\na escrituração e as apurações fiscais do período.\n`;
  }
  texto += `\n${sep2}\n${esc}\n`;

  document.getElementById('parecer-area').innerHTML = `
<div class="card mt-4">
  <div class="flex justify-between items-center mb-3">
    <strong>📄 Parecer Técnico — ${fmtComp(state.competencia)}</strong>
    <div style="display:flex;gap:6px">
      <button class="btn btn-ghost btn-sm" onclick="copiarParecer()">📋 Copiar</button>
      <button class="btn btn-ghost btn-sm" onclick="imprimirParecer()">🖨️ Imprimir</button>
    </div>
  </div>
  <div class="parecer-box" id="parecer-text">${texto}</div>
</div>`;
}
function copiarParecer() {
  navigator.clipboard.writeText(document.getElementById('parecer-text').textContent);
  alert('Parecer copiado!');
}
function imprimirParecer() {
  const conteudo = document.getElementById('parecer-text').textContent;
  const win = window.open('', '_blank');
  win.document.write(`<html><head><title>Parecer</title>
    <style>body{font-family:monospace;font-size:13px;padding:30px;line-height:1.7;white-space:pre-wrap}</style>
  </head><body>${conteudo}</body></html>`);
  win.document.close();
  win.print();
}


function saveObgItem(cliId, key, val) {
  const onboarding = DB.get('onboarding') || {};
  onboarding[cliId] = onboarding[cliId] || {};
  onboarding[cliId][key] = val;
  DB.set('onboarding', onboarding);
  // Opcional: Atualizar a página de trás se necessário (não faremos render para não fechar o modal)
}

// ─── Impact map for auto-audit classification ───
const IMPACTO_MAP = [
  { keys:['extrato','bancário','banco'], risco:'alto',  imp:'Impossibilita conciliação bancária — sem extrato não é possível validar entradas/saídas nem apurar resultado.' },
  { keys:['nota fiscal','nf-e','nfs-e','xml','nfe','nfse'], risco:'alto', imp:'Sem notas fiscais não é possível escriturar receitas/despesas, apurar tributos (ISS, PIS/COFINS) nem gerar SPED.' },
  { keys:['folha','holerite','funcionario','funcionário'], risco:'alto', imp:'Impossibilita escrituração da folha, cálculo de FGTS, INSS e encargos trabalhistas.' },
  { keys:['pró-labore','prolabore','pro-labore'], risco:'medio', imp:'Sem pró-labore a contribuição do sócio ao INSS não é corretamente apurada.' },
  { keys:['darf','das','guia','imposto','gps','dctf'], risco:'alto', imp:'Guias não recebidas geram registros incorretos do passivo fiscal e podem causar dupla cobrança.' },
  { keys:['parcelamento','pgfn','rfb','procuradoria'], risco:'alto', imp:'Sem comprovante o parcelamento ativo não pode ser corretamente provisionado no passivo.' },
  { keys:['cartão','fatura','cartao'], risco:'medio', imp:'Despesas com cartão não registradas distorcem o resultado e geram lançamentos sem documentação.' },
  { keys:['caixa','sangria','suprimento'], risco:'medio', imp:'Sem controle de caixa há risco de receitas não declaradas e passivos fictícios.' },
  { keys:['estoque','inventário','inventario'], risco:'medio', imp:'Sem movimentação de estoque não é possível apurar o CMV e o resultado operacional corretamente.' },
  { keys:['imobilizado','aquisição','baixa','depreciação'], risco:'medio', imp:'Sem registro de imobilizado há risco de depreciação incorreta e distorção do ativo permanente.' },
  { keys:['certificado','ecac','e-cac','gov.br','acesso','senha'], risco:'alto', imp:'Sem acesso digital ativo não é possível consultar pendências, parcelamentos e entregar obrigações.' },
  { keys:['sintegra','dime','sped','efd'], risco:'alto', imp:'Obrigação acessória não entregue sujeita a multa automática e gera pendência fiscal.' },
  { keys:['defis','dasn','dirf','rais','ecd','ecf'], risco:'alto', imp:'Declaração anual não entregue gera multa automática e pode bloquear certidões do cliente.' },
  { keys:['contrato','comprovante','recibo'], risco:'baixo', imp:'Documento de suporte importante para eventual fiscalização ou questionamento do lançamento.' },
];
function getImpacto(nome) {
  const n = (nome||'').toLowerCase();
  for (const m of IMPACTO_MAP) {
    if (m.keys.some(k => n.includes(k))) return { risco: m.risco, imp: m.imp };
  }
  return { risco:'baixo', imp:'Documento de suporte. Verificar relevância para a escrituração do período.' };
}

// ─── AUDITORIA ───
let audClienteId = null;
function renderAuditoria() {
  const clientes = DB.get('clientes') || [];
  const ativos   = clientes.filter(c => c.status === 'Ativo');
  const opts = ativos.map(c =>
    `<option value="${c.id}" ${audClienteId===c.id?'selected':''}>#${c.id} — ${c.nome}</option>`
  ).join('');

  const topBar = `
<div class="card mb-4" style="padding:14px 20px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
  <span style="font-weight:600">Cliente:</span>
  <select style="flex:1;min-width:250px;border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-family:inherit;font-size:13px"
    onchange="audClienteId=this.value;render()">
    <option value="">— Selecione o cliente —</option>${opts}
  </select>
  <input type="month" value="${state.competencia}" onchange="state.competencia=this.value;render()"
    style="border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-family:inherit;font-size:13px">
  ${audClienteId ? `<button class="btn btn-primary btn-sm" onclick="addAudItem()">+ Apontamento Manual</button>` : ''}
</div>`;

  if (!audClienteId) return topBar +
    `<div class="empty-state"><div class="empty-icon">🔍</div><p>Selecione um cliente para ver os apontamentos automáticos e manuais.</p></div>`;

  const cliente = clientes.find(c => c.id === audClienteId);
  const rBadge  = r => `<span class="badge ${r==='alto'?'badge-red':r==='medio'?'badge-yellow':'badge-green'}">${r==='alto'?'🔴 Alto':r==='medio'?'🟡 Médio':'🟢 Baixo'}</span>`;
  const stLbl   = { nao_enviado:'❌ Não enviado', incompleto:'⚠️ Incompleto', divergente:'🔎 Divergente', pendente:'⏳ Pendente', solicitado:'📨 Solicitado', verificar:'🔍 Verificar' };

  // ── AUTO: Checklist ──
  const chkSaved = (DB.get('checklists')||{})[`${audClienteId}_${state.competencia}`] || {};
  const chkPend  = Object.entries(chkSaved).filter(([,v]) => v !== 'recebido' && v !== 'aguardando');

  const chkRows = chkPend.map(([k,v]) => {
    const nome = k.replace(/_/g,' ');
    const {risco, imp} = getImpacto(nome);
    const bc = risco==='alto'?'#ef4444':risco==='medio'?'#f59e0b':'#10b981';
    return `<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 14px;border:1px solid var(--border);border-radius:8px;margin-bottom:6px;background:var(--card)">
      <div style="flex:1">
        <div style="font-weight:600;font-size:13px">${nome}</div>
        <div style="font-size:11px;color:var(--text-muted)">${stLbl[v]||v}</div>
        <div style="font-size:12px;margin-top:4px;padding:5px 10px;border-radius:5px;background:#f8fafc;border-left:3px solid ${bc}">⚡ ${imp}</div>
      </div>
      ${rBadge(risco)}
    </div>`;
  }).join('');

  const chkSection = chkPend.length
    ? `<div class="card mb-4">
        <div style="font-weight:700;font-size:14px;margin-bottom:10px">✅ Docs Pendentes — Checklist <strong>${fmtComp(state.competencia)}</strong> <span class="badge badge-red">${chkPend.length}</span></div>
        ${chkRows}
       </div>`
    : `<div class="card mb-4" style="border-left:4px solid var(--success);padding:12px 18px">
        <strong>✅ Checklist ${fmtComp(state.competencia)}</strong>
        <span class="text-muted text-sm" style="margin-left:8px">${Object.keys(chkSaved).length ? 'Todos os documentos recebidos.' : 'Nenhum item registrado ainda.'}</span>
       </div>`;

  // ── AUTO: Onboarding ──
  const obgSaved = (DB.get('onboarding')||{})[audClienteId] || {};
  const obgPend  = [];
  (C006_TEMPLATE||[]).forEach(sec => sec.items.forEach(item => {
    const k = sec.section+'_'+item.cod+'_'+item.nome;
    const v = obgSaved[k] || 'pendente';
    if (v !== 'concluido' && v !== 'cliente_nao_possui')
      obgPend.push({ nome: item.nome, status: v, secao: sec.section, cod: item.cod });
  }));

  const obgRows = obgPend.map(p => {
    const {risco, imp} = getImpacto(p.nome);
    const bc = risco==='alto'?'#ef4444':risco==='medio'?'#f59e0b':'#10b981';
    return `<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 14px;border:1px solid var(--border);border-radius:8px;margin-bottom:6px;background:var(--card)">
      <div style="flex:1">
        <div style="font-size:10px;color:var(--text-muted);font-weight:600">${p.secao} · ${p.cod}</div>
        <div style="font-weight:600;font-size:13px">${p.nome}</div>
        <div style="font-size:11px;color:var(--text-muted)">${stLbl[p.status]||p.status}</div>
        <div style="font-size:12px;margin-top:4px;padding:5px 10px;border-radius:5px;background:#f8fafc;border-left:3px solid ${bc}">⚡ ${imp}</div>
      </div>
      ${rBadge(risco)}
    </div>`;
  }).join('');

  const obgSection = obgPend.length
    ? `<div class="card mb-4">
        <div style="font-weight:700;font-size:14px;margin-bottom:10px">📁 Onboarding Pendente <span class="badge badge-yellow">${obgPend.length}</span></div>
        ${obgRows}
       </div>`
    : `<div class="card mb-4" style="border-left:4px solid var(--success);padding:12px 18px">
        <strong>✅ Onboarding</strong>
        <span class="text-muted text-sm" style="margin-left:8px">Todos os documentos de cadastro concluídos.</span>
       </div>`;

  // ── AUTO: Obrigações Acessórias entregues ──
  const obrigData = DB.get('obrigacoes') || {};
  const anoAtual = state.competencia.split('-')[0];
  const obgsAnuais = ['DEFIS','ECD','ECF','RAIS','DIRF','DASN-MEI'];
  const obgStatusRows = obgsAnuais.map(cod => {
    const k = `${audClienteId}_${cod}_${anoAtual}`;
    const d = obrigData[k] || {};
    const s = d.status || 'pendente';
    const hasFile = d.arquivo_nome;
    const badge = s==='entregue'?'badge-green':s==='em_atraso'?'badge-red':'badge-gray';
    const lbl   = s==='entregue'?'✅ Entregue':s==='em_atraso'?'🔴 Em Atraso':'⏳ Pendente';
    return `<div style="display:flex;align-items:center;gap:10px;padding:7px 14px;border-bottom:1px solid var(--border)">
      <strong style="min-width:80px;font-size:12px">${cod}</strong>
      <span class="badge ${badge}">${lbl}</span>
      ${d.data_entrega ? `<span class="text-muted text-sm">${d.data_entrega}</span>` : ''}
      ${hasFile ? `<span style="font-size:12px">📎 ${d.arquivo_nome}</span>` : ''}
      <span style="margin-left:auto"></span>
    </div>`;
  }).join('');

  const obgAcessSection = `<div class="card mb-4">
    <div style="font-weight:700;font-size:14px;margin-bottom:6px">📋 Obrigações Acessórias — ${anoAtual}</div>
    <div>${obgStatusRows}</div>
    <div class="text-muted text-sm mt-2" style="padding:0 14px">Gerencie entregas e anexos no módulo <button class="btn btn-ghost btn-sm" onclick="navigate('obrigacoes')">📋 Obrigações Acessórias</button></div>
  </div>`;

  // ── Manual apontamentos ──
  const audData = DB.get('auditoria') || {};
  const key     = `${audClienteId}_${state.competencia}`;
  const items   = audData[key] || [];
  const manualHtml = items.length === 0
    ? `<p class="text-muted text-sm" style="padding:10px 0">Nenhum apontamento manual. Use "+ Apontamento Manual" acima.</p>`
    : items.map((it,i) => {
        const rC = {baixo:'risk-low',medio:'risk-med',alto:'risk-high'}[it.risco]||'risk-low';
        return `<div class="audit-item">
          <div class="audit-item-header">
            <div class="risk-indicator ${rC}"></div>
            <strong style="flex:1">${it.item}</strong>
            <span class="badge ${it.risco==='alto'?'badge-red':it.risco==='medio'?'badge-yellow':'badge-green'}">${it.risco}</span>
            <button class="btn btn-danger btn-sm" onclick="delAudItem(${i})">✕</button>
          </div>
          <div class="audit-fields">
            <div class="form-group"><label>Observação Técnica</label><textarea rows="2" onchange="updateAud(${i},'obs',this.value)">${it.obs||''}</textarea></div>
            <div class="form-group"><label>Impacto Contábil/Fiscal</label><textarea rows="2" onchange="updateAud(${i},'impacto',this.value)">${it.impacto||''}</textarea></div>
            <div class="form-group"><label>Ação Recomendada</label><textarea rows="2" onchange="updateAud(${i},'acao',this.value)">${it.acao||''}</textarea></div>
            <div class="form-group"><label>Risco</label>
              <select onchange="updateAud(${i},'risco',this.value)">
                ${['baixo','medio','alto'].map(r=>`<option ${it.risco===r?'selected':''}>${r}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>`;
      }).join('');

  const driveBtn = cliente.drive_url
    ? `<a href="${cliente.drive_url}" target="_blank" class="btn btn-ghost btn-sm" style="margin-left:auto">🗂️ Drive do Cliente</a>`
    : '';

  return `${topBar}
<div class="card mb-4" style="border-left:4px solid var(--primary);padding:14px 20px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
  <strong>#${cliente.id} — ${cliente.nome}</strong>
  <span class="badge badge-blue">${cliente.regime}</span>
  ${driveBtn}
</div>
${chkSection}${obgSection}${obgAcessSection}
<div class="card"><div style="font-weight:700;font-size:14px;margin-bottom:10px">✏️ Apontamentos Manuais Adicionais</div>${manualHtml}</div>`;
}

function addAudItem() {

  const auditoria = DB.get('auditoria') || {};
  const key = audClienteId + '_' + state.competencia;
  auditoria[key] = auditoria[key] || [];
  auditoria[key].push({ item:'Novo apontamento', obs:'', impacto:'', acao:'', risco:'medio' });
  DB.set('auditoria', auditoria);
  render();
}
function addAudItemFromChk(itemKey, status) {
  const auditoria = DB.get('auditoria') || {};
  const key = audClienteId + '_' + state.competencia;
  auditoria[key] = auditoria[key] || [];
  auditoria[key].push({ item: itemKey.replace(/_/g,' '), obs:`Status: ${status}`, impacto:'', acao:'', risco: status==='divergente'?'alto':'medio' });
  DB.set('auditoria', auditoria);
  navigate('auditoria');
}
function delAudItem(i) {
  const auditoria = DB.get('auditoria') || {};
  const key = audClienteId + '_' + state.competencia;
  auditoria[key].splice(i,1);
  DB.set('auditoria', auditoria);
  render();
}
function updateAud(i, field, val) {
  const auditoria = DB.get('auditoria') || {};
  const key = audClienteId + '_' + state.competencia;
  if (auditoria[key] && auditoria[key][i]) auditoria[key][i][field] = val;
  DB.set('auditoria', auditoria);
}

// ─── EDUCAÇÃO ───
function renderEducacao() {
  const secoes = [
    { icon:'💰', title:'1. Contas a Pagar — PRIORIDADE', rules:[
      {emoji:'🔴', title:'Registre TODAS as obrigações', body:'Fornecedores, impostos, folha, aluguéis — sem exceção. Sem contas a pagar organizadas, sua contabilidade nunca será confiável.'},
      {emoji:'📂', title:'Separe por categoria', body:'Fornecedores / Impostos / Folha / Outros. Identifique data de vencimento, valor e documento vinculado.'},
      {emoji:'📄', title:'Nenhum pagamento sem documento', body:'Toda saída precisa de NF, recibo ou contrato. Pagamentos sem comprovante são um risco fiscal grave.'},
    ]},
    { icon:'📈', title:'2. Contas a Receber', rules:[
      {emoji:'✅', title:'Controle seu faturamento', body:'Mantenha relatório de todas as vendas e serviços prestados, com data, valor e forma de pagamento.'},
      {emoji:'🔔', title:'Registre as baixas', body:'Informe quando o pagamento for recebido. Inadimplência não registrada distorce o balanço.'},
      {emoji:'⚠️', title:'Inadimplência', body:'Relate ao escritório clientes em atraso. Impacta provisões e pode gerar ajuste no resultado.'},
    ]},
    { icon:'🏦', title:'3. Movimentação Bancária', rules:[
      {emoji:'🚫', title:'Nunca misture PF e PJ', body:'Conta pessoal do sócio é diferente da conta da empresa. Misturar é um dos maiores problemas contábeis.'},
      {emoji:'🔍', title:'Identifique TODAS as entradas', body:'Todo depósito deve ter origem identificada: venda, empréstimo, integralização. Entradas sem justificativa viram receita tributável.'},
      {emoji:'💸', title:'Evite saques em espécie sem justificativa', body:'Saques devem ter registro: retirada de pró-labore, pagamento de fornecedor, etc.'},
    ]},
    { icon:'📧', title:'4. Envio de Documentos', rules:[
      {emoji:'📁', title:'Use um canal único', body:'Google Drive, WhatsApp ou sistema definido pelo escritório. Não enviar por múltiplos canais sem confirmação.'},
      {emoji:'📛', title:'Padronize o nome dos arquivos', body:'Formato sugerido: NF_Fornecedor_Data_Valor. Exemplo: NF_Madeireira_2025-03-15_R$1500,00.pdf'},
      {emoji:'📅', title:'Respeite o prazo mensal', body:'Documentos entregues fora do prazo atrasam a escrituração, os relatórios e podem gerar multas por entrega de obrigações.'},
    ]},
    { icon:'⭐', title:'5. Regras de Ouro', rules:[
      {emoji:'⛔', title:'Não pague sem documento', body:'Toda despesa precisa de nota fiscal, recibo ou contrato assinado.'},
      {emoji:'🏛️', title:'Não receba fora da conta da empresa', body:'Vendas devem ser recebidas na conta PJ. Pix, cartão ou boleto — sempre na conta empresarial.'},
      {emoji:'🔒', title:'Não use dinheiro da empresa como pessoal', body:'Retiradas devem ser formalizadas como pró-labore ou distribuição de lucros. Retiradas informais são irregulares.'},
      {emoji:'📊', title:'Planeje sua carga tributária', body:'Não espere fechar o mês para saber se há impostos a pagar. Consulte o escritório para projeção mensal.'},
    ]},
  ];

  return `
<div style="max-width:800px">
  <div class="card mb-4" style="background:linear-gradient(135deg,var(--primary-dark),var(--primary));color:#fff;padding:22px 24px">
    <h2 style="font-size:18px;margin-bottom:6px">🎓 Educação Financeira para o Cliente</h2>
    <p style="opacity:.85;font-size:13px">Um cliente bem orientado gera uma contabilidade confiável. Compartilhe estas orientações com seus clientes.</p>
  </div>
  ${secoes.map(s=>`
  <div class="edu-section">
    <div class="edu-header" onclick="this.nextElementSibling.classList.toggle('open')">
      <span style="font-size:20px">${s.icon}</span>
      <h3>${s.title}</h3>
      <span style="margin-left:auto">▼</span>
    </div>
    <div class="edu-body">
      ${s.rules.map(r=>`<div class="edu-rule">
        <div style="font-size:20px;flex-shrink:0">${r.emoji}</div>
        <div><strong>${r.title}</strong><p style="margin-top:4px;color:var(--text-muted)">${r.body}</p></div>
      </div>`).join('')}
    </div>
  </div>`).join('')}
</div>`;
}

// ─── NOTE: attachEvents() and DOMContentLoaded init are in modules.js ───

