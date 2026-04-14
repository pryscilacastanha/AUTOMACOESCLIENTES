// ========== CONTAS A RECEBER ==========
function pgContasReceber(){
  const pf=calcReceitaMedia('pf'),pj=calcReceitaMedia('pj'),total=pf+pj;
  let h=`<div class="cards-row cards-3 anim d1">
    <div class="card c-emerald"><div class="c-icon i-emerald">💰</div><div class="c-label">Total Previsto</div><div class="c-value v-emerald">${fmt(total)}</div><div class="c-sub">PF + PJ / mês</div></div>
    <div class="card c-blue"><div class="c-icon i-blue">👤</div><div class="c-label">Pessoa Física</div><div class="c-value v-blue">${fmt(pf)}</div><div class="c-sub">${RECEITAS.pf.length} fontes</div></div>
    <div class="card c-purple"><div class="c-icon i-purple">🏢</div><div class="c-label">Pessoa Jurídica</div><div class="c-value v-purple">${fmt(pj)}</div><div class="c-sub">${RECEITAS.pj.length} fontes</div></div>
  </div>`;
  [['pf','👤 Receitas PF',RECEITAS.pf,'blue'],['pj','🏢 Receitas PJ',RECEITAS.pj,'purple']].forEach(([k,t,a,c])=>{
    const tot=a.reduce((s,r)=>s+(r.media||0),0);
    h+=`<div class="section anim d2"><div class="section-header"><div class="section-title">${t}</div><span class="section-badge" style="background:var(--${c}-soft);color:var(--${c});">${fmt(tot)}/mês</span></div>
    <div class="tbl"><table><thead><tr><th></th><th>Fonte / Cliente</th><th>Tipo</th><th>Média/Mês</th><th>Recorrente?</th><th>Status</th></tr></thead><tbody>`;
    a.forEach(r=>{h+=`<tr><td><span style="font-size:1rem;">${r.icon||'💼'}</span></td><td><strong>${r.fonte}</strong>${r.nota?`<br><span class="cred-d">${r.nota}</span>`:''}</td><td><span class="cat" style="background:var(--${c}-soft);color:var(--${c});">${r.tipo}</span></td><td><span class="amt v-emerald">${fmt(r.media)}</span></td><td>${r.recorrente?'✅ Sim':'⚡ Variável'}</td><td>${stH(r.status||'ativo')}</td></tr>`;});
    h+=`</tbody><tfoot class="tbl-footer"><tr><td colspan="3"><strong>Total</strong></td><td><span class="amt v-${c}">${fmt(tot)}</span></td><td colspan="2"></td></tr></tfoot></table></div></div>`;
  });
  return h;
}

// ========== CONTAS A PAGAR — Editável ==========
function pgContasPagar(){
  const dividas=CONTAS_PAGAR.filter(c=>c.saldo_atual>0);
  const fixas=CONTAS_PAGAR.filter(c=>!c.saldo_atual && c.parcela_valor>0);
  const totalDivida=dividas.reduce((s,c)=>s+(c.saldo_atual||0),0);
  const totalFixo=fixas.reduce((s,c)=>s+(c.parcela_valor||0),0);
  const totalParcelas=CONTAS_PAGAR.filter(c=>c.saldo_atual>0&&c.parcela_valor>0).reduce((s,c)=>s+(c.parcela_valor||0),0);
  const criticas=dividas.filter(c=>c.prioridade==='critica').length;

  let h=`<div class="action-row anim d1">
    <button class="btn btn-primary" onclick="abrirModalConta()">➕ Nova Conta</button>
    <button class="btn btn-ghost" onclick="exportarContas()">📥 Exportar</button>
  </div>
  <div class="cards-row cards-4 anim d1">
    <div class="card c-rose"><div class="c-icon i-rose">💳</div><div class="c-label">Total Dívidas</div><div class="c-value v-rose">${fmt(totalDivida)}</div><div class="c-sub">${dividas.length} credores</div></div>
    <div class="card c-amber"><div class="c-icon i-amber">📋</div><div class="c-label">Parcelas/Mês</div><div class="c-value v-amber">${fmt(totalParcelas)}</div><div class="c-sub">Compromisso mensal</div></div>
    <div class="card c-blue"><div class="c-icon i-blue">🔄</div><div class="c-label">Despesas Fixas</div><div class="c-value v-blue">${fmt(totalFixo)}</div><div class="c-sub">${fixas.length} fornecedores</div></div>
    <div class="card c-indigo"><div class="c-icon i-rose">⚡</div><div class="c-label">Críticos</div><div class="c-value v-rose" style="font-size:1.6rem;">${criticas}</div><div class="c-sub">Ação imediata</div></div>
  </div>`;

  // Dívidas ativas
  h+=`<div class="section anim d2"><div class="section-header"><div class="section-title">🔴 Dívidas Ativas</div><span class="section-badge" style="background:var(--rose-soft);color:var(--rose);">${fmt(totalDivida)}</span></div>`;
  h+=renderContasTable(dividas.sort((a,b)=>{const po={critica:0,alta:1,media:2,baixa:3};return(po[a.prioridade]||9)-(po[b.prioridade]||9);}));
  h+=`</div>`;

  // Despesas fixas mensais
  if(fixas.length){
    h+=`<div class="section anim d3"><div class="section-header"><div class="section-title">🔄 Despesas Fixas Mensais</div><span class="section-badge" style="background:var(--blue-soft);color:var(--blue);">${fmt(totalFixo)}/mês</span></div>`;
    h+=renderContasTable(fixas);
    h+=`</div>`;
  }
  h+=`<div id="modalContaContainer"></div>`;
  return h;
}

