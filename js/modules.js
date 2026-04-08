
// ─── IMPORTAÇÃO COM GEMINI AI ───
let impClienteId = null;
let impArquivos = [];
let impResultados = [];

function renderImportacao() {
  const apiKey = getApiKey();
  const clientes = DB.get('clientes') || [];
  const ativos = clientes.filter(c => c.status === 'Ativo');

  const aviso = !apiKey ? `<div class="card mb-4" style="border-left:4px solid var(--danger)">
  <div class="flex items-center gap-2"><span style="font-size:20px">⚠️</span><div>
    <strong>API Key não configurada</strong><br>
    <span class="text-muted text-sm">Vá em <button class="btn btn-ghost btn-sm" onclick="navigate('configuracoes')">⚙️ Configurações</button> e cadastre sua chave do Google AI Studio.</span>
  </div></div></div>` : '';

  const selectorOptions = ativos.map(c =>
    `<option value="${c.id}" ${impClienteId === c.id ? 'selected' : ''}>#${c.id} — ${c.nome}</option>`
  ).join('');

  const tiposDoc = [
    { val: 'extrato',       label: '📄 Extrato Bancário (PDF/imagem)' },
    { val: 'nfe_xml',       label: '🧾 Nota Fiscal XML (NF-e / NFS-e)' },
    { val: 'fatura_cartao', label: '💳 Fatura de Cartão de Crédito' },
    { val: 'folha',         label: '👥 Folha de Pagamento / Holerite' },
    { val: 'guia_imposto',  label: '🏛️ Guia de Imposto (DAS, DARF, GPS)' },
    { val: 'generico',      label: '📂 Outro documento contábil' },
  ];

  const resultHtml = impResultados.map((r, i) => {
    const hasChk = r.chkKeys && r.chkKeys.length && impClienteId;
    return `<div class="card mb-3" style="border-left:4px solid var(--success)">
      <div class="flex justify-between items-center mb-2">
        <strong>📄 ${r.arquivo}</strong>
        <span class="badge badge-green">${r.tipo}</span>
      </div>
      <pre style="background:var(--bg);border-radius:6px;padding:12px;font-size:12px;overflow-x:auto;max-height:220px;white-space:pre-wrap">${JSON.stringify(r.resultado, null, 2)}</pre>
      ${hasChk ? `<div class="mt-2 flex items-center gap-2">
        <span class="text-sm text-muted">Marcar no checklist <strong>${fmtComp(state.competencia)}</strong>:</span>
        <button class="btn btn-success btn-sm" onclick="aplicarNoChecklist(${i})">✅ Marcar como Recebido</button>
      </div>` : ''}
    </div>`;
  }).join('');

  return `
${aviso}
<div class="card mb-4" style="background:linear-gradient(135deg,#1e40af,#0891b2);color:#fff;padding:20px 24px">
  <h2 style="font-size:16px;margin-bottom:4px">🤖 Importação Inteligente com Gemini AI</h2>
  <p style="opacity:.85;font-size:13px">Envie PDFs, XMLs ou imagens — a IA extrai os dados e preenche o checklist automaticamente.</p>
</div>
<div class="card mb-4">
  <div class="form-grid">
    <div class="form-group">
      <label>Cliente</label>
      <select id="imp-cliente" style="border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-family:inherit;font-size:13px" onchange="impClienteId=this.value">
        <option value="">— Selecione o cliente —</option>${selectorOptions}
      </select>
    </div>
    <div class="form-group">
      <label>Tipo de Documento</label>
      <select id="imp-tipo" style="border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-family:inherit;font-size:13px">
        ${tiposDoc.map(t => `<option value="${t.val}">${t.label}</option>`).join('')}
      </select>
    </div>
    <div class="form-group form-full">
      <label>Arquivos (PDF, XML, imagem, CSV, OFX)</label>
      <input type="file" id="imp-files" multiple accept=".pdf,.xml,.csv,.jpg,.jpeg,.png,.ofx,.txt"
        style="border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-family:inherit;font-size:13px;width:100%;background:var(--card)"
        onchange="impArquivos=[...this.files]">
    </div>
    <div class="form-group">
      <label>Competência para o Checklist</label>
      <input type="month" value="${state.competencia}" onchange="state.competencia=this.value"
        style="border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-family:inherit;font-size:13px">
    </div>
  </div>
  <div class="mt-4" style="display:flex;gap:10px;align-items:center">
    <button class="btn btn-primary" onclick="processarImportacao()">🤖 Analisar com Gemini AI</button>
    <span id="imp-status" class="text-muted text-sm"></span>
  </div>
</div>
${resultHtml || '<div class="empty-state"><div class="empty-icon">📂</div><p>Selecione um cliente, o tipo de documento, faça o upload e clique em Analisar.</p></div>'}`;
}

async function processarImportacao() {
  if (!getApiKey()) { alert('Configure a API Key em Configurações.'); return; }
  if (!impClienteId) { alert('Selecione um cliente.'); return; }
  const fileInput = document.getElementById('imp-files');
  impArquivos = fileInput ? [...fileInput.files] : impArquivos;
  if (!impArquivos.length) { alert('Selecione pelo menos um arquivo.'); return; }

  const tipo = document.getElementById('imp-tipo').value;
  const clientes = DB.get('clientes') || [];
  const cliente = clientes.find(c => c.id === impClienteId);
  const statusEl = document.getElementById('imp-status');

  impResultados = [];
  for (const file of impArquivos) {
    try {
      statusEl.textContent = `⏳ Processando ${file.name}...`;
      const resultado = await analisarDocumento(file, tipo, cliente.nome);
      const chkKeys = mapResultToChecklist(tipo, resultado);
      impResultados.push({ arquivo: file.name, tipo, resultado, chkKeys });
    } catch (e) {
      impResultados.push({ arquivo: file.name, tipo, resultado: { erro: e.message }, chkKeys: [] });
    }
  }
  statusEl.textContent = `✅ ${impResultados.length} arquivo(s) processado(s).`;
  render();
}

function aplicarNoChecklist(idx) {
  const r = impResultados[idx];
  if (!r || !impClienteId || !r.chkKeys.length) return;
  const checklists = DB.get('checklists') || {};
  const key = impClienteId + '_' + state.competencia;
  checklists[key] = checklists[key] || {};
  r.chkKeys.forEach(k => { checklists[key][k] = 'recebido'; });
  DB.set('checklists', checklists);
  alert(`✅ ${r.chkKeys.length} item(s) marcados como Recebido no checklist de ${fmtComp(state.competencia)}!`);
}

// ─── OBRIGAÇÕES ACESSÓRIAS ───
// Calendário completo de obrigações por regime e prazo
const OBRIGACOES_CALENDARIO = [
  // Mensais
  { cod:'PGDAS-D',  nome:'PGDAS-D — Declaração Mensal Simples',  regime:['Simples Nacional'],               periodicidade:'Mensal',  prazo:'Último dia útil do mês subsequente',    categoria:'Fiscal'      },
  { cod:'DAS',      nome:'DAS — Documento de Arrecadação Simples', regime:['Simples Nacional'],              periodicidade:'Mensal',  prazo:'Dia 20 do mês subsequente',             categoria:'Fiscal'      },
  { cod:'DCTF-Web', nome:'DCTF-Web — Débitos e Créditos Trib.',   regime:['Lucro Presumido','Lucro Real'],   periodicidade:'Mensal',  prazo:'Dia 15 do mês subsequente',             categoria:'Trabalhista' },
  { cod:'GPS',      nome:'GPS — Contribuição Previdenciária',     regime:['todos'],                          periodicidade:'Mensal',  prazo:'Dia 20 do mês subsequente',             categoria:'Trabalhista' },
  { cod:'FGTS',     nome:'FGTS — Fundo de Garantia',             regime:['todos'],                          periodicidade:'Mensal',  prazo:'Dia 7 do mês subsequente',              categoria:'Trabalhista' },
  { cod:'SPED-F-M', nome:'SPED Fiscal — EFD ICMS/IPI (mensal)',   regime:['Lucro Presumido','Lucro Real'],   periodicidade:'Mensal',  prazo:'Dia 20 do mês subsequente',             categoria:'Fiscal'      },
  { cod:'EFD-Contrib',nome:'EFD-Contribuições (PIS/COFINS)',      regime:['Lucro Presumido','Lucro Real'],   periodicidade:'Mensal',  prazo:'Dia 20 do mês subsequente',             categoria:'Fiscal'      },
  // Anuais
  { cod:'DEFIS',    nome:'DEFIS — Declaração Informações Simples', regime:['Simples Nacional'],              periodicidade:'Anual',   prazo:'31/03 (ano seguinte)',                  categoria:'Fiscal',   anoRef:'2025', mesRef:'03' },
  { cod:'DASN-MEI', nome:'DASN — Declaração Anual MEI',           regime:['MEI'],                           periodicidade:'Anual',   prazo:'31/05 (ano seguinte)',                  categoria:'Fiscal',   anoRef:'2025', mesRef:'05' },
  { cod:'DIRF',     nome:'DIRF — Declaração IR Retido',           regime:['todos'],                         periodicidade:'Anual',   prazo:'28/02 (ano seguinte)',                  categoria:'Fiscal',   anoRef:'2025', mesRef:'02' },
  { cod:'RAIS',     nome:'RAIS — Atividades Sócio-Econômicas',    regime:['todos'],                         periodicidade:'Anual',   prazo:'Março (varia por ano)',                 categoria:'Trabalhista',anoRef:'2025',mesRef:'03' },
  { cod:'eSocial',  nome:'eSocial — Folha e Trabalhista',         regime:['todos'],                         periodicidade:'Mensal',  prazo:'Dia 7 do mês subsequente',              categoria:'Trabalhista' }
];

let obgAno = "2023"; // Ano principal para visualização (pode ser 2022, 2023)

function renderObrigacoes() {
  const clientes = DB.get('clientes') || [];
  const ativos = clientes.filter(c => c.status === 'Ativo').sort((a,b)=>parseInt(a.id)-parseInt(b.id));
  const entregas = DB.get('entregas_ecd') || {};

  let rows = ativos.map(c => {
    const e = entregas[c.id] || { anos: { '2022':{}, '2023':{}, '2024':{} }, resp: 'Aliny', constituicao: '' };
    
    const renderAno = (ano) => {
      const a = e.anos[ano] || {};
      const status = a.status || 'Pendente';
      const docs = a.docs || [];
      const bgColor = status.includes('Transmitida') ? 'var(--success)' : status.includes('Fechada') ? '#86efac' : status.includes('Sem Lançamento') ? '#64748b' : '#cbd5e1';
      const color = status==='Pendente' ? '#333' : '#fff';

      const tagsHtml = docs.map(d => `<span class="badge" style="font-size:9px;background:#e2e8f0;color:#333;margin:1px">${d}</span>`).join('');

      return `
        <td style="min-width:140px">
          <select style="border:none;background:${bgColor};color:${color};font-size:11px;padding:4px;border-radius:4px;width:100%;font-weight:bold" onchange="saveEntrega(${c.id}, '${ano}', 'status', this.value)">
            <option value="Pendente" ${status==='Pendente'?'selected':''}>Pendente</option>
            <option value="Transmitida" ${status==='Transmitida'?'selected':''}>Transmitida</option>
            <option value="Fechada sem ECD" ${status==='Fechada sem ECD'?'selected':''}>Fechada sem ECD</option>
            <option value="Sem Lançamento p/ ${ano}" ${status.includes('Sem Lançamento')?'selected':''}>Sem Lançamento p/ ${ano}</option>
          </select>
        </td>
        <td style="min-width:180px">
          <div style="display:flex;flex-wrap:wrap;gap:2px;margin-bottom:4px">${tagsHtml}</div>
          <button class="btn btn-ghost btn-sm" style="font-size:10px" onclick="editDocs(${c.id}, '${ano}')">+ Docs</button>
        </td>
        <td style="min-width:140px">
          <input type="text" placeholder="Data Hora" value="${a.dataHora || ''}" onblur="saveEntrega(${c.id}, '${ano}', 'dataHora', this.value)" style="width:100%;font-size:10px;padding:4px;border:1px solid var(--border);border-radius:4px">
        </td>
        <td style="min-width:160px">
          <input type="text" placeholder="HASH do Recibo" value="${a.hash || ''}" onblur="saveEntrega(${c.id}, '${ano}', 'hash', this.value)" style="width:100%;font-size:10px;padding:4px;border:1px solid var(--border);border-radius:4px">
        </td>
      `;
    };

    return `
      <tr>
        <td style="text-align:center;padding:4px"><strong>${c.id}</strong></td>
        <td style="font-size:11px;font-weight:600;white-space:nowrap;padding:4px">${c.nome}</td>
        <td style="font-size:11px;color:var(--text-muted);white-space:nowrap;padding:4px">${c.cnpj||c.cpf||''}</td>
        <td style="padding:4px"><input type="text" value="${e.resp || ''}" onblur="saveEntregaBase(${c.id}, 'resp', this.value)" style="width:60px;font-size:11px;padding:2px"></td>
        <td style="font-size:11px;padding:4px">${e.constituicao || '01/01/2000'}</td>
        ${renderAno('2022')}
        ${renderAno('2023')}
      </tr>
    `;
  }).join('');

  return `
<div class="card mb-4" style="background:linear-gradient(135deg,#312e81,#4338ca);color:#fff;padding:18px 24px">
  <h3 style="font-size:16px;margin-bottom:4px">📋 Controle de Entregas (ECD e DEFIS)</h3>
  <p style="opacity:.85;font-size:12px">Controle unificado de status anuais, envio de SPED e HASH dos recibos.</p>
</div>

<div class="card" style="padding:0">
  <div class="table-wrap" style="overflow-x:auto;max-height:65vh">
    <table style="width:max-content;border-collapse:collapse;font-size:12px">
      <thead style="position:sticky;top:0;background:var(--bg-side);color:#fff;z-index:2">
        <tr>
          <th style="padding:10px">Cód</th>
          <th style="padding:10px">Empresa</th>
          <th style="padding:10px">CNPJ</th>
          <th style="padding:10px">Resp</th>
          <th style="padding:10px">Const.</th>
          <th style="background:#1e1b4b;padding:10px">ANO 2022</th>
          <th style="background:#1e1b4b;padding:10px">Documentos Servidor</th>
          <th style="background:#1e1b4b;padding:10px">Data Entrega/Hora</th>
          <th style="background:#1e1b4b;padding:10px">HASH (2022)</th>
          <th style="background:#312e81;padding:10px">ANO 2023</th>
          <th style="background:#312e81;padding:10px">Documentos Servidor</th>
          <th style="background:#312e81;padding:10px">Data Entrega/Hora</th>
          <th style="background:#312e81;padding:10px">HASH (2023)</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </div>
</div>`;
}

function saveEntrega(clienteId, ano, campo, valor) {
  const entregas = DB.get('entregas_ecd') || {};
  if (!entregas[clienteId]) entregas[clienteId] = { anos: { '2022':{}, '2023':{}, '2024':{} } };
  if (!entregas[clienteId].anos[ano]) entregas[clienteId].anos[ano] = {};
  
  entregas[clienteId].anos[ano][campo] = valor;
  DB.set('entregas_ecd', entregas);
  // Opcional: render(); 
}

function saveEntregaBase(clienteId, campo, valor) {
  const entregas = DB.get('entregas_ecd') || {};
  if (!entregas[clienteId]) entregas[clienteId] = { anos: { '2022':{}, '2023':{}, '2024':{} } };
  
  entregas[clienteId][campo] = valor;
  DB.set('entregas_ecd', entregas);
}

