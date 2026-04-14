// ========== DEPENDENTES ==========
function pgDependentes(){
  const dep=calcCustoDependentes();
  let h=`<div class="alert alert-b anim d1"><span>⚖️</span><div><h3>Controle de Custos para Pensão Alimentícia — CC Art. 1.694 a 1.710</h3><p>Cálculo do custo efetivo mensal por dependente e divisão 50/50 entre genitores (Lei 13.058/2014).</p></div></div>
  <div class="cards-row cards-4 anim d2">
    <div class="card c-blue"><div class="c-icon i-blue">👶</div><div class="c-label">Custo Mensal Total</div><div class="c-value v-blue">${fmt(dep.totalMensal)}</div><div class="c-sub">Todos os dependentes</div></div>
    <div class="card c-indigo"><div class="c-icon i-blue">👩</div><div class="c-label">Parte Mãe (50%)</div><div class="c-value v-blue">${fmt(dep.metadeMae)}</div></div>
    <div class="card c-amber"><div class="c-icon i-amber">👨</div><div class="c-label">Parte Pai (50%)</div><div class="c-value v-amber">${fmt(dep.metadePai)}</div><div class="c-sub">Valor que o pai deve pagar</div></div>
    <div class="card c-rose"><div class="c-icon i-rose">📉</div><div class="c-label">Dívidas Depend. (50% pai)</div><div class="c-value v-rose">${fmt(dep.metadeDividaPai)}</div><div class="c-sub">Responsabilidade solidária</div></div>
  </div>
  <div class="tbl anim d3" style="padding:16px;">
    <div style="font-size:.8rem;font-weight:600;margin-bottom:8px;">Divisão de Responsabilidade Mensal</div>
    <div class="split-bar"><div class="split-mae" style="width:50%;">Mãe: ${fmt(dep.metadeMae)}</div><div class="split-pai" style="width:50%;">Pai: ${fmt(dep.metadePai)}</div></div>
    <div style="font-size:.7rem;color:var(--text-3);margin-top:6px;">⚖️ Base: Art. 1.703 CC — ajustar conforme renda de cada genitor.</div>
  </div>`;
  h+=`<div class="section anim d4"><div class="section-title">📋 Detalhamento por Categoria</div><div class="tbl"><table><thead><tr><th>Despesa</th><th>Categoria</th><th>Total/Mês</th><th>Mãe (50%)</th><th>Pai (50%)</th><th>Fundamento</th></tr></thead><tbody>`;
  DEPENDENTES.custos.filter(c=>c.tipo!=='divida').forEach(c=>{
    const mae=(c.valor||0)*(c.divisao||50)/100;const pai=(c.valor||0)-mae;
    h+=`<tr><td><div class="cred"><div class="cred-av" style="background:var(--blue-soft);">${c.icon}</div><div><span class="cred-n">${c.descricao}</span>${c.nota?`<br><span class="cred-d">${c.nota}</span>`:''}</div></div></td><td><span class="cat" style="background:var(--blue-soft);color:var(--blue);">${c.categoria}</span></td><td><span class="amt">${fmt(c.valor)}</span></td><td><span class="amt v-blue">${fmt(mae)}</span></td><td><span class="amt v-amber">${fmt(pai)}</span></td><td style="font-size:.68rem;color:var(--text-3);max-width:200px;">${c.fundamento}</td></tr>`;
  });
  h+=`</tbody><tfoot class="tbl-footer"><tr><td colspan="2"><strong>TOTAL MENSAL</strong></td><td><span class="amt">${fmt(dep.totalMensal)}</span></td><td><span class="amt v-blue">${fmt(dep.metadeMae)}</span></td><td><span class="amt v-amber">${fmt(dep.metadePai)}</span></td><td></td></tr></tfoot></table></div></div>`;
  const divDep=DEPENDENTES.custos.filter(c=>c.tipo==='divida');
  if(divDep.length){
    h+=`<div class="section anim d5"><div class="section-title">🔴 Dívidas dos Dependentes</div><div class="tbl"><table><thead><tr><th>Dívida</th><th>Total</th><th>Parte Pai (50%)</th><th>Fundamento</th></tr></thead><tbody>`;
    divDep.forEach(c=>{const pai=(c.valor||0)*(c.divisao||50)/100;h+=`<tr><td><div class="cred"><div class="cred-av" style="background:var(--rose-soft);">${c.icon}</div><span class="cred-n">${c.descricao}</span></div></td><td><span class="amt v-rose">${fmt(c.valor)}</span></td><td><span class="amt v-amber">${fmt(pai)}</span></td><td style="font-size:.7rem;color:var(--text-3);">${c.fundamento}</td></tr>`;});
    h+=`</tbody><tfoot class="tbl-footer"><tr><td><strong>TOTAL</strong></td><td><span class="amt v-rose">${fmt(dep.totalDividasDep)}</span></td><td><span class="amt v-amber">${fmt(dep.metadeDividaPai)}</span></td><td></td></tr></tfoot></table></div></div>`;
  }
  return h;
}