function renderContasTable(items){
  let h=`<div class="tbl"><table><thead><tr>
    <th style="width:30px;"></th><th>Fornecedor</th><th>Despesa</th><th>Total Dívida</th><th>Saldo Atual</th>
    <th>Parcela</th><th>Status</th><th>Prioridade</th><th>Ações</th>
  </tr></thead><tbody>`;
  items.forEach(c=>{
    const parcInfo=c.parcelas_total?`${c.parcelas_pagas||0}/${c.parcelas_total}`:(c.parcela_valor?'/mês':'');
    h+=`<tr>
      <td><button class="expand-btn" onclick="toggleDetail('cp${c.id}')" title="Detalhes">▶</button></td>
      <td><div class="cred"><div class="cred-av" style="background:var(--${c.prioridade==='critica'?'rose':c.prioridade==='alta'?'amber':'blue'}-soft);">${c.icon}</div><span class="cred-n">${c.fornecedor}</span></div></td>
      <td style="font-size:.78rem;color:var(--text-2);max-width:180px;">${c.despesa||'—'}</td>
      <td>${c.total_divida?`<span class="amt">${fmt(c.total_divida)}</span>`:'—'}</td>
      <td>${c.saldo_atual?`<span class="amt v-rose">${fmt(c.saldo_atual)}</span>`:'—'}</td>
      <td>${c.parcela_valor?`<span class="amt">${fmt(c.parcela_valor)}</span><br><span class="cred-d">${parcInfo}</span>`:'—'}</td>
      <td><select class="status-select" onchange="mudarStatusConta(${c.id},this.value)">
        <option value="em_dia" ${c.status==='em_dia'?'selected':''}>✅ Em Dia</option>
        <option value="atrasado" ${c.status==='atrasado'?'selected':''}>🚨 Atrasado</option>
        <option value="em_aberto" ${c.status==='em_aberto'?'selected':''}>📋 Em Aberto</option>
        <option value="negociando" ${c.status==='negociando'?'selected':''}>🤝 Negociando</option>
        <option value="pendente" ${c.status==='pendente'?'selected':''}>⏳ Pendente</option>
        <option value="aguardando_pensao" ${c.status==='aguardando_pensao'?'selected':''}>⏳ Aguard. Pensão</option>
        <option value="judicial" ${c.status==='judicial'?'selected':''}>⚖️ Judicial</option>
        <option value="quitado" ${c.status==='quitado'?'selected':''}>✅ Quitado</option>
        <option value="avaliar" ${c.status==='avaliar'?'selected':''}>⚠️ Avaliar</option>
      </select></td>
      <td><div style="display:flex;gap:4px;">
        <button class="btn btn-ghost btn-sm" onclick="abrirModalConta(${c.id})" title="Editar">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="excluirConta(${c.id})" title="Excluir">🗑️</button>
      </div></td>
    </tr>
    <tr class="detail-row" id="detail-cp${c.id}"><td colspan="9"><div class="detail-content">
      ${c.nota?`<div class="detail-section"><div class="detail-label">📋 Observação</div><strong>${c.nota}</strong></div>`:''}
      ${c.como_executar?`<div class="detail-section"><div class="detail-label">📝 Como Executar</div>${c.como_executar}</div>`:''}
      <div class="detail-section"><div class="detail-label">ℹ️ Info</div>PF/PJ: <strong>${(c.pf_pj||'pf').toUpperCase()}</strong> · Vencimento: <strong>${c.vencimento?'Dia '+c.vencimento:'Variável'}</strong> · Forma: <strong>${c.forma_pgto||'—'}</strong></div>
    </div></td></tr>`;
  });
  const totalSaldo=items.reduce((s,c)=>s+(c.saldo_atual||0),0);
  const totalParc=items.reduce((s,c)=>s+(c.parcela_valor||0),0);
  h+=`</tbody><tfoot class="tbl-footer"><tr><td></td><td colspan="2"><strong>TOTAL (${items.length} itens)</strong></td><td></td><td><span class="amt v-rose">${fmt(totalSaldo)}</span></td><td><span class="amt">${fmt(totalParc)}</span>/mês</td><td colspan="3"></td></tr></tfoot></table></div>`;
  return h;
}