window.editDocs = function(clienteId, ano) {
  const entregas = DB.get('entregas_ecd') || {};
  const current = (entregas[clienteId]?.anos[ano]?.docs) || [];
  
  const opts = ['BP', 'DRE', 'DLPA', 'Notas Explicativas', 'Arquivo SPED SCI', 'Recibo de Transmissão', 'Arquivo Validado ECD', 'ECF'];
  const p = prompt('Docs para o ano ' + ano + ' (Separe por vírgula):\nEx: ' + opts.slice(0,4).join(', '), current.join(', '));
  if (p !== null) {
    const arr = p.split(',').map(s=>s.trim()).filter(s=>s);
    saveEntrega(clienteId, ano, 'docs', arr);
    render();
  }
}

// ─── CONFIGURAÇÕES ───
function renderConfiguracoes() {
  const apiKey = getApiKey();
  return `
<div style="max-width:600px">
  <div class="card mb-4" style="border-left:4px solid var(--primary)">
    <h3 style="margin-bottom:4px">⚙️ Configurações do Sistema</h3>
    <p class="text-muted text-sm">Configurações globais da conta e integrações.</p>
  </div>

  <div class="card mb-4">
    <h3 style="margin-bottom:4px">🤖 Google Gemini API</h3>
    <p class="text-muted text-sm mb-4">Obtenha sua chave gratuita em <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:var(--primary-light)">aistudio.google.com</a></p>
    <div class="form-group">
      <label>API Key do Google AI Studio</label>
      <input type="password" id="cfg-apikey" value="${apiKey}" placeholder="AIzaSy..."
        style="border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-family:monospace;font-size:13px;width:100%">
    </div>
    <div style="margin-top:12px;display:flex;gap:10px;align-items:center">
      <button class="btn btn-primary" onclick="salvarApiKey()">💾 Salvar API Key</button>
      <button class="btn btn-ghost btn-sm" onclick="testarApiKey()">🔍 Testar conexão</button>
      <span id="cfg-status" class="text-sm"></span>
    </div>
  </div>

  <div class="card mb-4">
    <h3 style="margin-bottom:12px">📋 Informações do Escritório (Parecer)</h3>
    <div class="form-grid">
      <div class="form-group"><label>Nome do Escritório</label>
        <input id="cfg-nome" value="${localStorage.getItem('esc_nome')||'Criscontab & Madeira Contabilidade'}"
          style="border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-family:inherit;font-size:13px">
      </div>
      <div class="form-group"><label>CNPJ do Escritório</label>
        <input id="cfg-cnpj" value="${localStorage.getItem('esc_cnpj')||''}"
          style="border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-family:inherit;font-size:13px">
      </div>
    </div>
    <button class="btn btn-primary mt-2" onclick="salvarEscritorioInfo()">💾 Salvar</button>
  </div>

  <div class="card">
    <h3 style="margin-bottom:8px;color:var(--danger)">⚠️ Zona de Perigo</h3>
    <p class="text-muted text-sm mb-3">Apaga todos os checklists, onboarding e auditoria e recarrega os 87 clientes base.</p>
    <button class="btn btn-danger btn-sm" onclick="resetarDados()">🔄 Restaurar Dados Base</button>
  </div>
</div>`;
}

function salvarApiKey() {
  const k = document.getElementById('cfg-apikey').value.trim();
  localStorage.setItem('gemini_api_key', k);
  const el = document.getElementById('cfg-status');
  el.textContent = k ? '✅ API Key salva!' : '❌ Key apagada';
  el.style.color = k ? 'var(--success)' : 'var(--danger)';
  setTimeout(() => el.textContent='', 3000);
}

async function testarApiKey() {
  const statusEl = document.getElementById('cfg-status');
  statusEl.textContent = '⏳ Testando...';
  const apiKey = document.getElementById('cfg-apikey').value.trim();
  if (!apiKey) { statusEl.textContent = '❌ Insira a key primeiro'; return; }
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ contents:[{parts:[{text:'Responda apenas: OK'}]}] }) }
    );
    const d = await res.json();
    const txt = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
    statusEl.style.color = txt ? 'var(--success)' : 'var(--warning)';
    statusEl.textContent = txt ? '✅ Conexão OK! Gemini respondeu.' : '⚠️ Resposta inesperada';
  } catch(e) {
    statusEl.style.color = 'var(--danger)';
    statusEl.textContent = '❌ Erro: ' + e.message;
  }
  setTimeout(() => statusEl.textContent='', 5000);
}

function salvarEscritorioInfo() {
  localStorage.setItem('esc_nome', document.getElementById('cfg-nome').value);
  localStorage.setItem('esc_cnpj', document.getElementById('cfg-cnpj').value);
  alert('✅ Informações salvas!');
}

// ─── EVENTS ───
function attachEvents() {
  const compSel = document.getElementById('comp-topbar');
  if (compSel) compSel.value = state.competencia;
}

// ─── BOOTSTRAP (orquestrador principal) ───
async function bootstrapApp() {
  try {
    console.log('[Bootstrap] Iniciando...');

    // 0. Sincroniza estado inicial da nuvem (Supabase) localmente
    if (window.CloudDB && typeof window.CloudDB.pullAll === 'function') {
      console.log('[Bootstrap] Puxando dados da Nuvem...');
      await window.CloudDB.pullAll();
    }

    // 1. Inicializa storage (sem seed de clientes)
    initDB();
    console.log('[Bootstrap] initDB() OK. clientes=', (DB.get('clientes')||[]).length);
    // 2. Seed de clientes e obrigações (seed.js é a fonte primária)
    if (typeof initSeed === 'function') {
      initSeed();
      console.log('[Bootstrap] initSeed() OK. clientes=', (DB.get('clientes')||[]).length);
    } else {
      console.warn('[Bootstrap] initSeed não encontrada!');
    }
    // 3. Atualiza contagem no sidebar
    const countEl = document.getElementById('sidebar-count');
    if (countEl) {
      const total = (DB.get('clientes') || []).length;
      if (total > 0) countEl.textContent = total + ' clientes cadastrados';
    }
    // 4. Binds e primeira renderização
    const compEl = document.getElementById('comp-topbar');
    if (compEl) {
      compEl.addEventListener('change', e => {
        state.competencia = e.target.value;
        render();
      });
    }
    navigate('dashboard');
    console.log('[Bootstrap] Completo!');
  } catch (err) {
    console.error('[Bootstrap] ERRO:', err);
  }
}

// ─── INIT ───
let _bootstrapped = false;
function bootstrapAppOnce() {
  if (_bootstrapped) return;
  _bootstrapped = true;
  bootstrapApp();
}
document.addEventListener('DOMContentLoaded', bootstrapAppOnce);


// ─── PLANO DE CONTAS ───
let pcView = 'list';   // 'list' | 'detail' | 'historico'
let pcPlanId = null;   // currently selected plan id

function renderPlanoContas() {
  const planos = DB.get('planos_contas') || [];
  const historico = DB.get('plano_historico') || null;

  const topBar = `
<div class="card mb-4" style="background:linear-gradient(135deg,#1e3a8a,#0f766e);color:#fff;padding:18px 24px">
  <h2 style="font-size:15px;margin-bottom:4px">📊 Plano de Contas</h2>
  <p style="opacity:.8;font-size:12px">Importe, gerencie múltiplos planos e exporte no layout do Domínio Único.</p>
</div>
<div class="card mb-4" style="padding:14px 20px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
  <button class="btn btn-primary btn-sm" onclick="pcView='list';pcPlanId=null;render()">📋 Meus Planos</button>
  <button class="btn btn-ghost btn-sm" onclick="pcView='historico';render()">📚 Modelo Histórico</button>
  <span style="margin-left:auto;display:flex;gap:8px">
    <label class="btn btn-ghost btn-sm" style="cursor:pointer">
      ➕ Importar Plano (CSV)
      <input type="file" accept=".csv,.txt" style="display:none" onchange="importarPlano(this)">
    </label>
    <label class="btn btn-ghost btn-sm" style="cursor:pointer">
      📚 Importar Modelo Histórico (CSV)
      <input type="file" accept=".csv,.txt" style="display:none" onchange="importarHistorico(this)">
    </label>
  </span>
</div>`;

  if (pcView === 'historico') {
    if (!historico) return topBar + `<div class="empty-state"><div class="empty-icon">📚</div><p>Nenhum modelo histórico importado.<br>Use o botão "Importar Modelo Histórico (CSV)" acima.</p></div>`;
    const rows = historico.contas.slice(0,200).map(c => renderContaRow(c)).join('');
    return `${topBar}
<div class="card mb-4" style="border-left:4px solid #0f766e;padding:14px 20px;display:flex;align-items:center;gap:10px">
  <strong>📚 Modelo Histórico — ${historico.nome}</strong>
  <span class="text-muted text-sm">${historico.contas.length} contas · Importado em ${historico.data}</span>
  <button class="btn btn-ghost btn-sm" style="margin-left:auto" onclick="exportarDominioUnico('historico')">⬇️ Exportar Domínio Único</button>
</div>
<div class="card"><div class="table-wrap"><table>
  <thead><tr><th>Cód.</th><th>Descrição</th><th>Tipo</th><th>Nível</th><th>Natureza</th></tr></thead>
  <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">Sem contas</td></tr>'}</tbody>
</table></div></div>`;
  }

  if (pcView === 'detail' && pcPlanId !== null) {
    const plano = planos.find(p => p.id === pcPlanId);
    if (!plano) { pcView='list'; return renderPlanoContas(); }
    const rows = plano.contas.slice(0,500).map(c => renderContaRow(c)).join('');
    return `${topBar}
<div class="card mb-4" style="border-left:4px solid var(--primary);padding:14px 20px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
  <button class="btn btn-ghost btn-sm" onclick="pcView='list';pcPlanId=null;render()">← Voltar</button>
  <strong>${plano.nome}</strong>
  <span class="text-muted text-sm">${plano.contas.length} contas · ${plano.data}</span>
  <div style="margin-left:auto;display:flex;gap:8px">
    <button class="btn btn-ghost btn-sm" onclick="exportarDominioUnico(${pcPlanId})">⬇️ Exportar Domínio Único</button>
    <button class="btn btn-danger btn-sm" onclick="excluirPlano(${pcPlanId})">🗑️ Excluir</button>
  </div>
</div>
<div class="card"><div class="table-wrap"><table>
  <thead><tr><th>Cód.</th><th>Descrição</th><th>Tipo</th><th>Nível</th><th>Natureza</th></tr></thead>
  <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">Sem contas</td></tr>'}</tbody>
</table></div></div>`;
  }

  // ── LIST VIEW ──
  if (!planos.length) return topBar + `<div class="empty-state"><div class="empty-icon">📊</div><p>Nenhum plano de contas importado.<br>Use o botão "Importar Plano (CSV)" acima.</p></div>`;

  const cards = planos.map(p => `
<div class="card" style="display:flex;align-items:center;gap:14px;padding:16px 20px;margin-bottom:10px;cursor:pointer" onclick="pcPlanId=${p.id};pcView='detail';render()">
  <div style="width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,var(--primary-light),var(--accent));display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">📊</div>
  <div style="flex:1">
    <div style="font-weight:700">${p.nome}</div>
    <div class="text-muted text-sm">${p.contas.length} contas · Importado em ${p.data}</div>
  </div>
  <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();pcPlanId=${p.id};exportarDominioUnico(${p.id})">⬇️ Exportar</button>
  <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();excluirPlano(${p.id})">🗑️</button>
</div>`).join('');

  return `${topBar}${cards}`;
}

function renderContaRow(c) {
  const tipo = c.tipo || c.Tipo || c[2] || '';
  const nivel = c.nivel || c.Nivel || c[3] || '';
  const natureza = c.natureza || c.Natureza || c[4] || '';
  const cod  = c.codigo || c.Codigo || c[0] || '';
  const desc = c.descricao || c.Descricao || c[1] || '';
  return `<tr>
    <td style="font-family:monospace;font-size:12px">${cod}</td>
    <td>${'&nbsp;'.repeat((parseInt(nivel)||1)*2)}${desc}</td>
    <td><span class="badge badge-${tipo==='S'?'blue':tipo==='A'?'green':'gray'}">${tipo==='S'?'Sintética':tipo==='A'?'Analítica':tipo||'—'}</span></td>
    <td style="text-align:center">${nivel}</td>
    <td>${natureza}</td>
  </tr>`;
}

function parseContasCSV(text) {
  const lines = text.trim().split('\n').filter(l => l.trim());
  const sep   = lines[0].includes(';') ? ';' : ',';
  const header = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g,'').toLowerCase());
  return lines.slice(1).map(line => {
    const cols = line.split(sep).map(v => v.trim().replace(/^"|"$/g,''));
    const obj = {};
    // Detect columns by header or by position
    if (header.some(h => h.includes('cod') || h.includes('conta'))) {
      header.forEach((h,i) => obj[h] = cols[i]);
      // Normalize key names
      return {
        codigo:    obj['codigo'] || obj['cod'] || obj['conta'] || cols[0] || '',
        descricao: obj['descricao'] || obj['nome'] || obj['description'] || cols[1] || '',
        tipo:      (obj['tipo'] || cols[2] || '').charAt(0).toUpperCase(),
        nivel:     obj['nivel'] || obj['level'] || cols[3] || '',
        natureza:  obj['natureza'] || obj['dc'] || cols[4] || '',
      };
    }
    return { codigo: cols[0]||'', descricao: cols[1]||'', tipo: (cols[2]||'').charAt(0).toUpperCase(), nivel: cols[3]||'', natureza: cols[4]||'' };
  }).filter(c => c.codigo);
}

function importarPlano(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const contas = parseContasCSV(e.target.result);
    const planos = DB.get('planos_contas') || [];
    const nome   = file.name.replace(/\.(csv|txt)$/i,'');
    const id     = Date.now();
    planos.push({ id, nome, contas, data: new Date().toLocaleDateString('pt-BR') });
    DB.set('planos_contas', planos);
    pcPlanId = id; pcView = 'detail';
    render();
  };
  reader.readAsText(file, 'UTF-8');
  input.value = '';
}

function importarHistorico(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const contas = parseContasCSV(e.target.result);
    const nome   = file.name.replace(/\.(csv|txt)$/i,'');
    DB.set('plano_historico', { nome, contas, data: new Date().toLocaleDateString('pt-BR') });
    pcView = 'historico';
    render();
  };
  reader.readAsText(file, 'UTF-8');
  input.value = '';
}

function excluirPlano(id) {
  if (!confirm('Excluir este plano de contas?')) return;
  let planos = DB.get('planos_contas') || [];
  planos = planos.filter(p => p.id !== id);
  DB.set('planos_contas', planos);
  pcPlanId = null; pcView = 'list';
  render();
}

