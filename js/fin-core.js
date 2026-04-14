// ========== CORE ENGINE ==========
const fmt=v=>v==null?'—':'R$ '+v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});

const NAV=[
  {section:'FINANCEIRO',items:[
    {id:'contas_receber',icon:'💚',label:'Contas a Receber'},
    {id:'contas_pagar',icon:'📋',label:'Contas a Pagar',badge:'danger'},
    {id:'fluxo',icon:'💰',label:'Fluxo de Caixa'},
    {id:'dashboard',icon:'📊',label:'Dashboard'},
  ]},
  {section:'DEPENDENTES',items:[
    {id:'dependentes',icon:'👶',label:'Custos por Dependente',badge:'warn'},
    {id:'legal',icon:'⚖️',label:'Base Legal Pensão'},
  ]},
  {section:'ANÁLISE',items:[
    {id:'despesas',icon:'📦',label:'Despesas'},
    {id:'dividas',icon:'🔴',label:'Dívidas & Passivos'},
    {id:'patrimonio',icon:'🏦',label:'Patrimônio'},
    {id:'planejamento',icon:'🎯',label:'Planejamento'},
  ]},
  {section:'SISTEMA',items:[
    {id:'clientes',icon:'👥',label:'Clientes'},
    {id:'quitados',icon:'✅',label:'Quitados',badge:'ok'},
  ]}
];

let currentPage='contas_receber',currentFilter='todos';

function togglePFPJ(f){currentFilter=f;document.querySelectorAll('.toggle-btn').forEach(b=>b.classList.remove('active'));document.getElementById('tog-'+f).classList.add('active');renderPage(currentPage);}

function renderClienteSelect(){
  const sel=document.getElementById('clienteSelect');if(!sel)return;
  sel.innerHTML=CLIENTES.map(c=>`<option value="${c.id}" ${c.id===clienteAtualId?'selected':''}>${c.nome} (${c.tipo})</option>`).join('');
  const footer=document.getElementById('footerClientName');
  if(footer){const cl=getClienteAtual();footer.textContent=cl.nome+' ('+cl.tipo+')';}
}
function trocarCliente(id){clienteAtualId=id;salvarClientes();renderClienteSelect();renderPage(currentPage);}