function mudarStatusConta(id,newStatus){
  const c=CONTAS_PAGAR.find(x=>x.id===id);if(c){c.status=newStatus;salvarContas();}
}

function excluirConta(id){
  if(!confirm('Excluir esta conta?'))return;
  CONTAS_PAGAR=CONTAS_PAGAR.filter(c=>c.id!==id);salvarContas();renderPage('contas_pagar');
}

function abrirModalConta(editId){
  const c=editId?CONTAS_PAGAR.find(x=>x.id===editId):null;const isEdit=!!c;
  const d=c||{fornecedor:'',despesa:'',total_divida:'',saldo_atual:'',parcela_valor:'',parcelas_total:'',parcelas_pagas:'',status:'pendente',vencimento:'',forma_pgto:'',pf_pj:'pf',prioridade:'media',icon:'📋',acao:'levantar',nota:'',como_executar:''};
  const html=`<div class="modal-overlay" id="modalConta" onclick="if(event.target===this)this.remove()"><div class="modal">
    <div class="modal-title">${isEdit?'✏️ Editar':'➕ Nova'} Conta</div>
    <div class="modal-row"><div class="modal-field"><label class="modal-label">Fornecedor</label><input class="modal-input" id="mcForn" value="${d.fornecedor}" placeholder="Nome do fornecedor/credor"></div>
    <div class="modal-field"><label class="modal-label">Despesa</label><input class="modal-input" id="mcDesp" value="${d.despesa}" placeholder="Descrição da despesa"></div></div>
    <div class="modal-row-3">
      <div class="modal-field"><label class="modal-label">Total Dívida (R$)</label><input class="modal-input" id="mcTotal" type="number" step="0.01" value="${d.total_divida||''}"></div>
      <div class="modal-field"><label class="modal-label">Saldo Atual (R$)</label><input class="modal-input" id="mcSaldo" type="number" step="0.01" value="${d.saldo_atual||''}"></div>
      <div class="modal-field"><label class="modal-label">Parcela (R$)</label><input class="modal-input" id="mcParc" type="number" step="0.01" value="${d.parcela_valor||''}"></div>
    </div>
    <div class="modal-row-3">
      <div class="modal-field"><label class="modal-label">Qtd. Parcelas</label><input class="modal-input" id="mcParcTotal" type="number" value="${d.parcelas_total||''}"></div>
      <div class="modal-field"><label class="modal-label">Parcelas Pagas</label><input class="modal-input" id="mcParcPagas" type="number" value="${d.parcelas_pagas||''}"></div>
      <div class="modal-field"><label class="modal-label">Dia Vencimento</label><input class="modal-input" id="mcVenc" type="number" min="1" max="31" value="${d.vencimento||''}"></div>
    </div>
    <div class="modal-row-3">
      <div class="modal-field"><label class="modal-label">Status</label><select class="modal-input" id="mcStatus">
        <option value="em_dia" ${d.status==='em_dia'?'selected':''}>Em Dia</option><option value="atrasado" ${d.status==='atrasado'?'selected':''}>Atrasado</option>
        <option value="em_aberto" ${d.status==='em_aberto'?'selected':''}>Em Aberto</option><option value="negociando" ${d.status==='negociando'?'selected':''}>Negociando</option>
        <option value="pendente" ${d.status==='pendente'?'selected':''}>Pendente</option><option value="aguardando_pensao" ${d.status==='aguardando_pensao'?'selected':''}>Aguard. Pensão</option>
        <option value="judicial" ${d.status==='judicial'?'selected':''}>Judicial</option><option value="quitado" ${d.status==='quitado'?'selected':''}>Quitado</option><option value="avaliar" ${d.status==='avaliar'?'selected':''}>Avaliar</option>
      </select></div>
      <div class="modal-field"><label class="modal-label">Prioridade</label><select class="modal-input" id="mcPri">
        <option value="critica" ${d.prioridade==='critica'?'selected':''}>🔴 Crítica</option><option value="alta" ${d.prioridade==='alta'?'selected':''}>🟠 Alta</option>
        <option value="media" ${d.prioridade==='media'?'selected':''}>🟡 Média</option><option value="baixa" ${d.prioridade==='baixa'?'selected':''}>🟢 Baixa</option>
      </select></div>
      <div class="modal-field"><label class="modal-label">PF / PJ</label><select class="modal-input" id="mcPFPJ">
        <option value="pf" ${d.pf_pj==='pf'?'selected':''}>PF</option><option value="pj" ${d.pf_pj==='pj'?'selected':''}>PJ</option>
      </select></div>
    </div>
    <div class="modal-row"><div class="modal-field"><label class="modal-label">Forma Pagamento</label><input class="modal-input" id="mcForma" value="${d.forma_pgto||''}" placeholder="boleto, pix, cartão..."></div>
    <div class="modal-field"><label class="modal-label">Ícone</label><input class="modal-input" id="mcIcon" value="${d.icon||'📋'}" placeholder="Emoji"></div></div>
    <div class="modal-field"><label class="modal-label">Observações</label><input class="modal-input" id="mcNota" value="${d.nota||''}" placeholder="Notas..."></div>
    <div class="modal-field"><label class="modal-label">Como Executar</label><textarea class="modal-input" id="mcComo" rows="2" placeholder="Instruções de pagamento/negociação...">${d.como_executar||''}</textarea></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="document.getElementById('modalConta').remove()">Cancelar</button>
      <button class="btn btn-success" onclick="salvarModalConta(${editId||0})">💾 ${isEdit?'Salvar':'Adicionar'}</button>
    </div>
  </div></div>`;
  document.getElementById('modalContaContainer').innerHTML=html;
}

