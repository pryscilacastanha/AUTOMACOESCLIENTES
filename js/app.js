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

let searchTimeout;
window.handleSearch = (val) => {
  state.filtro = val;
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    let focusEl = document.activeElement;
    let isSearch = focusEl && focusEl.id === 'search-input';
    render();
    if (isSearch) {
      setTimeout(() => {
        const el = document.getElementById('search-input');
        if (el) { el.focus(); el.setSelectionRange(val.length, val.length); }
      }, 50);
    }
  }, 350);
};

function render() {
  const main = document.getElementById('main-content');
  try {
    const titles = {
      dashboard:'Carteira de Clientes', clientes:'Clientes',
      onboarding:'Onboarding de Clientes',
      educacao:'Educação do Cliente',
      configuracoes:'Configurações',
      treinamento:'Treinamento da Equipe',
    };
    document.getElementById('topbar-title').textContent = titles[state.page] || '';
    switch(state.page) {
      case 'dashboard':     main.innerHTML = renderDashboard(); break;
      case 'clientes':      main.innerHTML = renderClientes(); break;
      case 'onboarding':    main.innerHTML = renderOnboarding(); break;
      case 'educacao':      main.innerHTML = renderEducacao(); break;
      case 'configuracoes': main.innerHTML = renderConfiguracoes(); break;
      case 'treinamento':   main.innerHTML = renderTreinamento(); break;
      default: main.innerHTML = renderDashboard(); break;
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
        <button class="btn btn-ghost btn-sm btn-danger" onclick="deleteCliente('${c.id}')" title="Excluir Cliente">🗑️</button>
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
        <input id="search-input" type="text" placeholder="Buscar nome, CNPJ ou código..." value="${state.filtro||''}" oninput="window.handleSearch(this.value)">
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
function deleteCliente(id) {
  const clientes = DB.get('clientes') || [];
  const c = clientes.find(x => x.id === id);
  if (!c) return;
  if (!confirm(`Tem certeza que deseja EXCLUIR o cliente #${id} — ${c.nome}?\n\nEsta ação não pode ser desfeita.`)) return;
  const updated = clientes.filter(x => x.id !== id);
  DB.set('clientes', updated);
  // Update sidebar count
  const countEl = document.getElementById('sidebar-count');
  if (countEl) countEl.textContent = `${updated.length} clientes cadastrados`;
  navigate(state.page);
}
window.deleteCliente = deleteCliente;

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
      <button class="btn btn-ghost btn-sm btn-danger" onclick="deleteCliente('${c.id}')">🗑️</button>
    </td>
  </tr>`).join('');

  return `
<div class="flex justify-between items-center mb-4">
  <div class="search-bar" style="width:320px">
    <span>🔍</span>
    <input id="search-input" type="text" placeholder="Buscar por nome, CNPJ ou código..." value="${state.filtro}" oninput="window.handleSearch(this.value)">
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

  const getDiag = (key) => typeof c[key] === 'object' && c[key] !== null ? c[key] : { status: c[key] ? 'Pendente' : 'Regular', comp: '' };
  const d_sped_f = getDiag('d_sped_f');
  const d_sped_c = getDiag('d_sped_c');
  const d_ecd = getDiag('d_ecd');
  const d_ecf = getDiag('d_ecf');
  const d_defis = getDiag('d_defis');
  const d_dasnmei = getDiag('d_dasnmei');
  const d_simples = getDiag('d_simples');
  const d_dctfweb = getDiag('d_dctfweb');
  const d_dime = getDiag('d_dime');
  const d_gia = getDiag('d_gia');

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
      <select id="${key}-st" onchange="if(typeof window.runDiagAlerts==='function') window.runDiagAlerts()" style="width:120px;font-size:10px;padding:4px;border:1px solid #ccc;border-radius:4px;outline:none">
        <option value="Pendente" ${obj.status==='Pendente'?'selected':''}>🔴 Pendente</option>
        <option value="Em andamento" ${obj.status==='Em andamento'?'selected':''}>🟡 Em andamento</option>
        <option value="Regular" ${obj.status==='Regular'?'selected':''}>🟢 Regular</option>
        <option value="Não se aplica" ${obj.status==='Não se aplica'?'selected':''}>⚫ Não se aplica</option>
      </select>
      <input id="${key}-comp" value="${obj.comp||''}" placeholder="Período/Comp." style="flex:1;font-size:10px;padding:4px;border:1px solid #ccc;border-radius:4px;outline:none">
    </div>`;
  };

  const allDiags = [d_sped_f, d_sped_c, d_ecd, d_ecf, d_defis, d_dasnmei, d_simples, d_dctfweb, d_dime, d_gia, d_div_rfb, d_div_pgfn, d_div_est, d_div_pref];
  const countPendents = allDiags.filter(x=>x.status==='Pendente').length;
  const countAndamento = allDiags.filter(x=>x.status==='Em andamento').length;
  const risco = countPendents > 0 ? 'Alto' : countAndamento > 0 ? 'Médio' : 'Baixo';
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
        <button class="tab-btn" onclick="switchTab(this,'tab-bancos')">Gestão Financeira e Bancos</button>
        <button class="tab-btn" onclick="switchTab(this,'tab-parcelamentos')">Passivos e Parcelamentos</button>
        <button class="tab-btn" onclick="switchTab(this,'tab-trabalhista')">Estrutura Trab. / Risco</button>
        <button class="tab-btn" onclick="switchTab(this,'tab-situacao-fiscal')">Situação Fiscal (Débitos)</button>
        <button class="tab-btn" onclick="switchTab(this,'tab-obrigacoes')">Obrigações Acessórias</button>
      </div>
      <form id="form-cliente">
        <input type="hidden" id="f-id" value="${c.id}">

        <div id="tab-geral" class="tab-panel active">
          <div class="form-grid">
            <div class="form-group"><label>Código</label><input id="f-cod" value="${c.id}" placeholder="Auto" ${mode==='new'?'':'readonly'}></div>
            <div class="form-group"><label>Status</label><select id="f-status">
              ${['Ativo','Inativo','Encerrada','Especial','Avaliar'].map(s=>`<option ${c.status===s?'selected':''}>${s}</option>`).join('')}
            </select></div>
            <div class="form-group form-full"><label>Razão Social</label><input id="f-nome" value="${c.nome}" required placeholder="Nome completo da empresa" onblur="if(typeof window.autoClassifyITG==='function') window.autoClassifyITG()"></div>
            <div class="form-group"><label>CNPJ</label><input id="f-cnpj" value="${c.cnpj}" placeholder="00.000.000/0001-00"></div>
            <div class="form-group"><label>Regime Tributário</label><select id="f-regime" onchange="if(typeof window.autoClassifyITG==='function') window.autoClassifyITG()">
              ${['Simples Nacional','Lucro Presumido','Lucro Real','MEI','A definir'].map(r=>`<option ${c.regime===r?'selected':''}>${r}</option>`).join('')}
            </select></div>
            <div class="form-group"><label>CNAE</label><input id="f-cnae" value="${c.cnae||''}" placeholder="0000-0/00"></div>
            <div class="form-group"><label>Tipo de Operação</label><select id="f-tipo" onchange="if(typeof window.handleTipoOperacaoChange==='function') window.handleTipoOperacaoChange()">
              ${['Serviço','Comércio','Indústria','Misto'].map(t=>`<option ${c.tipo_operacao===t?'selected':''}>${t}</option>`).join('')}
            </select></div>
            <div class="form-group"><label>Complexidade</label><select id="f-comp" onchange="if(typeof window.autoClassifyITG==='function') window.autoClassifyITG()">
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
                  ${['Sistema Único (SCI)','Alterdata','Questor','TecWeb','Conta Azul','Omie','Bling','Emissão de Nota no Portal da prefeitura','Emissão da Nota no portal Nacional','Manual','Outro'].map(e=>`<option ${c.erp===e||(['Domínio','Domínio Único','SCI'].includes(c.erp)&&e==='Sistema Único (SCI)')?'selected':''}>${e}</option>`).join('')}
                </select>
                <input id="f-erp-nome" value="${c.erp_nome||''}" placeholder="Nome do sistema / Informação Adicional..." style="flex:1;display:${['Outro','Manual'].includes(c.erp)?'block':'none'};border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-family:inherit;font-size:13px;">
              </div>
            </div>
          </div>
          <div class="form-group form-full mt-2">
            <label>🔗 Drive Google — Link da pasta do cliente</label>
            <input id="f-drive-url" value="${c.drive_url||''}"
              placeholder="Cole aqui o link da pasta do Google Drive compartilhada pelo cliente (ex: https://drive.google.com/drive/folders/...)"
              style="border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-family:inherit;font-size:13px;width:100%;box-sizing:border-box">
            <div style="font-size:11px;color:#64748b;margin-top:4px">Este link ativa o botão "🔄 Sincronizar Drive" no módulo Escrituração 2025.</div>
          </div>
          <div class="form-group form-full mt-2"><label>Observações Gerais</label><textarea id="f-obs">${c.obs||''}</textarea></div>
          
          <!-- CLASSIFICAÇÃO CONTÁBIL INTELIGENTE -->
          <div style="margin-top:16px;background:#f0fdff;border:1px solid #7dd3fc;padding:12px;border-radius:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:1px solid #bae6fd;padding-bottom:8px">
              <div style="font-weight:700;font-size:14px;color:#0369a1">🚦 Classificação Contábil Inteligente</div>
              <div style="background:#0284c7;color:#fff;padding:5px 10px;border-radius:6px;font-size:12px;font-weight:700;min-width:180px;text-align:center" id="ci_risco_display">Nível: A Calcular</div>
            </div>

            <!-- ETAPA 1: CLASSIFICAÇÃO LEGAL -->
            <div style="margin-bottom:14px;padding-bottom:12px;border-bottom:1px dashed #bae6fd">
              <div style="font-size:11px;font-weight:700;color:#0ea5e9;text-transform:uppercase;margin-bottom:8px">📋 Etapa 1 — Classificação Legal</div>
              <div class="form-grid">
                <div class="form-group"><label>Tipo de Entidade</label><select id="ci_itg_tipo" onchange="runITGDiagnosis()">
                  ${['Empresa com fins lucrativos','Simples Nacional','Entidade sem fins lucrativos (Terceiro Setor)','Cooperativa'].map(x=>`<option ${c.ci_itg_tipo===x?'selected':''}>${x}</option>`).join('')}
                </select></div>
                <div class="form-group"><label>Receita Bruta Anual (R$)</label>
                  <input id="ci_receita_anual" value="${c.ci_receita_anual||''}" placeholder="Ex: 2.500.000" onchange="runITGDiagnosis()">
                </div>
                <div class="form-group"><label>Ativo Total (R$)</label>
                  <input id="ci_ativo_total" value="${c.ci_ativo_total||''}" placeholder="Ex: 500.000" onchange="runITGDiagnosis()">
                </div>
                <div class="form-group"><label>Natureza Jurídica</label><select id="ci_nat_juridica" onchange="runITGDiagnosis()">
                  ${['LTDA','S.A. Fechada','S.A. Aberta','EIRELI','SLU','MEI','Associação','Fundação','Cooperativa','Outro'].map(x=>`<option ${c.ci_nat_juridica===x?'selected':''}>${x}</option>`).join('')}
                </select></div>
                <div class="form-group"><label>Possui Auditoria Obrigatória?</label><select id="ci_tem_auditoria" onchange="runITGDiagnosis()">
                  ${['Não','Sim'].map(x=>`<option ${c.ci_tem_auditoria===x?'selected':''}>${x}</option>`).join('')}
                </select></div>
                <div class="form-group"><label>Investidores Externos?</label><select id="ci_investidores" onchange="runITGDiagnosis()">
                  ${['Não','Sim'].map(x=>`<option ${c.ci_investidores===x?'selected':''}>${x}</option>`).join('')}
                </select></div>
              </div>
              <div id="ci_porte_auto" style="margin-top:8px;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:700;background:#e0f2fe;color:#0369a1;display:none"></div>
            </div>

            <!-- ETAPA 2: COMPLEXIDADE OPERACIONAL -->
            <div style="margin-bottom:14px;padding-bottom:12px;border-bottom:1px dashed #bae6fd">
              <div style="font-size:11px;font-weight:700;color:#0ea5e9;text-transform:uppercase;margin-bottom:8px">📊 Etapa 2 — Complexidade Operacional (Score)</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
                ${[
                  {id:'ci_cx_estoque', label:'Possui estoque relevante?', val:c.ci_cx_estoque},
                  {id:'ci_cx_financ', label:'Possui financiamento/empréstimos?', val:c.ci_cx_financ},
                  {id:'ci_cx_unidades', label:'Possui mais de uma unidade?', val:c.ci_cx_unidades},
                  {id:'ci_cx_folha', label:'Possui folha complexa (>10 func)?', val:c.ci_cx_folha},
                  {id:'ci_cx_planej', label:'Planejamento tributário ativo?', val:c.ci_cx_planej},
                  {id:'ci_cx_externo', label:'Usuários externos exigem demonstr.?', val:c.ci_cx_externo}
                ].map(f => `<label style="display:flex;align-items:center;gap:6px;font-size:12px;padding:4px 8px;background:#fff;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer">
                  <input type="checkbox" id="${f.id}" ${f.val?'checked':''} onchange="runITGDiagnosis()">
                  ${f.label}
                </label>`).join('')}
              </div>
              <div id="ci_score_display" style="margin-top:8px;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:700;background:#f1f5f9;color:#475569">Score: 0 — Complexidade: Baixa</div>
            </div>

            <!-- ETAPA 3: FINALIDADE -->
            <div style="margin-bottom:14px;padding-bottom:12px;border-bottom:1px dashed #bae6fd">
              <div style="font-size:11px;font-weight:700;color:#0ea5e9;text-transform:uppercase;margin-bottom:8px">🎯 Etapa 3 — Finalidade da Contabilidade</div>
              <div class="form-grid">
                <div class="form-group"><label>Porte (automático / override)</label><select id="ci_itg_porte" onchange="runITGDiagnosis()">
                  ${['— Automático —','Microempresa (ME)','Empresa de Pequeno Porte (EPP)','Médio Porte','Grande Porte'].map(x=>`<option ${c.ci_itg_porte===x?'selected':''}>${x}</option>`).join('')}
                </select></div>
                <div class="form-group"><label>Finalidade (Regra de Ouro)</label><select id="ci_itg_finalidade" onchange="runITGDiagnosis()">
                  ${['Somente Cumprimento Fiscal / Obrigações','Apoio a Tomada de Decisão / Relatórios Gerenciais e Crescimento'].map(x=>`<option ${c.ci_itg_finalidade===x?'selected':''}>${x}</option>`).join('')}
                </select></div>
              </div>
            </div>

            <!-- OUTPUT AUTOMÁTICO -->
            <div style="margin-top:8px">
              <div style="font-size:11px;font-weight:700;color:#0ea5e9;display:block;margin-bottom:8px;text-transform:uppercase">🧠 Output Automático — Classificação Contábil</div>
              <div id="ci_alerta_itg" style="padding:14px;border-radius:8px;background:#fff;border-left:4px solid var(--warning);font-size:13px;color:var(--text);box-shadow:var(--shadow)">
                Preencha as etapas acima para classificação automática.
              </div>
              <input type="hidden" id="ci_itg_norma_calc" value="${c.ci_itg_norma_calc||''}">
              <input type="hidden" id="ci_itg_risco_calc" value="${c.ci_itg_risco_calc||''}">
              <input type="hidden" id="ci_itg_complex" value="${c.ci_itg_complex||''}">
            </div>
          </div>

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
            </div>
          </div>

        <div id="tab-bancos" class="tab-panel">
          <div style="display:flex;gap:16px;margin-bottom:20px;">
            <!-- CAIXA -->
            <div style="flex:1;background:#f8fafc;padding:12px;border-radius:8px;border:1px solid var(--border)">
              <div style="font-weight:700;margin-bottom:8px;font-size:12px;color:var(--primary-dark)">1. Caixa e Bancos</div>
              <div class="form-group"><label>Controle de caixa?</label><select id="ci_cx_possui" onchange="if(typeof window.handleCaixaBancosChange==='function') window.handleCaixaBancosChange()">
                ${['Não possui','Controle manual (caderno/planilha)','Controle em sistema','Parcial'].map(x=>`<option ${c.ci_cx_possui===x?'selected':''}>${x}</option>`).join('')}
              </select></div>
              <div class="form-group"><label>Frequência (Caixa)</label><select id="ci_cx_freq">
                ${['N/A','Diário','Semanal','Mensal','Eventual'].map(x=>`<option ${c.ci_cx_freq===x?'selected':''}>${x}</option>`).join('')}
              </select></div>
              <div class="form-group" style="padding-top:12px;border-top:1px solid #e2e8f0;margin-top:12px"><label>Possui conta bancária?</label><select id="ci_banco_possui" onchange="if(typeof window.handleCaixaBancosChange==='function') window.handleCaixaBancosChange()">
                ${['Sim','Não'].map(x=>`<option ${c.ci_banco_possui===x?'selected':''}>${x}</option>`).join('')}
              </select></div>
              <div class="form-group"><label>Forma de controle bancário</label><select id="ci_banco_forma">
                ${['N/A','Não controla','Apenas arquiva extrato','Conciliação manual (planilha)','Conciliação em sistema'].map(x=>`<option ${c.ci_banco_forma===x?'selected':''}>${x}</option>`).join('')}
              </select></div>
              <div class="form-group"><label>Situação da conciliação</label><select id="ci_banco_sit">
                ${['N/A','Não conciliado','Parcialmente conciliado','Conciliado'].map(x=>`<option ${c.ci_banco_sit===x?'selected':''}>${x}</option>`).join('')}
              </select></div>
              <div class="form-group"><label>Separação PF x PJ?</label><select id="ci_cx_sep">
                ${['N/A','Sim','Não'].map(x=>`<option ${c.ci_cx_sep===x?'selected':''}>${x}</option>`).join('')}
              </select></div>
              <div style="font-size:10px;color:var(--danger);margin-top:6px;font-style:italic">👉 Sem separar = Contabilidade vira estimativa</div>
            </div>
            
            <div style="flex:1;background:#f8fafc;padding:12px;border-radius:8px;border:1px solid var(--border)">
              <div style="font-weight:700;margin-bottom:8px;font-size:12px;color:var(--primary-dark)">2. Instituições Vinculadas</div>
              <div class="form-group form-full">
                <div class="checkbox-group" style="max-height:220px;overflow-y:auto;border:1px solid #e2e8f0;padding:8px;border-radius:6px;background:#fff">${bancosHtml}</div>
              </div>
              <div class="form-group form-full" style="margin-top:12px"><label>Outro banco / instituição (nome livre)</label><input id="f-banco-outro" value="${c.banco_outro||''}" placeholder="Ex: Sicredi, Cresol, Conta Internacional..."></div>
            </div>
          </div>


          <!-- DIAGNOSTICO BANCARIO -->
          <div style="background:#f8fafc;padding:16px;border-radius:8px;border:1px solid var(--border);margin-top:20px;">
             <h3 style="font-size:14px;color:var(--primary-dark);margin-bottom:12px;border-bottom:1px solid #e2e8f0;padding-bottom:6px">Mapeamento de Operações (Diagnóstico Avançado)</h3>
             <div class="cards-grid" style="grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
                
                <div>
                  <strong style="display:block;font-size:12px;margin-bottom:12px;color:var(--primary-dark)">📊 Operações Bancárias</strong>
                  <div class="form-group"><label>Movimentações simples (Receb. / Pag.)?</label><select id="mf_ob_simples" onchange="updateMovFinanceiraAlerts()">
                      ${['Não Informado', 'Não', 'Sim'].map(x => `<option value="${x}" ${c.mov_fin?.ob_simples === x ? 'selected' : ''}>${x}</option>`).join('')}
                  </select></div>
                  <div class="form-group"><label>Alto volume de transações?</label><select id="mf_ob_alto_vol" onchange="updateMovFinanceiraAlerts()">
                      ${['Não Informado', 'Não', 'Sim'].map(x => `<option value="${x}" ${c.mov_fin?.ob_alto_vol === x ? 'selected' : ''}>${x}</option>`).join('')}
                  </select></div>
                  <div class="form-group"><label>Transferências entre contas frequentes?</label><select id="mf_ob_transf" onchange="updateMovFinanceiraAlerts()">
                      ${['Não Informado', 'Não', 'Sim'].map(x => `<option value="${x}" ${c.mov_fin?.ob_transf === x ? 'selected' : ''}>${x}</option>`).join('')}
                  </select></div>
                </div>

                <div>
                  <strong style="display:block;font-size:12px;margin-bottom:12px;color:var(--primary-dark)">💳 Cartões de Crédito</strong>
                  <div class="form-group"><label>Maquininha (recebimento)?</label><select id="mf_cc_maq" onchange="updateMovFinanceiraAlerts()">
                      ${['Não Informado', 'Não', 'Sim'].map(x => `<option value="${x}" ${c.mov_fin?.cc_maq === x ? 'selected' : ''}>${x}</option>`).join('')}
                  </select></div>
                  <div class="form-group"><label>Cartão corporativo (despesas)?</label><select id="mf_cc_corp" onchange="updateMovFinanceiraAlerts()">
                      ${['Não Informado', 'Não', 'Sim'].map(x => `<option value="${x}" ${c.mov_fin?.cc_corp === x ? 'selected' : ''}>${x}</option>`).join('')}
                  </select></div>
                  <div class="form-group"><label>Antecipação de recebíveis?</label><select id="mf_cc_antec" onchange="updateMovFinanceiraAlerts()">
                      ${['Não Informado', 'Não', 'Sim'].map(x => `<option value="${x}" ${c.mov_fin?.cc_antec === x ? 'selected' : ''}>${x}</option>`).join('')}
                  </select></div>
                  <div class="form-group"><label>Múltiplas operadoras (Cielo, Stone, etc.)?</label><select id="mf_cc_multi" onchange="updateMovFinanceiraAlerts()">
                      ${['Não Informado', 'Não', 'Sim'].map(x => `<option value="${x}" ${c.mov_fin?.cc_multi === x ? 'selected' : ''}>${x}</option>`).join('')}
                  </select></div>
                </div>

                <div>
                  <strong style="display:block;font-size:12px;margin-bottom:12px;color:var(--primary-dark)">💰 Empréstimos e Financiamentos</strong>
                  <div class="form-group"><label>Empréstimos bancários?</label><select id="mf_ef_banc" onchange="updateMovFinanceiraAlerts()">
                      ${['Não Informado', 'Não', 'Sim'].map(x => `<option value="${x}" ${c.mov_fin?.ef_banc === x ? 'selected' : ''}>${x}</option>`).join('')}
                  </select></div>
                  <div class="form-group"><label>Financiamentos (veículos/máquinas)?</label><select id="mf_ef_finan" onchange="updateMovFinanceiraAlerts()">
                      ${['Não Informado', 'Não', 'Sim'].map(x => `<option value="${x}" ${c.mov_fin?.ef_finan === x ? 'selected' : ''}>${x}</option>`).join('')}
                  </select></div>
                  <div class="form-group"><label>Capital de giro?</label><select id="mf_ef_capgiro" onchange="updateMovFinanceiraAlerts()">
                      ${['Não Informado', 'Não', 'Sim'].map(x => `<option value="${x}" ${c.mov_fin?.ef_capgiro === x ? 'selected' : ''}>${x}</option>`).join('')}
                  </select></div>
                  <div class="form-group"><label>Renegociações ou parcelamentos?</label><select id="mf_ef_reneg" onchange="updateMovFinanceiraAlerts()">
                      ${['Não Informado', 'Não', 'Sim'].map(x => `<option value="${x}" ${c.mov_fin?.ef_reneg === x ? 'selected' : ''}>${x}</option>`).join('')}
                  </select></div>
                </div>

                <div>
                  <strong style="display:block;font-size:12px;margin-bottom:12px;color:var(--primary-dark)">📈 Investimentos e Aplicações</strong>
                  <div class="form-group"><label>Aplicações automáticas (CDB, RDB)?</label><select id="mf_ia_auto" onchange="updateMovFinanceiraAlerts()">
                      ${['Não Informado', 'Não', 'Sim'].map(x => `<option value="${x}" ${c.mov_fin?.ia_auto === x ? 'selected' : ''}>${x}</option>`).join('')}
                  </select></div>
                  <div class="form-group"><label>Fundos de investimento?</label><select id="mf_ia_fundo" onchange="updateMovFinanceiraAlerts()">
                      ${['Não Informado', 'Não', 'Sim'].map(x => `<option value="${x}" ${c.mov_fin?.ia_fundo === x ? 'selected' : ''}>${x}</option>`).join('')}
                  </select></div>
                  <div class="form-group"><label>Tesouro direto?</label><select id="mf_ia_td" onchange="updateMovFinanceiraAlerts()">
                      ${['Não Informado', 'Não', 'Sim'].map(x => `<option value="${x}" ${c.mov_fin?.ia_td === x ? 'selected' : ''}>${x}</option>`).join('')}
                  </select></div>
                  <div class="form-group"><label>Conta remunerada?</label><select id="mf_ia_conta" onchange="updateMovFinanceiraAlerts()">
                      ${['Não Informado', 'Não', 'Sim'].map(x => `<option value="${x}" ${c.mov_fin?.ia_conta === x ? 'selected' : ''}>${x}</option>`).join('')}
                  </select></div>
                  <div class="form-group"><label>Título de capitalização?</label><select id="mf_ia_cap" onchange="updateMovFinanceiraAlerts()">
                      ${['Não Informado', 'Não', 'Sim'].map(x => `<option value="${x}" ${c.mov_fin?.ia_cap === x ? 'selected' : ''}>${x}</option>`).join('')}
                  </select></div>
                  <div class="form-group"><label>Investimentos em outras empresas?</label><select id="mf_ia_outras" onchange="updateMovFinanceiraAlerts()">
                      ${['Não Informado', 'Não', 'Sim'].map(x => `<option value="${x}" ${c.mov_fin?.ia_outras === x ? 'selected' : ''}>${x}</option>`).join('')}
                  </select></div>
                </div>

                <div>
                  <strong style="display:block;font-size:12px;margin-bottom:12px;color:var(--primary-dark)">🧾 Operações Específicas</strong>
                  <div class="form-group"><label>Consórcios?</label><select id="mf_oe_cons" onchange="updateMovFinanceiraAlerts()">
                      ${['Não Informado', 'Não', 'Sim'].map(x => `<option value="${x}" ${c.mov_fin?.oe_cons === x ? 'selected' : ''}>${x}</option>`).join('')}
                  </select></div>
                  <div class="form-group"><label>Operações em moeda estrangeira?</label><select id="mf_oe_moeda" onchange="updateMovFinanceiraAlerts()">
                      ${['Não Informado', 'Não', 'Sim'].map(x => `<option value="${x}" ${c.mov_fin?.oe_moeda === x ? 'selected' : ''}>${x}</option>`).join('')}
                  </select></div>
                  <div class="form-group"><label>Recebimentos via PIX estruturado?</label><select id="mf_oe_pix" onchange="updateMovFinanceiraAlerts()">
                      ${['Não Informado', 'Não', 'Sim'].map(x => `<option value="${x}" ${c.mov_fin?.oe_pix === x ? 'selected' : ''}>${x}</option>`).join('')}
                  </select></div>
                  <div class="form-group"><label>Subvenções / incentivos financeiros?</label><select id="mf_oe_subv" onchange="updateMovFinanceiraAlerts()">
                      ${['Não Informado', 'Não', 'Sim'].map(x => `<option value="${x}" ${c.mov_fin?.oe_subv === x ? 'selected' : ''}>${x}</option>`).join('')}
                  </select></div>
                  <div class="form-group"><label>Criptomoedas?</label><select id="mf_oe_cripto" onchange="updateMovFinanceiraAlerts()">
                      ${['Não Informado', 'Não', 'Sim'].map(x => `<option value="${x}" ${c.mov_fin?.oe_cripto === x ? 'selected' : ''}>${x}</option>`).join('')}
                  </select></div>
                </div>

                <div>
                  <strong style="display:block;font-size:12px;margin-bottom:12px;color:var(--warning)">⚠️ Situações de Atenção Contábil</strong>
                  <div class="form-group"><label>Conta pessoal misturada com PJ?</label><select id="mf_sa_mistura" onchange="updateMovFinanceiraAlerts()">
                      ${['Não Informado', 'Não', 'Sim'].map(x => `<option value="${x}" ${c.mov_fin?.sa_mistura === x ? 'selected' : ''}>${x}</option>`).join('')}
                  </select></div>
                  <div class="form-group"><label>Falta de extratos completos?</label><select id="mf_sa_faltacomp" onchange="updateMovFinanceiraAlerts()">
                      ${['Não Informado', 'Não', 'Sim'].map(x => `<option value="${x}" ${c.mov_fin?.sa_faltacomp === x ? 'selected' : ''}>${x}</option>`).join('')}
                  </select></div>
                  <div class="form-group"><label>Movimentação não identificada?</label><select id="mf_sa_naoident" onchange="updateMovFinanceiraAlerts()">
                      ${['Não Informado', 'Não', 'Sim'].map(x => `<option value="${x}" ${c.mov_fin?.sa_naoident === x ? 'selected' : ''}>${x}</option>`).join('')}
                  </select></div>
                  <div class="form-group"><label>Alto volume de saques?</label><select id="mf_sa_saque" onchange="updateMovFinanceiraAlerts()">
                      ${['Não Informado', 'Não', 'Sim'].map(x => `<option value="${x}" ${c.mov_fin?.sa_saque === x ? 'selected' : ''}>${x}</option>`).join('')}
                  </select></div>
                  <div class="form-group"><label>Uso de múltiplas contas sem controle?</label><select id="mf_sa_multi" onchange="updateMovFinanceiraAlerts()">
                      ${['Não Informado', 'Não', 'Sim'].map(x => `<option value="${x}" ${c.mov_fin?.sa_multi === x ? 'selected' : ''}>${x}</option>`).join('')}
                  </select></div>
                </div>

             </div>

             <!-- ALERT CONTAINER -->
             <div id="mf_alerta" style="padding:16px;border-radius:8px;background:#fff;border:1px solid #cbd5e1;font-size:12px;color:var(--text);box-shadow:var(--shadow)">
               ⚠️ Preencha o mapeamento acima para gerar um diagnóstico automático.
             </div>
          </div>
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
          <div style="background:#f8fafc;padding:16px;border-radius:8px;border:1px solid var(--border);">
            <div class="cards-grid" style="grid-template-columns:1fr 1fr;gap:20px;">
               <!-- BLOCO 1 E BLOCO 4 -->
               <div style="display:flex;flex-direction:column;gap:16px;">
                  <div>
                    <h3 style="font-size:13px;color:var(--primary-dark);margin-bottom:8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px">👥 BLOCO 1 — Estrutura Trabalhista</h3>
                    <div class="checkbox-group" style="display:flex;flex-direction:column;gap:4px">
                       <label style="font-size:12px"><input type="checkbox" id="tr_tem_folha" onchange="runTrabDiagnosis()" ${c.tem_folha?'checked':''}> Possui funcionários ativos?</label>
                       <div style="margin-left:24px;margin-bottom:6px;display:flex;align-items:center;gap:8px">
                          <span style="font-size:11px">Quantidade:</span>
                          <input type="number" id="tr_qtd_func" value="${c.trab?.qtd_func || c.qtd_funcionarios || ''}" onchange="runTrabDiagnosis()" style="width:60px;padding:2px 4px;font-size:11px;border:1px solid #ccc;border-radius:4px" placeholder="0">
                       </div>
                       <label style="font-size:12px"><input type="checkbox" id="tr_tem_prol" onchange="runTrabDiagnosis()" ${c.tem_prolabore?'checked':''}> Possui sócios com pró-labore?</label>
                       <label style="font-size:12px;margin-left:16px;color:#475569"><input type="checkbox" id="tr_tem_retirada" onchange="runTrabDiagnosis()" ${c.trab?.tem_retirada?'checked':''}> Há questionamento/definição sobre a retirada de pró-labore?</label>
                       <label style="font-size:12px"><input type="checkbox" id="tr_tem_aut" onchange="runTrabDiagnosis()" ${c.trab?.tem_aut?'checked':''}> Possui autônomos/RPA?</label>
                       <label style="font-size:12px"><input type="checkbox" id="tr_tem_estag" onchange="runTrabDiagnosis()" ${c.trab?.tem_estag?'checked':''}> Possui estagiários?</label>
                    </div>
                  </div>
                  <div>
                    <h3 style="font-size:13px;color:var(--primary-dark);margin-bottom:8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px">📁 BLOCO 4 — Documentação</h3>
                    <div class="checkbox-group" style="display:flex;flex-direction:column;gap:4px">
                       <label style="font-size:12px"><input type="checkbox" id="tr_doc_soc" onchange="runTrabDiagnosis()" ${c.trab?.doc_soc?'checked':''}> Contratos Sociais e Alterações disponíveis?</label>
                       <label style="font-size:12px"><input type="checkbox" id="tr_doc_contr" onchange="runTrabDiagnosis()" ${c.trab?.doc_contr?'checked':''}> Contratos de trabalho disponíveis?</label>
                       <label style="font-size:12px"><input type="checkbox" id="tr_doc_ponto" onchange="runTrabDiagnosis()" ${c.trab?.doc_ponto?'checked':''}> Controle de ponto vigente?</label>
                       <label style="font-size:12px"><input type="checkbox" id="tr_doc_folha" onchange="runTrabDiagnosis()" ${c.trab?.doc_folha?'checked':''}> Folha assinada eletrônica ou física?</label>
                       <label style="font-size:12px"><input type="checkbox" id="tr_doc_recibo" onchange="runTrabDiagnosis()" ${c.trab?.doc_recibo?'checked':''}> Recibos de pró/férias organizados?</label>
                    </div>
                  </div>
               </div>

               <!-- BLOCO 2 E BLOCO 3 -->
               <div style="display:flex;flex-direction:column;gap:16px;">
                  <div>
                    <h3 style="font-size:13px;color:var(--primary-dark);margin-bottom:8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px">📅 BLOCO 2 — Obrigações e Rotinas</h3>
                    <div class="checkbox-group" style="display:flex;flex-direction:column;gap:6px">
                       <label style="font-size:12px;font-weight:600;margin-bottom:2px"><input type="checkbox" id="tr_folha_proc" onchange="runTrabDiagnosis()" ${c.trab?.folha_proc?'checked':''}> Folha de pagamento processada regularmente?</label>
                       <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px">
                          <span>Envio eSocial:</span>
                          <select id="tr_esoc_st" style="border:1px solid #ccc;border-radius:4px;padding:2px 4px" onchange="runTrabDiagnosis()">
                            <option ${c.trab?.esoc_st==='Regular'?'selected':''}>Regular</option><option ${c.trab?.esoc_st==='Em atraso'?'selected':''}>Em atraso</option><option ${c.trab?.esoc_st==='Não enviado'?'selected':''}>Não enviado</option>
                          </select>
                       </div>
                       <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px">
                          <span>GFIP/FGTS:</span>
                          <select id="tr_fgts_st" style="border:1px solid #ccc;border-radius:4px;padding:2px 4px" onchange="runTrabDiagnosis()">
                            <option ${c.trab?.fgts_st==='Regular'?'selected':''}>Regular</option><option ${c.trab?.fgts_st==='Em atraso'?'selected':''}>Em atraso</option>
                          </select>
                       </div>
                       <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px">
                          <span>INSS Patronal/Retic:</span>
                          <select id="tr_inss_st" style="border:1px solid #ccc;border-radius:4px;padding:2px 4px" onchange="runTrabDiagnosis()">
                            <option ${c.trab?.inss_st==='Regular'?'selected':''}>Regular</option><option ${c.trab?.inss_st==='Em atraso'?'selected':''}>Em atraso</option>
                          </select>
                       </div>
                       <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px">
                          <span>SST (Segurança Trab):</span>
                          <select id="tr_sst_st" style="border:1px solid #ccc;border-radius:4px;padding:2px 4px" onchange="runTrabDiagnosis()">
                            <option ${c.trab?.sst_st==='Pendente'?'selected':''}>Pendente</option><option ${c.trab?.sst_st==='Implantado'?'selected':''}>Implantado</option>
                          </select>
                       </div>
                    </div>
                  </div>
                  <div>
                    <h3 style="font-size:13px;color:var(--danger);margin-bottom:8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px">⚠️ BLOCO 3 — Risco Trabalhista</h3>
                    <div class="checkbox-group" style="display:flex;flex-direction:column;gap:4px">
                       <label style="font-size:12px"><input type="checkbox" id="tr_r_sem_reg" onchange="runTrabDiagnosis()" ${c.trab?.r_sem_reg?'checked':''}> Indícios de funcionário sem registro?</label>
                       <label style="font-size:12px"><input type="checkbox" id="tr_r_atraso" onchange="runTrabDiagnosis()" ${c.trab?.r_atraso?'checked':''}> Recusa ou atrasos sistêmicos de folha?</label>
                       <label style="font-size:12px"><input type="checkbox" id="tr_r_prol_sem" onchange="runTrabDiagnosis()" ${c.trab?.r_prol_sem?'checked':''}> Sócios c/ pró-labore irregular/sem retirada?</label>
                       <label style="font-size:12px"><input type="checkbox" id="tr_r_div_esoc" onchange="runTrabDiagnosis()" ${c.trab?.r_div_esoc?'checked':''}> Divergências entre sistema DP x eSocial?</label>
                    </div>
                  </div>
               </div>
            </div>

            <!-- BLOCO 5 e 6 (DIAGNÓSTICO AUTOMÁTICO) -->
            <div style="margin-top:20px;">
               <h3 style="font-size:13px;color:var(--primary-dark);margin-bottom:8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px">🧠 BLOCO 5 e 6 — Diagnóstico Automático e Ações</h3>
               <div id="tr_alerta" style="padding:16px;border-radius:8px;background:#fff;border-left:4px solid var(--warning);font-size:13px;color:var(--text);box-shadow:var(--shadow)">
                 Preencha as informações acima para processar a análise trabalhista e disparar as ações.
               </div>
            </div>
          </div>
        </div>

        <div id="tab-situacao-fiscal" class="tab-panel">
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:16px;display:flex;gap:20px;align-items:center">
            <div style="min-width:140px;text-align:center;border-right:1px solid #e2e8f0;padding-right:16px">
              <div style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:700">Risco Fiscal Global</div>
              <div style="font-size:16px;font-weight:bold;color:${riscoColor}" id="diag_risco_val_sf">${risco}</div>
            </div>
            <div style="flex:1;margin-left:20px">
              <div style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:700;margin-bottom:4px">Última Competência Analisada</div>
              <input id="f-ultima-comp" value="${c.d_ultima_comp||''}" placeholder="Ex: Fev/2026" style="width:100%;max-width:200px;font-size:12px;padding:6px;border:1px solid #ccc;border-radius:4px;outline:none">
            </div>
          </div>
          <h4 style="margin-bottom:12px;font-size:12px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;text-transform:uppercase;color:#475569">SITUAÇÃO FISCAL / DÉBITOS</h4>
          <div class="cards-grid" style="grid-template-columns:1fr 1fr;gap:24px">
             <div>
                ${renderDiagRow('d_div_rfb', 'Dívida RFB', d_div_rfb)}
                ${renderDiagRow('d_div_pgfn', 'Dívida PGFN', d_div_pgfn)}
             </div>
             <div>
                ${renderDiagRow('d_div_est', 'Dívida Estadual', d_div_est)}
                ${renderDiagRow('d_div_pref', 'Dívida Municipal', d_div_pref)}
             </div>
          </div>
          <div class="form-group mt-4"><label>Observações do Diagnóstico (Passivos)</label><textarea id="f-obs-diag" style="min-height:70px;border-radius:6px">${c.obs_diag||''}</textarea></div>
        </div>

        <div id="tab-obrigacoes" class="tab-panel">
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;margin-bottom:16px;display:flex;gap:20px;align-items:center">
             <div style="font-size:13px;color:#1e40af">Esta aba gerencia as entregas acessórias. Pendências aqui elevam o <strong>Risco Fiscal global</strong> do cliente, geram alertas, porém NÃO exigem upload de documentação contábil na matriz.</div>
          </div>
          <h4 style="margin-bottom:12px;font-size:12px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;text-transform:uppercase;color:#475569">OBRIGAÇÕES ACESSÓRIAS / DECLARAÇÕES</h4>
          <div class="cards-grid" style="grid-template-columns:1fr 1fr;gap:24px">
            <div>
              ${renderDiagRow('d_sped_f', 'SPED Fiscal', d_sped_f)}
              ${renderDiagRow('d_sped_c', 'SPED Contribuições', d_sped_c)}
              ${renderDiagRow('d_ecd', 'ECD', d_ecd)}
              ${renderDiagRow('d_ecf', 'ECF', d_ecf)}
              ${renderDiagRow('d_dctfweb', 'DCTFWEB', d_dctfweb)}
            </div>
            <div>
              ${renderDiagRow('d_defis', 'DEFIS', d_defis)}
              ${renderDiagRow('d_dasnmei', 'DASNMEI', d_dasnmei)}
              ${renderDiagRow('d_simples', 'PGDAS', d_simples)}
              ${renderDiagRow('d_dime', 'DIME', d_dime)}
              ${renderDiagRow('d_gia', 'GIA', d_gia)}
            </div>
          </div>
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
      const STATUS_OBG = ['pendente','solicitado','verificar','concluido','cliente_nao_possui','nao_disponibilizado'];
      const statusLabel = {pendente:'Pendente',solicitado:'Solicitado',verificar:'Verificar',concluido:'Concluído',cliente_nao_possui:'Cliente Não Possui',nao_disponibilizado:'Não disponibilizado'};

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
  setTimeout(() => {
    if(typeof window.autoClassifyITG === 'function') window.autoClassifyITG();
    if(typeof runITGDiagnosis === 'function') runITGDiagnosis();
    if(typeof updateMovFinanceiraAlerts === 'function') updateMovFinanceiraAlerts();
    if(typeof runTrabDiagnosis === 'function') runTrabDiagnosis();
    if(typeof window.runDiagAlerts === 'function') window.runDiagAlerts();
    if(typeof window.handleTipoOperacaoChange === 'function') window.handleTipoOperacaoChange();
    if(typeof window.handleCaixaBancosChange === 'function') window.handleCaixaBancosChange();
  }, 50);
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
    drive_url: (document.getElementById('f-drive-url')||{}).value||'',
    responsavel: document.getElementById('f-resp').value,
    whatsapp: document.getElementById('f-wapp').value,
    email: document.getElementById('f-email').value,
    im: document.getElementById('f-im').value,
    ie: document.getElementById('f-ie').value,
    fat_medio: document.getElementById('f-fat').value,
    qtd_socios: document.getElementById('f-socios').value,
    obs: document.getElementById('f-obs').value,
    obs_diag: document.getElementById('f-obs-diag').value,
    tem_prolabore: document.getElementById('tr_tem_prol')?.checked || false,
    tem_folha: document.getElementById('tr_tem_folha')?.checked || false,
    trab: {
        qtd_func: document.getElementById('tr_qtd_func')?.value || '',
        tem_aut: document.getElementById('tr_tem_aut')?.checked,
        tem_estag: document.getElementById('tr_tem_estag')?.checked,
        tem_retirada: document.getElementById('tr_tem_retirada')?.checked,
        folha_proc: document.getElementById('tr_folha_proc')?.checked,
        esoc_st: document.getElementById('tr_esoc_st')?.value,
        fgts_st: document.getElementById('tr_fgts_st')?.value,
        inss_st: document.getElementById('tr_inss_st')?.value,
        sst_st: document.getElementById('tr_sst_st')?.value,
        r_sem_reg: document.getElementById('tr_r_sem_reg')?.checked,
        r_atraso: document.getElementById('tr_r_atraso')?.checked,
        r_prol_sem: document.getElementById('tr_r_prol_sem')?.checked,
        r_div_esoc: document.getElementById('tr_r_div_esoc')?.checked,
        doc_soc: document.getElementById('tr_doc_soc')?.checked,
        doc_contr: document.getElementById('tr_doc_contr')?.checked,
        doc_ponto: document.getElementById('tr_doc_ponto')?.checked,
        doc_folha: document.getElementById('tr_doc_folha')?.checked,
        doc_recibo: document.getElementById('tr_doc_recibo')?.checked,
    },
    bancos, banco_outro: (document.getElementById('f-banco-outro')||{}).value||'',
    parc_federal: document.getElementById('f-parc-fed')?.checked || false,
    parc_estadual: document.getElementById('f-parc-est')?.checked || false,
    parc_pref: document.getElementById('f-parc-pref')?.checked || false,
    parc_pgfn: document.getElementById('f-parc-pgfn')?.checked || false,
    d_simples: { status: (document.getElementById('d_simples-st')||{}).value||'', comp: (document.getElementById('d_simples-comp')||{}).value||'' },
    d_sped_f: { status: (document.getElementById('d_sped_f-st')||{}).value||'', comp: (document.getElementById('d_sped_f-comp')||{}).value||'' },
    d_sped_c: { status: (document.getElementById('d_sped_c-st')||{}).value||'', comp: (document.getElementById('d_sped_c-comp')||{}).value||'' },
    d_ecd: { status: (document.getElementById('d_ecd-st')||{}).value||'', comp: (document.getElementById('d_ecd-comp')||{}).value||'' },
    d_ecf: { status: (document.getElementById('d_ecf-st')||{}).value||'', comp: (document.getElementById('d_ecf-comp')||{}).value||'' },
    d_defis: { status: (document.getElementById('d_defis-st')||{}).value||'', comp: (document.getElementById('d_defis-comp')||{}).value||'' },
    d_dasnmei: { status: (document.getElementById('d_dasnmei-st')||{}).value||'', comp: (document.getElementById('d_dasnmei-comp')||{}).value||'' },
    d_dctfweb: { status: (document.getElementById('d_dctfweb-st')||{}).value||'', comp: (document.getElementById('d_dctfweb-comp')||{}).value||'' },
    d_dime: { status: (document.getElementById('d_dime-st')||{}).value||'', comp: (document.getElementById('d_dime-comp')||{}).value||'' },
    d_gia: { status: (document.getElementById('d_gia-st')||{}).value||'', comp: (document.getElementById('d_gia-comp')||{}).value||'' },
    d_div_rfb: { status: (document.getElementById('d_div_rfb-st')||{}).value||'', comp: (document.getElementById('d_div_rfb-comp')||{}).value||'' },
    d_div_pgfn: { status: (document.getElementById('d_div_pgfn-st')||{}).value||'', comp: (document.getElementById('d_div_pgfn-comp')||{}).value||'' },
    d_div_est: { status: (document.getElementById('d_div_est-st')||{}).value||'', comp: (document.getElementById('d_div_est-comp')||{}).value||'' },
    d_div_pref: { status: (document.getElementById('d_div_pref-st')||{}).value||'', comp: (document.getElementById('d_div_pref-comp')||{}).value||'' },
    d_ultima_comp: (document.getElementById('f-ultima-comp')||{}).value||'',
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
    ci_cx_freq: (document.getElementById('ci_cx_freq')||{}).value,
    ci_banco_possui: (document.getElementById('ci_banco_possui')||{}).value || 'Sim',
    ci_banco_forma: (document.getElementById('ci_banco_forma')||{}).value,
    ci_banco_sit: (document.getElementById('ci_banco_sit')||{}).value,
    
    ci_bens_reg: (document.getElementById('ci_bens_reg')||{}).value,
    ci_bens_depr: (document.getElementById('ci_bens_depr')||{}).value,
    ci_bens_inv: (document.getElementById('ci_bens_inv')||{}).value,
    ci_bens_freq: (document.getElementById('ci_bens_freq')||{}).value,
    ci_doc_org: (document.getElementById('ci_doc_org')||{}).value,
    ci_doc_forma: (document.getElementById('ci_doc_forma')||{}).value,
    ci_doc_padrao: (document.getElementById('ci_doc_padrao')||{}).value,
    ci_doc_chk: (document.getElementById('ci_doc_chk')||{}).value,
    ci_proc_rotina: (document.getElementById('ci_proc_rotina')||{}).value,
    ci_est_freq: (document.getElementById('ci_est_freq')||{}).value,
    ci_est_integra: (document.getElementById('ci_est_integra')||{}).value,
    ci_bens_possui: (document.getElementById('ci_bens_possui')||{}).value,
    ci_proc_seg: (document.getElementById('ci_proc_seg')||{}).value,
    ci_itg_tipo: (document.getElementById('ci_itg_tipo')||{}).value,
    ci_itg_porte: (document.getElementById('ci_itg_porte')||{}).value,
    ci_itg_complex: (document.getElementById('ci_itg_complex')||{}).value,
    ci_itg_finalidade: (document.getElementById('ci_itg_finalidade')||{}).value,
    ci_itg_norma_calc: (document.getElementById('ci_itg_norma_calc')||{}).value,
    ci_itg_risco_calc: (document.getElementById('ci_itg_risco_calc')||{}).value,
    ci_receita_anual: (document.getElementById('ci_receita_anual')||{}).value || '',
    ci_ativo_total: (document.getElementById('ci_ativo_total')||{}).value || '',
    ci_nat_juridica: (document.getElementById('ci_nat_juridica')||{}).value || '',
    ci_tem_auditoria: (document.getElementById('ci_tem_auditoria')||{}).value || 'Não',
    ci_investidores: (document.getElementById('ci_investidores')||{}).value || 'Não',
    ci_cx_estoque: document.getElementById('ci_cx_estoque')?.checked || false,
    ci_cx_financ: document.getElementById('ci_cx_financ')?.checked || false,
    ci_cx_unidades: document.getElementById('ci_cx_unidades')?.checked || false,
    ci_cx_folha: document.getElementById('ci_cx_folha')?.checked || false,
    ci_cx_planej: document.getElementById('ci_cx_planej')?.checked || false,
    ci_cx_externo: document.getElementById('ci_cx_externo')?.checked || false,
    ...(() => {
        let mf = {};
        ['ob_simples','ob_alto_vol','ob_transf','cc_maq','cc_corp','cc_antec','cc_multi',
         'ef_banc','ef_finan','ef_capgiro','ef_reneg','ia_auto','ia_fundo','ia_td','ia_conta','ia_cap','ia_outras',
         'oe_cons','oe_moeda','oe_pix','oe_subv','oe_cripto','sa_mistura','sa_faltacomp','sa_naoident','sa_saque','sa_multi'].forEach(id => {
            mf[id] = document.getElementById('mf_'+id) ? document.getElementById('mf_'+id).value === 'Sim' : false;
        });
        return { mov_fin: mf };
    })(),
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

window.runITGDiagnosis = () => {
    const tipo = document.getElementById('ci_itg_tipo')?.value || '';
    const porteOverride = document.getElementById('ci_itg_porte')?.value || '';
    const finalidade = document.getElementById('ci_itg_finalidade')?.value || '';
    const temAuditoria = document.getElementById('ci_tem_auditoria')?.value === 'Sim';
    const temInvestidores = document.getElementById('ci_investidores')?.value === 'Sim';
    const natJuridica = document.getElementById('ci_nat_juridica')?.value || '';

    // ETAPA 1: Receita e Ativo para porte automático
    const parseNum = v => parseFloat((v||'').replace(/[^\d.,]/g,'').replace(/\./g,'').replace(',','.')) || 0;
    const receita = parseNum(document.getElementById('ci_receita_anual')?.value);
    const ativo = parseNum(document.getElementById('ci_ativo_total')?.value);

    let porteAuto = '—';
    if (ativo > 240000000 || receita > 300000000) porteAuto = 'Grande Porte';
    else if (receita > 4800000) porteAuto = 'Médio Porte';
    else if (receita > 360000) porteAuto = 'Empresa de Pequeno Porte (EPP)';
    else if (receita > 0) porteAuto = 'Microempresa (ME)';

    const porteEl = document.getElementById('ci_porte_auto');
    if (porteEl && receita > 0) {
      porteEl.style.display = 'block';
      porteEl.innerHTML = `📊 Porte calculado pela receita: <strong>${porteAuto}</strong>${ativo > 0 ? ' · Ativo: R$ '+ativo.toLocaleString('pt-BR') : ''}`;
    }

    // Porte efetivo (override manual ou automático)
    const porte = (porteOverride && porteOverride !== '— Automático —') ? porteOverride : porteAuto;

    // ETAPA 2: Score de complexidade
    const cxFields = ['ci_cx_estoque','ci_cx_financ','ci_cx_unidades','ci_cx_folha','ci_cx_planej','ci_cx_externo'];
    let score = 0;
    cxFields.forEach(id => { if (document.getElementById(id)?.checked) score++; });
    const complexidade = score >= 5 ? 'Alta' : score >= 3 ? 'Média' : 'Baixa';

    const scoreEl = document.getElementById('ci_score_display');
    const scoreColors = { Baixa:'#10b981', Média:'#f59e0b', Alta:'#ef4444' };
    if (scoreEl) scoreEl.innerHTML = `Score: <strong>${score}/6</strong> — Complexidade: <strong style="color:${scoreColors[complexidade]}">${complexidade}</strong>`;

    // Guardar complexidade no hidden
    const cxHidden = document.getElementById('ci_itg_complex');
    if (cxHidden) cxHidden.value = complexidade;

    // ETAPA 3: Motor de decisão
    let norma = 'A Definir', nivelTecnico = '', tipoEntrega = '';
    let riscoColor = '#94a3b8', risco = 'A Definir';

    // Entidades especiais
    if (tipo === 'Cooperativa') {
      norma = 'ITG 2004 (+ ITG 2000)'; nivelTecnico = 'Avançado'; tipoEntrega = 'Estratégico';
      risco = '🔴 Alto'; riscoColor = '#ef4444';
    } else if (tipo.includes('sem fins')) {
      norma = 'ITG 2002'; nivelTecnico = complexidade === 'Alta' ? 'Avançado' : 'Intermediário';
      tipoEntrega = complexidade === 'Alta' ? 'Estratégico' : 'Gerencial';
      risco = complexidade === 'Alta' ? '🔴 Alto' : '🟡 Médio';
      riscoColor = complexidade === 'Alta' ? '#ef4444' : '#f59e0b';
    }
    // Grande porte ou auditada
    else if (porte.includes('Grande') || temAuditoria || natJuridica.includes('S.A.')) {
      norma = 'CPC Completo (IFRS Full)'; nivelTecnico = 'Avançado'; tipoEntrega = 'Estratégico';
      risco = '🔴 Alto'; riscoColor = '#ef4444';
    }
    // Média empresa
    else if (porte.includes('Médio')) {
      norma = 'CPC PME (NBC TG 1000)'; nivelTecnico = 'Intermediário'; tipoEntrega = 'Gerencial';
      risco = '🟡 Médio'; riscoColor = '#f59e0b';
    }
    // ME/EPP com complexidade alta/média → CPC PME
    else if ((porte.includes('ME') || porte.includes('EPP') || porte.includes('Pequeno')) && (complexidade === 'Alta' || complexidade === 'Média')) {
      norma = 'CPC PME (NBC TG 1000)'; nivelTecnico = 'Intermediário'; tipoEntrega = 'Gerencial';
      risco = '🟡 Médio'; riscoColor = '#f59e0b';
    }
    // ME/EPP com baixa complexidade
    else if (porte.includes('ME') || porte.includes('EPP') || porte.includes('Pequeno') || porte.includes('Micro')) {
      norma = 'ITG 1000'; nivelTecnico = 'Simplificado'; tipoEntrega = 'Operacional';
      risco = '🟢 Baixo'; riscoColor = '#10b981';
    }
    // Finalidade consultiva override
    if (finalidade.includes('Tomada de Decisão') && norma === 'ITG 1000') {
      norma = 'CPC PME (NBC TG 1000)'; nivelTecnico = 'Intermediário'; tipoEntrega = 'Gerencial';
      risco = '🟡 Médio'; riscoColor = '#f59e0b';
    }
    // Investidores externos forçam upgrade
    if (temInvestidores && !norma.includes('CPC Completo')) {
      norma = 'CPC PME (NBC TG 1000)'; nivelTecnico = 'Intermediário'; tipoEntrega = 'Gerencial';
      if (risco === '🟢 Baixo') { risco = '🟡 Médio'; riscoColor = '#f59e0b'; }
    }

    // Grava nos campos
    const nf = document.getElementById('ci_itg_norma_calc');
    const rf = document.getElementById('ci_itg_risco_calc');
    if(nf) nf.value = norma;
    if(rf) rf.value = risco;

    const divAlerta = document.getElementById('ci_alerta_itg');
    const divRisco = document.getElementById('ci_risco_display');
    if(!divAlerta) return;

    if(divRisco) { divRisco.innerHTML = `${risco}`; divRisco.style.background = riscoColor; }

    let msg = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">`;
    msg += `<div style="background:#f0f9ff;padding:8px 12px;border-radius:6px;border:1px solid #bae6fd">
      <div style="font-size:10px;font-weight:700;color:#0369a1;text-transform:uppercase">Porte</div>
      <div style="font-size:14px;font-weight:800;color:#0f172a">${porte || '—'}</div>
    </div>`;
    msg += `<div style="background:#f0f9ff;padding:8px 12px;border-radius:6px;border:1px solid #bae6fd">
      <div style="font-size:10px;font-weight:700;color:#0369a1;text-transform:uppercase">Norma Aplicável</div>
      <div style="font-size:14px;font-weight:800;color:#0f172a">${norma}</div>
    </div>`;
    msg += `<div style="background:#f0f9ff;padding:8px 12px;border-radius:6px;border:1px solid #bae6fd">
      <div style="font-size:10px;font-weight:700;color:#0369a1;text-transform:uppercase">Nível Técnico</div>
      <div style="font-size:14px;font-weight:800;color:#0f172a">${nivelTecnico || '—'}</div>
    </div>`;
    msg += `<div style="background:#f0f9ff;padding:8px 12px;border-radius:6px;border:1px solid #bae6fd">
      <div style="font-size:10px;font-weight:700;color:#0369a1;text-transform:uppercase">Tipo de Entrega</div>
      <div style="font-size:14px;font-weight:800;color:#0f172a">${tipoEntrega || '—'}</div>
    </div></div>`;

    // Alertas de risco
    if (complexidade === 'Alta' && finalidade.includes('Cumprimento')) {
      msg += `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:8px 12px;font-size:12px;color:#991b1b;margin-top:8px">
        🚨 <strong>Sinal Vermelho:</strong> Alta complexidade com finalidade apenas fiscal. Forte risco operacional — considere migração para CPC PME.
      </div>`;
    }
    if (norma === 'ITG 1000' && finalidade.includes('Tomada de Decisão')) {
      msg += `<div style="background:#fefce8;border:1px solid #fde68a;border-radius:6px;padding:8px 12px;font-size:12px;color:#92400e;margin-top:8px">
        💡 <strong>Oportunidade:</strong> Cliente busca inteligência gerencial. Elevar para CPC PME agrega valor e justifica precificação premium.
      </div>`;
    }
    if (temInvestidores) {
      msg += `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:8px 12px;font-size:12px;color:#1e40af;margin-top:8px">
        📈 <strong>Investidores Externos:</strong> Demonstrações contábeis robustas são obrigatórias para suportar due diligence e compliance.
      </div>`;
    }

    divAlerta.innerHTML = msg;
    divAlerta.style.borderLeftColor = riscoColor;
};

window.autoClassifyITG = () => {
    const nome = (document.getElementById('f-nome')?.value || '').toLowerCase();
    const regime = document.getElementById('f-regime')?.value || '';
    const comp = document.getElementById('f-comp')?.value || '';
    
    const itgTipo = document.getElementById('ci_itg_tipo');
    const itgPorte = document.getElementById('ci_itg_porte');
    const itgComplex = document.getElementById('ci_itg_complex');

    if (!itgTipo || !itgPorte || !itgComplex) return;

    // 1. Tipo de Entidade
    if (nome.includes('cooperativa') || nome.includes('coop.')) {
        itgTipo.value = 'Cooperativa';
    } else if (nome.includes('associacao') || nome.includes('associação') || nome.includes('instituto') || nome.includes('igreja') || nome.includes('sindicato') || nome.includes('ong')) {
        itgTipo.value = 'Entidade sem fins lucrativos (Terceiro Setor)';
    } else if (regime === 'Simples Nacional' || regime === 'MEI') {
        itgTipo.value = 'Simples Nacional';
    } else if (regime === 'Lucro Presumido' || regime === 'Lucro Real') {
        itgTipo.value = 'Empresa com fins lucrativos';
    }

    // 2. Porte (Inferência básica pelo regime/complexidade se aplicável)
    if (regime === 'MEI') itgPorte.value = 'Microempresa (ME)';
    else if (regime === 'Lucro Real') itgPorte.value = 'Grande Porte';
    else if (comp === 'Alta' && regime !== 'Simples Nacional') itgPorte.value = 'Médio Porte';

    // 3. Complexidade Operacional
    if (comp === 'Simples') {
        itgComplex.value = 'Baixa (Sem estoque relevante, sem financiamento, rotina simples)';
    } else if (comp === 'Intermediário') {
        itgComplex.value = 'Média (Com estoque, controle financeiro ativo, dívidas estruturadas)';
    } else if (comp === 'Alta') {
        itgComplex.value = 'Alta (Financiamentos, Crescimento Acelerado, Auditoria)';
    }

    // Dispara a revalidação da Norma ITG automaticamente
    if (typeof runITGDiagnosis === 'function') runITGDiagnosis();
};

window.handleTipoOperacaoChange = () => {
    const tipo = document.getElementById('f-tipo')?.value || '';
    
    const fields = [
        { id: 'ci_est_possui', val: 'Não se aplica' },
        { id: 'ci_est_tipo', val: 'N/A' },
        { id: 'ci_est_inv', val: 'N/A' },
        { id: 'ci_est_freq', val: 'N/A' },
        { id: 'ci_est_integra', val: 'N/A' }
    ];

    fields.forEach(f => {
        const el = document.getElementById(f.id);
        if (!el) return;
        
        if (tipo === 'Serviço') {
            el.value = f.val;
            el.setAttribute('disabled', 'true');
            el.style.backgroundColor = '#f1f5f9';
        } else {
            el.removeAttribute('disabled');
            el.style.backgroundColor = '';
        }
    });
};

window.handleCaixaBancosChange = () => {
    const cxPossui = document.getElementById('ci_cx_possui');
    const cxFreq = document.getElementById('ci_cx_freq');
    if (cxPossui && cxFreq) {
        if (cxPossui.value === 'Não possui' || cxPossui.value === 'Controle manual (caderno/planilha)') {
            cxFreq.value = 'N/A';
            cxFreq.setAttribute('disabled', 'true');
            cxFreq.style.backgroundColor = '#f8fafc';
        } else {
            cxFreq.removeAttribute('disabled');
            cxFreq.style.backgroundColor = '';
        }
    }
    const bPossui = document.getElementById('ci_banco_possui');
    const bForma = document.getElementById('ci_banco_forma');
    const bSit = document.getElementById('ci_banco_sit');
    if (bPossui && bForma && bSit) {
        if (bPossui.value === 'Não') {
            bForma.value = 'N/A';
            bSit.value = 'N/A';
            bForma.setAttribute('disabled', 'true');
            bSit.setAttribute('disabled', 'true');
            bForma.style.backgroundColor = '#f8fafc';
            bSit.style.backgroundColor = '#f8fafc';
        } else {
            bForma.removeAttribute('disabled');
            bSit.removeAttribute('disabled');
            bForma.style.backgroundColor = '';
            bSit.style.backgroundColor = '';
        }
    }
};

window.runDiagAlerts = () => {
    const keys = ['d_sped_f','d_sped_c','d_ecd','d_ecf','d_defis','d_dasnmei','d_simples','d_div_rfb','d_div_pgfn','d_div_est','d_div_pref'];
    let count = 0;
    keys.forEach(k => {
        const el = document.getElementById(k+'-st');
        if (el && el.value === 'Pendente') count++;
    });
    
    let risco = count > 5 ? 'Alto' : count > 0 ? 'Médio' : 'Baixo';
    let riscoColor = count > 5 ? '#ef4444' : count > 0 ? '#eab308' : '#22c55e';
    
    const countEl = document.getElementById('diag_total_pend');
    if (countEl) countEl.innerHTML = count;
    
    const riscoEl = document.getElementById('diag_risco_val');
    if (riscoEl) { 
       riscoEl.innerHTML = risco;
       riscoEl.style.color = riscoColor;
    }
};

window.runTrabDiagnosis = () => {
    // Collect variables
    const isActive = document.getElementById('tr_tem_folha')?.checked || false;
    const qtdFunc = parseInt(document.getElementById('tr_qtd_func')?.value || '0', 10);
    const hasProlabore = document.getElementById('tr_tem_prol')?.checked || false;
    const hasAutonomo = document.getElementById('tr_tem_aut')?.checked || false;
    
    const esoc = document.getElementById('tr_esoc_st')?.value || 'Regular';
    const sst = document.getElementById('tr_sst_st')?.value || 'Pendente';
    
    const rReg = document.getElementById('tr_r_sem_reg')?.checked;
    const rAtraso = document.getElementById('tr_r_atraso')?.checked;
    const rProlSem = document.getElementById('tr_r_prol_sem')?.checked;
    const rDivEsoc = document.getElementById('tr_r_div_esoc')?.checked;

    let riscoNivel = '🟢 Baixo';
    let riscoColor = 'var(--success-dark)';
    let msgs = [];
    let acoes = [];

    // Lógica Inteligente Trabalhista
    if (isActive) {
        msgs.push(`Empresa ativa com <b>${qtdFunc} funcionário(s)</b>.`);
        if (sst === 'Pendente') {
            riscoNivel = '🔴 Alto'; riscoColor = 'var(--danger)';
            msgs.push('🚨 Atenção: SST Pendente com funcionários ativos configurando risco iminente de autuação/multa na Receita Federal.');
            acoes.push('Implantar SST / Adquirir certificação PCMSO/PGR urgentemente');
        }
    }
    
    if (hasProlabore) {
        if (rProlSem) {
            if(riscoNivel !== '🔴 Alto') { riscoNivel = '🟡 Médio'; riscoColor = 'var(--warning)'; }
            msgs.push('Sócio(s) sem retirada formal de pró-labore, configurando distribuição de lucros disfarçada.');
            acoes.push('Ajustar pró-labore (formalizar contrato/valor e periodicidade)');
        }
    }

    if (esoc !== 'Regular' || rDivEsoc) {
        riscoNivel = '🔴 Alto'; riscoColor = 'var(--danger)';
        msgs.push('Inconsistência ou Atrasos no eSocial, ou divergência severa com a Folha de Pagamento base.');
        acoes.push('Regularizar eSocial e realizar cruzamento completo dos holerites na DCTFWeb');
    }

    if (rReg) {
        riscoNivel = '🔴 Alto'; riscoColor = 'var(--danger)';
        msgs.push('Indícios graves de funcionários trabalhando sem registro formal.');
        acoes.push('Auditoria de contratos e regularização de vínculos empregatícios (Assinatura CTPS)');
    }

    if (rAtraso) {
        riscoNivel = '🔴 Alto'; riscoColor = 'var(--danger)';
        msgs.push('Atrasos sistemáticos nas remunerações da folha ou encargos.');
        acoes.push('Conferir e recalcular recolhimentos de FGTS/INSS atrasados');
    }

    if (hasAutonomo) {
        msgs.push('Utilização de Autônomos exige validação técnica de retenções na fonte.');
        acoes.push('Conferir notas fiscais e retenção do ISS/INSS de profissionais PJs/Autônomos');
    }

    const painel = document.getElementById('tr_alerta');
    if (!painel) return;

    // Remover acoes repetidas
    acoes = [...new Set(acoes)];

    if (!isActive && !hasProlabore && !hasAutonomo) {
        painel.innerHTML = '✨ Empresa não apresentou indícios de movimentação trabalhista ou pró-labore.';
        painel.style.borderLeftColor = '#cbd5e1';
        return;
    }

    painel.style.borderLeftColor = riscoColor;
    painel.innerHTML = `
        <div style="margin-bottom:12px;font-size:15px"><strong>Diagnóstico Foco Trabalhista: <span style="color:${riscoColor};font-weight:900">${riscoNivel}</span></strong></div>
        <div style="font-size:13px;color:var(--text);margin-bottom:12px;line-height:1.6;background:#f1f5f9;padding:10px;border-radius:6px">
           ${msgs.join('<br>')}
        </div>
        ${acoes.length > 0 ? `<div style="color:var(--primary-dark)">
            <strong style="display:flex;align-items:center;gap:6px;margin-bottom:4px">📌 Ações Práticas Mód. Departamento Pessoal:</strong>
            <ul style="margin-left:18px;margin-top:2px">${acoes.map(a=>`<li style="margin-bottom:2px">${a}</li>`).join('')}</ul>
        </div>` : '<div style="color:var(--success-dark)">✓ Estrutura Trabalhista Regular e mitigada.</div>'}
    `;
};

window.updateMovFinanceiraAlerts = () => {
    let riscos = [];
    let acoes = [];
    let tags = [];
    
    // Regras de detecção baseadas na solicitação
    if (document.getElementById('mf_cc_maq')?.checked) { tags.push('operações com cartão'); }
    if (document.getElementById('mf_cc_antec')?.checked) { 
        tags.push('antecipação'); 
        riscos.push('necessidade de controle de juros financeiros na antecipação');
        riscos.push('possível divergência de receitas (BRUTO vs LÍQUIDO)');
        acoes.push('sugerir conta transitória + classificação de taxa financeira');
    }
    if (document.getElementById('mf_ef_banc')?.checked || document.getElementById('mf_ef_finan')?.checked || document.getElementById('mf_ef_capgiro')?.checked) {
        tags.push('financiamento ativo');
        riscos.push('necessidade de controle de juros apropriados');
        acoes.push('criar obrigação: controle de juros a transcorrer + passivo exigível');
        acoes.push('validar contratos financeiros / tabela SAC/PRICE');
    }
    if (document.getElementById('mf_ia_auto')?.checked || document.getElementById('mf_ia_fundo')?.checked || document.getElementById('mf_ia_td')?.checked || document.getElementById('mf_ia_conta')?.checked || document.getElementById('mf_ia_outras')?.checked) {
        tags.push('aplicações financeiras');
        riscos.push('conciliação complexa de apuração de rendimentos e IR retido');
        acoes.push('exigir: classificação contábil detalhada + retenção de rendimentos/IRRF');
    }
    if (document.getElementById('mf_ob_alto_vol')?.checked) {
        tags.push('alto volume de transações');
        riscos.push('fechamento contábil e conciliação morosas');
        acoes.push('ativar conciliação bancária avançada (Automação OFX)');
    }
    if (document.getElementById('mf_sa_mistura')?.checked) {
        tags.push('conta pessoal misturada');
        riscos.push('alto risco de presunção de receita pela RFB e quebra da Entidade');
        acoes.push('notificar cliente formalmente sobre separação patrimonial PFxPJ');
    }
    if (document.getElementById('mf_oe_cripto')?.checked || document.getElementById('mf_oe_moeda')?.checked) {
        tags.push('cripto / moeda estrangeira');
        riscos.push('variação cambial não controlada / IN 1888');
        acoes.push('exigir controle em planilha auxiliar de variação ativa/passiva');
    }

    const painel = document.getElementById('mf_alerta');
    if (!painel) return;
    
    // remover duplicatas
    riscos = [...new Set(riscos)];
    acoes = [...new Set(acoes)];
    
    if (tags.length === 0 && riscos.length === 0 && acoes.length === 0) {
        painel.innerHTML = '⚠️ Selecione as movimentações bancárias acima para gerar o diagnóstico automático de Conta. Recomenda-se preenchimento diligente.';
        painel.style.borderLeft = '4px solid #cbd5e1';
        return;
    }
    
    painel.style.borderLeft = '4px solid ' + (riscos.length > 2 ? 'var(--danger)' : 'var(--warning)');
    painel.innerHTML = `
        <div style="margin-bottom:12px;font-size:15px;color:var(--primary-dark)"><strong>🧠 Diagnóstico Contábil Bancário Automatizado:</strong></div>
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:12px;background:#f1f5f9;padding:8px;border-radius:4px">
           O cliente possui <b>${tags.join(' + ')}</b>.
        </div>
        ${riscos.length > 0 ? `<div style="color:var(--danger);margin-bottom:12px">
            <strong style="display:flex;align-items:center;gap:6px;margin-bottom:4px">⚠️ Risco Fiscal e Operacional:</strong>
            <ul style="margin-left:18px;margin-top:2px">${riscos.map(r=>`<li style="margin-bottom:2px">${r}</li>`).join('')}</ul>
        </div>` : ''}
        ${acoes.length > 0 ? `<div style="color:var(--success-dark)">
            <strong style="display:flex;align-items:center;gap:6px;margin-bottom:4px">📌 Ação Recomendada:</strong>
            <ul style="margin-left:18px;margin-top:2px">${acoes.map(a=>`<li style="margin-bottom:2px">${a}</li>`).join('')}</ul>
        </div>` : ''}
    `;
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

  const categorias = window.getDynamicChecklist(cliente);

  const totalItems = categorias.reduce((a,c) => a + c.items.length, 0);
  const doneItems  = categorias.reduce((a,c) => a + c.items.filter(i => saved[i.key]==='recebido').length, 0);
  const pct = totalItems ? Math.round((doneItems/totalItems)*100) : 0;

  const catHtml = categorias.map(cat => {
    const catDone = cat.items.filter(i => saved[i.key] === 'recebido').length;
    const itemsHtml = cat.items.map(item => {
      let val = saved[item.key] || 'aguardando';
      if (item._disabled) val = 'na';
      return `<div class="checklist-item" ${item._disabled ? 'style="opacity:0.6"' : ''}>
        <div style="flex:1">
          <div class="checklist-item-name">${item.nome}</div>
          ${item.obs ? `<div class="checklist-item-sub">${item.obs}</div>` : ''}
        </div>
        <select class="status-select ${val}" onchange="saveChkItem('${item.key}',this.value,this)" ${item._disabled?'disabled':''}>
          <option value="aguardando"  ${val==='aguardando' ?'selected':''}>⏳ Aguardando</option>
          <option value="recebido"    ${val==='recebido'   ?'selected':''}>✅ Recebido</option>
          <option value="incompleto"  ${val==='incompleto' ?'selected':''}>⚠️ Incompleto</option>
          <option value="nao_enviado" ${val==='nao_enviado'?'selected':''}>❌ Não enviado</option>
          <option value="divergente"  ${val==='divergente' ?'selected':''}>🔎 Divergente</option>
          <option value="na"          ${val==='na'         ?'selected':''}>➖ N/A</option>
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

window.getDynamicChecklist = (cliente, appData = {}) => {
    let tpl = JSON.parse(JSON.stringify(CHECKLIST_TEMPLATE));
    if (!cliente) return tpl;
    if (Object.keys(appData).length === 0 && cliente.mov_fin) appData = cliente.mov_fin;

    const ativoCaixa = tpl.find(c => c.cat.includes('ATIVO — CAIXA'));
    if (ativoCaixa) {
        const cxAtivo = !!cliente.ci_cx_possui && !['Não possui', 'Não se aplica'].includes(cliente.ci_cx_possui);
        const itemCaixa = {
            key: "dyn_cx_mov", 
            nome: "Conferir / Validar Movimento de Caixa", 
            regimes: ["todos"], 
            condicao: null, 
            obs: cxAtivo ? "Frequência: " + (cliente.ci_cx_freq || 'N/A') : "Controle não se aplica / Não possui"
        };
        if (!cxAtivo) itemCaixa._disabled = true;
        ativoCaixa.items.unshift(itemCaixa);
    }

    const ativoBancos = tpl.find(c => c.cat.includes('ATIVO — BANCOS'));
    if (ativoBancos) {
        if (cliente.ci_banco_possui === 'Sim' || !cliente.ci_banco_possui) {
            const bancosUtilizados = (cliente.bancos||[]).map(cod => (BANCOS.find(b => b.cod === cod)||{}).nome).filter(Boolean);
            if (cliente.banco_outro) bancosUtilizados.push(cliente.banco_outro);
            
            let risk = "MÉDIO";
            if (cliente.ci_banco_forma === 'Não controla' || cliente.ci_banco_sit === 'Não conciliado') risk = "ALTO";
            else if (cliente.ci_banco_sit === 'Conciliado') risk = "BAIXO";

            bancosUtilizados.forEach((nome, idx) => {
                ativoBancos.items.push({key:"dyn_b_"+idx+"_ext", nome:`Importar/lançar extrato — ${nome}`, regimes:["todos"], condicao:null, obs:"Risco Associado: "+risk});
                if (cliente.ci_banco_forma && (cliente.ci_banco_forma.includes('Conciliação') || cliente.ci_banco_forma.includes('sistema') || cliente.ci_banco_forma.includes('planilha'))) {
                    ativoBancos.items.push({key:"dyn_b_"+idx+"_conc", nome:`Conciliar banco — ${nome}`, regimes:["todos"], condicao:null, obs:""});
                }
            });
        }
    }
    
    return tpl.map(cat => {
      const items = cat.items.filter(item => {
        if (item.condicao) {
          if (item.condicao === 'tem_caixa')       return !!cliente.tem_caixa;
          if (item.condicao === 'tem_estoque')     return !!cliente.tem_estoque;
          if (item.condicao === 'tem_folha')       return !!cliente.tem_folha;
          if (item.condicao === 'tem_prolabore')   return !!cliente.tem_prolabore;
          
          if (item.condicao === 'div_rfb') {
              item._disabled = !(cliente.d_div_rfb && (cliente.d_div_rfb.status === 'Pendente' || cliente.d_div_rfb.status === 'Em andamento'));
              return true;
          }
          if (item.condicao === 'div_estado') {
              item._disabled = !(cliente.d_div_est && (cliente.d_div_est.status === 'Pendente' || cliente.d_div_est.status === 'Em andamento'));
              return true;
          }
          if (item.condicao === 'div_pref') {
              item._disabled = !(cliente.d_div_pref && (cliente.d_div_pref.status === 'Pendente' || cliente.d_div_pref.status === 'Em andamento'));
              return true;
          }
          if (item.condicao === 'div_pgfn') {
              item._disabled = !(cliente.d_div_pgfn && (cliente.d_div_pgfn.status === 'Pendente' || cliente.d_div_pgfn.status === 'Em andamento'));
              return true;
          }

          if (item.condicao === 'fiscal_integrado') return !!cliente.fiscal_integrado;
          if (item.condicao === 'ci_bens_depr')    return !!appData.ci_bens_depr;
          
          if (item.condicao === 'mf_cc_maq')       return !!appData.mf_cc_maq;
          if (item.condicao === 'mf_cc_antec')     return !!appData.mf_cc_antec;
          if (item.condicao === 'mf_cc_corp')      return !!appData.mf_cc_corp;
          if (item.condicao === 'mf_cc_multi')     return !!appData.mf_cc_multi;
          if (item.condicao === 'mf_ef_banc')      return !!appData.mf_ef_banc;
          if (item.condicao === 'mf_ef_finan')     return !!appData.mf_ef_finan;
          if (item.condicao === 'mf_ef_capgiro')   return !!appData.mf_ef_capgiro;
          if (item.condicao === 'mf_ef_reneg')     return !!appData.mf_ef_reneg;
          if (item.condicao === 'mf_ia_auto')      return !!appData.mf_ia_auto;
          if (item.condicao === 'mf_ia_fundo')     return !!appData.mf_ia_fundo;
          if (item.condicao === 'mf_ia_td')        return !!appData.mf_ia_td;
          if (item.condicao === 'mf_ia_conta')     return !!appData.mf_ia_conta;
          if (item.condicao === 'mf_ia_outras')    return !!appData.mf_ia_outras;
          if (item.condicao === 'mf_oe_moeda')     return !!appData.mf_oe_moeda;
          if (item.condicao === 'mf_oe_pix')       return !!appData.mf_oe_pix;
          if (item.condicao === 'mf_oe_subv')      return !!appData.mf_oe_subv;
          if (item.condicao === 'mf_oe_cripto')    return !!appData.mf_oe_cripto;
          if (item.condicao === 'mf_oe_cons')      return !!appData.mf_oe_cons;
          if (item.condicao === 'mf_sa_mistura')   return !!appData.mf_sa_mistura;
          
          if (item.condicao === 'mf_tem_aut')      return !!appData.mf_tem_aut  || !!appData.tr_tem_aut;
          if (item.condicao === 'mf_tem_estag')    return !!appData.mf_tem_estag || !!appData.tr_tem_estag;
        }
        if (item.regimes && !item.regimes.includes('todos') && !item.regimes.includes(cliente.regime)) return false;
        return true;
      });
      return { ...cat, items };
    }).filter(cat => cat.items.length > 0);
};

function gerarParecer() {
  const clientes = DB.get('clientes') || [];
  const cliente = clientes.find(c => c.id === chkClienteId);
  const checklists = DB.get('checklists') || {};
  const key = `${chkClienteId}_${state.competencia}`;
  const saved = checklists[key] || {};

  // Coleta status
  const recebidos = [], pendentes = [], incompletos = [], divergentes = [], naoEnviados = [];
  const categorias = window.getDynamicChecklist(cliente);
  categorias.forEach(cat => cat.items.forEach(item => {
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

  if (cliente.ci_itg_norma_calc) {
     texto += `\nDIAGNÓSTICO CONTÁBIL (ENQUADRAMENTO TÉCNICO)\n${sep2}\n`;
     texto += `Entidade     : ${cliente.ci_itg_tipo || '—'} (${cliente.ci_itg_porte || '—'})\n`;
     texto += `Complexidade : ${cliente.ci_itg_complex || '—'}\n`;
     texto += `Finalidade   : ${cliente.ci_itg_finalidade || '—'}\n`;
     texto += `==> Norma Aplicável Recomendada : ${cliente.ci_itg_norma_calc}\n`;
     texto += `==> Risco Técnico Operacional   : ${cliente.ci_itg_risco_calc || '—'}\n`;
     texto += `==> Atenção para a escrituração : Aplicabilidade obrigatória complementar da ITG 2000.\n`;
  }

  const dbEntregas = DB.get('entregas_ecd') || {};
  const ecdDefis = dbEntregas[cliente.id] || { anos: {}, defis_anos: {} };
  const getAutoSt = (tipo) => {
      if (tipo === 'ecd') return cliente.regime === 'Simples Nacional' ? 'Não aplicável' : 'Pendente';
      if (tipo === 'defis') return cliente.regime === 'Simples Nacional' ? 'Pendente' : 'Não aplicável';
      return 'Pendente';
  };
  const ecdSt = {
      2022: ecdDefis.anos?.['2022']?.status || getAutoSt('ecd'),
      2023: ecdDefis.anos?.['2023']?.status || getAutoSt('ecd'),
      2024: ecdDefis.anos?.['2024']?.status || getAutoSt('ecd'),
      2025: ecdDefis.anos?.['2025']?.status || getAutoSt('ecd')
  };
  const defisSt = {
      2023: ecdDefis.defis_anos?.['2023']?.status || getAutoSt('defis'),
      2024: ecdDefis.defis_anos?.['2024']?.status || getAutoSt('defis'),
      2025: ecdDefis.defis_anos?.['2025']?.status || getAutoSt('defis')
  };
  let ecdPends = [], defisPends = [];
  [2022,2023,2024,2025].forEach(a => { if(['Pendente','Em andamento'].includes(ecdSt[a])) ecdPends.push(`ECD ${a}`); });
  [2023,2024,2025].forEach(a => { if(['Pendente','Em andamento'].includes(defisSt[a])) defisPends.push(`DEFIS ${a}`); });

  const totalObg = ecdPends.length + defisPends.length;
  const stObgStr = totalObg === 0 ? '🟢 Regular' : totalObg === 1 ? '🟡 Atenção' : '🔴 Irregular';

  texto += `\n📍 MATRIZ DE OBRIGAÇÕES ANUAIS (ECD / DEFIS)\n${sep2}\n`;
  texto += `1. Enquadramento Tributário\n`;
  if (cliente.regime === 'Simples Nacional') {
     texto += `A empresa está enquadrada no regime do Simples Nacional, estando obrigada\nà entrega da DEFIS anual e dispensada, em regra, da ECD.\n`;
  } else {
     texto += `A empresa está enquadrada no regime de ${cliente.regime || 'não especificado'}.\nEstando obrigada à entrega da Escrituração Contábil Digital (ECD), não sujeita à DEFIS.\n`;
  }
  
  texto += `\n2. Situação das Obrigações\n`;
  texto += `[ECD]:   ` + [2022,2023,2024,2025].map(a => `${a}: ${ecdSt[a]}`).join(' | ') + `\n`;
  texto += `[DEFIS]: ` + [2023,2024,2025].map(a => `${a}: ${defisSt[a]}`).join(' | ') + `\n`;
  
  texto += `\n3. Diagnóstico do Painel Estratégico\nStatus Geral: ${stObgStr}\n`;
  if (totalObg > 0) {
      texto += `\n4. Riscos Identificados\n`;
      texto += `Identifica-se situação de irregularidade/atenção quanto às obrigações acessórias\n`;
      texto += `anuais, com pendência na entrega de: ${[...ecdPends, ...defisPends].join(', ')}.\n`;
      texto += `\n5. Recomendações (Ações Práticas)\n`;
      if (ecdPends.length) texto += `• Regularizar de imediato a Escrituração (ECD).\n`;
      if (defisPends.length) texto += `• Avaliar e encaminhar a transmissão da(s) declaração(ões) da DEFIS.\n`;
      texto += `• Revisar o enquadramento se o fluxo for discordante do regime indicado.\n`;
  }

  // Pendências Fiscais Menores
  const obgs = [
    { n: 'SPED Fiscal', v: cliente.d_sped_f, isAcessoria: true }, 
    { n: 'SPED Contrib', v: cliente.d_sped_c, isAcessoria: true },
    { n: 'ECD Mensal/Outra', v: cliente.d_ecd, isAcessoria: true }, 
    { n: 'ECF', v: cliente.d_ecf, isAcessoria: true },
    { n: 'DEFIS', v: cliente.d_defis, isAcessoria: true },
    { n: 'DASNMEI', v: cliente.d_dasnmei, isAcessoria: true },
    { n: 'PGDAS Mensal', v: cliente.d_simples, isAcessoria: true }, 
    { n: 'DCTFWEB', v: cliente.d_dctfweb, isAcessoria: true },
    { n: 'DIME', v: cliente.d_dime, isAcessoria: true },
    { n: 'GIA', v: cliente.d_gia, isAcessoria: true },
    { n: 'Dívida RFB', v: cliente.d_div_rfb, isAcessoria: false },
    { n: 'Dívida PGFN', v: cliente.d_div_pgfn, isAcessoria: false }, 
    { n: 'Dívida Estadual', v: cliente.d_div_est, isAcessoria: false },
    { n: 'Dívida Municipal', v: cliente.d_div_pref, isAcessoria: false }
  ];
  const pends = obgs.filter(o => o.v && o.v.status === 'Pendente');
  const andam = obgs.filter(o => o.v && o.v.status === 'Em andamento');
  
  if (pends.length > 0 || andam.length > 0) {
      const riscoFiscal = pends.length > 5 ? '🔴 ALTO' : pends.length > 0 ? '🟡 MÉDIO' : '🟢 BAIXO';
      texto += `\n📍 REVISÃO DE ROTINAS FISCAIS E DÍVIDAS SECUNDÁRIAS\n${sep2}\n`;
      texto += `Risco Secundário (Obrigações/Dívidas): ${riscoFiscal} (${pends.length} pendências)\n\n`;
      if(pends.length > 0) {
          texto += `🔴 OBRIGAÇÕES/DÉBITOS PENDENTES:\n`;
          pends.forEach(p => {
              if (p.isAcessoria) {
                  texto += `     • Empresa possui pendência na entrega do ${p.n} (Ref: ${p.v.comp || 'N/A'}) — risco de autuação e necessidade de regularização.\n`;
              } else {
                  texto += `     • Empresa possui débitos fiscais em aberto (${p.n}) — necessário acompanhamento e conciliação de parcelamentos.\n`;
              }
          });
      }
      if(andam.length > 0) {
          texto += `\n🟡 EM ANDAMENTO/PARCELANDO:\n`;
          andam.forEach(p => {
              if (p.isAcessoria) {
                  texto += `     • Entrega em andamento: ${p.n} (Ref: ${p.v.comp || 'N/A'}).\n`;
              } else {
                  texto += `     • Débito em regularização/parcelando: ${p.n}.\n`;
              }
          });
      }
  }

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
      <button class="btn btn-ghost btn-sm" onclick="imprimirParecer()">🖨️ Imprimir PDF</button>
    </div>
  </div>
  <div class="parecer-box" id="parecer-text">${texto}</div>
</div>`;

  setTimeout(() => { imprimirParecer(); }, 300);
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
  const obgsAcessAux = ['ECF','RAIS','DIRF','DASN-MEI'];
  const obgDataDb = DB.get('obrigacoes') || {};
  const ecdDefisDb = DB.get('entregas_ecd') || {};
  const anoAtualStr = parseInt(state.competencia.split('-')[0]) || new Date().getFullYear();
  const cliDataEcd = ecdDefisDb[cliente.id] || {anos:{}, defis_anos:{}};
  
  const autoSt = (tipo) => {
    if (tipo==='ecd') return cliente.regime === 'Simples Nacional' ? 'Não aplicável' : 'Pendente';
    if (tipo==='defis') return cliente.regime === 'Simples Nacional' ? 'Pendente' : 'Não aplicável';
    return 'Pendente';
  };
  
  const stColor = st => {
    const s = String(st).toLowerCase();
    if (s.includes('transmitida') || s.includes('entregue') || s.includes('concluído')) return '#10b981';
    if (s.includes('não aplicável')) return '#94a3b8';
    return '#ef4444';
  };
  
  const boxHtml = (title, status) => {
    const rawSt = String(status).toLowerCase();
    const lbl = rawSt === 'entregue' ? 'Transmitida' : rawSt === 'em_atraso' ? 'Em Atraso' : rawSt === 'pendente' ? 'Pendente' : status;
    return `<div style="flex:1;min-width:90px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px;text-align:center;">
      <div style="font-size:10px;font-weight:700;color:#64748b;margin-bottom:4px">${title}</div>
      <div style="font-size:11px;font-weight:600;color:${stColor(lbl)};padding:2px 0;background:#fff;border-radius:4px;border:1px solid ${stColor(lbl)}33">${lbl}</div>
    </div>`;
  };

  const ecdBoxes = [2022, 2023, 2024, 2025].map(a => boxHtml(`ECD ${a}`, cliDataEcd.anos?.[a]?.status || autoSt('ecd'))).join('');
  const defisBoxes = [2023, 2024, 2025].map(a => boxHtml(`DEFIS ${a}`, cliDataEcd.defis_anos?.[a]?.status || autoSt('defis'))).join('');
  
  const auxBoxes = obgsAcessAux.map(cod => {
     const k = `${cliente.id}_${cod}_${anoAtualStr}`;
     const status = obgDataDb[k]?.status || 'Pendente';
     return boxHtml(`${cod} ${anoAtualStr}`, status);
  }).join('');

  const obgAcessSection = `<div class="card mb-4" style="padding:16px 20px;">
    <div style="font-weight:700;font-size:14px;margin-bottom:16px;display:flex;align-items:center;gap:8px;">
      📋 Painel Estratégico de Obrigações
    </div>
    <div style="margin-bottom:12px">
      <div style="font-size:11px;font-weight:700;color:#475569;margin-bottom:6px;text-transform:uppercase;">📊 OBRIGAÇÕES CONTÁBEIS (ECD)</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">${ecdBoxes}</div>
    </div>
    <div style="margin-bottom:12px">
      <div style="font-size:11px;font-weight:700;color:#475569;margin-bottom:6px;text-transform:uppercase;">📊 SIMPLES NACIONAL (DEFIS)</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">${defisBoxes}</div>
    </div>
    <div>
      <div style="font-size:11px;font-weight:700;color:#475569;margin-bottom:6px;text-transform:uppercase;">📅 OUTRAS DECLARAÇÕES (${anoAtualStr})</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">${auxBoxes}</div>
    </div>
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
  const clienteId = typeof parecerClienteId !== 'undefined' ? parecerClienteId : audClienteId;
  if (!clienteId) { alert('Selecione um cliente primeiro.'); return; }
  const auditoria = DB.get('auditoria') || {};
  const key = clienteId + '_' + state.competencia;
  auditoria[key] = auditoria[key] || [];
  auditoria[key].push({ item:'Novo apontamento', obs:'', impacto:'', acao:'', risco:'medio' });
  DB.set('auditoria', auditoria);
  render();
}
function addAudItemFromChk(itemKey, status) {
  const clienteId = typeof parecerClienteId !== 'undefined' ? parecerClienteId : audClienteId;
  const auditoria = DB.get('auditoria') || {};
  const key = clienteId + '_' + state.competencia;
  auditoria[key] = auditoria[key] || [];
  auditoria[key].push({ item: itemKey.replace(/_/g,' '), obs:`Status: ${status}`, impacto:'', acao:'', risco: status==='divergente'?'alto':'medio' });
  DB.set('auditoria', auditoria);
  navigate('parecer');
}
function delAudItem(i) {
  const clienteId = typeof parecerClienteId !== 'undefined' ? parecerClienteId : audClienteId;
  const auditoria = DB.get('auditoria') || {};
  const key = clienteId + '_' + state.competencia;
  auditoria[key].splice(i,1);
  DB.set('auditoria', auditoria);
  render();
}
function updateAud(i, field, val) {
  const clienteId = typeof parecerClienteId !== 'undefined' ? parecerClienteId : audClienteId;
  const auditoria = DB.get('auditoria') || {};
  const key = clienteId + '_' + state.competencia;
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

