// ========== FLUXO DE CAIXA ==========
let fluxoAno=2025;
function setFluxoAno(ano){fluxoAno=ano;renderPage('fluxo');}

function pgFluxo(){
  const r=calcReceitaMedia('pf')+calcReceitaMedia('pj'),d=calcDespesasMensais(),p=calcParcelasMensais(),s=r-d-p;
  const dados2025=FLUXO_MENSAL.filter(m=>m.ano===2025);
  const dados2026=FLUXO_MENSAL.filter(m=>m.ano===2026);
  const dadosAno=fluxoAno===2025?dados2025:dados2026;
  const totais=calcFluxoMensalTotais(fluxoAno);
  const totaisGeral=calcFluxoMensalTotais();
  const maxVal=Math.max(...dadosAno.map(m=>Math.max(m.entradas,m.saidas)),1);

  let barsH='';
  dadosAno.forEach(m=>{
    const eH=maxVal>0?Math.max(4,Math.round(m.entradas/maxVal*170)):4;
    const sH=maxVal>0?Math.max(4,Math.round(m.saidas/maxVal*170)):4;
    const isProj=m.entradas===0&&m.saidas===0;
    barsH+=`<div class="chart-bar-group"><div class="chart-bar-pair">
      <div class="chart-bar ${isProj?'empty':'entrada'}" style="height:${isProj?4:eH}px;" title="Entradas ${m.mes}/${m.ano}: ${fmt(m.entradas)}"></div>
      <div class="chart-bar ${isProj?'empty':'saida'}" style="height:${isProj?4:sH}px;" title="Saídas ${m.mes}/${m.ano}: ${fmt(m.saidas)}"></div>
    </div><div class="chart-bar-label">${m.mes}</div></div>`;
  });

  let h=`
  <div class="cards-row cards-4 anim d1">
    <div class="card c-emerald"><div class="c-icon i-emerald">💰</div><div class="c-label">Entradas (Média)</div><div class="c-value v-emerald">${fmt(r)}</div><div class="c-sub">PF + PJ / mês</div></div>
    <div class="card c-amber"><div class="c-icon i-amber">📋</div><div class="c-label">Despesas</div><div class="c-value v-amber">${fmt(d)}</div><div class="c-sub">Fixas + variáveis</div></div>
    <div class="card c-rose"><div class="c-icon i-rose">💳</div><div class="c-label">Parcelas</div><div class="c-value v-rose">${fmt(p)}</div><div class="c-sub">Dívidas ativas</div></div>
    <div class="card ${s>=0?'c-emerald':'c-rose'}"><div class="c-icon ${s>=0?'i-emerald':'i-rose'}">⚡</div><div class="c-label">Resultado</div><div class="c-value ${s>=0?'v-emerald':'v-rose'}">${fmt(s)}</div><div class="c-sub">${s>=0?'✅ Sobra':'❌ Déficit'}</div></div>
  </div>

  <div class="year-tabs anim d1">
    <div class="year-tab ${fluxoAno===2025?'active':''}" onclick="setFluxoAno(2025)">📅 2025</div>
    <div class="year-tab ${fluxoAno===2026?'active':''}" onclick="setFluxoAno(2026)">📅 2026</div>
  </div>

  <div class="chart-container anim d2">
    <div class="chart-title">📊 Entradas vs Saídas — ${fluxoAno}</div>
    <div class="chart-legend">
      <span><span class="dot" style="background:var(--emerald);"></span> Entradas</span>
      <span><span class="dot" style="background:var(--rose);"></span> Saídas</span>
    </div>
    <div class="chart-bars">${barsH}</div>
  </div>

  <div class="g2 anim d3" style="margin-top:16px;">
    <div class="card c-emerald">
      <div class="c-label">ACUMULADO ENTRADAS ${fluxoAno} (${totais.meses} meses)</div>
      <div class="c-value v-emerald" style="font-size:1.3rem;">${fmt(totais.totalEntradas)}</div>
      <div class="c-sub">Média: ${fmt(totais.mediaEntradas)}/mês</div>
    </div>
    <div class="card c-rose">
      <div class="c-label">ACUMULADO SAÍDAS ${fluxoAno} (${totais.meses} meses)</div>
      <div class="c-value v-rose" style="font-size:1.3rem;">${fmt(totais.totalSaidas)}</div>
      <div class="c-sub">Média: ${fmt(totais.mediaSaidas)}/mês</div>
    </div>
  </div>

  <div class="section anim d4" style="margin-top:16px;">
    <div class="section-header">
      <div class="section-title">📋 Detalhamento por Mês — ${fluxoAno}</div>
      <button class="btn btn-primary btn-sm" onclick="toggleEditFluxo()">✏️ Editar Valores</button>
    </div>
    <div id="fluxoEditArea"></div>
    <div class="tbl"><table><thead><tr><th>Mês</th><th>Entradas</th><th>Saídas</th><th>Saldo</th><th>Obs</th></tr></thead><tbody>`;
  dadosAno.forEach(m=>{
    const saldo=m.entradas-m.saidas;const isProj=m.entradas===0&&m.saidas===0;
    h+=`<tr style="${isProj?'opacity:.45;':''}">
      <td><strong>${m.mes}/${m.ano}</strong></td>
      <td><span class="amt v-emerald">${fmt(m.entradas)}</span></td>
      <td><span class="amt v-rose">${fmt(m.saidas)}</span></td>
      <td><span class="amt ${saldo>=0?'v-emerald':'v-rose'}">${fmt(saldo)}</span></td>
      <td style="font-size:.74rem;color:var(--text-3);">${m.nota||'—'}</td>
    </tr>`;
  });
  h+=`</tbody><tfoot class="tbl-footer"><tr><td><strong>TOTAL</strong></td><td><span class="amt v-emerald">${fmt(totais.totalEntradas)}</span></td><td><span class="amt v-rose">${fmt(totais.totalSaidas)}</span></td><td><span class="amt ${totais.totalEntradas-totais.totalSaidas>=0?'v-emerald':'v-rose'}">${fmt(totais.totalEntradas-totais.totalSaidas)}</span></td><td></td></tr></tfoot></table></div></div>

  <div class="card c-indigo anim d5" style="margin-top:16px;padding:20px;">
    <div class="c-label">RESUMO GERAL 2025 + 2026</div>
    <div style="display:flex;gap:24px;margin-top:10px;flex-wrap:wrap;">
      <div><span style="font-size:.72rem;color:var(--text-3);">Total Entradas:</span><br><span class="amt v-emerald" style="font-size:1.2rem;">${fmt(totaisGeral.totalEntradas)}</span></div>
      <div><span style="font-size:.72rem;color:var(--text-3);">Total Saídas:</span><br><span class="amt v-rose" style="font-size:1.2rem;">${fmt(totaisGeral.totalSaidas)}</span></div>
      <div><span style="font-size:.72rem;color:var(--text-3);">Resultado:</span><br><span class="amt ${totaisGeral.totalEntradas-totaisGeral.totalSaidas>=0?'v-emerald':'v-rose'}" style="font-size:1.2rem;">${fmt(totaisGeral.totalEntradas-totaisGeral.totalSaidas)}</span></div>
      <div><span style="font-size:.72rem;color:var(--text-3);">Meses c/ dados:</span><br><span class="amt" style="font-size:1.2rem;">${totaisGeral.meses}</span></div>
    </div>
  </div>`;
  return h;
}