function salvarModalConta(editId){
  const dados={
    fornecedor:document.getElementById('mcForn').value.trim(),
    despesa:document.getElementById('mcDesp').value.trim(),
    total_divida:parseFloat(document.getElementById('mcTotal').value)||null,
    saldo_atual:parseFloat(document.getElementById('mcSaldo').value)||null,
    parcela_valor:parseFloat(document.getElementById('mcParc').value)||null,
    parcelas_total:parseInt(document.getElementById('mcParcTotal').value)||null,
    parcelas_pagas:parseInt(document.getElementById('mcParcPagas').value)||null,
    vencimento:parseInt(document.getElementById('mcVenc').value)||null,
    status:document.getElementById('mcStatus').value,
    prioridade:document.getElementById('mcPri').value,
    pf_pj:document.getElementById('mcPFPJ').value,
    forma_pgto:document.getElementById('mcForma').value.trim(),
    icon:document.getElementById('mcIcon').value.trim()||'📋',
    nota:document.getElementById('mcNota').value.trim(),
    como_executar:document.getElementById('mcComo').value.trim(),
  };
  if(!dados.fornecedor){alert('Informe o fornecedor.');return;}
  if(editId>0){const idx=CONTAS_PAGAR.findIndex(c=>c.id===editId);if(idx>=0)Object.assign(CONTAS_PAGAR[idx],dados);}
  else{dados.id=CONTAS_PAGAR.length>0?Math.max(...CONTAS_PAGAR.map(c=>c.id))+1:1;CONTAS_PAGAR.push(dados);}
  salvarContas();document.getElementById('modalConta').remove();renderPage('contas_pagar');
}

function exportarContas(){
  let csv='Fornecedor;Despesa;Total Dívida;Saldo Atual;Parcela;Parcelas Total;Parcelas Pagas;Status;Prioridade;PF/PJ;Vencimento;Forma Pgto;Nota\n';
  CONTAS_PAGAR.forEach(c=>{csv+=`"${c.fornecedor}";"${c.despesa}";${c.total_divida||''};${c.saldo_atual||''};${c.parcela_valor||''};${c.parcelas_total||''};${c.parcelas_pagas||''};${c.status};${c.prioridade};${c.pf_pj};${c.vencimento||''};${c.forma_pgto||''};"${c.nota||''}"\n`;});
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='contas_a_pagar.csv';a.click();
}