// ========== BASE LEGAL ==========
function pgLegal(){
  const f=DEPENDENTES.fundamentacao;
  let h=`<div class="alert alert-b anim d1"><span>⚖️</span><div><h3>${f.titulo}</h3><p>Artigos e leis que fundamentam o direito à pensão alimentícia e a divisão de custos entre genitores.</p></div></div>`;
  h+=`<div class="tbl anim d2">`;
  f.artigos.forEach(a=>{h+=`<div class="legal-article"><div class="legal-ref">${a.lei} — ${a.artigo}</div><div class="legal-text">"${a.texto}"</div></div>`;});
  h+=`</div>`;
  h+=`<div class="section anim d3" style="margin-top:16px;"><div class="section-title">💡 Observações Importantes</div><div class="tbl">`;
  f.observacoes.forEach(o=>{h+=`<div class="goal"><div class="goal-status pendente"></div><div class="goal-text" style="font-size:.8rem;">${o}</div></div>`;});
  h+=`</div></div>`;
  h+=`<div class="alert alert-a anim d4"><span>⚠️</span><div><h3>Informações para completar</h3><p>1. <strong>Nomes e idades dos filhos</strong><br>2. <strong>Tipo de guarda atual</strong><br>3. <strong>Renda do ex-marido</strong><br>4. <strong>Valor da pensão atual</strong><br>5. <strong>Despesas extraordinárias</strong></p></div></div>`;
  return h;
}

// ========== DESPESAS ==========
function pgDespesas(){
  const cats=[{k:'fixas_essenciais',t:'🔹 Fixas Essenciais',c:'blue',a:DESPESAS.fixas_essenciais},{k:'fixas_nao_essenciais',t:'🔸 Fixas Não Essenciais',c:'amber',a:DESPESAS.fixas_nao_essenciais},{k:'variaveis',t:'🔻 Variáveis',c:'rose',a:DESPESAS.variaveis},{k:'profissionais_pj',t:'🔷 Profissionais (PJ)',c:'blue',a:DESPESAS.profissionais_pj}];
  let h='';cats.forEach(c=>{const tot=c.a.reduce((s,d)=>s+(d.valor||0),0);
    h+=`<div class="section anim d2"><div class="section-header"><div class="section-title">${c.t}</div><span class="section-badge" style="background:var(--${c.c}-soft);color:var(--${c.c});">${fmt(tot)}/mês</span></div><div class="tbl"><table><thead><tr><th>Despesa</th><th>Tipo</th><th>Vencimento</th><th>Valor/Mês</th><th>Status</th></tr></thead><tbody>`;
    c.a.forEach(d=>{h+=`<tr><td><div class="cred"><div class="cred-av" style="background:var(--${c.c}-soft);">${d.icon}</div><div><span class="cred-n">${d.nome}</span>${d.nota?`<br><span class="cred-d">${d.nota}</span>`:''}</div></div></td><td><span class="cat" style="background:var(--${c.c}-soft);color:var(--${c.c});">${d.tipo}</span></td><td>${d.vencDia?'Dia '+d.vencDia:'Variável'}</td><td><span class="amt">${fmt(d.valor)}</span></td><td>${stH(d.status||'ativo')}</td></tr>`;});
    h+=`</tbody><tfoot class="tbl-footer"><tr><td colspan="3"><strong>Subtotal</strong></td><td><span class="amt v-${c.c}">${fmt(tot)}</span></td><td></td></tr></tfoot></table></div></div>`;});
  h+=`<div class="card c-amber anim d4" style="text-align:center;padding:20px;"><div class="c-label">TOTAL DESPESAS</div><div class="c-value v-amber" style="font-size:1.8rem;">${fmt(calcDespesasMensais())}</div></div>`;return h;
}