let fluxoEditMode=false;
function toggleEditFluxo(){
  fluxoEditMode=!fluxoEditMode;const area=document.getElementById('fluxoEditArea');if(!fluxoEditMode){area.innerHTML='';return;}
  const dadosAno=FLUXO_MENSAL.filter(m=>m.ano===fluxoAno);
  let h='<div class="tbl" style="margin-bottom:14px;padding:12px;">';
  h+='<div style="font-size:.8rem;font-weight:700;margin-bottom:10px;color:var(--indigo);">✏️ Editar Valores — '+fluxoAno+'</div>';
  dadosAno.forEach((m,i)=>{
    const idx=FLUXO_MENSAL.indexOf(m);
    h+=`<div class="chart-edit-row">
      <span class="chart-edit-mes">${m.mes}/${m.ano}</span>
      <span class="chart-edit-label">Entradas:</span>
      <input class="edit-input" type="number" step="0.01" value="${m.entradas}" onchange="updateFluxoMes(${idx},'entradas',this.value)">
      <span class="chart-edit-label">Saídas:</span>
      <input class="edit-input" type="number" step="0.01" value="${m.saidas}" onchange="updateFluxoMes(${idx},'saidas',this.value)">
    </div>`;
  });
  h+='<div style="padding:10px 12px;text-align:right;"><button class="btn btn-success btn-sm" onclick="salvarFluxoMensal();toggleEditFluxo();renderPage(\'fluxo\');">💾 Salvar</button></div></div>';
  area.innerHTML=h;
}
function updateFluxoMes(idx,field,val){FLUXO_MENSAL[idx][field]=parseFloat(val)||0;}