// ─── EXPORTAR NO LAYOUT DOMÍNIO ÚNICO ───
// Domínio Único espera: Codigo;Descricao;Tipo(S/A);Nivel;Natureza(D/C/DC)
function exportarDominioUnico(planIdOrHistorico) {
  let contas, nome;
  if (planIdOrHistorico === 'historico') {
    const h = DB.get('plano_historico');
    if (!h) return;
    contas = h.contas; nome = h.nome;
  } else {
    const planos = DB.get('planos_contas') || [];
    const p = planos.find(x => x.id === planIdOrHistorico);
    if (!p) return;
    contas = p.contas; nome = p.nome;
  }
  // Cabeçalho layout Domínio Único
  const header = 'CODIGO;DESCRICAO;TIPO;NIVEL;NATUREZA;CONTA_REDUZIDA;CONTA_RESULTADO\r\n';
  const rows = contas.map(c => {
    const cod  = (c.codigo||'').replace(/;/g,'');
    const desc = (c.descricao||'').replace(/;/g,'');
    const tipo = c.tipo === 'A' ? 'A' : 'S';      // Analítica / Sintética
    const niv  = c.nivel || '1';
    const nat  = c.natureza || 'DC';               // Devedora, Credora ou DC
    return `${cod};${desc};${tipo};${niv};${nat};;`;
  }).join('\r\n');
  const blob = new Blob(['\ufeff' + header + rows], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `PlanoContas_DominioUnico_${nome.replace(/\s/g,'_')}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

// ─── TREINAMENTO DA EQUIPE ───
const TRILHAS_TREINAMENTO = [
  {
    id:'auxiliar', nivel:1, titulo:'📘 Auxiliar Contábil', cor:'#3b82f6',
    objetivo:'Executar tarefas com precisão e disciplina, sem análise crítica profunda.',
    criterios:['Não comete erros operacionais recorrentes','Entrega dentro do prazo','Segue padrão sem supervisão constante'],
    modulos:[
      { id:'aux1', titulo:'1. Fundamentos Contábeis',
        conteudo:['O que é contabilidade (ativo, passivo, resultado)','Regime de competência x caixa','Estrutura básica das demonstrações contábeis'],
        quiz:[
          { q:'O regime de competência reconhece receitas e despesas:', op:['Na data do pagamento','Na data do fato gerador','Na data do recebimento'], r:1 },
          { q:'O Ativo representa:', op:['Obrigações da empresa','Bens e direitos da empresa','Resultado do período'], r:1 },
          { q:'A DRE demonstra:', op:['O resultado econômico do período','A posição patrimonial','O fluxo de caixa'], r:0 },
        ]
      },
      { id:'aux2', titulo:'2. Documentos e Nomenclaturas',
        conteudo:['Tipos de notas fiscais: entrada e saída (NF-e / NFS-e)','Extratos bancários: leitura e organização','Padrão de nomenclatura: Tipo_Documento_Data_Valor'],
        quiz:[
          { q:'Como nomear corretamente um arquivo?', op:['QualquerNome','Tipo_Documento_Data_Valor','DocumentoCliente2024'], r:1 },
          { q:'NF-e significa:', op:['Nota Fiscal Especial','Nota Fiscal Eletrônica','Nota de Fechamento'], r:1 },
        ]
      },
      { id:'aux3', titulo:'3. Rotinas Operacionais',
        conteudo:['Importação de dados no sistema','Conferência: valores, datas e sequência','Boas práticas: nunca assumir informação sem validar documento'],
        quiz:[
          { q:'Ao receber um documento sem data, devo:', op:['Lançar com data de hoje','Solicitar ao cliente','Ignorar e lançar assim mesmo'], r:1 },
          { q:'Um lançamento contábil básico exige:', op:['Apenas débito','Débito e crédito em valor igual','Apenas crédito'], r:1 },
        ]
      },
    ]
  },
  {
    id:'assistente', nivel:2, titulo:'📗 Assistente Contábil', cor:'#10b981',
    objetivo:'Executar com consciência do impacto contábil e identificar inconsistências.',
    criterios:['Identifica erros antes do analista','Entende o impacto das falhas','Consegue justificar lançamentos'],
    modulos:[
      { id:'ass1', titulo:'1. Estrutura Contábil e Classificações',
        conteudo:['Classificação: ativo, passivo, despesa, receita','Grupos e subgrupos do plano de contas','Diferença entre resultado e patrimônio'],
        quiz:[
          { q:'Aluguel pago é classificado como:', op:['Ativo','Despesa','Passivo'], r:1 },
          { q:'Empréstimo bancário recebido é:', op:['Receita','Despesa','Passivo — obrigação'], r:2 },
        ]
      },
      { id:'ass2', titulo:'2. Integrações Fiscal e Folha',
        conteudo:['Fiscal: conferir notas emitidas x lançados no sistema','Folha: provisões de férias, 13° e encargos','Identificar divergências entre módulos'],
        quiz:[
          { q:'Provisão de férias deve ser registrada:', op:['Apenas na baixa','Mensalmente, quando incorrida','Somente quando paga'], r:1 },
          { q:'Discrepância entre SPED Fiscal e contabilidade indica:', op:['Normalidade','Possível erro de lançamento','Diferença cambial'], r:1 },
        ]
      },
      { id:'ass3', titulo:'3. Conciliações e Checklist',
        conteudo:['Conciliação bancária: extrato x livro caixa','Conciliação de cartão de crédito','Preenchimento correto do checklist: Recebido / Pendente / Divergente'],
        quiz:[
          { q:'Um valor no extrato sem contrapartida contábil é:', op:['Normal','Pendência a investigar','Lucro extra'], r:1 },
          { q:'Ao identificar divergência, devo:', op:['Corrigir sem registrar','Registrar apontamento e informar analista','Ignorar se valor pequeno'], r:1 },
        ]
      },
    ]
  },
  {
    id:'analista', nivel:3, titulo:'📙 Analista Contábil', cor:'#f59e0b',
    objetivo:'Validar, interpretar e gerar posicionamento técnico.',
    criterios:['Assume carteira de clientes com autonomia','Reduz risco do escritório','Gera valor consultivo'],
    modulos:[
      { id:'an1', titulo:'1. Revisão e Fechamento Contábil',
        conteudo:['Fechamento: amarrações resultado x caixa','Conferência fiscal x contábil','Validar balancete antes do fechamento definitivo'],
        quiz:[
          { q:'Antes de fechar o mês devo garantir:', op:['Apenas os lançamentos','Checklist validado + conciliações + apontamentos','Somente o DAS pago'], r:1 },
          { q:'Diferença entre lucro contábil e saldo bancário deve ser:', op:['Ignorada','Conciliada e explicada','Ajustada arbitrariamente'], r:1 },
        ]
      },
      { id:'an2', titulo:'2. Análise de Demonstrações',
        conteudo:['Leitura e interpretação da DRE','Análise do Balanço Patrimonial','Identificar variações relevantes mês a mês'],
        quiz:[
          { q:'Queda brusca de receita merece:', op:['Ignorar','Registrar apontamento e comunicar cliente','Ajustar para parecer melhor'], r:1 },
          { q:'O Balanço deve obedecer:', op:['Ativo = Passivo','Ativo = Passivo + Patrimônio Líquido','Receita = Despesa'], r:1 },
        ]
      },
      { id:'an3', titulo:'3. Parecer Técnico e Auditoria',
        conteudo:['Estrutura: apontamento + impacto + recomendação','Risco fiscal e risco contábil','Regra de ouro: nenhuma contabilidade sem conciliação + checklist + apontamentos'],
        quiz:[
          { q:'Um parecer técnico deve conter:', op:['Apenas o problema','Problema + impacto + recomendação','Apenas a recomendação'], r:1 },
          { q:'Risco fiscal alto significa:', op:['Empresa muito lucrativa','Possibilidade de autuação pela Receita','Saldo de caixa elevado'], r:1 },
        ]
      },
    ]
  },
];

let tView='list', tTrilhaId=null, tModuloId=null, tQuizAns={};

function renderTreinamento() {
  const prog = DB.get('treinamento_prog') || {};

  if (tView==='list') {
    const cards = TRILHAS_TREINAMENTO.map(t => {
      const totalQ = t.modulos.reduce((a,m)=>a+(m.quiz?.length||0),0);
      const doneQ  = t.modulos.reduce((a,m)=>a+(m.quiz?.filter((_,qi)=>prog[t.id+'_'+m.id+'_q'+qi]!==undefined).length||0),0);
      const pct = totalQ?Math.round(doneQ/totalQ*100):0;
      return `<div class="card" style="display:flex;align-items:center;gap:16px;padding:18px 22px;margin-bottom:10px;cursor:pointer;border-left:4px solid ${t.cor}" onclick="tTrilhaId='${t.id}';tView='trilha';render()">
        <div style="font-size:30px">${t.titulo.split(' ')[0]}</div>
        <div style="flex:1">
          <div style="font-weight:700;font-size:14px">${t.titulo.replace(/^. /,'')}</div>
          <div class="text-muted text-sm" style="margin:2px 0">${t.objetivo}</div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:5px">
            <div class="progress-bar" style="flex:1;max-width:180px"><div class="progress-fill" style="width:${pct}%;background:${t.cor}"></div></div>
            <span class="text-sm">${pct}% concluído</span>
          </div>
        </div>
        <span class="badge" style="background:${t.cor}22;color:${t.cor}">Nível ${t.nivel}</span>
      </div>`;
    }).join('');
    return `
<div class="card mb-4" style="background:linear-gradient(135deg,#1e3a8a,#7c3aed);color:#fff;padding:18px 24px">
  <h2 style="font-size:15px;margin-bottom:4px">🎓 Treinamento da Equipe</h2>
  <p style="opacity:.8;font-size:12px">Trilha de qualificação por nível — baseado no Cronograma de Qualificação de Colaborador</p>
</div>
${cards}
<div class="card" style="padding:14px 18px;background:#f8fafc;border-left:4px solid #10b981;margin-top:4px">
  <strong>📋 Fluxo Operacional — 10 Etapas obrigatórias</strong>
  <div class="text-muted text-sm" style="margin-top:6px;line-height:1.9">
    1 Recebimento → 2 Organização → 3 Checklist → 4 Conferência → 5 Integração de Dados<br>
    6 Lançamentos → 7 Conciliações → 8 Apontamentos → 9 Envio ao Analista → 10 Retorno ao Cliente
  </div>
  <div style="margin-top:8px;font-size:12px;font-weight:600;color:#065f46">
    ✔ Nenhuma contabilidade é concluída sem: Conciliação + Checklist + Apontamentos
  </div>
</div>`;
  }

  const trilha = TRILHAS_TREINAMENTO.find(t=>t.id===tTrilhaId);
  if (!trilha) { tView='list'; return renderTreinamento(); }

  if (tView==='trilha') {
    const modsHtml = trilha.modulos.map(m => {
      const tot = m.quiz?.length||0;
      const done = tot?m.quiz.filter((_,qi)=>prog[trilha.id+'_'+m.id+'_q'+qi]!==undefined).length:0;
      const pct  = tot?Math.round(done/tot*100):0;
      const acertos = tot?m.quiz.filter((_,qi)=>prog[trilha.id+'_'+m.id+'_q'+qi]===true).length:0;
      return `<div class="card" style="display:flex;align-items:center;gap:14px;padding:14px 18px;margin-bottom:8px;cursor:pointer" onclick="tModuloId='${m.id}';tView='modulo';render()">
        <div style="flex:1"><div style="font-weight:600">${m.titulo}</div><div class="text-muted text-sm">${m.conteudo.length} tópicos · ${tot} questões</div></div>
        ${pct===100?`<span class="badge badge-green">✅ ${acertos}/${tot} certas</span>`:done?`<span class="badge badge-yellow">⏳ ${pct}%</span>`:'<span class="badge badge-gray">Não iniciado</span>'}
      </div>`;
    }).join('');
    return `
<div class="card mb-4" style="border-left:4px solid ${trilha.cor};padding:14px 20px;display:flex;align-items:center;gap:10px">
  <button class="btn btn-ghost btn-sm" onclick="tView='list';render()">← Voltar</button>
  <strong>${trilha.titulo}</strong>
  <span class="badge" style="background:${trilha.cor}22;color:${trilha.cor}">Nível ${trilha.nivel}</span>
</div>
<div class="card mb-4" style="padding:14px 18px;background:#f8fafc">
  <strong>🎯 Objetivo:</strong> <span class="text-muted">${trilha.objetivo}</span><br><br>
  <strong>✅ Critérios de evolução:</strong>
  <ul style="margin:6px 0 0 18px;font-size:13px;color:var(--text-muted)">${trilha.criterios.map(c=>`<li>${c}</li>`).join('')}</ul>
</div>
${modsHtml}`;
  }

  const modulo = trilha.modulos.find(m=>m.id===tModuloId);
  if (!modulo) { tView='trilha'; return renderTreinamento(); }

  if (tView==='modulo') {
    return `
<div class="card mb-4" style="padding:14px 20px;display:flex;align-items:center;gap:10px">
  <button class="btn btn-ghost btn-sm" onclick="tView='trilha';render()">← Voltar</button>
  <strong>${modulo.titulo}</strong>
</div>
<div class="card mb-4">
  <div style="font-weight:700;margin-bottom:10px">📚 Conteúdo</div>
  ${modulo.conteudo.map(c=>`<div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:${trilha.cor}">▸</span>${c}</div>`).join('')}
</div>
${modulo.quiz?.length?`<div class="card">
  <div style="font-weight:700;margin-bottom:8px">📝 Prova deste módulo — ${modulo.quiz.length} questões</div>
  <button class="btn btn-primary" onclick="tQuizAns={};tView='quiz';render()">▶ Iniciar Prova</button>
</div>`:''}`;
  }

  if (tView==='quiz') {
    const allDone = modulo.quiz.every((_,i)=>tQuizAns[i]!==undefined);
    const qHtml = modulo.quiz.map((q,qi)=>{
      const answered = tQuizAns[qi];
      return `<div class="card mb-3" style="padding:16px 20px${answered!==undefined?';border-left:4px solid '+(q.r===answered?'#10b981':'#ef4444'):''}">
        <div style="font-weight:600;margin-bottom:10px">${qi+1}. ${q.q}</div>
        ${q.op.map((op,oi)=>{
          let bg='var(--bg)',col='var(--text)';
          if(answered!==undefined){if(oi===q.r){bg='#d1fae5';col='#065f46';}else if(oi===answered&&answered!==q.r){bg='#fee2e2';col='#991b1b';}}
          return `<div style="padding:8px 14px;border-radius:8px;background:${bg};color:${col};margin-bottom:6px;cursor:${answered!==undefined?'default':'pointer'};border:1px solid var(--border);font-size:13px"
            onclick="${answered!==undefined?'':'tQuizAns['+qi+']='+oi+';render()'}">${answered!==undefined&&oi===q.r?'✅ ':answered===oi&&answered!==q.r?'❌ ':''}${op}</div>`;
        }).join('')}
      </div>`;
    }).join('');
    const acertos = allDone?modulo.quiz.filter((_,i)=>tQuizAns[i]===modulo.quiz[i].r).length:0;
    return `
<div class="card mb-4" style="padding:14px 20px;display:flex;align-items:center;gap:10px">
  <button class="btn btn-ghost btn-sm" onclick="tView='modulo';render()">← Voltar ao Conteúdo</button>
  <strong>📝 ${modulo.titulo}</strong>
</div>
${qHtml}
${allDone?`<div class="card" style="padding:16px 20px;background:#f0fdf4;border-left:4px solid #10b981;display:flex;align-items:center;gap:12px">
  <strong>Prova concluída!</strong>
  <span class="text-muted text-sm">${acertos}/${modulo.quiz.length} acertos</span>
  <span class="badge ${acertos===modulo.quiz.length?'badge-green':acertos>=modulo.quiz.length/2?'badge-yellow':'badge-red'}">${Math.round(acertos/modulo.quiz.length*100)}%</span>
  <button class="btn btn-success" style="margin-left:auto" onclick="finalizarQuiz('${trilha.id}','${modulo.id}')">💾 Salvar Resultado</button>
</div>`:''}`;
  }
  return '';
}

function finalizarQuiz(trilhaId, moduloId) {
  const prog = DB.get('treinamento_prog') || {};
  const t = TRILHAS_TREINAMENTO.find(x=>x.id===trilhaId);
  const m = t?.modulos.find(x=>x.id===moduloId);
  if (!m) return;
  m.quiz.forEach((q,i)=>{ prog[trilhaId+'_'+moduloId+'_q'+i]=(tQuizAns[i]===q.r); });
  DB.set('treinamento_prog', prog);
  tQuizAns={}; tView='trilha'; render();
}

// ─── INTEGRAÇÃO — IMPORT & EXPORT ───
let intTab = 'import';  // 'import' | 'export'

function renderIntegracao() {
  const tabBtn = (id, label, icon) =>
    `<button class="btn ${intTab===id?'btn-primary':'btn-ghost'} btn-sm" onclick="intTab='${id}';render()">${icon} ${label}</button>`;

  const header = `
<div class="card mb-4" style="background:linear-gradient(135deg,#1e3a8a,#7c3aed);color:#fff;padding:18px 24px">
  <h2 style="font-size:15px;margin-bottom:4px">🔄 Integração — Import &amp; Export</h2>
  <p style="opacity:.8;font-size:12px">Importe dados externos e exporte relatórios em formatos compatíveis com Domínio Único e planilhas</p>
</div>
<div class="card mb-4" style="padding:12px 18px;display:flex;gap:8px;flex-wrap:wrap">
  ${tabBtn('import','Importação','⬆️')}
  ${tabBtn('export','Exportação','⬇️')}
</div>`;

  if (intTab === 'import') {
    return header + renderIntegracaoImport();
  } else {
    return header + renderIntegracaoExport();
  }
}

function renderIntegracaoImport() {
  const clientes = DB.get('clientes') || [];
  return `
<div class="card mb-4">
  <div style="font-weight:700;font-size:14px;margin-bottom:12px">📥 Importar Clientes (CSV)</div>
  <p class="text-muted text-sm mb-3">
    Arquivo CSV com colunas: <code>id;nome;cnpj;regime;status;tipo_operacao;complexidade</code><br>
    Regimes aceitos: Simples Nacional, Lucro Presumido, Lucro Real, MEI
  </p>
  <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
    <label class="btn btn-ghost btn-sm" style="cursor:pointer">
      📂 Selecionar CSV de Clientes
      <input type="file" accept=".csv" style="display:none" onchange="importarClientesCSV(this)">
    </label>
    <button class="btn btn-ghost btn-sm" onclick="baixarModeloClientesCSV()">⬇️ Baixar Modelo CSV</button>
    <span class="text-muted text-sm">${clientes.length} clientes já cadastrados</span>
  </div>
  <div id="import-status-cli" style="margin-top:8px;font-size:13px"></div>
</div>

<div class="card mb-4">
  <div style="font-weight:700;font-size:14px;margin-bottom:12px">🔄 Recarregar Base de 87 Clientes</div>
  <p class="text-muted text-sm mb-3">Adiciona os 87 clientes da carteira Criscontab &amp; Madeira sem apagar dados existentes.</p>
  <button class="btn btn-primary btn-sm" onclick="const n=seedClientes();document.getElementById('seed-status').textContent=n?'✅ '+n+' clientes adicionados!':'ℹ️ Todos os clientes já estão cadastrados.'">
    ➕ Adicionar Clientes Base
  </button>
  <span id="seed-status" class="text-muted text-sm" style="margin-left:10px"></span>
</div>

<div class="card mb-4">
  <div style="font-weight:700;font-size:14px;margin-bottom:12px">📋 Importar Checklist (JSON)</div>
  <p class="text-muted text-sm mb-3">Importe um backup do checklist mensal exportado anteriormente.</p>
  <label class="btn btn-ghost btn-sm" style="cursor:pointer">
    📂 Selecionar backup JSON
    <input type="file" accept=".json" style="display:none" onchange="importarChecklistJSON(this)">
  </label>
  <div id="import-status-chk" style="margin-top:8px;font-size:13px"></div>
</div>

<div class="card mb-4">
  <div style="font-weight:700;font-size:14px;margin-bottom:12px">📎 Anexar Arquivos a Obrigações Acessórias</div>
  <p class="text-muted text-sm mb-3">
    Anexe recibos e declarações (DEFIS, ECD, ECF etc.) diretamente no registro da obrigação.<br>
    Os arquivos ficam referenciados no sistema para validação em Auditoria.
  </p>
  ${renderDefisAttach()}
</div>`;
}

function renderDefisAttach() {
  const clientes = (DB.get('clientes') || []).filter(c => c.status === 'Ativo');
  const obgData  = DB.get('obrigacoes') || {};
  const anos     = ['2024','2025','2026'];
  const obgs     = ['DEFIS','ECD','ECF','RAIS','DIRF','DASN-MEI'];

  const opts = clientes.map(c =>
    `<option value="${c.id}">${c.id} — ${c.nome}</option>`).join('');
  const optAnos = anos.map(a => `<option>${a}</option>`).join('');
  const optObgs = obgs.map(o => `<option>${o}</option>`).join('');

  return `<div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;margin-bottom:10px">
    <div class="form-group" style="min-width:200px">
      <label>Cliente</label>
      <select id="atch-cli" style="border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-family:inherit;font-size:13px">
        <option value="">— selecione —</option>${opts}
      </select>
    </div>
    <div class="form-group">
      <label>Obrigação</label>
      <select id="atch-obg" style="border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-family:inherit;font-size:13px">${optObgs}</select>
    </div>
    <div class="form-group">
      <label>Ano</label>
      <select id="atch-ano" style="border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-family:inherit;font-size:13px">${optAnos}</select>
    </div>
    <div class="form-group">
      <label>Tipo</label>
      <select id="atch-tipo" style="border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-family:inherit;font-size:13px">
        <option value="recibo">Recibo de Entrega</option>
        <option value="declaracao">Declaração</option>
        <option value="guia">Guia/DARF</option>
        <option value="outro">Outro Documento</option>
      </select>
    </div>
  </div>
  <label class="btn btn-ghost btn-sm" style="cursor:pointer">
    📎 Selecionar Arquivo (PDF/imagem)
    <input type="file" accept=".pdf,.png,.jpg,.jpeg" style="display:none" onchange="salvarAnexoObg(this)">
  </label>
  <div id="atch-status" style="margin-top:8px;font-size:13px"></div>
  <div id="atch-list" style="margin-top:10px">${renderAnexosList()}</div>`;
}

function renderAnexosList() {
  const obgData = DB.get('obrigacoes') || {};
  const rows = Object.entries(obgData)
    .filter(([,d]) => d.arquivo_nome)
    .map(([k,d]) => {
      const [cliId, cod, ano] = k.split('_');
      const cli = (DB.get('clientes')||[]).find(c=>c.id===cliId);
      return `<div style="display:flex;align-items:center;gap:10px;padding:6px 12px;border:1px solid var(--border);border-radius:8px;margin-bottom:4px;font-size:12px">
        <span class="badge badge-green">📎</span>
        <span><strong>${cod} ${ano}</strong> — ${cli?.nome||cliId}</span>
        <span class="text-muted">${d.arquivo_nome}</span>
        <span class="text-muted">${d.arquivo_tipo||''}  ${d.data_entrega||''}</span>
        <button class="btn btn-danger btn-sm" style="margin-left:auto;font-size:10px" onclick="removerAnexoObg('${k}')">✕</button>
      </div>`;
    }).join('');
  return rows || '<p class="text-muted text-sm">Nenhum arquivo anexado ainda.</p>';
}

function salvarAnexoObg(input) {
  const file = input.files[0]; if (!file) return;
  const cliId = document.getElementById('atch-cli').value;
  const obg   = document.getElementById('atch-obg').value;
  const ano   = document.getElementById('atch-ano').value;
  const tipo  = document.getElementById('atch-tipo').value;
  if (!cliId) { document.getElementById('atch-status').textContent='❌ Selecione o cliente.'; return; }
  const k = `${cliId}_${obg}_${ano}`;
  const obgData = DB.get('obrigacoes') || {};
  obgData[k] = obgData[k] || {};
  obgData[k].arquivo_nome  = file.name;
  obgData[k].arquivo_tipo  = tipo;
  if (!obgData[k].status) obgData[k].status = 'entregue';
  if (!obgData[k].data_entrega) obgData[k].data_entrega = new Date().toISOString().split('T')[0];
  DB.set('obrigacoes', obgData);
  document.getElementById('atch-status').textContent = `✅ Arquivo "${file.name}" vinculado a ${obg} ${ano}!`;
  document.getElementById('atch-list').innerHTML = renderAnexosList();
  input.value = '';
}

function removerAnexoObg(k) {
  const obgData = DB.get('obrigacoes') || {};
  if (obgData[k]) { delete obgData[k].arquivo_nome; delete obgData[k].arquivo_tipo; }
  DB.set('obrigacoes', obgData);
  document.getElementById('atch-list').innerHTML = renderAnexosList();
}

function importarClientesCSV(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const lines = e.target.result.trim().split('\n').filter(l=>l.trim());
    const sep   = lines[0].includes(';') ? ';' : ',';
    const header = lines[0].split(sep).map(h=>h.toLowerCase().trim());
    const clientes = DB.get('clientes') || [];
    const existingIds = new Set(clientes.map(c=>c.id));
    let added = 0;
    lines.slice(1).forEach(line => {
      const cols = line.split(sep).map(v=>v.trim().replace(/^"|"$/g,''));
      const obj  = {}; header.forEach((h,i)=>obj[h]=cols[i]);
      const id   = obj['id'] || obj['cod'] || obj['codigo'] || cols[0];
      if (!id || existingIds.has(id)) return;
      clientes.push({
        id, nome: obj['nome']||cols[1]||'', cnpj: obj['cnpj']||cols[2]||'',
        regime: obj['regime']||obj['enquadramento']||cols[3]||'Simples Nacional',
        status: obj['status']||'Ativo', tipo_operacao: obj['tipo_operacao']||'Serviço',
        complexidade: obj['complexidade']||'Simples',
        erp:'Domínio Único', bancos:[], parc_federal:false, parc_estadual:false,
        parc_pref:false, parc_pgfn:false, drive_url:'',
        criado_em: new Date().toISOString(),
      });
      existingIds.add(id); added++;
    });
    DB.set('clientes', clientes);
    document.getElementById('import-status-cli').innerHTML =
      `<span style="color:var(--success)">✅ ${added} client(es) importado(s). Total: ${clientes.length}</span>`;
    input.value='';
  };
  reader.readAsText(file, 'UTF-8');
}

function importarChecklistJSON(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      const existing = DB.get('checklists') || {};
      let count = 0;
      Object.entries(data).forEach(([k,v]) => { if (!existing[k]) { existing[k]=v; count++; } });
      DB.set('checklists', existing);
      document.getElementById('import-status-chk').innerHTML =
        `<span style="color:var(--success)">✅ ${count} competência(s) importada(s).</span>`;
    } catch(err) {
      document.getElementById('import-status-chk').innerHTML =
        `<span style="color:var(--danger)">❌ Erro: JSON inválido.</span>`;
    }
    input.value='';
  };
  reader.readAsText(file, 'UTF-8');
}

function baixarModeloClientesCSV() {
  const header = 'id;nome;cnpj;regime;status;tipo_operacao;complexidade\r\n';
  const exemplo = '001;EMPRESA EXEMPLO LTDA;00.000.000/0001-00;Simples Nacional;Ativo;Serviço;Simples\r\n';
  const blob = new Blob(['\ufeff'+header+exemplo], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download='modelo_importacao_clientes.csv'; a.click(); URL.revokeObjectURL(a.href);
}

function renderIntegracaoExport() {
  return `
<div class="card mb-4">
  <div style="font-weight:700;font-size:14px;margin-bottom:12px">⬇️ Exportar Clientes (CSV)</div>
  <p class="text-muted text-sm mb-3">Exporta todos os clientes cadastrados com CNPJ, regime e status.</p>
  <button class="btn btn-ghost btn-sm" onclick="exportarClientesCSV()">⬇️ Baixar Clientes.csv</button>
</div>

<div class="card mb-4">
  <div style="font-weight:700;font-size:14px;margin-bottom:12px">⬇️ Exportar Checklist por Competência (CSV)</div>
  <p class="text-muted text-sm mb-3">Exporta o status de todos os documentos de todas as competências.</p>
  <button class="btn btn-ghost btn-sm" onclick="exportarChecklistCSV()">⬇️ Baixar Checklist.csv</button>
</div>

<div class="card mb-4">
  <div style="font-weight:700;font-size:14px;margin-bottom:12px">⬇️ Exportar Obrigações Acessórias (CSV)</div>
  <p class="text-muted text-sm mb-3">Status de todas as obrigações anuais e mensais por cliente.</p>
  <button class="btn btn-ghost btn-sm" onclick="exportarObrigacoesCSV()">⬇️ Baixar Obrigacoes.csv</button>
</div>

<div class="card mb-4">
  <div style="font-weight:700;font-size:14px;margin-bottom:12px">⬇️ Backup Completo (JSON)</div>
  <p class="text-muted text-sm mb-3">Exporta todos os dados do sistema (clientes, checklists, auditoria, obrigações) em JSON para backup.</p>
  <button class="btn btn-primary btn-sm" onclick="exportarBackupJSON()">💾 Baixar Backup_Sistema.json</button>
</div>`;
}

function exportarClientesCSV() {
  const clientes = DB.get('clientes') || [];
  const header = 'id;nome;cnpj;regime;status;tipo_operacao;complexidade;erp;drive_url\r\n';
  const rows = clientes.map(c =>
    `${c.id};${c.nome};${c.cnpj};${c.regime};${c.status};${c.tipo_operacao||''};${c.complexidade||''};${c.erp||''};${c.drive_url||''}`
  ).join('\r\n');
  downloadCSV('\ufeff'+header+rows, 'Clientes_Criscontab.csv');
}

function exportarChecklistCSV() {
  const checklists = DB.get('checklists') || {};
  const clientes   = DB.get('clientes')   || [];
  const rows = ['competencia;cliente_id;cliente_nome;documento;status'];
  Object.entries(checklists).forEach(([key, items]) => {
    const [cliId, comp] = key.split('_');
    const cli = clientes.find(c=>c.id===cliId);
    Object.entries(items).forEach(([doc, status]) => {
      rows.push(`${comp};${cliId};${cli?.nome||''};${doc.replace(/;/g,'')};${status}`);
    });
  });
  downloadCSV('\ufeff'+rows.join('\r\n'), 'Checklist_Criscontab.csv');
}

function exportarObrigacoesCSV() {
  const obgData  = DB.get('obrigacoes') || [];
  const clientes = DB.get('clientes')   || [];
  const rows = ['cliente_id;cliente_nome;obrigacao;periodo;status;data_entrega;arquivo'];
  Object.entries(obgData).forEach(([key, d]) => {
    const parts = key.split('_');
    const cliId = parts[0]; const cod = parts[1]; const periodo = parts.slice(2).join('-');
    const cli = clientes.find(c=>c.id===cliId);
    rows.push(`${cliId};${cli?.nome||''};${cod};${periodo};${d.status||''};${d.data_entrega||''};${d.arquivo_nome||''}`);
  });
  downloadCSV('\ufeff'+rows.join('\r\n'), 'Obrigacoes_Criscontab.csv');
}

function exportarBackupJSON() {
  const backup = {
    exportado_em: new Date().toISOString(),
    clientes:     DB.get('clientes')     || [],
    checklists:   DB.get('checklists')   || {},
    onboarding:   DB.get('onboarding')   || {},
    auditoria:    DB.get('auditoria')    || {},
    obrigacoes:   DB.get('obrigacoes')   || {},
    planos_contas:DB.get('planos_contas')|| [],
    plano_historico: DB.get('plano_historico') || null,
    treinamento_prog: DB.get('treinamento_prog') || {},
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], {type:'application/json'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=`Backup_Sistema_${new Date().toISOString().split('T')[0]}.json`;
  a.click(); URL.revokeObjectURL(a.href);
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=filename; a.click(); URL.revokeObjectURL(a.href);
}

// ══════════════════════════════════════════════════════════
// MOTOR CPC / ITG — Classificação por Regime Tributário
// ══════════════════════════════════════════════════════════
const CPC_ENGINE = {

  // SIMPLES NACIONAL e MEI → ITG 1000 (NBC TG 1000)
  'Simples Nacional': {
    norma_base: 'ITG 1000 — Modelo Contábil para Microempresa e Empresa de Pequeno Porte (NBC TG 1000)',
    cit_base: 'Resolução CFC n.º 1.418/2012 e NBC TG 1000 (atualizada)',
    regras: [
      { doc:'extrato', cpc:'ITG 1000 (item 1.4.3)', risco:'alto',
        impacto:'Impossibilidade de conciliação bancária. A NBC TG 1000 exige que as movimentações de caixa e bancos sejam integralmente registradas.',
        acao:'Solicitar extratos bancários completos do período. Sem eles a escrituração está incompleta.' },
      { doc:'nf-e', cpc:'ITG 1000 (item 1.4.1 — Receitas)', risco:'alto',
        impacto:'Sem NF-e de entrada e saída não é possível apurar receitas e despesas. Risco de omissão de receita perante a Receita Federal e SEFAZ.',
        acao:'Solicitar XMLs das NFs emitidas e recebidas no período.' },
      { doc:'folha', cpc:'ITG 1000 (item 1.4.2 — Custos e Despesas)', risco:'alto',
        impacto:'A folha de pagamento é insumo obrigatório para registro de salários, FGTS e INSS — despesas relevantes da DRE.',
        acao:'Solicitar holerites e relatórios de GPS/DCTF-Web do período.' },
      { doc:'das', cpc:'Res. CGSN n.º 140/2018, Art. 38', risco:'alto',
        impacto:'O DAS é a guia do Simples Nacional. Sem comprovante não é possível conciliar o passivo tributário nem demonstrar regularidade fiscal.',
        acao:'Solicitar DAS pagos ou verificar no PGDAS-D do eSocial/RFB.' },
      { doc:'defis', cpc:'Res. CGSN n.º 140/2018, Art. 66', risco:'alto',
        impacto:'DEFIS é obrigação acessória anual do Simples Nacional. A não entrega gera multa de R$500 a R$1.000 e pode resultar em exclusão.',
        acao:'Verificar entrega da DEFIS no Portal SIMEI / PGDAS.' },
    ]
  },

  'MEI': {
    norma_base: 'ITG 1000 — Modelo Contábil para MEI (NBC TG 1000)',
    cit_base: 'LC 123/2006, Art. 18-A; LC 128/2008; Res. CGSN 140/2018',
    regras: [
      { doc:'extrato', cpc:'LC 123/2006 + ITG 1000', risco:'medio',
        impacto:'MEI com múltiplas movimentações deve manter registros mínimos de entradas e saídas (Relatório Mensal de Receitas Brutas).',
        acao:'Verificar caderneta de receitas e extratos disponíveis.' },
      { doc:'dasn-mei', cpc:'Res. CGSN 140/2018, Art. 91', risco:'alto',
        impacto:'DASN-SIMEI é obrigação anual. Omissão impede emissão de certidão negativa e bloqueia benefícios previdenciários.',
        acao:'Verificar entrega da DASN-SIMEI até 31/05 de cada ano.' },
      { doc:'nf-e', cpc:'LC 128/2008 + ITG 1000', risco:'medio',
        impacto:'Para MEI com clientes PJ é obrigatória a emissão de NF. A ausência pode gerar exclusão da condição de MEI.',
        acao:'Verificar se o cliente emite NFs para pessoas jurídicas.' },
    ]
  },

  // LUCRO PRESUMIDO → CPCs selecionados + ITG 2000
  'Lucro Presumido': {
    norma_base: 'CPCs Completos + ITG 2000 (NBC TG 2000 — Escrituração Contábil)',
    cit_base: 'Lei 6.404/76; RIR/2018 (Dec. 9.580); IN RFB 2.004/2021; CPCs 26, 03, 30, 32, 33, 25',
    regras: [
      { doc:'extrato', cpc:'CPC 03 (DFC) + CPC 26 (Apresentação)', risco:'alto',
        impacto:'CPC 03 exige Demonstração dos Fluxos de Caixa. Sem extratos não há base para DFC e o Balanço Patrimonial fica sem conciliação bancária.',
        acao:'Exigir extratos bancários completos. Elaborar DFC pelo método direto ou indireto conforme CPC 03.' },
      { doc:'nf-e', cpc:'CPC 30 (Receitas) + CPC 47', risco:'alto',
        impacto:'CPC 30 exige o reconhecimento de receita quando do cumprimento da obrigação de desempenho. Sem NFs há subavaliação de receita bruta e distorção do LALUR.',
        acao:'Solicitar XMLs das NFs emitidas. Conferir com SPED Fiscal e EFD-Contribuições.' },
      { doc:'folha', cpc:'CPC 33 (Benefícios a Empregados)', risco:'alto',
        impacto:'CPC 33 exige reconhecimento de férias proporcionais, 13º proporcional e encargos como passivo de curto prazo. Sem folha essas provisões ficam incorretas.',
        acao:'Exigir folha de pagamento assinada e relatório de GPS/DCTF-Web.' },
      { doc:'darf', cpc:'CPC 32 (Tributos sobre o Lucro)', risco:'alto',
        impacto:'CPC 32 trata do reconhecimento correto de CSLL, IRPJ, PIS e COFINS. Sem comprovante de pagamento o passivo fiscal fica distorcido.',
        acao:'Solicitar DARFs pagos ou comprovantes via SICALC / eSocial.' },
      { doc:'ecd', cpc:'ITG 2000 + IN RFB 2.004/2021', risco:'alto',
        impacto:'ECD é obrigatória para Lucro Presumido com faturamento acima de R$78 Mi ou que distribuiu lucros acima do limite presumido. Omissão gera multa de R$5.000/mês.',
        acao:'Verificar obrigatoriedade e apurar se ECD foi entregue no prazo.' },
      { doc:'ecf', cpc:'IN RFB 2.004/2021', risco:'alto',
        impacto:'ECF é obrigatória para todas as PJs tributadas pelo Lucro Presumido. Multa de 0,25% da receita bruta por mês de atraso.',
        acao:'Verificar entrega da ECF no prazo (último dia útil de julho do ano seguinte).' },
      { doc:'desp', cpc:'CPC 25 (Provisões e Contingências)', risco:'medio',
        impacto:'CPC 25 exige reconhecimento de passivos contingentes. Despesas sem documentação geram risco de autuação fiscal por indedutibilidade (Art. 311 do RIR).',
        acao:'Exigir comprovantes de todas as despesas lançadas como dedutíveis.' },
      { doc:'imob', cpc:'CPC 27 (Ativo Imobilizado)', risco:'medio',
        impacto:'CPC 27 exige controle de depreciação por vida útil econômica. Sem nota de aquisição/baixa a depreciação fica incorreta.',
        acao:'Manter laudo de ativos e planilha de controle de imobilizado.' },
    ]
  },

  // LUCRO REAL → Todos os CPCs aplicáveis
  'Lucro Real': {
    norma_base: 'CPCs Completos + IFRS + ITG 2000 + NBC TAs (Auditoria)',
    cit_base: 'Lei 6.404/76; RIR/2018; IN RFB 2.004/2021; CPCs 26, 03, 01, 30, 32, 33, 25, 27, 06',
    regras: [
      { doc:'extrato', cpc:'CPC 03 (DFC, obrigatória) + CPC 26', risco:'alto',
        impacto:'DFC pelo método direto é altamente recomendada pelo CPC 03. Sem extratos não é possível nem elaborar DFC nem validar o LALUR de forma confiável.',
        acao:'Exigir extratos de todas as contas, inclusive investimentos e aplicações.' },
      { doc:'nf-e', cpc:'CPC 30 + CPC 47 (Contratos c/ Clientes)', risco:'alto',
        impacto:'CPC 47 (correlato ao IFRS 15) exige reconhecimento de receita por etapas de desempenho. Sem NFs não há base para apuração correta do IRPJ/CSLL pelo método real.',
        acao:'Cruzar XMLs com EFD-Contribuições e SPED Fiscal.' },
      { doc:'folha', cpc:'CPC 33 + NBC TA 570 (Continuidade)', risco:'alto',
        impacto:'Para Lucro Real as provisões de benefícios (férias, 13º, PLR) impactam diretamente o LALUR. Erro gera diferença de adição/exclusão na ECF.',
        acao:'Exigir folha, GPS, GFIP e e-Social mensal.' },
      { doc:'darf', cpc:'CPC 32 + NBC TA 540', risco:'alto',
        impacto:'Cálculo do IRPJ/CSLL pelo Lucro Real depende do LALUR, que por sua vez depende de todos os DARFs corretamente provisionados.',
        acao:'Exigir todos os DARFs e DCTF-Web do período.' },
      { doc:'ecd', cpc:'ITG 2000 + IN RFB 2.004/2021 (obrigatória)', risco:'alto',
        impacto:'ECD é OBRIGATÓRIA sem exceção para Lucro Real. Omissão: multa de R$5.000/mês pessoa jurídica + 0,5% sobre o lucro líquido.',
        acao:'Confirmar entrega da ECD e integridade dos arquivos SPED.' },
      { doc:'ecf', cpc:'IN RFB 2.004/2021 (obrigatória)', risco:'alto',
        impacto:'ECF é OBRIGATÓRIA sem exceção para Lucro Real com todo o LALUR. Multa de 0,25% da receita bruta/mês de atraso.',
        acao:'Verificar ECF e LALUR/LACS no sistema.' },
      { doc:'imob', cpc:'CPC 27 (Ativo Imobilizado)', risco:'alto',
        impacto:'CPC 27 exige depreciação pela vida útil econômica real, não necessariamente as taxas fiscais. Diferenças geram ajuste de adição/exclusão na ECF.',
        acao:'Manter laudo técnico de imobilizado e controle item a item.' },
      { doc:'imp', cpc:'CPC 01 (Valor Recuperável — Impairment)', risco:'medio',
        impacto:'CPC 01 exige avaliação anual de ativos para impairment. Não reconhecer pode gerar superavaliação do ativo e violação ao princípio da prudência.',
        acao:'Realizar teste de impairment ao menos anualmente para ativos significativos.' },
      { doc:'arren', cpc:'CPC 06 (Arrendamentos — IFRS 16)', risco:'medio',
        impacto:'CPC 06 revisado exige que contratos de arrendamento operacional sejam reconhecidos como ativo de direito de uso e passivo de arrendamento.',
        acao:'Mapear todos os contratos de aluguel e leasing e aplicar CPC 06.' },
      { doc:'prov', cpc:'CPC 25 (Provisões e Contingências)', risco:'alto',
        impacto:'Passivos contingentes trabalhistas, cíveis e fiscais devem ser reconhecidos conforme probabilidade de perda (CPC 25). Omissão distorce o Balanço.',
        acao:'Verificar lista de processos judiciais e classificar por probabilidade.' },
    ]
  }
};

// Função auxiliar: retorna regras CPC para o regime do cliente
function getCPCRules(regime) {
  return CPC_ENGINE[regime] || CPC_ENGINE['Simples Nacional'];
}

// Verifica se um apontamento de checklist tem regra CPC correspondente
function getCPCForItem(itemNome, regime) {
  const rules = getCPCRules(regime);
  const n = (itemNome||'').toLowerCase();
  const keywords = {
    extrato:['extrato','bancário','banco','banco '], 'nf-e':['nota fiscal','xml','nf-e','nfs-e','nfe','nfse'],
    folha:['folha','holerite','funcionario','funcionário'], das:['das','simples nac','pgdas'],
    darf:['darf','guia','imposto','gps','dctf','inss','fgts'], defis:['defis'],
    'dasn-mei':['dasn','dasn-mei'], ecd:['ecd'], ecf:['ecf'],
    desp:['comprovante','despesa','recibo'], imob:['imobilizado','depreciação','bem'],
    prov:['provisão','contingência','judicial'], imp:['impairment','valor recup'],
    arren:['arrendamento','leasing','aluguel']
  };
  for (const [key, kws] of Object.entries(keywords)) {
    if (kws.some(k => n.includes(k))) {
      const rule = rules.regras?.find(r => r.doc === key);
      if (rule) return rule;
    }
  }
  return null;
}

// ══════════════════════════════════════════════════════════
// CONTROLE DE CLIENTES — Lista avançada com filtros
// ══════════════════════════════════════════════════════════
let cliFilter = { regime:'', status:'', complexidade:'', busca:'' };

function renderClientesAvancado() {
  let clientes = DB.get('clientes') || [];
  // Deduplicar por ID
  const seen = new Set();
  clientes = clientes.filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true; });

  // Ler obrigações para buscar dados da DEFIS/ECD (Ação e Responsável)
  const obrigacoes = DB.get('obrigacoes') || {};
  clientes.forEach(c => {
    let chave = c.regime === 'Simples Nacional' ? `${c.id}_DEFIS_2025` : `${c.id}_ECD_2025`;
    let ob = obrigacoes[chave] || {};
    c.acao_entrega = ob.status === 'entregue' ? 'Entregue' : (ob.status === 'nao_aplicavel' ? 'Sem entrega' : 'Pendente/ECD');
    c.responsavel = ob.responsavel || 'Não def.';
    if (ob.obs_defis) c.obs = c.obs ? c.obs + ' | ' + ob.obs_defis : ob.obs_defis;
  });

  // Aplicar filtros
  let filtrados = clientes;
  if (cliFilter.regime)       filtrados = filtrados.filter(c => c.regime === cliFilter.regime);
  if (cliFilter.status)       filtrados = filtrados.filter(c => c.status === cliFilter.status);
  if (cliFilter.complexidade) filtrados = filtrados.filter(c => c.complexidade === cliFilter.complexidade);
  if (cliFilter.responsavel)  filtrados = filtrados.filter(c => c.responsavel === cliFilter.responsavel);
  if (cliFilter.acao_entrega) filtrados = filtrados.filter(c => c.acao_entrega === cliFilter.acao_entrega);
  if (cliFilter.busca)        filtrados = filtrados.filter(c =>
    c.nome.toLowerCase().includes(cliFilter.busca.toLowerCase()) ||
    c.cnpj.includes(cliFilter.busca) ||
    (c.obs||'').toLowerCase().includes(cliFilter.busca.toLowerCase()) ||
    c.id.toString() === cliFilter.busca
  );

  const regimes    = [...new Set(clientes.map(c=>c.regime).filter(Boolean))];
  const statuses   = [...new Set(clientes.map(c=>c.status).filter(Boolean))];
  const complexs   = [...new Set(clientes.map(c=>c.complexidade).filter(Boolean))];
  const resps      = [...new Set(clientes.map(c=>c.responsavel).filter(Boolean))];
  const acoes      = [...new Set(clientes.map(c=>c.acao_entrega).filter(Boolean))];

  const totalAtivos = clientes.filter(c=>c.status==='Ativo').length;
  const totalInativ = clientes.filter(c=>c.status==='Inativo'||c.status==='Encerrada'||c.status==='Avaliar').length;

  const filterBar = `
<div class="card mb-4" style="padding:14px 18px">
  <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
    <input type="text" placeholder="🔍 Buscar nome, CNPJ, Cód, Obs..."
      value="${cliFilter.busca||''}" oninput="cliFilter.busca=this.value;renderCliAv()"
      style="flex:1;min-width:200px;border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-family:inherit;font-size:13px">
    
    <select onchange="cliFilter.acao_entrega=this.value;renderCliAv()" style="border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-family:inherit;font-size:13px">
      <option value="">Status Entrega</option>
      ${acoes.map(x=>`<option ${cliFilter.acao_entrega===x?'selected':''}>${x}</option>`).join('')}
    </select>
    
    <select onchange="cliFilter.responsavel=this.value;renderCliAv()" style="border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-family:inherit;font-size:13px">
      <option value="">Quem Faz?</option>
      ${resps.map(x=>`<option ${cliFilter.responsavel===x?'selected':''}>${x}</option>`).join('')}
    </select>

    <select onchange="cliFilter.regime=this.value;renderCliAv()" style="border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-family:inherit;font-size:13px">
      <option value="">Todos regimes</option>
      ${regimes.map(r=>`<option ${cliFilter.regime===r?'selected':''}>${r}</option>`).join('')}
    </select>
    
    <select onchange="cliFilter.status=this.value;renderCliAv()" style="border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-family:inherit;font-size:13px">
      <option value="">Todos status CRM</option>
      ${statuses.map(s=>`<option ${cliFilter.status===s?'selected':''}>${s}</option>`).join('')}
    </select>

    <button class="btn btn-ghost btn-sm" onclick="cliFilter={regime:'',status:'',complexidade:'',busca:'',acao_entrega:'',responsavel:''};renderCliAv()">✕ Limpar</button>
    <button class="btn btn-ghost btn-sm" onclick="exportarClientesCSV()">⬇️ Export</button>
  </div>
  <div style="margin-top:8px;font-size:12px;color:var(--text-muted)">
    ${filtrados.length} de ${clientes.length} clientes listados · ${totalAtivos} operacionais
  </div>
</div>`;

  if (!filtrados.length) return filterBar + `<div class="empty-state"><div class="empty-icon">🔍</div><p>Nenhum cliente encontrado com os filtros aplicados.</p></div>`;

  const regimedBadge = r => {
    const m={'Simples Nacional':'badge-green','Lucro Presumido':'badge-blue','Lucro Real':'badge-red','MEI':'badge-yellow','A definir':'badge-gray'};
    return `<span class="badge ${m[r]||'badge-gray'}" style="font-size:10px">${r}</span>`;
  };

  const rows = filtrados.map(c => {
    const statusBg = c.status==='Ativo'?'#d1fae5':c.status==='Inativo'?'#f3f4f6':'#fee2e2';
    const statusClr = c.status==='Ativo'?'#065f46':c.status==='Inativo'?'#6b7280':'#991b1b';
    const obsPend = [
      c.d_div_rfb?'⚠ Dívida RFB':'', c.d_div_pgfn?'⚠ Dívida PGFN':'',
      c.d_div_pref?'⚠ Dívida Pref':'', c.d_ecd===false&&(c.regime==='Lucro Presumido'||c.regime==='Lucro Real')?'📋 ECD pendente':'',
      c.d_ecf===false&&(c.regime==='Lucro Presumido'||c.regime==='Lucro Real')?'📋 ECF pendente':'',
      c.obs?`💬 ${c.obs.slice(0,40)}${c.obs.length>40?'…':''}`:'',
    ].filter(Boolean);

    return `<tr style="cursor:pointer" onclick="navigate('clientes');openModal('edit','${c.id}')">
      <td style="font-family:monospace;font-size:11px;color:var(--text-muted)">${c.id}</td>
      <td style="font-weight:600;max-width:280px">
        ${c.nome}
        ${c.cnpj?`<br><span style="font-size:11px;color:var(--text-muted);font-weight:400">${c.cnpj}</span>`:''}
      </td>
      <td>${regimedBadge(c.regime)}</td>
      <td><span style="font-size:11px;font-weight:600;padding:3px 8px;border-radius:10px;background:${statusBg};color:${statusClr}">${c.status}</span></td>
      <td style="font-size:11px">${c.tipo_operacao||'—'}</td>
      <td style="font-size:11px">${c.complexidade||'—'}</td>
      <td style="font-size:11px">
        ${obsPend.slice(0,2).map(o=>`<div style="color:${o.startsWith('⚠')?'#b45309':'var(--text-muted)'}">${o}</div>`).join('')}
      </td>
      <td style="font-size:11px;font-weight:600;color:var(--primary)">${c.responsavel}</td>
      <td>
        <div style="display:flex;gap:4px;flex-wrap:wrap">
          <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();audClienteId='${c.id}';navigate('auditoria')" title="Compliance/Pendências">🔍</button>
          <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();chkClienteId='${c.id}';navigate('checklist')" title="Checklist mensal">✅</button>
          ${c.drive_url?`<a href="${c.drive_url}" target="_blank" class="btn btn-ghost btn-sm" onclick="event.stopPropagation()" title="Pasta Nuvem">🗂️</a>`:''}
          <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();abrirCPCAnalise('${c.id}')" title="Emitir Parecer Técnico">📄Técnico</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  return `
<div class="card mb-4" style="background:linear-gradient(135deg,#1e3a8a,#0f766e);color:#fff;padding:16px 22px">
  <h2 style="font-size:15px;margin-bottom:2px">👥 Controle Unificado de Entregas e Clientes — CM Contabilidade</h2>
  <p style="opacity:.8;font-size:12px">${clientes.length} clientes classificados · Baseado na Escrituração 2025/2026</p>
</div>
${filterBar}
<div class="card">
  <div class="table-wrap">
    <table>
      <thead><tr><th>Cód.</th><th>Razão Social / CNPJ</th><th>Regime</th><th>Status</th><th>Operação</th><th>Pendências/Obs.</th><th>Resp.</th><th>Ações</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</div>`;
}

function renderCliAv() {
  const el = document.getElementById('main-content');
  if (el) el.innerHTML = renderClientesAvancado();
}

function abrirCPCAnalise(cliId) {
  audClienteId = cliId;
  navigate('auditoria');
  setTimeout(() => {
    const el = document.getElementById('cpc-panel');
    if (el) el.scrollIntoView({behavior:'smooth'});
  }, 300);
}

// ══════════════════════════════════════════════════════════
// MÓDULO: PAINEL GLOBAL — Kanban de entrega por todos os clientes
// ══════════════════════════════════════════════════════════
function renderPainelGlobal() {
  const clientes   = (DB.get('clientes')||[]).filter(c=>c.status==='Ativo');
  const checklists = DB.get('checklists') || {};
  const comp       = state.competencia;

  const header = `
<div class="card mb-4" style="background:linear-gradient(135deg,#7c3aed,#1e3a8a);color:#fff;padding:16px 22px">
  <h2 style="font-size:15px;margin-bottom:2px">🗂️ Painel Global — Entrega de Documentos</h2>
  <p style="opacity:.8;font-size:12px">Todos os clientes ativos · Competência: ${comp}</p>
</div>`;

  const cards = clientes.map(c => {
    const key  = `${c.id}_${comp}`;
    const data = checklists[key];
    let pct=0, done=0, total=0, statusCls='k-empty', emoji='⬜', statusTxt='Sem dados';
    if (data) {
      const vals = Object.values(data);
      total = vals.length; done = vals.filter(v=>v==='recebido').length;
      pct = total?Math.round(done/total*100):0;
      statusCls = pct===100?'k-full':done>0?'k-partial':'k-empty';
      emoji = pct===100?'✅':done>0?'⚠️':'❌';
      statusTxt = pct===100?'Completo':`${done}/${total} — ${pct}%`;
    }
    return `<div class="kanban-card ${statusCls}" onclick="chkClienteId='${c.id}';navigate('checklist')" style="min-width:180px;max-width:220px">
      <div style="font-size:18px;margin-bottom:4px">${emoji}</div>
      <div style="font-weight:700;font-size:12px;line-height:1.3">${c.nome.slice(0,32)}${c.nome.length>32?'…':''}</div>
      <div style="font-size:10px;color:var(--text-muted);margin-top:2px">#${c.id} · ${c.regime?.split(' ')[0]||''}</div>
      <div style="margin-top:6px;font-size:11px;font-weight:600">${statusTxt}</div>
      ${data?`<div class="kanban-card-bar" style="margin-top:4px"><div class="kanban-card-fill" style="width:${pct}%"></div></div>`:''}
    </div>`;
  });

  const total    = clientes.length;
  const completo = clientes.filter(c=>{ const d=checklists[`${c.id}_${comp}`]; return d&&Object.values(d).every(v=>v==='recebido');}).length;
  const parcial  = clientes.filter(c=>{ const d=checklists[`${c.id}_${comp}`]; return d&&Object.values(d).some(v=>v==='recebido')&&!Object.values(d).every(v=>v==='recebido');}).length;
  const semDados = total - completo - parcial;

  return `${header}
<div class="card mb-4" style="padding:14px 18px;display:flex;gap:20px;flex-wrap:wrap">
  <div style="text-align:center"><div style="font-size:24px;font-weight:800;color:#10b981">${completo}</div><div style="font-size:11px;color:var(--text-muted)">✅ Completos</div></div>
  <div style="text-align:center"><div style="font-size:24px;font-weight:800;color:#f59e0b">${parcial}</div><div style="font-size:11px;color:var(--text-muted)">⚠️ Parciais</div></div>
  <div style="text-align:center"><div style="font-size:24px;font-weight:800;color:#6b7280">${semDados}</div><div style="font-size:11px;color:var(--text-muted)">❌ Sem dados</div></div>
  <div style="text-align:center"><div style="font-size:24px;font-weight:800;color:#1e3a8a">${total}</div><div style="font-size:11px;color:var(--text-muted)">Total clientes</div></div>
  <button class="btn btn-ghost btn-sm" style="margin-left:auto;align-self:center" onclick="exportarRelatorioEntrega()">⬇️ Relatório CSV</button>
</div>
<div style="display:flex;flex-wrap:wrap;gap:12px">${cards.join('')}</div>`;
}

function exportarRelatorioEntrega() {
  const clientes   = DB.get('clientes') || [];
  const checklists = DB.get('checklists') || {};
  const comp       = state.competencia;
  const rows = ['id;nome;cnpj;regime;status_entrega;docs_recebidos;docs_total;pct'];
  clientes.filter(c=>c.status==='Ativo').forEach(c => {
    const data = checklists[`${c.id}_${comp}`];
    if (data) {
      const vals=Object.values(data), done=vals.filter(v=>v==='recebido').length, tot=vals.length;
      rows.push(`${c.id};${c.nome};${c.cnpj};${c.regime};${done===tot?'Completo':done>0?'Parcial':'Pendente'};${done};${tot};${Math.round(done/tot*100)}%`);
    } else {
      rows.push(`${c.id};${c.nome};${c.cnpj};${c.regime};Sem dados;0;0;0%`);
    }
  });
  downloadCSV('\ufeff'+rows.join('\r\n'), `RelatorioEntrega_${comp}.csv`);
}

// ══════════════════════════════════════════════════════════
// PÁGINA PARECER TÉCNICO — Relatório de Escrituração
// ══════════════════════════════════════════════════════════
let parecerClienteId = null;

function renderParecerPage() {
  const clientes = DB.get('clientes') || [];
  const ativos = clientes.filter(c => c.status === 'Ativo').sort((a,b) => a.nome.localeCompare(b.nome));
  const comp = state.competencia;

  // Selector
  let html = `
  <div class="card mb-4">
    <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
      <div style="font-weight:700;font-size:15px">📄 Parecer Técnico sobre Escrituração</div>
      <select style="flex:1;min-width:280px;border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-family:inherit;font-size:13px"
        onchange="parecerClienteId=this.value;render()">
        <option value="">— Selecione um cliente —</option>
        ${ativos.map(c => `<option value="${c.id}" ${parecerClienteId===c.id?'selected':''}>#${c.id} — ${c.nome}</option>`).join('')}
      </select>
    </div>
    <p class="text-muted text-sm" style="margin-top:8px">
      Selecione um cliente para gerar o parecer técnico da competência <strong>${fmtComp(comp)}</strong>.
      O relatório analisa pendências documentais com base nas normas CPC/ITG e classifica os riscos.
    </p>
  </div>`;

  if (!parecerClienteId) {
    html += `<div class="empty-state"><div class="empty-icon">📄</div><p>Selecione um cliente acima para gerar o parecer técnico.</p></div>`;
    return html;
  }

  const cliente = clientes.find(c => c.id === parecerClienteId);
  if (!cliente) { parecerClienteId = null; return renderParecerPage(); }

  // Info do cliente
  html += `
  <div class="card mb-4">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
      <div>
        <div style="font-weight:700;font-size:16px">${cliente.nome}</div>
        <span class="text-muted text-sm">CNPJ: ${cliente.cnpj} · ${regimedIcon(cliente.regime)}</span>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary btn-sm" onclick="gerarEExibirParecer('${cliente.id}')">📄 Gerar Parecer Escrituração</button>
        <button class="btn btn-success btn-sm" onclick="gerarEExibirParecerCPC('${cliente.id}')">📋 Análise CPC/ITG</button>
      </div>
    </div>
  </div>`;

  // Resumo do checklist
  const chkSaved = (DB.get('checklists')||{})[`${cliente.id}_${comp}`] || {};
  const template = CHECKLIST_TEMPLATE || [];
  let totalItems = 0, recebidos = 0, pendentes = 0, pendList = [];
  template.forEach(cat => {
    cat.items.forEach(item => {
      totalItems++;
      const st = chkSaved[item.key] || 'nao_enviado';
      if (st === 'recebido') recebidos++;
      else { pendentes++; pendList.push({nome: item.nome, status: st}); }
    });
  });
  const pct = totalItems > 0 ? Math.round((recebidos/totalItems)*100) : 0;

  html += `
  <div class="card mb-4">
    <div style="font-weight:700;font-size:14px;margin-bottom:12px">📊 Resumo Documental — ${fmtComp(comp)}</div>
    <div class="cards-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px">
      <div class="stat-card"><div class="stat-icon blue">📥</div><div><div class="stat-label">Recebidos</div><div class="stat-value">${recebidos}</div></div></div>
      <div class="stat-card"><div class="stat-icon red">⏳</div><div><div class="stat-label">Pendentes</div><div class="stat-value">${pendentes}</div></div></div>
      <div class="stat-card"><div class="stat-icon green">📈</div><div><div class="stat-label">Conformidade</div><div class="stat-value">${pct}%</div></div></div>
    </div>
    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
  </div>`;

  // Pendências
  if (pendList.length > 0) {
    html += `<div class="card mb-4">
      <div style="font-weight:700;font-size:14px;margin-bottom:12px">⚠️ Pendências (${pendList.length})</div>
      <table><thead><tr><th>Documento</th><th>Status</th></tr></thead><tbody>
      ${pendList.map(p => `<tr><td>${p.nome}</td><td><span class="badge badge-${p.status==='incompleto'?'yellow':p.status==='divergente'?'purple':'red'}">${p.status.replace('_',' ')}</span></td></tr>`).join('')}
      </tbody></table></div>`;
  }

  // Área do parecer gerado
  html += `<div id="parecer-page-output"></div>`;
  return html;
}


function gerarDadosParecer(cliId) {
  const clientes = DB.get('clientes') || [];
  const cliente = clientes.find(c => c.id === cliId);
  if (!cliente) return null;
  const comp = state.competencia;

  const chkAll = DB.get('checklists') || {};
  const chkKey = cliId + '_' + comp;
  const savedChk = chkAll[chkKey] || {};
  const chkTemplate = CHECKLIST_TEMPLATE || [];

  const pendenciasChk = [];
  let totalChk = 0, recebidosChk = 0;
  chkTemplate.forEach(cat => {
    cat.items.forEach(item => {
      totalChk++;
      const st = savedChk[item.key] || 'nao_enviado';
      if (st === 'recebido') recebidosChk++;
      else pendenciasChk.push({nome: item.nome, cat: cat.cat, status: st});
    });
  });

  const onboardingInfo = DB.get('onboarding') || {};
  const savedObg = onboardingInfo[cliId] || {};
  const pendenciasObg = [];
  let totalObg = 0, concluidosObg = 0;
  if (typeof C006_TEMPLATE !== 'undefined') {
    C006_TEMPLATE.forEach(sec => {
      sec.items.forEach(item => {
        totalObg++;
        const k = sec.section+'_'+item.cod+'_'+item.nome;
        const st = savedObg[k] || 'pendente';
        if (st === 'concluido' || st === 'cliente_nao_possui') concluidosObg++;
        else pendenciasObg.push({nome: item.nome, cod: item.cod, cat: sec.section, status: st});
      });
    });
  }

  const pctChk  = totalChk  > 0 ? Math.round((recebidosChk/totalChk)*100)  : 0;
  const pctObg  = totalObg  > 0 ? Math.round((concluidosObg/totalObg)*100) : 0;
  const risco   = pendenciasObg.length === 0 && pendenciasChk.length === 0 ? 'baixo'
                : (pendenciasChk.length > 10 || pendenciasObg.length > 5)  ? 'alto'
                : 'medio';

  // ── Classificação Normativa ITG / NBC TG (árvore de decisão) ──
  const itg = (() => {
    if (cliente.sem_fins_lucrativos) return {
      norma: 'ITG 2002', emoji: '🏛️',
      desc: 'Entidade sem Fins Lucrativos',
      detalhe: 'Aplica-se à entidade que não distribui resultados. Exige demonstrações específicas (DFC, DFPS) e notas explicativas sobre gratuidade.',
      passos: ['✅ Passo 1: Sem fins lucrativos → ITG 2002'],
      extra: 'ITG 2000 também se aplica para a escrituração contábil geral.'
    };
    if (cliente.cooperativa) return {
      norma: 'ITG 2004', emoji: '🤝',
      desc: 'Cooperativa',
      detalhe: 'Cooperativas têm norma própria. Exige tratamento específico das sobras e perdas e demonstração de resultados por ato cooperativo e não cooperativo.',
      passos: ['✅ Passo 1: Não é sem fins lucrativos', '✅ Passo 2: É cooperativa → ITG 2004'],
      extra: 'ITG 2000 aplica-se para a escrituração.'
    };
    if (cliente.regime === 'MEI' || cliente.regime === 'Simples Nacional') return {
      norma: 'ITG 1000', emoji: '🏪',
      desc: 'Entidade de Pequeno Porte (EP²)',
      detalhe: 'Empresa pequena e simples enquadrada no Simples Nacional ou MEI. Pode adotar escrituração simplificada conforme ITG 1000 (Resolução CFC n.º 1.418/12).',
      passos: ['✅ Passo 1: Não é sem fins lucrativos', '✅ Passo 2: Não é cooperativa', '✅ Passo 3: Empresa pequena/simples → ITG 1000'],
      extra: 'ITG 2000 se aplica paralelamente para garantir integridade da escrituração.'
    };
    return {
      norma: 'NBC TG Completas', emoji: '📚',
      desc: 'Normas Completas (IFRS / NBC TG)',
      detalhe: 'A entidade não se enquadra em nenhuma ITG simplificada. Deve adotar as Normas Brasileiras de Contabilidade Técnicas Gerais (NBC TG), equivalentes ao IFRS.',
      passos: ['✅ Passo 1: Não é sem fins lucrativos', '✅ Passo 2: Não é cooperativa', '✅ Passo 3: Não é empresa pequena/simples', '✅ Passo 4: NBC TG Completas (IFRS)'],
      extra: 'ITG 2000 aplica-se para a escrituração contábil. Verifique se ITG 1002 é aplicável em casos específicos.'
    };
  })();

  return {
    cliente, comp,
    pendenciasChk, pendenciasObg,
    pctChk, pctObg,
    totalChk, recebidosChk,
    totalObg, concluidosObg,
    risco, itg,
    escritorio: localStorage.getItem('esc_nome') || 'Criscontab & Madeira Contabilidade',
    dataGeracao: new Date().toLocaleString('pt-BR'),
  };
}

function gerarHtmlParecer(d) {
  const riscoStyle = {
    baixo: { cor:'#10b981', bg:'#ecfdf5', label:'✅ BAIXO RISCO',   txt:'Documentação em conformidade.' },
    medio: { cor:'#f59e0b', bg:'#fffbeb', label:'⚠️ RISCO MÉDIO',   txt:'Pendências devem ser sanadas.' },
    alto:  { cor:'#ef4444', bg:'#fef2f2', label:'🔴 RISCO ELEVADO', txt:'Regularização urgente necessária.' },
  }[d.risco] || {};

  const statusBadge = st => {
    const m = {
      pendente:    ['#6b7280','#f3f4f6','Pendente'],
      solicitado:  ['#f59e0b','#fffbeb','Solicitado'],
      verificar:   ['#8b5cf6','#f5f3ff','Verificar'],
      nao_enviado: ['#ef4444','#fef2f2','Não Enviado'],
      incompleto:  ['#f59e0b','#fffbeb','Incompleto'],
      divergente:  ['#8b5cf6','#f5f3ff','Divergente'],
    }[st] || ['#6b7280','#f3f4f6',st];
    return `<span style="background:${m[1]};color:${m[0]};border:1px solid ${m[0]}33;border-radius:4px;padding:2px 8px;font-size:10px;font-weight:600;text-transform:uppercase;white-space:nowrap">${m[2]}</span>`;
  };

  const obgGroups = {};
  d.pendenciasObg.forEach(p => { (obgGroups[p.cat] = obgGroups[p.cat]||[]).push(p); });

  const obgSection = d.pendenciasObg.length === 0
    ? `<div style="display:flex;align-items:center;gap:10px;padding:14px 16px;background:#ecfdf5;border-radius:8px;border:1px solid #a7f3d0">
        <span style="font-size:22px">✅</span>
        <div><div style="font-weight:700;color:#065f46">Onboarding Concluído</div>
        <div style="font-size:12px;color:#047857;margin-top:2px">O cliente forneceu todos os documentos iniciais e parametrizações requeridas.</div></div>
       </div>`
    : Object.entries(obgGroups).map(([cat, items]) => `
        <div style="margin-bottom:12px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#64748b;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #e2e8f0">${cat}</div>
          ${items.map(p=>`
            <div style="display:flex;align-items:center;gap:10px;padding:7px 10px;background:#fff;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:4px">
              <span style="font-size:11px;color:#94a3b8;min-width:32px;font-family:monospace">${p.cod}</span>
              <span style="flex:1;font-size:12px;color:#1e293b">${p.nome}</span>
              ${statusBadge(p.status)}
            </div>`).join('')}
        </div>`).join('');

  const chkGroups = {};
  d.pendenciasChk.forEach(p => { (chkGroups[p.cat] = chkGroups[p.cat]||[]).push(p); });

  const chkSection = d.pendenciasChk.length === 0
    ? `<div style="display:flex;align-items:center;gap:10px;padding:14px 16px;background:#ecfdf5;border-radius:8px;border:1px solid #a7f3d0">
        <span style="font-size:22px">✅</span>
        <div><div style="font-weight:700;color:#065f46">Escrituração Completa</div>
        <div style="font-size:12px;color:#047857;margin-top:2px">Todos os documentos mensais foram recebidos e estão em conformidade.</div></div>
       </div>`
    : Object.entries(chkGroups).map(([cat, items]) => `
        <div style="margin-bottom:12px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#64748b;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #e2e8f0">${cat}</div>
          ${items.map(p=>`
            <div style="display:flex;align-items:center;gap:10px;padding:7px 10px;background:#fff;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:4px">
              <span style="flex:1;font-size:12px;color:#1e293b">${p.nome}</span>
              ${statusBadge(p.status)}
            </div>`).join('')}
        </div>`).join('');

  const bar = (pct, cor) => `
    <div style="background:#e2e8f0;border-radius:99px;height:8px;overflow:hidden;margin-top:4px">
      <div style="width:${pct}%;background:${cor};height:100%;border-radius:99px;transition:width .4s"></div>
    </div>`;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Parecer Técnico — ${d.cliente.nome}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Inter',sans-serif; background:#f1f5f9; color:#1e293b; padding:32px 16px; min-height:100vh; }
  .page { max-width:820px; margin:0 auto; }
  .header { background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%); border-radius:16px 16px 0 0; padding:32px 36px; color:#fff; position:relative; overflow:hidden; }
  .header::before { content:''; position:absolute; top:-40px; right:-40px; width:220px; height:220px; background:rgba(255,255,255,.07); border-radius:50%; }
  .header::after  { content:''; position:absolute; bottom:-60px; right:60px; width:150px; height:150px; background:rgba(255,255,255,.05); border-radius:50%; }
  .header-brand { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:1px; opacity:.7; margin-bottom:6px; }
  .header-title { font-size:22px; font-weight:800; line-height:1.2; margin-bottom:4px; }
  .header-sub { font-size:13px; opacity:.75; }
  .header-meta { display:flex; gap:20px; margin-top:20px; flex-wrap:wrap; }
  .header-meta div { background:rgba(255,255,255,.12); border-radius:8px; padding:8px 14px; font-size:12px; }
  .header-meta strong { display:block; font-size:10px; text-transform:uppercase; letter-spacing:.5px; opacity:.7; margin-bottom:2px; }
  .risk-banner { display:flex; align-items:center; gap:14px; padding:16px 24px; background:${riscoStyle.bg}; border:2px solid ${riscoStyle.cor}; border-top:none; }
  .risk-icon { width:44px; height:44px; border-radius:50%; background:${riscoStyle.cor}; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
  .risk-label { font-weight:800; font-size:15px; color:${riscoStyle.cor}; }
  .risk-desc  { font-size:12px; color:#475569; margin-top:2px; }
  .stats-row { display:grid; grid-template-columns:1fr 1fr; gap:0; border-left:1px solid #e2e8f0; border-right:1px solid #e2e8f0; }
  .stat-box { padding:20px 24px; background:#fff; border-bottom:1px solid #e2e8f0; }
  .stat-box:nth-child(1) { border-right:1px solid #e2e8f0; }
  .stat-label { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.5px; color:#64748b; margin-bottom:6px; }
  .stat-numbers { display:flex; align-items:baseline; gap:6px; }
  .stat-big { font-size:28px; font-weight:800; line-height:1; }
  .stat-of { font-size:13px; color:#94a3b8; }
  .section { background:#fff; border:1px solid #e2e8f0; border-top:none; padding:24px 28px; }
  .section-title { display:flex; align-items:center; gap:8px; font-size:14px; font-weight:700; color:#1e293b; margin-bottom:16px; padding-bottom:12px; border-bottom:2px solid #f1f5f9; }
  .section-title .tag { font-size:10px; font-weight:700; padding:2px 8px; border-radius:4px; text-transform:uppercase; letter-spacing:.5px; }
  .footer { background:#f8fafc; border:1px solid #e2e8f0; border-top:none; border-radius:0 0 16px 16px; padding:18px 28px; display:flex; align-items:center; justify-content:space-between; font-size:11px; color:#94a3b8; }
  .footer strong { color:#475569; }
  .actions { display:flex; gap:10px; justify-content:flex-end; margin-bottom:16px; }
  .btn-act { display:inline-flex; align-items:center; gap:6px; padding:9px 18px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; border:none; font-family:inherit; transition:opacity .15s; }
  .btn-act:hover { opacity:.85; }
  .btn-print  { background:#1e3a5f; color:#fff; }
  .btn-copy   { background:#f1f5f9; color:#475569; }
  @media print {
    body { background:#fff; padding:0; }
    .actions { display:none; }
    .page { max-width:100%; }
    .header { border-radius:0; }
    .footer { border-radius:0; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="actions">
    <button class="btn-act btn-copy" onclick="copyReport()">📋 Copiar Texto</button>
    <button class="btn-act btn-print" onclick="window.print()">🖨️ Imprimir / PDF</button>
  </div>

  <!-- CABEÇALHO -->
  <div class="header">
    <div class="header-brand">${d.escritorio}</div>
    <div class="header-title">Parecer de Escrituração e Conformidade Técnica</div>
    <div class="header-sub">Competência: ${fmtComp(d.comp)} · Gerado em ${d.dataGeracao}</div>
    <div class="header-meta">
      <div><strong>Cliente</strong>${d.cliente.nome}</div>
      <div><strong>CNPJ</strong>${d.cliente.cnpj || '—'}</div>
      <div><strong>Regime</strong>${d.cliente.regime || '—'}</div>
      ${d.cliente.responsavel ? `<div><strong>Responsável</strong>${d.cliente.responsavel}</div>` : ''}
    </div>
  </div>

  <!-- BANNER DE RISCO -->
  <div class="risk-banner">
    <div class="risk-icon">${d.risco === 'baixo' ? '✅' : d.risco === 'medio' ? '⚠️' : '🔴'}</div>
    <div>
      <div class="risk-label">${riscoStyle.label}</div>
      <div class="risk-desc">${riscoStyle.txt} — ${d.pendenciasObg.length} pend. onboarding · ${d.pendenciasChk.length} pend. mensal</div>
    </div>
  </div>

  <!-- STATS -->
  <div class="stats-row">
    <div class="stat-box">
      <div class="stat-label">📋 Checklist Mensal — ${fmtComp(d.comp)}</div>
      <div class="stat-numbers">
        <span class="stat-big" style="color:${d.pctChk===100?'#10b981':d.pctChk>60?'#f59e0b':'#ef4444'}">${d.pctChk}%</span>
        <span class="stat-of">${d.recebidosChk} / ${d.totalChk} docs</span>
      </div>
      ${bar(d.pctChk, d.pctChk===100?'#10b981':d.pctChk>60?'#f59e0b':'#ef4444')}
    </div>
    <div class="stat-box">
      <div class="stat-label">📁 Onboarding C-006</div>
      <div class="stat-numbers">
        <span class="stat-big" style="color:${d.pctObg===100?'#10b981':d.pctObg>60?'#f59e0b':'#ef4444'}">${d.pctObg}%</span>
        <span class="stat-of">${d.concluidosObg} / ${d.totalObg} itens</span>
      </div>
      ${bar(d.pctObg, d.pctObg===100?'#10b981':d.pctObg>60?'#f59e0b':'#ef4444')}
    </div>
  </div>

  <!-- SEÇÃO ONBOARDING / CONFORMIDADE INICIAL -->
  <div class="section">
    <div class="section-title">
      <span>📁 Evolução da Conformidade Inicial (C-006)</span>
      <span class="tag" style="background:${d.pendenciasObg.length===0?'#ecfdf5':'#fef2f2'};color:${d.pendenciasObg.length===0?'#065f46':'#991b1b'}">
        ${d.pendenciasObg.length === 0 ? 'Concluído' : d.pendenciasObg.length + ' pendência(s)'}
      </span>
    </div>
    ${obgSection}
  </div>

  <!-- SEÇÃO CLASSIFICAÇÃO NORMATIVA ITG / NBC TG -->
  <div class="section" style="border-top:1px solid #e2e8f0">
    <div class="section-title">
      <span>⚖️ Classificação Normativa — ITG / NBC TG</span>
      <span class="tag" style="background:#eff6ff;color:#1d4ed8">${d.itg.norma}</span>
    </div>
    <div style="display:flex;align-items:flex-start;gap:14px;background:#f8fafc;border-radius:10px;padding:16px;border:1px solid #e2e8f0">
      <div style="font-size:28px;line-height:1">${d.itg.emoji}</div>
      <div style="flex:1">
        <div style="font-weight:800;font-size:15px;color:#1e293b;margin-bottom:4px">${d.itg.norma} — ${d.itg.desc}</div>
        <div style="font-size:12px;color:#475569;line-height:1.6;margin-bottom:10px">${d.itg.detalhe}</div>
        <div style="margin-bottom:10px">
          ${d.itg.passos.map(p=>`<div style="font-size:11px;color:#334155;padding:3px 0;line-height:1.5">${p}</div>`).join('')}
        </div>
        <div style="background:#eff6ff;border-radius:6px;padding:8px 12px;font-size:11px;color:#1d4ed8">
          📌 ${d.itg.extra}
        </div>
      </div>
    </div>
  </div>

  <!-- SEÇÃO CHECKLIST MENSAL -->
  <div class="section" style="border-top:1px solid #e2e8f0">
    <div class="section-title">
      <span>📋 Situação da Escrituração (${fmtComp(d.comp)})</span>
      <span class="tag" style="background:${d.pendenciasChk.length===0?'#ecfdf5':'#fef2f2'};color:${d.pendenciasChk.length===0?'#065f46':'#991b1b'}">
        ${d.pendenciasChk.length === 0 ? 'Completo' : d.pendenciasChk.length + ' pendência(s)'}
      </span>
    </div>
    ${chkSection}
  </div>

  <!-- RODAPÉ -->
  <div class="footer">
    <div>Documento gerado automaticamente pelo <strong>Sistema de Automação Contábil</strong></div>
    <div>${d.dataGeracao}</div>
  </div>
</div>

<textarea id="_copy-buffer" style="position:fixed;opacity:0;pointer-events:none"></textarea>
<script>
function copyReport() {
  const lines = [];
  lines.push('PARECER DE ESCRITURAÇÃO E CONFORMIDADE TÉCNICA');
  lines.push('Escritório: ${d.escritorio}');
  lines.push('Competência: ${fmtComp(d.comp)} | Gerado em: ${d.dataGeracao}');
  lines.push('');
  lines.push('Cliente: ${d.cliente.nome}');
  lines.push('CNPJ   : ${d.cliente.cnpj || "—"}');
  lines.push('Regime : ${d.cliente.regime || "—"}');
  lines.push('');
  lines.push('CHECKLIST MENSAL: ${d.pctChk}% (${d.recebidosChk}/${d.totalChk} docs) | Pendentes: ${d.pendenciasChk.length}');
  lines.push('ONBOARDING C-006: ${d.pctObg}% (${d.concluidosObg}/${d.totalObg} itens) | Pendentes: ${d.pendenciasObg.length}');
  lines.push('CLASSIFICAÇÃO DE RISCO: ${riscoStyle.label}');
  const t = document.getElementById('_copy-buffer');
  t.value = lines.join('\\n');
  t.select();
  document.execCommand('copy');
  alert('Texto copiado!');
}
</script>
</body>
</html>`;
}

// Gera e exibe parecer avulso numa popup — chamado pelo botão 📋 no Dashboard
function emitirParecerAvulso(cliId) {
  const d = gerarDadosParecer(cliId);
  if (!d) { alert('Erro ao gerar Parecer Técnico.'); return; }
  const html = gerarHtmlParecer(d);
  const w = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
  if (!w) { alert('Popup bloqueado pelo navegador. Permita popups neste site.'); return; }
  w.document.write(html);
  w.document.close();
}

// Gera e exibe parecer na página de Parecer Técnico (inline)
function gerarEExibirParecer(cliId) {
  const d = gerarDadosParecer(cliId);
  if (!d) return;
  const html = gerarHtmlParecer(d);
  // Renderiza inline removendo o <html>/<body> wrapper
  const area = document.getElementById('parecer-page-output');
  if (area) {
    area.innerHTML = `<div style="border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(30,58,95,.08)">
      <iframe id="parecer-iframe" style="width:100%;border:none;min-height:700px" srcdoc="${html.replace(/"/g,'&quot;')}"></iframe>
    </div>`;
    // Auto-resize iframe
    const fr = document.getElementById('parecer-iframe');
    if (fr) fr.onload = () => { try { fr.style.height = (fr.contentWindow.document.body.scrollHeight + 40) + 'px'; } catch(e){} };
  }
}

// Utilitário de impressão de texto legado (para gerarParecer no checklist)
function imprimirTexto(texto) {
  const w = window.open('','_blank','width=800,height=600');
  w.document.write('<pre style="font-family:monospace;font-size:12px;line-height:1.8;white-space:pre-wrap;padding:30px">' + texto + '</pre>');
  w.document.close();
  w.print();
}

// Versão legado — gerarTextoParecer ainda usado por alguns fluxos
function gerarTextoParecer(cliId) {
  const d = gerarDadosParecer(cliId);
  if (!d) return null;
  const sep = '═'.repeat(60);
  const sep2 = '─'.repeat(60);
  let texto = `${sep}\nPARECER DE ESCRITURAÇÃO E CONFORMIDADE TÉCNICA\nEmitido em: ${d.dataGeracao}\n${sep}\n\nCliente   : ${d.cliente.nome}\nCNPJ      : ${d.cliente.cnpj}\nRegime    : ${d.cliente.regime}\nEscritório: ${d.escritorio}\n\n`;
  texto += `${sep2}\nONBOARDING (C-006): ${d.pctObg}% — ${d.pendenciasObg.length} pendência(s)\n${sep2}\n\n`;
  if (!d.pendenciasObg.length) texto += '✅ ONBOARDING CONCLUÍDO\n\n';
  else d.pendenciasObg.forEach((p,i) => { texto += `${i+1}. [${p.cod}] ${p.nome} — ${p.status.replace(/_/g,' ')}\n`; });
  texto += `\n${sep2}\nESCRITURAÇÃO (${fmtComp(d.comp)}): ${d.pctChk}% — ${d.pendenciasChk.length} pendência(s)\n${sep2}\n\n`;
  if (!d.pendenciasChk.length) texto += '✅ TODOS OS DOCUMENTOS RECEBIDOS\n\n';
  else d.pendenciasChk.forEach((p,i) => { texto += `${i+1}. ${p.nome} — ${p.status.replace(/_/g,' ')}\n`; });
  texto += `\n${sep2}\n${d.escritorio}\nSistema de Automação Contábil.\n${sep}\n`;
  return { texto, comp: d.comp };
}

// Gera e exibe análise CPC/ITG na página de parecer
function gerarEExibirParecerCPC(cliId) {
  gerarParecerCPC(cliId);
  // Move o resultado gerado para a área de output da página
  const cpcEl = document.getElementById('cpc-parecer');
  const outEl = document.getElementById('parecer-page-output');
  if (cpcEl && outEl) outEl.appendChild(cpcEl);
}

// Utilitário para imprimir texto
function imprimirTexto(texto) {
  const w = window.open('','_blank','width=800,height=600');
  w.document.write('<pre style="font-family:monospace;font-size:12px;line-height:1.8;white-space:pre-wrap">' + texto + '</pre>');
  w.document.close();
  w.print();
}

// ══════════════════════════════════════════════════════════
// ANÁLISE TÉCNICA DE CONFORMIDADE COM CPC — Gerado pelo motor de regras
// ══════════════════════════════════════════════════════════
function gerarParecerCPC(cliId) {
  const clientes  = DB.get('clientes') || [];
  const cliente   = clientes.find(c => c.id === cliId);
  if (!cliente) return;

  const chkSaved  = (DB.get('checklists')||{})[`${cliId}_${state.competencia}`] || {};
  const obgSaved  = (DB.get('onboarding')||{})[cliId] || {};
  const rules     = getCPCRules(cliente.regime);

  // Coletar pendências do checklist e cruzar com CPC
  const pendencias = [];
  Object.entries(chkSaved).forEach(([k,v]) => {
    if (v === 'recebido' || v === 'aguardando') return;
    const rule = getCPCForItem(k.replace(/_/g,' '), cliente.regime);
    pendencias.push({ nome: k.replace(/_/g,' '), status: v, rule });
  });

  // Coletar pendências de Onboarding (C-006)
  if (typeof C006_TEMPLATE !== 'undefined') {
    C006_TEMPLATE.forEach(sec => {
      sec.items.forEach(item => {
        const k = sec.section+'_'+item.cod+'_'+item.nome;
        const st = obgSaved[k] || 'pendente';
        if (st !== 'concluido' && st !== 'cliente_nao_possui') {
          const rule = getCPCForItem(item.nome, cliente.regime);
          pendencias.push({ nome: `(Onboarding) ${item.nome}`, status: st, rule });
        }
      });
    });
  }

  const altoRisco  = pendencias.filter(p => p.rule?.risco === 'alto');
  const medioRisco = pendencias.filter(p => p.rule?.risco === 'medio');
  const baixoRisco = pendencias.filter(p => !p.rule || p.rule.risco === 'baixo');

  const hoje   = new Date().toLocaleDateString('pt-BR');
  const escritorio = localStorage.getItem('esc_nome') || 'CM Contabilidade';
  const sep    = '═'.repeat(60);
  const sep2   = '─'.repeat(60);

  let parecer = `${sep}
ANÁLISE TÉCNICA DE CONFORMIDADE CONTÁBIL
${sep}
Cliente     : ${cliente.nome}
CNPJ        : ${cliente.cnpj}
Regime      : ${cliente.regime}
Tipo        : ${cliente.tipo_operacao||'—'} | Complexidade: ${cliente.complexidade||'—'}
Competência : ${fmtComp(state.competencia)}
Emissão     : ${hoje}
Escritório  : ${escritorio}
${sep2}
NORMAS E PRONUNCIAMENTOS APLICÁVEIS
${sep2}
${rules.norma_base}
Referência legal: ${rules.cit_base}
${sep2}
ANÁLISE CRÍTICA — DOCUMENTAÇÃO PENDENTE
${sep2}
`;

  if (!pendencias.length) {
    parecer += `✅ SITUAÇÃO REGULAR: Toda a documentação foi recebida e está em conformidade\ncom as normas contábeis aplicáveis ao regime ${cliente.regime}.\n\n`;
    parecer += `O escritório está em condições de prosseguir com a escrituração do\nperíodo sem ressalvas técnicas.\n`;
  } else {
    if (altoRisco.length) {
      parecer += `\n⚠️  PENDÊNCIAS DE ALTO RISCO (${altoRisco.length}) — AÇÃO IMEDIATA NECESSÁRIA\n${sep2}\n`;
      altoRisco.forEach((p,i) => {
        parecer += `\n${i+1}. ${p.nome.toUpperCase()}\n`;
        parecer += `   Status      : ${p.status}\n`;
        if (p.rule) {
          parecer += `   Norma CPC   : ${p.rule.cpc}\n`;
          parecer += `   Impacto     : ${p.rule.impacto}\n`;
          parecer += `   Ação        : ${p.rule.acao}\n`;
        }
      });
    }
    if (medioRisco.length) {
      parecer += `\n⚠️  PENDÊNCIAS DE MÉDIO RISCO (${medioRisco.length})\n${sep2}\n`;
      medioRisco.forEach((p,i) => {
        parecer += `\n${i+1}. ${p.nome.toUpperCase()}\n`;
        if (p.rule) {
          parecer += `   Norma CPC   : ${p.rule.cpc}\n`;
          parecer += `   Impacto     : ${p.rule.impacto}\n`;
        }
      });
    }
    if (baixoRisco.length) {
      parecer += `\n🔵  PENDÊNCIAS DE BAIXO RISCO (${baixoRisco.length})\n`;
      baixoRisco.forEach(p => { parecer += `   • ${p.nome}\n`; });
    }

    parecer += `\n${sep2}\nCONCLUSÃO TÉCNICA\n${sep2}\n`;
    parecer += `Com base nas normas do ${rules.norma_base.split('—')[0].trim()},\n`;
    if (altoRisco.length > 0) {
      parecer += `identificamos ${altoRisco.length} pendência(s) de ALTO RISCO que\n`;
      parecer += `comprometem a qualidade e fidedignidade da escrituração contábil\n`;
      parecer += `referente à competência ${fmtComp(state.competencia)}.\n\n`;
      parecer += `Solicitamos que a CM Contabilidade adote providências urgentes\n`;
      parecer += `junto ao cliente para regularizar a documentação.\n`;
    } else {
      parecer += `as pendências identificadas são de impacto moderado e podem ser\n`;
      parecer += `regularizadas no prazo normal do ciclo contábil.\n`;
    }
  }

  parecer += `\n${sep2}\nASSINATURA\n${sep2}\n`;
  parecer += `${escritorio}\nAnálise gerada em ${hoje}\nSistema de Automação Contábil — CM Contabilidade\n`;
  parecer += `${sep}\n`;

  // Exibir
  const container = document.getElementById('cpc-panel');
  if (container) {
    container.innerHTML = `
<div class="card mt-4" id="cpc-parecer">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap">
    <strong style="font-size:14px">📊 Análise Técnica — ${cliente.nome.slice(0,40)}</strong>
    <span class="badge ${altoRisco.length?'badge-red':medioRisco.length?'badge-yellow':'badge-green'}">${altoRisco.length?'🔴 Alto Risco':medioRisco.length?'🟡 Médio Risco':'🟢 Regular'}</span>
    <div style="margin-left:auto;display:flex;gap:6px">
      <button class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText(document.getElementById('cpc-parecer-txt').textContent);alert('Copiado!')">📋 Copiar</button>
      <button class="btn btn-ghost btn-sm" onclick="imprimirParecerCPC()">🖨️ Imprimir</button>
    </div>
  </div>
  <pre id="cpc-parecer-txt" style="font-family:monospace;font-size:12px;line-height:1.7;white-space:pre-wrap;background:#f8fafc;padding:16px;border-radius:8px;border:1px solid var(--border)">${parecer}</pre>
</div>`;
    container.scrollIntoView({behavior:'smooth'});
  }
}

function imprimirParecerCPC() {
  const txt = document.getElementById('cpc-parecer-txt')?.textContent || '';
  const win = window.open('','_blank');
  win.document.write(`<html><head><title>Análise Técnica</title>
    <style>body{font-family:monospace;font-size:12px;padding:30px;line-height:1.7;white-space:pre-wrap}</style>
  </head><body>${txt}</body></html>`);
  win.document.close(); win.print();
}