// ========== DÍVIDAS ==========
function pgDividas(){
  const dP=calcTotalDividas('pessoais'),dE=calcTotalDividas('empresariais');
  const pessoais=CONTAS_PAGAR.filter(c=>c.pf_pj==='pf'&&c.saldo_atual>0).sort((a,b)=>b.saldo_atual-a.saldo_atual);
  const empresariais=CONTAS_PAGAR.filter(c=>c.pf_pj==='pj'&&c.saldo_atual>0);
  let h=`<div class="cards-row cards-3 anim d1"><div class="card c-rose"><div class="c-icon i-rose">💳</div><div class="c-label">Pessoal</div><div class="c-value v-rose">${fmt(dP)}</div></div><div class="card c-purple"><div class="c-icon i-purple">🏢</div><div class="c-label">Empresarial</div><div class="c-value v-purple">${fmt(dE)}</div></div><div class="card c-emerald"><div class="c-icon i-emerald">✅</div><div class="c-label">Quitados</div><div class="c-value v-emerald">${DIVIDAS.quitadas.length}</div></div></div>`;
  h+=`<div class="section anim d2"><div class="section-title">👤 Pessoais</div><div class="tbl"><table><thead><tr><th>Credor</th><th>Valor Original</th><th>Saldo</th><th>Parcela</th><th>Status</th></tr></thead><tbody>`;
  pessoais.forEach(d=>{h+=`<tr><td><div class="cred"><div class="cred-av" style="background:var(--rose-soft);">${d.icon}</div><div><span class="cred-n">${d.fornecedor}</span>${d.nota?`<br><span class="cred-d">${d.nota.substring(0,60)}</span>`:''}</div></div></td><td>${d.total_divida?fmt(d.total_divida):'—'}</td><td><span class="amt v-rose">${fmt(d.saldo_atual)}</span></td><td>${d.parcela_valor?fmt(d.parcela_valor):'—'}</td><td>${stH(d.status)}</td></tr>`;});
  h+=`</tbody><tfoot class="tbl-footer"><tr><td colspan="2"><strong>Total</strong></td><td><span class="amt v-rose">${fmt(dP)}</span></td><td colspan="2"></td></tr></tfoot></table></div></div>`;
  h+=`<div class="section anim d3"><div class="section-title">🏢 Empresariais</div><div class="tbl"><table><thead><tr><th>Empresa</th><th>Saldo</th><th>Status</th><th>Obs</th></tr></thead><tbody>`;
  empresariais.forEach(d=>{h+=`<tr><td><div class="cred"><div class="cred-av" style="background:var(--purple-soft);">${d.icon}</div><span class="cred-n">${d.fornecedor}</span></div></td><td><span class="amt v-purple">${d.saldo_atual?fmt(d.saldo_atual):'Verificar'}</span></td><td>${stH(d.status)}</td><td style="font-size:.76rem;color:var(--text-2);">${d.nota||'—'}</td></tr>`;});
  h+=`</tbody></table></div></div>`;return h;
}

// ========== PATRIMÔNIO ==========
function pgPatrimonio(){
  const a=PATRIMONIO.ativos.reduce((s,x)=>s+(x.valor||0),0),pP=PATRIMONIO.passivos_pessoais(),pE=PATRIMONIO.passivos_empresariais(),pl=a-pP-pE;
  const t=a+pP+pE;const pa=t>0?Math.max(2,Math.round(a/t*100)):0;const pp=t>0?Math.round(pP/t*100):0;const pe=t>0?Math.round(pE/t*100):0;
  return`<div class="cards-row cards-4 anim d1"><div class="card c-emerald"><div class="c-icon i-emerald">📈</div><div class="c-label">Ativos</div><div class="c-value v-emerald">${fmt(a)}</div></div><div class="card c-rose"><div class="c-icon i-rose">📉</div><div class="c-label">Passivo Pessoal</div><div class="c-value v-rose">${fmt(pP)}</div></div><div class="card c-purple"><div class="c-icon i-purple">🏢</div><div class="c-label">Passivo Empresarial</div><div class="c-value v-purple">${fmt(pE)}</div></div><div class="card ${pl>=0?'c-emerald':'c-rose'}"><div class="c-icon ${pl>=0?'i-emerald':'i-rose'}">💎</div><div class="c-label">Patrimônio Líquido</div><div class="c-value ${pl>=0?'v-emerald':'v-rose'}">${fmt(pl)}</div></div></div>
  <div class="tbl anim d2" style="padding:14px;"><div style="font-size:.78rem;color:var(--text-3);margin-bottom:6px;">Proporção</div><div class="patri-bar"><div class="seg" style="width:${pa}%;background:var(--emerald);">${pa>3?'Ativos':''}</div><div class="seg" style="width:${pp}%;background:var(--rose);">${pp>5?'Pessoal':''}</div><div class="seg" style="width:${pe}%;background:var(--purple);">${pe>5?'Empresarial':''}</div></div></div>`;
}