// ========== DASHBOARD ==========
function pgDashboard(){
  const r=calcReceitaMedia('pf')+calcReceitaMedia('pj'),d=calcDespesasMensais(),p=calcParcelasMensais(),s=r-d-p;
  const divP=calcTotalDividas('pessoais'),divE=calcTotalDividas('empresariais');
  const dep=calcCustoDependentes();
  const atrasados=CONTAS_PAGAR.filter(c=>c.status==='atrasado'||c.status==='em_aberto').length;
  return`
  <div class="flow anim d1"><div class="flow-step current">💰 GANHAR</div><span class="flow-arrow">→</span><div class="flow-step current">📋 CONTROLAR</div><span class="flow-arrow">→</span><div class="flow-step pending">📊 ORGANIZAR</div><span class="flow-arrow">→</span><div class="flow-step pending">🛡️ PROTEGER</div><span class="flow-arrow">→</span><div class="flow-step pending">🚀 CRESCER</div></div>
  <div class="cards-row cards-5 anim d2">
    <div class="card c-emerald"><div class="c-icon i-emerald">💰</div><div class="c-label">Receita Média</div><div class="c-value v-emerald">${fmt(r)}</div><div class="c-sub">PF + PJ</div></div>
    <div class="card c-amber"><div class="c-icon i-amber">📋</div><div class="c-label">Despesas</div><div class="c-value v-amber">${fmt(d)}</div><div class="c-sub">Fixas + variáveis</div></div>
    <div class="card c-rose"><div class="c-icon i-rose">🔴</div><div class="c-label">Dívida Pessoal</div><div class="c-value v-rose">${fmt(divP)}</div></div>
    <div class="card c-purple"><div class="c-icon i-purple">🏢</div><div class="c-label">Dívida Empresarial</div><div class="c-value v-purple">${fmt(divE)}</div></div>
    <div class="card ${s>=0?'c-emerald':'c-rose'}"><div class="c-icon ${s>=0?'i-emerald':'i-rose'}">⚡</div><div class="c-label">Saldo Mensal</div><div class="c-value ${s>=0?'v-emerald':'v-rose'}">${fmt(s)}</div><div class="c-sub">${s>=0?'✅ Positivo':'❌ Déficit'}</div></div>
  </div>
  ${atrasados>0?`<div class="alert alert-r anim d3"><span>🚨</span><div><h3>${atrasados} conta(s) em atraso ou em aberto</h3><p>Verifique a página de Contas a Pagar para ação imediata.</p></div></div>`:''}
  <div class="g2 anim d4">
    <div class="section"><div class="section-title">📊 Composição das Despesas</div><div class="tbl">${despResumo()}</div></div>
    <div class="section"><div class="section-title">🔴 Top Dívidas</div><div class="tbl">${topDividas()}</div></div>
  </div>
  <div class="card c-blue anim d5" style="margin-top:14px;">
    <div class="c-label">👶 CUSTO MENSAL COM DEPENDENTES (50/50)</div>
    <div style="display:flex;gap:24px;margin-top:8px;flex-wrap:wrap;">
      <div><span style="font-size:.75rem;color:var(--text-3);">Total mensal:</span><br><span class="amt" style="font-size:1.2rem;">${fmt(dep.totalMensal)}</span></div>
      <div><span style="font-size:.75rem;color:var(--blue);">Parte da Mãe (50%):</span><br><span class="amt v-blue" style="font-size:1.2rem;">${fmt(dep.metadeMae)}</span></div>
      <div><span style="font-size:.75rem;color:var(--amber);">Parte do Pai (50%):</span><br><span class="amt v-amber" style="font-size:1.2rem;">${fmt(dep.metadePai)}</span></div>
      <div><span style="font-size:.75rem;color:var(--rose);">Dívidas dependentes (50% pai):</span><br><span class="amt v-rose" style="font-size:1.2rem;">${fmt(dep.metadeDividaPai)}</span></div>
    </div>
  </div>`;
}

function despResumo(){
  const cats=[{n:'Fixas Essenciais',a:DESPESAS.fixas_essenciais,c:'var(--blue)'},{n:'Fixas Não Essenciais',a:DESPESAS.fixas_nao_essenciais,c:'var(--amber)'},{n:'Variáveis',a:DESPESAS.variaveis,c:'var(--rose)'},{n:'Profissionais PJ',a:DESPESAS.profissionais_pj,c:'var(--cyan)'}];
  const total=calcDespesasMensais();let h='<table>';
  cats.forEach(c=>{const s=c.a.reduce((a,d)=>a+(d.valor||0),0);const p=total>0?Math.round(s/total*100):0;
    h+=`<tr><td style="width:38%;"><span style="color:${c.c};font-weight:600;">${c.n}</span></td><td><div class="bar"><div class="bar-fill" style="width:${p}%;background:${c.c};"></div></div></td><td style="text-align:right;"><span class="amt">${fmt(s)}</span></td><td style="text-align:right;color:var(--text-3);font-size:.72rem;">${p}%</td></tr>`;});
  h+=`</table><div class="tbl-footer"><table><tr><td>Total</td><td colspan="2" style="text-align:right;"><span class="amt v-amber">${fmt(total)}</span></td><td style="text-align:right;font-size:.72rem;">100%</td></tr></table></div>`;return h;
}

function topDividas(){
  const all=CONTAS_PAGAR.filter(d=>d.saldo_atual>0).sort((a,b)=>b.saldo_atual-a.saldo_atual).slice(0,7);
  let h='<table>';all.forEach(d=>{h+=`<tr><td><div class="cred"><div class="cred-av" style="background:var(--rose-soft);">${d.icon}</div><span class="cred-n">${d.fornecedor}</span></div></td><td style="text-align:right;"><span class="amt v-rose">${fmt(d.saldo_atual)}</span></td><td>${stH(d.status)}</td></tr>`;});return h+'</table>';
}