function abrirModalCliente(editId){
  const cl=editId?CLIENTES.find(c=>c.id===editId):null;const isEdit=!!cl;
  const overlay=document.createElement('div');overlay.className='modal-overlay';overlay.id='modalCliente';
  overlay.innerHTML=`<div class="modal">
    <div class="modal-title">${isEdit?'✏️ Editar':'➕ Novo'} Cliente</div>
    <div class="modal-field"><label class="modal-label">Nome</label><input class="modal-input" id="mcNome" value="${cl?cl.nome:''}" placeholder="Nome do cliente"></div>
    <div class="modal-row">
      <div class="modal-field"><label class="modal-label">Tipo</label><select class="modal-input" id="mcTipo"><option value="PF" ${cl&&cl.tipo==='PF'?'selected':''}>Pessoa Física</option><option value="PJ" ${cl&&cl.tipo==='PJ'?'selected':''}>Pessoa Jurídica</option></select></div>
      <div class="modal-field"><label class="modal-label">CPF / CNPJ</label><input class="modal-input" id="mcDoc" value="${cl?(cl.cpf||cl.cnpj||''):''}" placeholder="Documento"></div>
    </div>
    <div class="modal-row">
      <div class="modal-field"><label class="modal-label">WhatsApp</label><input class="modal-input" id="mcWhats" value="${cl?cl.whatsapp:''}" placeholder="(xx) xxxxx-xxxx"></div>
      <div class="modal-field"><label class="modal-label">Email</label><input class="modal-input" id="mcEmail" value="${cl?cl.email:''}" placeholder="email@email.com"></div>
    </div>
    <div class="modal-actions">
      ${isEdit?'<button class="btn btn-danger btn-sm" onclick="excluirCliente(\''+cl.id+'\')">🗑️ Excluir</button>':''}
      <button class="btn btn-ghost" onclick="document.getElementById('modalCliente').remove()">Cancelar</button>
      <button class="btn btn-success" onclick="salvarModalCliente('${editId||''}')">✔ ${isEdit?'Salvar':'Adicionar'}</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove();});
}
function salvarModalCliente(editId){
  const nome=document.getElementById('mcNome').value.trim();const tipo=document.getElementById('mcTipo').value;
  const doc=document.getElementById('mcDoc').value.trim();const whats=document.getElementById('mcWhats').value.trim();
  const email=document.getElementById('mcEmail').value.trim();
  if(!nome){alert('Nome é obrigatório');return;}
  if(editId){const cl=CLIENTES.find(c=>c.id===editId);if(cl){cl.nome=nome;cl.tipo=tipo;if(tipo==='PF'){cl.cpf=doc;cl.cnpj=null;}else{cl.cnpj=doc;cl.cpf=null;}cl.whatsapp=whats;cl.email=email;}}
  else{const id=nome.toLowerCase().replace(/[^a-z0-9]/g,'-').replace(/-+/g,'-')+'-'+tipo.toLowerCase();
    CLIENTES.push({id,nome,tipo,cpf:tipo==='PF'?doc:null,cnpj:tipo==='PJ'?doc:null,whatsapp:whats,email,data_inicio:new Date().toISOString().slice(0,10),ativo:true,etapa_atual:1,etapas:[
      {num:1,nome:'Levantamento',status:'em_andamento',icon:'📋'},{num:2,nome:'Priorização',status:'pendente',icon:'🎯'},{num:3,nome:'Negociação',status:'pendente',icon:'🤝'},
      {num:4,nome:'Fluxo de Caixa',status:'pendente',icon:'💰'},{num:5,nome:'Redução',status:'pendente',icon:'✂️'},{num:6,nome:'Reorganização',status:'pendente',icon:'🚀'}
    ]});clienteAtualId=id;}
  salvarClientes();document.getElementById('modalCliente').remove();renderClienteSelect();renderPage(currentPage);
}
function excluirCliente(id){
  if(CLIENTES.length<=1){alert('Não é possível excluir o único cliente.');return;}
  if(!confirm('Excluir cliente?'))return;CLIENTES=CLIENTES.filter(c=>c.id!==id);
  if(clienteAtualId===id)clienteAtualId=CLIENTES[0].id;salvarClientes();document.getElementById('modalCliente').remove();renderClienteSelect();renderPage(currentPage);
}

function renderNav(){
  const el=document.getElementById('sidebarNav');if(!el)return;
  let h='';NAV.forEach(s=>{h+=`<div class="nav-section"><div class="nav-label">${s.section}</div>`;
    s.items.forEach(i=>{const bc=i.badge==='danger'?'badge-danger':i.badge==='warn'?'badge-warn':i.badge==='ok'?'badge-ok':'';
      h+=`<div class="nav-item ${i.id===currentPage?'active':''}" onclick="renderPage('${i.id}')"><span class="nav-icon">${i.icon}</span>${i.label}${i.badge?`<span class="nav-badge ${bc}">!</span>`:''}</div>`;
    });h+=`</div>`;});
  el.innerHTML=h;
}

function stH(s){const m={ativo:['st-b','Ativo'],em_dia:['st-e','✅ Em Dia'],em_aberto:['st-r','Em Aberto'],atrasado:['st-r','🚨 Atrasado'],levantar:['st-p','🔍 Levantar'],negociando:['st-a','🤝 Negociando'],aguardando_pensao:['st-a','⏳ Aguard. Pensão'],judicial:['st-p','⚖️ Judicial'],verificar:['st-a','⚠️ Verificar'],avaliar:['st-a','⚠️ Avaliar'],urgente:['st-r','🚨 Urgente'],pendente:['st-a','Pendente'],planejado:['st-b','Planejado'],em_andamento:['st-e','Em Andamento'],quitado:['st-e','✅ Quitado']};const[c,l]=m[s]||['st-b','—'];return`<span class="st ${c}"><span class="st-dot"></span>${l}</span>`;}
function priH(p){const m={critica:['pri-critica','🔴 CRÍTICA'],alta:['pri-alta','🟠 ALTA'],media:['pri-media','🟡 MÉDIA'],baixa:['pri-baixa','🟢 BAIXA']};const[c,l]=m[p]||['pri-media','—'];return`<span class="pri ${c}"><span class="pri-dot"></span>${l}</span>`;}
function actH(a){const m={manter:['act-manter','🟢 MANTER'],negociar:['act-negociar','🟡 NEGOCIAR'],cancelar:['act-cancelar','🔴 CANCELAR'],levantar:['act-levantar','🔍 LEVANTAR'],regularizar:['act-regularizar','⚡ REGULARIZAR']};const[c,l]=m[a]||['act-manter','—'];return`<span class="act ${c}">${l}</span>`;}
function toggleDetail(id){const row=document.getElementById('detail-'+id);if(row)row.classList.toggle('show');}

function renderPage(id){
  const contentEl=document.getElementById('content');if(!contentEl)return;
  currentPage=id;renderNav();
  const titles={dashboard:['Dashboard','Panorama financeiro consolidado'],contas_receber:['Contas a Receber','Receitas e entradas previstas'],contas_pagar:['Contas a Pagar','Fornecedor · Despesa · Total · Status · Parcelas'],clientes:['Clientes','Cadastro e gestão'],despesas:['Despesas','Controle por classificação'],dividas:['Dívidas & Passivos','Mapa de endividamento'],patrimonio:['Patrimônio','Ativos – Passivos'],planejamento:['Planejamento','Curto, médio e longo prazo'],fluxo:['Fluxo de Caixa','Entradas vs Saídas — 2025 e 2026'],quitados:['Quitados','Conquistas'],dependentes:['Custos por Dependente','Controle para pensão — Art. 1.694 CC'],legal:['Base Legal','Fundamentação jurídica']};
  const[t,s]=titles[id]||['',''];
  const pt=document.getElementById('pageTitle');if(pt)pt.textContent=t;
  const ps=document.getElementById('pageSubtitle');if(ps)ps.textContent=s;
  const pages={dashboard:pgDashboard,contas_receber:pgContasReceber,contas_pagar:pgContasPagar,clientes:pgClientes,despesas:pgDespesas,dividas:pgDividas,patrimonio:pgPatrimonio,planejamento:pgPlanejamento,fluxo:pgFluxo,quitados:pgQuitados,dependentes:pgDependentes,legal:pgLegal};
  try{contentEl.innerHTML=(pages[id]||pgContasReceber)();}catch(e){console.error('ERRO:',id,e);contentEl.innerHTML='<div style="padding:20px;"><h2 style="color:red;">⚠️ Erro: '+id+'</h2><pre style="color:red;font-size:.8rem;padding:16px;background:#fff5f5;border-radius:8px;white-space:pre-wrap;">'+e.message+'\n'+e.stack+'</pre></div>';}
  renderClienteSelect();
}

document.addEventListener('DOMContentLoaded',()=>{
  // Only auto-init if running standalone (not inside Vértice)
  if(document.getElementById('headerDate')){
    document.getElementById('headerDate').textContent=new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'});
    renderClienteSelect();renderPage('contas_receber');
  }
});