// ========== PLANEJAMENTO ==========
function pgPlanejamento(){
  const f=[{t:'⚡ Curto Prazo',s:'Estabilizar',a:PLANEJAMENTO.curto_prazo},{t:'📈 Médio Prazo',s:'Reorganizar',a:PLANEJAMENTO.medio_prazo},{t:'🚀 Longo Prazo',s:'Crescer',a:PLANEJAMENTO.longo_prazo}];
  let h='';f.forEach(x=>{h+=`<div class="section anim d2"><div class="section-header"><div class="section-title">${x.t}</div><span style="font-size:.76rem;color:var(--text-3);">${x.s}</span></div><div class="tbl">`;x.a.forEach(g=>{h+=`<div class="goal"><div class="goal-status ${g.status}"></div><div class="goal-text">${g.meta}</div><div class="goal-prazo">${g.prazo}</div>${stH(g.status)}</div>`;});h+=`</div></div>`;});return h;
}

// ========== CLIENTES ==========
function pgClientes(){
  let h=`<div class="action-row anim d1"><button class="btn btn-primary" onclick="abrirModalCliente()">➕ Novo Cliente</button></div>`;
  h+=`<div class="tbl anim d2"><table><thead><tr><th></th><th>Cliente</th><th>Tipo</th><th>CPF / CNPJ</th><th>WhatsApp</th><th>Email</th><th>Desde</th><th>Ações</th></tr></thead><tbody>`;
  CLIENTES.forEach(c=>{const isAtivo=c.id===clienteAtualId;
    h+=`<tr style="${isAtivo?'background:var(--indigo-soft);':''}"><td>${isAtivo?'<span class="pri pri-critica" style="font-size:.6rem;padding:2px 6px;">ATIVO</span>':''}</td><td><strong>${c.nome}</strong></td><td><span class="pgto-tag">${c.tipo}</span></td><td>${c.cpf||c.cnpj||'—'}</td><td>${c.whatsapp||'—'}</td><td>${c.email||'—'}</td><td>${c.data_inicio||'—'}</td><td><div style="display:flex;gap:4px;"><button class="btn btn-sm btn-ghost" onclick="abrirModalCliente('${c.id}')">✏️</button>${!isAtivo?`<button class="btn btn-sm btn-primary" onclick="trocarCliente('${c.id}')">Ativar</button>`:''}</div></td></tr>`;
  });
  return h+`</tbody></table></div>`;
}

// ========== QUITADOS ==========
function pgQuitados(){
  let h=`<div class="alert alert-e anim d1"><span>🎉</span><div><h3 style="color:var(--emerald);">${DIVIDAS.quitadas.length} dívidas resolvidas!</h3><p>Cada uma é uma vitória.</p></div></div><div class="tbl anim d2"><table><thead><tr><th>Credor</th><th>Status</th><th>Obs</th></tr></thead><tbody>`;
  DIVIDAS.quitadas.forEach(d=>{h+=`<tr><td><div class="cred"><div class="cred-av" style="background:var(--emerald-soft);">${d.icon}</div><span class="cred-n">${d.credor}</span></div></td><td><span class="st st-e"><span class="st-dot"></span>✅ Quitado</span></td><td style="font-size:.78rem;color:var(--text-2);">${d.nota||'—'}</td></tr>`;});
  return h+'</tbody></table></div>';
}
