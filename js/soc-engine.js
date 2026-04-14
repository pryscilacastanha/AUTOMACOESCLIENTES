/* ═══════════════════════════════════════════════════════
   VÉRTICE — Módulo Societário Completo
   Motor Antigravity + Simulador + Gerador + Playbook + Academia
   Migrado de app_holding React → Vanilla JS
   ═══════════════════════════════════════════════════════ */

const SOC = (() => {
  'use strict';

  // ── ENUMS ──
  const TIPOS_EMPRESA = ['MEI', 'ME/EPP (Simples)', 'LTDA', 'SLU', 'Sociedade Simples', 'Holding Familiar', 'SA'];
  const OPERACOES = ['Constituição', 'Alteração', 'Baixa/Dissolução', 'Corporate (Fusão/Cisão)'];
  const REGIMES = ['MEI', 'Simples Nacional', 'Lucro Presumido', 'Lucro Real'];

  // ── STATE ──
  let diagStep = 0, diagForm = {}, diagResult = null;
  let simReceita = '', simMostrar = false;
  let docTipo = '', docDados = {}, docGerado = false;
  let pbEtapa = 0, pbChecks = [], pbBloqs = [];
  let acadModulo = null, acadFase = 'conteudo', acadRespostas = {}, acadNota = null;

  function resetDiag() {
    diagStep = 0; diagResult = null;
    diagForm = { operacao:'',tipo:'',objetivo:'',regime:'',receita:'',processoJudicial:'nao',socioTipoPJ:'nao',cnaeCompativel:'sim',divergenciaDBE:'nao',cpfIrregular:'nao',objetoGenerico:'nao',capitalBaixo:'nao',semCertificado:'nao',objetivoClaro:'sim',patrimonioJustifica:'sim',integViavel:'sim',sociosDivergem:'nao',regimeBens:'',atividadeRisco:'nao',portasAbertas:'nao',funcionariosCLT:'nao',estadoCivil:'',herdeiros:'0' };
  }

  // ── CHECKLISTS ──
  const CHECKLISTS = {
    'Constituição': {
      'MEI': ['Verificar faturamento ≤ R$81k/ano','Verificar CNAE permitido para MEI','Cadastro no Portal do Empreendedor','DAS automático após registro','Adesão ao Simei'],
      'ME/EPP (Simples)': ['Consulta de viabilidade de nome','Elaboração do Contrato Social','DARE para Junta Comercial','Protocolo Redesim','Assinatura digital gov.br','Emissão do NIRE','DBE Receita Federal','CNPJ + Inscrição municipal','Opção pelo Simples Nacional (prazo: 30 dias)'],
      'LTDA': ['Consulta de viabilidade de nome + CNAE','Elaboração do Contrato Social estratégico','DARE Junta Comercial','Protocolo digital JucisRS','Assinatura digital gov.br','Emissão do NIRE','DBE Receita Federal','CNPJ emitido','Inscrição Estadual (se ICMS)','Inscrição Municipal (ISS/Alvará)','Abertura conta PJ','Balanço de abertura (CPC 26)'],
      'SLU': ['Confirmar sócio único (pessoa física)','Consulta de viabilidade','Elaboração do Contrato de SLU','Protocolo Junta + NIRE','CNPJ Receita Federal','Definição do regime tributário'],
      'Holding Familiar': ['Diagnóstico patrimonial completo','Análise de risco jurídico (processos ativos?)','Definição do tipo: Pura x Mista','Elaboração do Contrato Social com cláusulas pétreas','Análise de ITBI e Ganho de Capital','Balanço de Abertura (CPC 26/27)','Registro Junta + CNPJ (CNAE 3520-4)','Integralização de bens (valor histórico)','Atualização contratos de locação para PJ','Abertura conta bancária PJ exclusiva','Atualização DIRPF do sócio'],
      'Sociedade Simples': ['Definir se é SS pura ou com CNPJ','Elaborar Contrato Social','Registro no Cartório ou Junta','CNPJ Receita','Verificar registro profissional'],
      'SA': ['Definir capital em ações (Estatuto Social)','Publicação do Estatuto (jornal oficial)','Ata de Constituição + Assembleia','NIRE + CNPJ','Livro de Ações Nominativas','Conselho de Administração'],
    },
    'Alteração': { 'Sócios':['Ata de deliberação','Elaboração da Alteração Contratual','DARE Junta','Protocolo JucisRS + assinatura gov.br','Atualização CNPJ','Atualizar DIRPF'], 'Capital Social':['Ata de deliberação','Alteração Contratual com novo valor','Protocolo Junta','Atualizar CNPJ'], 'Objeto Social':['Verificar novo CNAE na Prefeitura','Alteração Contratual','Protocolo Junta','Atualizar CNPJ e ISS/Alvará'], 'Endereço':['Verificar viabilidade novo endereço','Alteração Contratual','Protocolo Junta','Atualizar inscrições'], 'Regime Tributário':['Verificar prazo (janeiro)','Verificar vedações','Protocolo e-CAC','Atualizar contabilidade'] },
    'Baixa/Dissolução': { 'Dissolução amigável':['Ata de dissolução','Quitação de dívidas','Distrato Social','Protocolo Junta','Baixa CNPJ','Baixa Prefeitura/Estado','DCTF final','Partilha saldo'], 'Cancelamento MEI':['Declaração no Portal Gov.br','Quitar DAS','Baixa automática CNPJ'], 'Baixa Simplificada':['Verificar elegibilidade (Lei 14.195/2021)','Sem débitos fiscais','Requerimento único Redesim'] },
    'Corporate (Fusão/Cisão)': { 'Fusão':['Laudo de avaliação','Protocolo de fusão','Aprovação sócios','Registro Junta','Extinção CNPJs'], 'Incorporação':['Protocolo incorporação','Laudo avaliação','Aprovação sócios','Alteração incorporadora','Extinção CNPJ incorporada'], 'Cisão Parcial':['Protocolo cisão','Laudo dos bens','Aprovação sócios','Nova empresa','Alteração empresa cindida'], 'Holdingização':['Diagnóstico completo','Criar Holding','Transferir quotas','Alterar contratos','Verificar vedação Simples','Registrar MEP'] }
  };

  // ── MOTOR DE INTELIGÊNCIA 3 CAMADAS ──
  function rodarEngine(f) {
    const bloqueios=[], alertas=[], oportunidades=[];
    const receita = parseFloat(f.receita)||0;

    // BLOQUEIOS
    if(f.processoJudicial==='sim') bloqueios.push({msg:'Processo judicial ativo — risco de fraude à execução (Ação Pauliana).',lei:'CC art. 179 + CPC arts. 133-137'});
    if(f.tipo==='Holding Familiar'&&f.regime==='Simples Nacional') bloqueios.push({msg:'Holding VEDADA no Simples Nacional.',lei:'LC 123/2006, art. 3º §4º VI'});
    if(f.socioTipoPJ==='sim'&&f.regime==='Simples Nacional') bloqueios.push({msg:'Sócio PJ veda Simples Nacional.',lei:'LC 123/2006, art. 3º §4º VI'});
    if(receita>4800000&&f.regime==='Simples Nacional') bloqueios.push({msg:'Faturamento acima de R$4,8M — exclusão obrigatória do Simples.',lei:'LC 123/06, art. 3º'});
    if(receita>81000/12&&f.tipo==='MEI') bloqueios.push({msg:'Faturamento excede limite MEI.',lei:'LC 128/2008, art. 18-A'});
    if(f.cnaeCompativel==='nao') bloqueios.push({msg:'CNAE incompatível com endereço/zoneamento.',lei:'IN DREI 81/2020'});
    if(f.divergenciaDBE==='sim') bloqueios.push({msg:'Divergência DBE x Contrato Social.',lei:'IN DREI 81/2020'});
    if(f.cpfIrregular==='sim') bloqueios.push({msg:'CPF de sócio com restrição.',lei:'IN RFB 2.043/2021'});
    if(f.tipo==='Holding Familiar'&&f.objetivoClaro==='nao') bloqueios.push({msg:'Cliente sem objetivo claro — NÃO FAZER.',lei:'Fluxograma Decisório'});
    if(f.tipo==='Holding Familiar'&&f.patrimonioJustifica==='nao') bloqueios.push({msg:'Patrimônio não justifica a estrutura.',lei:'Viabilidade financeira'});
    if(f.tipo==='Holding Familiar'&&f.integViavel==='nao') bloqueios.push({msg:'Integralização inviável — ITBI/Ganho de Capital pendente.',lei:'CF art. 156 §2º I + STF Tema 796'});

    // ALERTAS
    if(receita<5000&&f.tipo==='Holding Familiar') alertas.push({msg:'Receita abaixo de R$5k — custo pode superar benefício.',acao:'Revisar viabilidade financeira'});
    if(f.objetoGenerico==='sim') alertas.push({msg:'Objeto social genérico.',acao:'Especificar CNAE'});
    if(f.capitalBaixo==='sim') alertas.push({msg:'Capital social baixo para a atividade.',acao:'Ajustar capital'});
    if(f.semCertificado==='sim') alertas.push({msg:'Sem certificado digital.',acao:'Emitir e-CNPJ A1 ou A3'});
    if(f.sociosDivergem==='sim') alertas.push({msg:'Sócios 50/50 — risco de Empate Paralítico.',acao:'Incluir Golden Share no contrato'});
    if(f.regimeBens==='comunhao_total'&&f.tipo==='Holding Familiar') alertas.push({msg:'Comunhão total — quotas se comunicam.',acao:'Cláusula de incomunicabilidade'});
    if(f.atividadeRisco==='sim') alertas.push({msg:'Atividade de risco — Holding deve ser preventiva.',acao:'Estruturar ANTES de litígio'});
    if(f.portasAbertas==='sim') alertas.push({msg:'Estabelecimento físico — Alvará + Bombeiros obrigatórios.',acao:'Verificar regulação'});
    if(f.funcionariosCLT==='sim') alertas.push({msg:'CLT desde o dia 1 — eSocial/Pró-labore obrigatório.',acao:'Incluir custo de folha'});

    // OPORTUNIDADES
    if(f.tipo==='Holding Familiar') {
      oportunidades.push({msg:'Isenção de IR na distribuição de lucros (economia até 16,17%).',base:'Lei 9.249/1995, art. 10'});
      oportunidades.push({msg:'Proteção patrimonial com cláusulas pétreas.',base:'CC arts. 49-A e 50'});
      oportunidades.push({msg:'Planejamento sucessório via doação de quotas com usufruto.',base:'CC art. 1.848 + ITCMD'});
    }
    if(f.regime==='Lucro Presumido') oportunidades.push({msg:'Lucro distribuído isento de IRPF — carga ~11,33%.',base:'Lei 9.249/1995, art. 10'});
    if((f.tipo==='LTDA'||f.tipo==='SLU')&&receita<4800000) oportunidades.push({msg:'Avaliar Simples Nacional (até R$4,8M/ano).',base:'LC 123/2006'});

    const recomendacao = bloqueios.length>0?'NÃO FAZER':alertas.length>0?'FAZER COM AJUSTES':'FAZER';
    const status = bloqueios.length>0?'BLOQUEADO':alertas.length>0?'PENDENTE':'APROVADO';
    const key = f.operacao==='Alteração'?f.objetivo||'Sócios':f.tipo;
    const checks = (CHECKLISTS[f.operacao]||{})[key]||[];
    const trib = calcTrib(receita/12, f.regime);
    return { status, recomendacao, bloqueios, alertas, oportunidades, checks, trib };
  }

  function calcTrib(r,regime) {
    switch(regime) {
      case 'MEI': return {imposto:70.60,efetiva:r>0?(70.60/r*100).toFixed(1):0,obs:'DAS fixo mensal (comércio)'};
      case 'Simples Nacional': return {imposto:r*0.06,efetiva:6.0,obs:'Anexo I — Comércio (1ª faixa)'};
      case 'Lucro Presumido': return {imposto:r*0.1133,efetiva:11.33,obs:'IRPJ+CSLL+PIS/COFINS s/ presunção 32%'};
      case 'Lucro Real': return {imposto:r*0.24,efetiva:24.0,obs:'IRPJ+CSLL sobre lucro real'};
      default: return {imposto:0,efetiva:0,obs:''};
    }
  }

  function fmtR(v){return 'R$ '+(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});}

  // ════════════════════════════════
  // DIAGNÓSTICO PAGE
  // ════════════════════════════════
  function renderDiagnostico(el) {
    resetDiag();
    el.innerHTML = buildDiagHTML();
    bindDiagEvents(el);
  }

  function buildDiagHTML() {
    return `<div class="soc-module">
      <div class="soc-header"><h2>🧩 Diagnóstico + Motor Antigravity</h2><p>Análise 3 camadas: <span style="color:#ef4444">🔴 Bloqueios</span> · <span style="color:#f59e0b">🟡 Alertas</span> · <span style="color:#22c55e">🟢 Oportunidades</span></p></div>
      <div class="soc-steps" id="soc-steps"></div>
      <div id="soc-diag-content"></div>
    </div>`;
  }

  function renderDiagStep(el) {
    const steps = ['Operação','Empresa','Cliente','Dados','Validação','Resultado'];
    const stepsEl = el.querySelector('#soc-steps');
    stepsEl.innerHTML = steps.map((s,i)=>`<div class="soc-step ${i<=diagStep?'active':''} ${i===diagStep?'current':''}">${i+1}. ${s}</div>`).join('');

    const content = el.querySelector('#soc-diag-content');
    if(diagStep===0) content.innerHTML = renderStep0();
    else if(diagStep===1) content.innerHTML = renderStep1();
    else if(diagStep===2) content.innerHTML = renderStep2();
    else if(diagStep===3) content.innerHTML = renderStep3();
    else if(diagStep===4) content.innerHTML = renderStep4();
    else if(diagStep===5) { diagResult = rodarEngine(diagForm); content.innerHTML = renderStep5(); }
    bindDiagEvents(el);
  }

  function renderStep0() {
    return `<div class="soc-form-step"><h3>Qual a operação desejada?</h3><div class="soc-option-grid">${OPERACOES.map(op=>`<button class="soc-opt-btn ${diagForm.operacao===op?'selected':''}" data-op="${op}">${op==='Constituição'?'🏢':op==='Alteração'?'✏️':op==='Baixa/Dissolução'?'🔴':'⚡'} ${op}</button>`).join('')}</div></div>`;
  }

  function renderStep1() {
    let opts = '';
    if(diagForm.operacao==='Alteração') opts = Object.keys(CHECKLISTS['Alteração']).map(a=>`<button class="soc-opt-btn ${diagForm.objetivo===a?'selected':''}" data-obj="${a}">${a}</button>`).join('');
    else if(diagForm.operacao==='Baixa/Dissolução') opts = Object.keys(CHECKLISTS['Baixa/Dissolução']).map(b=>`<button class="soc-opt-btn ${diagForm.tipo===b?'selected':''}" data-tipo="${b}">${b}</button>`).join('');
    else if(diagForm.operacao==='Corporate (Fusão/Cisão)') opts = Object.keys(CHECKLISTS['Corporate (Fusão/Cisão)']).map(c=>`<button class="soc-opt-btn ${diagForm.tipo===c?'selected':''}" data-tipo="${c}">${c}</button>`).join('');
    else opts = TIPOS_EMPRESA.map(t=>`<button class="soc-opt-btn ${diagForm.tipo===t?'selected':''}" data-tipo="${t}">${t}</button>`).join('');
    return `<div class="soc-form-step"><h3>Tipo / Objetivo</h3><div class="soc-option-grid">${opts}</div><div class="soc-nav"><button class="btn btn-secondary" data-back>← Voltar</button><button class="btn btn-primary" data-next>Próximo →</button></div></div>`;
  }

  function renderStep2() {
    return `<div class="soc-form-step"><h3>Perfil do Cliente</h3><div class="form-grid">
      <div class="form-group"><label>Estado civil</label><select data-field="estadoCivil"><option value="">Selecione...</option><option value="solteiro" ${diagForm.estadoCivil==='solteiro'?'selected':''}>Solteiro(a)</option><option value="casado" ${diagForm.estadoCivil==='casado'?'selected':''}>Casado(a)</option><option value="uniao_estavel" ${diagForm.estadoCivil==='uniao_estavel'?'selected':''}>União Estável</option><option value="divorciado" ${diagForm.estadoCivil==='divorciado'?'selected':''}>Divorciado(a)</option><option value="viuvo" ${diagForm.estadoCivil==='viuvo'?'selected':''}>Viúvo(a)</option></select></div>
      <div class="form-group"><label>Regime de bens</label><select data-field="regimeBens"><option value="">Selecione...</option><option value="parcial" ${diagForm.regimeBens==='parcial'?'selected':''}>Comunhão parcial</option><option value="comunhao_total" ${diagForm.regimeBens==='comunhao_total'?'selected':''}>Comunhão total</option><option value="separacao_total" ${diagForm.regimeBens==='separacao_total'?'selected':''}>Separação total</option></select></div>
      <div class="form-group"><label>Nº de herdeiros</label><input type="number" min="0" value="${diagForm.herdeiros||'0'}" data-field="herdeiros"></div>
      <div class="form-group"><label>Atividade de risco?</label><select data-field="atividadeRisco"><option value="nao" ${diagForm.atividadeRisco==='nao'?'selected':''}>Não</option><option value="sim" ${diagForm.atividadeRisco==='sim'?'selected':''}>Sim</option></select></div>
      <div class="form-group"><label>Portas abertas ao público?</label><select data-field="portasAbertas"><option value="nao" ${diagForm.portasAbertas==='nao'?'selected':''}>Não</option><option value="sim" ${diagForm.portasAbertas==='sim'?'selected':''}>Sim</option></select></div>
      <div class="form-group"><label>Funcionários CLT?</label><select data-field="funcionariosCLT"><option value="nao" ${diagForm.funcionariosCLT==='nao'?'selected':''}>Não</option><option value="sim" ${diagForm.funcionariosCLT==='sim'?'selected':''}>Sim</option></select></div>
      <div class="form-group"><label>Sócios 50/50?</label><select data-field="sociosDivergem"><option value="nao" ${diagForm.sociosDivergem==='nao'?'selected':''}>Não</option><option value="sim" ${diagForm.sociosDivergem==='sim'?'selected':''}>🟡 Sim</option></select></div>
    </div><div class="soc-nav"><button class="btn btn-secondary" data-back>← Voltar</button><button class="btn btn-primary" data-next>Próximo →</button></div></div>`;
  }

  function renderStep3() {
    return `<div class="soc-form-step"><h3>Dados Financeiros</h3><div class="form-grid">
      <div class="form-group"><label>Receita Anual (R$)</label><input type="number" placeholder="ex: 204000" value="${diagForm.receita||''}" data-field="receita"></div>
      <div class="form-group"><label>Regime Tributário</label><select data-field="regime"><option value="">Selecione...</option>${REGIMES.map(r=>`<option value="${r}" ${diagForm.regime===r?'selected':''}>${r}</option>`).join('')}</select></div>
      <div class="form-group"><label>Processo judicial ativo?</label><select data-field="processoJudicial"><option value="nao" ${diagForm.processoJudicial==='nao'?'selected':''}>Não</option><option value="sim" ${diagForm.processoJudicial==='sim'?'selected':''}>Sim</option></select></div>
      <div class="form-group"><label>Sócio PJ?</label><select data-field="socioTipoPJ"><option value="nao" ${diagForm.socioTipoPJ==='nao'?'selected':''}>Não</option><option value="sim" ${diagForm.socioTipoPJ==='sim'?'selected':''}>Sim</option></select></div>
    </div><div class="soc-nav"><button class="btn btn-secondary" data-back>← Voltar</button><button class="btn btn-primary" data-next>Próximo →</button></div></div>`;
  }

  function renderStep4() {
    let holdExt = '';
    if(diagForm.tipo==='Holding Familiar') holdExt = `
      <div class="form-group"><label>Objetivo claro?</label><select data-field="objetivoClaro"><option value="sim" ${diagForm.objetivoClaro==='sim'?'selected':''}>Sim</option><option value="nao" ${diagForm.objetivoClaro==='nao'?'selected':''}>❌ Não</option></select></div>
      <div class="form-group"><label>Patrimônio justifica?</label><select data-field="patrimonioJustifica"><option value="sim" ${diagForm.patrimonioJustifica==='sim'?'selected':''}>Sim</option><option value="nao" ${diagForm.patrimonioJustifica==='nao'?'selected':''}>❌ Não</option></select></div>
      <div class="form-group"><label>Integralização viável?</label><select data-field="integViavel"><option value="sim" ${diagForm.integViavel==='sim'?'selected':''}>Sim</option><option value="nao" ${diagForm.integViavel==='nao'?'selected':''}>❌ Não</option></select></div>`;
    return `<div class="soc-form-step"><h3>Validação Técnica</h3><div class="form-grid">
      <div class="form-group"><label>CNAE compatível?</label><select data-field="cnaeCompativel"><option value="sim" ${diagForm.cnaeCompativel==='sim'?'selected':''}>Sim</option><option value="nao" ${diagForm.cnaeCompativel==='nao'?'selected':''}>❌ Não</option></select></div>
      <div class="form-group"><label>Divergência DBE?</label><select data-field="divergenciaDBE"><option value="nao" ${diagForm.divergenciaDBE==='nao'?'selected':''}>Não</option><option value="sim" ${diagForm.divergenciaDBE==='sim'?'selected':''}>❌ Sim</option></select></div>
      <div class="form-group"><label>CPF com restrição?</label><select data-field="cpfIrregular"><option value="nao" ${diagForm.cpfIrregular==='nao'?'selected':''}>Não</option><option value="sim" ${diagForm.cpfIrregular==='sim'?'selected':''}>❌ Sim</option></select></div>
      <div class="form-group"><label>Objeto genérico?</label><select data-field="objetoGenerico"><option value="nao" ${diagForm.objetoGenerico==='nao'?'selected':''}>Não</option><option value="sim" ${diagForm.objetoGenerico==='sim'?'selected':''}>🟡 Sim</option></select></div>
      <div class="form-group"><label>Capital baixo?</label><select data-field="capitalBaixo"><option value="nao" ${diagForm.capitalBaixo==='nao'?'selected':''}>Não</option><option value="sim" ${diagForm.capitalBaixo==='sim'?'selected':''}>🟡 Sim</option></select></div>
      <div class="form-group"><label>Sem certificado digital?</label><select data-field="semCertificado"><option value="nao" ${diagForm.semCertificado==='nao'?'selected':''}>Não</option><option value="sim" ${diagForm.semCertificado==='sim'?'selected':''}>🟡 Sim</option></select></div>
      ${holdExt}
    </div><div class="soc-nav"><button class="btn btn-secondary" data-back>← Voltar</button><button class="btn btn-primary" data-run>🚀 Gerar Diagnóstico</button></div></div>`;
  }

  function renderStep5() {
    if(!diagResult) return '';
    const r = diagResult;
    const recCol = r.recomendacao==='FAZER'?'#22c55e':r.recomendacao==='NÃO FAZER'?'#ef4444':'#f59e0b';
    const stCol = r.status==='APROVADO'?'#22c55e':r.status==='BLOQUEADO'?'#ef4444':'#f59e0b';
    const stIcon = r.status==='APROVADO'?'✅':r.status==='BLOQUEADO'?'🚨':'🟡';

    let h = `<div class="soc-resultado">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap">
        <h3 style="margin:0">Resultado Motor Antigravity</h3>
        <span style="background:${stCol}18;color:${stCol};border:1px solid ${stCol};padding:4px 14px;border-radius:99px;font-weight:700;font-size:13px">${stIcon} ${r.status}</span>
      </div>
      <div style="padding:14px 20px;background:${recCol}12;border:1px solid ${recCol}40;border-radius:10px;margin-bottom:20px">
        <span style="font-weight:700;font-size:15px;color:${recCol}">⚖️ Recomendação: ${r.recomendacao}</span>
      </div>`;

    if(r.bloqueios.length) {
      h += `<div class="soc-res-card" style="border-color:#ef444440"><div class="soc-res-title" style="color:#ef4444">🔴 Bloqueios Críticos (${r.bloqueios.length})</div>`;
      r.bloqueios.forEach(b => h += `<div class="soc-alert soc-alert-red"><strong>${b.msg}</strong><br><span style="font-size:11px;opacity:.7">Base: ${b.lei}</span></div>`);
      h += '</div>';
    }
    if(r.alertas.length) {
      h += `<div class="soc-res-card" style="border-color:#f59e0b40"><div class="soc-res-title" style="color:#f59e0b">🟡 Alertas (${r.alertas.length})</div>`;
      r.alertas.forEach(a => h += `<div class="soc-alert soc-alert-yellow"><span>${a.msg}</span><br><span style="font-size:12px;color:#f59e0b">Ação: ${a.acao}</span></div>`);
      h += '</div>';
    }
    if(r.oportunidades.length) {
      h += `<div class="soc-res-card" style="border-color:#22c55e30"><div class="soc-res-title" style="color:#22c55e">🟢 Oportunidades (${r.oportunidades.length})</div>`;
      r.oportunidades.forEach(o => h += `<div style="margin-top:8px;padding:10px 14px;background:#22c55e08;border:1px solid #22c55e20;border-radius:8px"><span style="font-size:13px;color:#22c55e">${o.msg}</span><br><span style="font-size:11px;color:#22c55e80">Base: ${o.base}</span></div>`);
      h += '</div>';
    }

    // Checklist
    h += `<div class="soc-res-card" style="margin-top:16px"><div class="soc-res-title">✅ Checklist — ${diagForm.operacao} · ${diagForm.tipo||diagForm.objetivo}</div><ul class="soc-checklist">`;
    r.checks.forEach(c => h += `<li>☐ ${c}</li>`);
    if(!r.checks.length) h += '<li style="color:#94a3b8">Sem checklist para esta combinação.</li>';
    h += '</ul></div>';

    // Tributário
    h += `<div class="soc-res-card" style="margin-top:16px"><div class="soc-res-title">💰 Análise Tributária</div>
      <div style="padding:10px 0"><div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9"><span>Receita Mensal</span><span>${fmtR(parseFloat(diagForm.receita||0)/12)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;color:#ef4444"><span>Imposto/mês</span><span>${fmtR(r.trib.imposto)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;color:#f59e0b;font-weight:700"><span>Carga Efetiva</span><span>${r.trib.efetiva}%</span></div>
      <div style="font-size:12px;color:#94a3b8;margin-top:6px">${r.trib.obs}</div></div></div>`;

    h += `<button class="btn btn-secondary" style="margin-top:20px" data-restart>← Novo Diagnóstico</button></div>`;
    return h;
  }

  function bindDiagEvents(el) {
    el.querySelectorAll('[data-op]').forEach(b => b.onclick = () => { diagForm.operacao = b.dataset.op; diagStep = 1; renderDiagStep(el); });
    el.querySelectorAll('[data-tipo]').forEach(b => b.onclick = () => { diagForm.tipo = b.dataset.tipo; });
    el.querySelectorAll('[data-obj]').forEach(b => b.onclick = () => { diagForm.objetivo = b.dataset.obj; diagForm.tipo = 'Alteração'; });
    el.querySelectorAll('[data-field]').forEach(inp => { inp.onchange = () => diagForm[inp.dataset.field] = inp.value; });
    el.querySelectorAll('[data-back]').forEach(b => b.onclick = () => { diagStep--; renderDiagStep(el); });
    el.querySelectorAll('[data-next]').forEach(b => b.onclick = () => { diagStep++; renderDiagStep(el); });
    el.querySelectorAll('[data-run]').forEach(b => b.onclick = () => { diagStep = 5; renderDiagStep(el); });
    el.querySelectorAll('[data-restart]').forEach(b => b.onclick = () => { resetDiag(); renderDiagStep(el); });
  }

  // ════════════════════════════════
  // SIMULADOR TRIBUTÁRIO
  // ════════════════════════════════
  function renderSimulador(el) {
    simReceita = ''; simMostrar = false;
    el.innerHTML = `<div class="soc-module"><div class="soc-header"><h2>💰 Simulador Multi-Regime</h2><p>Compare MEI, Simples, Presumido e Real lado a lado.</p></div>
      <div style="display:flex;gap:12px;align-items:end;margin-bottom:20px;flex-wrap:wrap"><div class="form-group" style="flex:1;max-width:300px"><label>Receita Mensal (R$)</label><input type="number" placeholder="ex: 17000" id="sim-receita"></div>
      <button class="btn btn-primary" id="sim-btn">Simular →</button></div>
      <div id="sim-result"></div></div>`;
    el.querySelector('#sim-btn').onclick = () => {
      simReceita = parseFloat(el.querySelector('#sim-receita').value)||0;
      if(!simReceita) return;
      const results = REGIMES.map(r => { const t = calcTrib(simReceita,r); return {regime:r,...t,efetiva:parseFloat(t.efetiva)}; });
      const best = [...results].sort((a,b)=>a.imposto-b.imposto)[0];
      let h = '<div class="soc-sim-grid">';
      results.forEach(r => {
        const isBest = r.regime===best.regime;
        h += `<div class="soc-sim-card ${isBest?'best':''}">
          ${isBest?'<div class="soc-best-badge">⭐ Mais Eficiente</div>':''}
          <div style="font-weight:700;font-size:15px;margin-bottom:8px">${r.regime}</div>
          <div style="font-size:28px;font-weight:800;color:${isBest?'#22c55e':'#f59e0b'}">${r.efetiva}%</div>
          <div style="font-size:11px;color:#94a3b8;margin-bottom:10px">Carga Efetiva</div>
          <div style="font-size:16px;font-weight:700;color:#ef4444">${fmtR(r.imposto)}</div>
          <div style="font-size:11px;color:#94a3b8;margin-bottom:8px">Imposto/mês</div>
          <div style="font-size:11px;color:#94a3b8;padding-top:8px;border-top:1px solid #e2e8f0">${r.obs}</div>
        </div>`;
      });
      h += '</div>';
      h += `<div style="margin-top:16px;padding:16px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;text-align:center"><span>💡 Economia anual vs. pior regime: </span><strong style="color:#22c55e;font-size:18px">${fmtR((Math.max(...results.map(r=>r.imposto))-best.imposto)*12)}</strong></div>`;
      if(simReceita*12>81000) h += '<div class="soc-alert soc-alert-red" style="margin-top:12px"><strong>⚠️ MEI:</strong> Faturamento excede R$81k/ano. Vedado.</div>';
      if(simReceita*12>4800000) h += '<div class="soc-alert soc-alert-red" style="margin-top:12px"><strong>⚠️ Simples:</strong> Faturamento excede R$4,8M/ano. Exclusão obrigatória.</div>';
      el.querySelector('#sim-result').innerHTML = h;
    };
  }

  // ════════════════════════════════
  // HOLDINGS PAGE
  // ════════════════════════════════
  function renderHoldings(el) {
    el.innerHTML = `<div class="soc-module"><div class="soc-header"><h2>🏢 Gestão de Holdings</h2><p>Holdings constituídas — Vorcon Holding e demais.</p></div>
      <div class="card"><div class="card-body" style="padding:0"><div class="table-wrap"><table><thead><tr><th>Holding</th><th>CNPJ</th><th>Tipo</th><th>Sócios</th><th>Status</th></tr></thead><tbody>
      <tr><td><strong>Vorcon Holding LTDA</strong></td><td style="font-family:monospace;font-size:12px">—</td><td><span class="badge badge-primary">Pura</span></td><td>Luiz Carlos Lopes Viana</td><td><span class="badge badge-success">Constituída</span></td></tr>
      </tbody></table></div></div></div>
      <div class="card" style="margin-top:16px"><div class="card-body"><h3 style="font-size:15px;font-weight:700;margin-bottom:12px">📚 Base de Conhecimento Societário</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px">
        ${['Fluxo Operacional (7 Fases)','Setor Societário','Tributário','Patrimonial','Sucessório','Risco Jurídico','Contábil','Perfil Estratégico','Checklist Inteligente','Cláusulas Fortes','Simulação Tributária','Roteiro de Reunião','Precificação','Módulo Onboarding','Base Legal IRPF','Guia Primeira Holding','Base CPC Holdings','Viabilidade Score','Escopo Total','Base Legal Completa','Fluxo JucisRS','Motor Validação','Playbook Abertura RS','Ecossistema Apoio RS','ISS Municipal Holdings','Checklist Pós-Registro','Legislação Municipal POA','Integralização Patrimonial'].map(t=>`<div style="padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;font-size:12px;display:flex;align-items:center;gap:8px"><span>📄</span>${t}</div>`).join('')}
      </div></div></div>
    </div>`;
  }

  // ════════════════════════════════
  // ABERTURA DE EMPRESAS (PLAYBOOK)
  // ════════════════════════════════
  const PB_ETAPAS = [
    {id:1,nome:'Diagnóstico',resp:'Consultor',checks:['Atividade definida','Faturamento estimado','Endereço definido','Sócios identificados','Risco jurídico avaliado'],bloqueios:[]},
    {id:2,nome:'Viabilidade',resp:'Analista',checks:['Acesso JucisRS/Redesim','CNAE validado','Nome disponível'],bloqueios:['CNAE incompatível','Endereço inválido']},
    {id:3,nome:'DBE / CNPJ',resp:'Analista',checks:['QSA preenchido','CNAE definido','Capital registrado','Regime selecionado'],bloqueios:['Divergência DBE x Contrato','CPF com restrição']},
    {id:4,nome:'Contrato Social',resp:'Consultor',checks:['Objeto específico','Quotas distribuídas','Administração definida','Cláusulas presentes','Coerência com DBE'],bloqueios:['Objeto genérico','Falta cláusula','Incoerência com DBE']},
    {id:5,nome:'Registro Junta',resp:'Analista',checks:['PDF-A','Assinatura gov.br','DARE paga','Protocolo gerado'],bloqueios:['PDF fora do padrão','Sem assinatura','DARE não paga']},
    {id:6,nome:'Validação',resp:'Revisor',checks:['DBE conferido','Contrato conferido','Documentos completos'],bloqueios:['Divergência encontrada']},
    {id:7,nome:'Inscrições',resp:'Analista',checks:['Inscrição Municipal','Inscrição Estadual'],bloqueios:['Sem IM → NFS-e bloqueada']},
    {id:8,nome:'Licenciamento',resp:'Analista',checks:['Alvará','Bombeiros','Vig. sanitária'],bloqueios:['Atividade de risco sem licença']},
    {id:9,nome:'Operacional',resp:'Consultor',checks:['e-CNPJ emitido','Conta PJ aberta','NFS-e habilitada','Contabilidade implantada','Balanço abertura (CPC 26)'],bloqueios:['Mistura PF/PJ','Sem certificado']},
  ];

  function renderAbertura(el) {
    pbEtapa = 0;
    pbChecks = PB_ETAPAS.map(e=>e.checks.map(()=>false));
    pbBloqs = PB_ETAPAS.map(e=>e.bloqueios.map(()=>false));
    el.innerHTML = `<div class="soc-module"><div class="soc-header"><h2>📋 Playbook — Abertura de Empresa</h2><p>9 etapas com validação automática. O sistema impede avanço se houver erro crítico.</p></div>
      <div class="soc-pb-tabs" id="pb-tabs"></div>
      <div id="pb-content"></div></div>`;
    renderPBStep(el);
  }

  function renderPBStep(el) {
    const tabs = el.querySelector('#pb-tabs');
    tabs.innerHTML = PB_ETAPAS.map((e,i)=>{
      const allDone = pbChecks[i].every(c=>c);
      const anyBlock = pbBloqs[i].some(b=>b);
      const st = anyBlock?'bloqueado':allDone?'concluido':i===pbEtapa?'andamento':'pendente';
      const colors = {concluido:'#22c55e',andamento:'#f59e0b',pendente:'#94a3b8',bloqueado:'#ef4444'};
      return `<button class="soc-pb-tab" style="color:${colors[st]};${i===pbEtapa?'background:var(--accent-bg,#eff6ff);border-color:var(--accent,#6366f1)':''}" data-pb-tab="${i}">${i+1}. ${e.nome}</button>`;
    }).join('');
    tabs.querySelectorAll('[data-pb-tab]').forEach(b => b.onclick = () => { pbEtapa = parseInt(b.dataset.pbTab); renderPBStep(el); });

    const e = PB_ETAPAS[pbEtapa];
    const allDone = pbChecks[pbEtapa].every(c=>c);
    const anyBlock = pbBloqs[pbEtapa].some(b=>b);
    const st = anyBlock?'bloqueado':allDone?'concluido':pbEtapa===pbEtapa?'andamento':'pendente';
    const labels = {concluido:'✅ Concluído',andamento:'🔄 Em andamento',pendente:'⏳ Pendente',bloqueado:'🚨 BLOQUEADO'};
    const colors = {concluido:'#22c55e',andamento:'#f59e0b',pendente:'#94a3b8',bloqueado:'#ef4444'};

    let h = `<div class="soc-res-card" style="border-color:${colors[st]}40;margin-top:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div><div class="soc-res-title">Etapa ${e.id} — ${e.nome}</div><div style="font-size:12px;color:#94a3b8">Responsável: ${e.resp}</div></div>
        <span style="padding:4px 14px;border-radius:99px;font-size:12px;font-weight:700;color:${colors[st]};background:${colors[st]}15;border:1px solid ${colors[st]}40">${labels[st]}</span>
      </div>
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#6366f1;margin-bottom:8px">✅ Checklist</div>`;
    e.checks.forEach((c,ci) => { h += `<label style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13px;cursor:pointer;color:${pbChecks[pbEtapa][ci]?'#22c55e':'#64748b'}"><input type="checkbox" ${pbChecks[pbEtapa][ci]?'checked':''} data-pb-check="${ci}" style="accent-color:#22c55e;width:16px;height:16px"><span style="${pbChecks[pbEtapa][ci]?'text-decoration:line-through':''}">${c}</span></label>`; });
    if(e.bloqueios.length) {
      h += `<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#ef4444;margin:12px 0 8px">🚨 Erros Bloqueantes</div>`;
      e.bloqueios.forEach((b,bi) => { h += `<label style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:13px;cursor:pointer;color:${pbBloqs[pbEtapa][bi]?'#ef4444':'#64748b'}"><input type="checkbox" ${pbBloqs[pbEtapa][bi]?'checked':''} data-pb-bloq="${bi}" style="accent-color:#ef4444;width:16px;height:16px">${b}</label>`; });
    }
    if(anyBlock) h += `<div class="soc-alert soc-alert-red" style="margin-top:12px"><strong>BLOQUEADO</strong> — Resolva os erros acima antes de avançar.</div>`;
    h += `<div class="soc-nav" style="margin-top:14px"><button class="btn btn-secondary" ${pbEtapa===0?'disabled':''} data-pb-prev>← Anterior</button><button class="btn btn-primary" ${(!allDone||anyBlock||pbEtapa===PB_ETAPAS.length-1)?'disabled':''} data-pb-next>Próxima →</button></div>`;
    if(pbEtapa===PB_ETAPAS.length-1&&allDone&&!anyBlock) h += `<div style="margin-top:16px;padding:20px;background:#22c55e10;border:1px solid #22c55e30;border-radius:10px;text-align:center"><div style="font-size:28px">🎉</div><div style="color:#22c55e;font-weight:700;font-size:16px">Empresa aberta com sucesso!</div><div style="color:#94a3b8;font-size:13px">Todas as 9 etapas concluídas.</div></div>`;
    h += '</div>';

    el.querySelector('#pb-content').innerHTML = h;
    el.querySelectorAll('[data-pb-check]').forEach(inp => inp.onchange = () => { pbChecks[pbEtapa][parseInt(inp.dataset.pbCheck)] = inp.checked; renderPBStep(el); });
    el.querySelectorAll('[data-pb-bloq]').forEach(inp => inp.onchange = () => { pbBloqs[pbEtapa][parseInt(inp.dataset.pbBloq)] = inp.checked; renderPBStep(el); });
    el.querySelectorAll('[data-pb-prev]').forEach(b => b.onclick = () => { pbEtapa--; renderPBStep(el); });
    el.querySelectorAll('[data-pb-next]').forEach(b => b.onclick = () => { pbEtapa++; renderPBStep(el); });
  }

  // ══════════ PUBLIC API ══════════
  return { renderDiagnostico, renderDiagStep, renderSimulador, renderHoldings, renderAbertura };
})();
