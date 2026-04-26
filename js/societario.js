// ═══════════════════════════════════════════════════════════════
// MÓDULO SOCIETÁRIO — Portado de React para Vanilla JS
// Motor Antigravity + Simulador + Documentos + Playbook + Academia
// ═══════════════════════════════════════════════════════════════

// ── STATE ──
const SOC = {
  diagStep: 0, diagForm: null, diagResult: null,
  simReceita: '', simMostrar: false,
  docTipo: '', docDados: null, docGerado: false,
  pbEtapa: 0, pbChecks: null, pbBloqs: null,
  acadModulo: null, acadFase: 'conteudo', acadRespostas: {}, acadNota: null,
};
function socReset() {
  SOC.diagStep=0; SOC.diagForm=socFormDefault(); SOC.diagResult=null;
  SOC.simReceita=''; SOC.simMostrar=false;
  SOC.docTipo=''; SOC.docDados=socDocDefault(); SOC.docGerado=false;
  SOC.acadModulo=null; SOC.acadFase='conteudo'; SOC.acadRespostas={}; SOC.acadNota=null;
}
function socFormDefault(){return{operacao:'',tipo:'',objetivo:'',regime:'',receita:'',processoJudicial:'nao',socioTipoPJ:'nao',cnaeCompativel:'sim',divergenciaDBE:'nao',cpfIrregular:'nao',objetoGenerico:'nao',capitalBaixo:'nao',semCertificado:'nao',objetivoClaro:'sim',patrimonioJustifica:'sim',integViavel:'sim',sociosDivergem:'nao',regimeBens:'',atividadeRisco:'nao',portasAbertas:'nao',funcionariosCLT:'nao',estadoCivil:'',herdeiros:'0',dbEGerado:'sim',erroTela:''};}
function socDocDefault(){return{empresa:'',cnpj:'',socio1:'',cpf1:'',socio2:'',capital:'',objeto:'',sede:'',admin:'',nomeAssoc:'',foro:'Porto Alegre - RS',dataAssembleia:'',quorum:'',finalidade:'',mandato:'2',investidor:'',cpfInvestidor:'',valorAporte:'',prazoAnos:'5',percentualResultados:''};}
if(!SOC.diagForm) SOC.diagForm=socFormDefault();
if(!SOC.docDados) SOC.docDados=socDocDefault();

// ── CONSTANTS ──
const TIPOS_EMPRESA=['MEI','ME/EPP (Simples)','LTDA','SLU','Sociedade Simples','Holding Familiar','SA'];
const OPERACOES=['Constituição','Alteração','Baixa/Dissolução','Corporate (Fusão/Cisão)'];
const REGIMES_TRIB=['MEI','Simples Nacional','Lucro Presumido','Lucro Real'];

// ── TRIBUTAÇÃO ──
function calcTrib(receita,regime){
  const r=parseFloat(receita)||0;
  switch(regime){
    case 'MEI':return{imposto:70.60,efetiva:r>0?(70.60/r*100).toFixed(1):0,obs:'DAS fixo mensal (comércio)'};
    case 'Simples Nacional':return{imposto:r*0.06,efetiva:6.0,obs:'Anexo I — Comércio (1ª faixa)'};
    case 'Lucro Presumido':return{imposto:r*0.1133,efetiva:11.33,obs:'IRPJ 15%+CSLL 9%+PIS/COFINS s/ presunção 32%'};
    case 'Lucro Real':return{imposto:r*0.24,efetiva:24.0,obs:'IRPJ+CSLL sobre lucro real + PIS/COFINS não-cumulativo'};
    default:return{imposto:0,efetiva:0,obs:''};
  }
}

// ── CHECKLISTS SOCIETÁRIOS ──
const SOC_CHECKS = {
  'Constituição':{'MEI':['Verificar faturamento ≤ R$81k/ano','Verificar CNAE permitido para MEI','Cadastro no Portal do Empreendedor','DAS automático após registro','Adesão ao Simei'],'ME/EPP (Simples)':['Consulta de viabilidade de nome','Elaboração do Contrato Social','DARE para Junta Comercial','Protocolo Redesim','Assinatura digital gov.br','Emissão do NIRE','DBE Receita Federal','CNPJ + Inscrição municipal','Opção pelo Simples Nacional (prazo: 30 dias)'],'LTDA':['Consulta de viabilidade de nome + CNAE','Elaboração do Contrato Social estratégico','DARE Junta Comercial','Protocolo digital JucisRS','Assinatura digital gov.br','Emissão do NIRE','DBE Receita Federal','MAT Redesim—gerar CNPJ (prazo: 90 dias)','CNPJ emitido+comprovante','Inscrição Estadual (se ICMS)','Inscrição Municipal (ISS/Alvará)','Abertura conta PJ','Balanço de abertura (CPC 26)'],'SLU':['Confirmar sócio único (PF)','Consulta de viabilidade','Elaboração do Contrato de SLU','Protocolo Junta+NIRE','MAT Redesim CNPJ (90 dias)','CNPJ emitido','Definição do regime tributário'],'Holding Familiar':['Diagnóstico patrimonial completo','Análise de risco jurídico','Definição Pura x Mista','Contrato Social com cláusulas pétreas','Análise ITBI e Ganho de Capital','Balanço de Abertura (CPC 26/27)','Registro Junta+NIRE','MAT Redesim CNPJ (90 dias)','CNPJ emitido+comprovante','Integralização de bens','Atualização contratos de locação para PJ','Abertura conta bancária PJ','Atualização DIRPF do sócio'],'Sociedade Simples':['Definir se é SS pura ou com CNPJ','Elaborar Contrato Social','Registro no Cartório ou Junta','CNPJ Receita','Verificar registro profissional'],'SA':['Definir capital em ações','Publicação do Estatuto','Ata de Constituição+Assembleia','NIRE+CNPJ','Livro de Ações Nominativas','Conselho de Administração']},
  'Alteração':{'Sócios':['Ata de deliberação','Elaboração da Alteração Contratual','DARE Junta','Protocolo JucisRS+assinatura gov.br','Atualização CNPJ Receita','Atualização Simples','Atualizar DIRPF'],'Capital Social':['Ata de deliberação','Alteração Contratual','Protocolo Junta','Atualizar CNPJ','Verificar integralização'],'Objeto Social':['Verificar novo CNAE','Alteração Contratual','Protocolo Junta','Atualizar CNPJ','Atualizar ISS/Alvará','Verificar impacto tributário'],'Endereço':['Verificar viabilidade','Alteração Contratual','Protocolo Junta','Atualizar CNPJ','Atualizar inscrições'],'Regime Tributário':['Verificar prazo (janeiro)','Verificar vedações','Protocolo Receita (e-CAC)','Atualizar sistema contábil']},
  'Baixa/Dissolução':{'Dissolução amigável':['Ata de dissolução','Quitação de dívidas','Distrato Social','Protocolo Junta','Baixa CNPJ','Baixa Prefeitura/Estado','DCTF finais','Partilha saldo'],'Cancelamento MEI':['Declaração cancelamento Gov.br','Quitar DAS','Baixa automática CNPJ'],'Baixa Simplificada':['Verificar elegibilidade (Lei 14.195/2021)','Sem débitos fiscais','Requerimento único Redesim']},
  'Corporate (Fusão/Cisão)':{'Fusão':['Laudo de avaliação','Protocolo de fusão','Aprovação dos sócios','Publicação (se SA)','Registro Junta','Extinção CNPJs'],'Incorporação':['Protocolo de incorporação','Laudo de avaliação','Aprovação dos sócios','Alteração Contratual','Extinção CNPJ incorporada'],'Cisão Parcial':['Protocolo de cisão','Laudo avaliação bens','Aprovação dos sócios','Constituição nova empresa','Alteração Contratual empresa cindida'],'Holdingização':['Diagnóstico empresas operacionais','Criar Holding','Transferir quotas','Alterar contratos sociais','Verificar vedação Simples (CPC 18)','Registrar participações (MEP)']}
};

// ── MOTOR ANTIGRAVITY (3 CAMADAS) ──
function rodarEngine(f){
  const bl=[],al=[],op=[];
  if(f.processoJudicial==='sim') bl.push({msg:'Processo judicial ativo — risco de fraude à execução.',lei:'CC art. 179 + CPC arts. 133-137'});
  if(f.tipo==='Holding Familiar'&&f.regime==='Simples Nacional') bl.push({msg:'Holding VEDADA do Simples Nacional.',lei:'LC 123/2006, art. 3º §4º VI'});
  if(f.socioTipoPJ==='sim'&&f.regime==='Simples Nacional') bl.push({msg:'Sócio PJ veda Simples Nacional.',lei:'LC 123/2006, art. 3º §4º VI'});
  if(parseFloat(f.receita)>4800000&&f.regime==='Simples Nacional') bl.push({msg:'Faturamento acima do limite do Simples (R$4,8M).',lei:'LC 123/06, art. 3º'});
  if(parseFloat(f.receita)>81000/12&&f.tipo==='MEI') bl.push({msg:'Faturamento excede limite MEI (R$81k/ano).',lei:'LC 128/2008, art. 18-A'});
  if(f.cnaeCompativel==='nao') bl.push({msg:'CNAE incompatível com endereço/zoneamento.',lei:'IN DREI 81/2020'});
  if(f.divergenciaDBE==='sim') bl.push({msg:'Divergência DBE x Contrato Social. Junta recusará.',lei:'IN DREI 81/2020'});
  if(f.cpfIrregular==='sim') bl.push({msg:'CPF com restrição — trava IE e compliance.',lei:'IN RFB 2.043/2021'});
  if(f.tipo==='Holding Familiar'&&f.objetivoClaro==='nao') bl.push({msg:'Cliente sem objetivo claro. NÃO FAZER.',lei:'Fluxograma Decisório Mestre'});
  if(f.tipo==='Holding Familiar'&&f.patrimonioJustifica==='nao') bl.push({msg:'Patrimônio não justifica a estrutura.',lei:'Viabilidade financeira — Fase 0'});
  if(f.tipo==='Holding Familiar'&&f.integViavel==='nao') bl.push({msg:'Integralização inviável — ITBI/GC não resolvido.',lei:'CF art. 156 §2º I + STF Tema 796'});
  // Alertas
  if(parseFloat(f.receita)<5000&&f.tipo==='Holding Familiar') al.push({msg:'Receita <R$5k/mês — custo pode superar benefício.',acao:'Revisar viabilidade'});
  if(f.objetoGenerico==='sim') al.push({msg:'Objeto social genérico dificulta NFS-e.',acao:'Especificar CNAE'});
  if(f.capitalBaixo==='sim') al.push({msg:'Capital social muito baixo.',acao:'Adequar ao patrimônio'});
  if(f.semCertificado==='sim') al.push({msg:'Sem certificado digital.',acao:'Emitir e-CNPJ A1/A3'});
  if(f.sociosDivergem==='sim') al.push({msg:'Sócios 50/50 — Empate Paralítico.',acao:'Cláusula de voto de minerva'});
  if(f.regimeBens==='comunhao_total'&&f.tipo==='Holding Familiar') al.push({msg:'Comunhão total — quotas comunicam.',acao:'Cláusula de incomunicabilidade'});
  if(f.atividadeRisco==='sim') al.push({msg:'Atividade de risco — Holding deve ser preventiva.',acao:'Estruturar ANTES de litígio'});
  if(f.portasAbertas==='sim') al.push({msg:'Portas abertas — Alvará Bombeiros+Plano Diretor.',acao:'Verificar regulação'});
  if(f.funcionariosCLT==='sim') al.push({msg:'CLT dia 1 — eSocial/Pró-labore obrigatório.',acao:'Incluir custo folha'});
  // Oportunidades
  if(f.tipo==='Holding Familiar'){
    op.push({msg:'Isenção IR na distribuição de lucros (até 16,17% vs PF).',base:'Lei 9.249/95, art. 10'});
    op.push({msg:'Proteção patrimonial: separação PF/PJ com cláusulas pétreas.',base:'CC arts. 49-A e 50'});
    op.push({msg:'Planejamento sucessório via doação de quotas com usufruto.',base:'CC art. 1.848 + ITCMD'});
  }
  if(f.regime==='Lucro Presumido') op.push({msg:'Lucro distribuído isento de IRPF. Carga ~11,33%.',base:'Lei 9.249/95, art. 10'});
  if((f.tipo==='LTDA'||f.tipo==='SLU')&&parseFloat(f.receita)<4800000) op.push({msg:'Avaliar Simples Nacional (até R$4,8M/ano).',base:'LC 123/2006'});
  if(f.tipo!=='Holding Familiar'&&parseFloat(f.receita)>20000) op.push({msg:'Considerar Holding futuramente.',base:'Planejamento patrimonial'});

  let rec=bl.length>0?'NÃO FAZER':al.length>0?'FAZER COM AJUSTES':'FAZER';
  const status=bl.length>0?'BLOQUEADO':al.length>0?'PENDENTE':'APROVADO';
  const key=f.operacao==='Alteração'?f.objetivo||'Sócios':f.tipo;
  const checks=(SOC_CHECKS[f.operacao]||{})[key]||[];
  const trib=calcTrib(parseFloat(f.receita||0)/12,f.regime);
  return{status,recomendacao:rec,bloqueios:bl,alertas:al,oportunidades:op,checks,trib};
}

// ═══════════════════════════════════════════
// RENDER: DIAGNÓSTICO
// ═══════════════════════════════════════════
function renderDiagnostico(){
  const f=SOC.diagForm, s=SOC.diagStep, r=SOC.diagResult;
  const STEPS=['Operação','Empresa','Cliente','Dados','Validação','Resultado'];
  let h=`<div class="card mb-4"><div style="font-weight:800;font-size:16px;color:var(--primary);margin-bottom:4px">🧩 Diagnóstico + Motor Antigravity</div><p class="text-muted text-sm">Análise de 3 camadas: <span style="color:#ef4444">🔴 Bloqueios</span> · <span style="color:#f59e0b">🟡 Alertas</span> · <span style="color:#10b981">🟢 Oportunidades</span></p></div>`;
  // Progress
  h+=`<div class="card mb-4" style="display:flex;gap:6px;flex-wrap:wrap;padding:14px 18px">`;
  STEPS.forEach((st,i)=>{h+=`<div style="display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:${i<=s?700:500};background:${i<=s?'var(--primary)':'var(--bg)'};color:${i<=s?'#fff':'var(--text-muted)'}">${i+1}. ${st}</div>`;});
  h+=`</div>`;

  if(s===0){
    h+=`<div class="card"><h3 style="margin-bottom:14px">Qual a operação desejada?</h3><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">`;
    OPERACOES.forEach(op=>{const ic=op==='Constituição'?'🏢':op==='Alteração'?'✏️':op==='Baixa/Dissolução'?'🔴':'⚡';h+=`<button class="btn btn-ghost" style="padding:16px;justify-content:flex-start;font-size:14px;${f.operacao===op?'background:var(--primary);color:#fff;border-color:var(--primary)':''}" onclick="socSetForm('operacao','${op}');SOC.diagStep=1;render()">${ic} ${op}</button>`;});
    h+=`</div></div>`;
  }
  if(s===1){
    h+=`<div class="card"><h3 style="margin-bottom:14px">Tipo de empresa / operação</h3><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">`;
    if(f.operacao==='Alteração'){Object.keys(SOC_CHECKS['Alteração']).forEach(a=>{h+=`<button class="btn btn-ghost" style="padding:14px;${f.objetivo===a?'background:var(--primary);color:#fff;border-color:var(--primary)':''}" onclick="socSetForm('objetivo','${a}');socSetForm('tipo','Alteração');render()">${a}</button>`;});}
    else if(f.operacao==='Baixa/Dissolução'){Object.keys(SOC_CHECKS['Baixa/Dissolução']).forEach(b=>{h+=`<button class="btn btn-ghost" style="padding:14px;${f.tipo===b?'background:var(--primary);color:#fff;border-color:var(--primary)':''}" onclick="socSetForm('tipo','${b}');render()">${b}</button>`;});}
    else if(f.operacao==='Corporate (Fusão/Cisão)'){Object.keys(SOC_CHECKS['Corporate (Fusão/Cisão)']).forEach(c=>{h+=`<button class="btn btn-ghost" style="padding:14px;${f.tipo===c?'background:var(--primary);color:#fff;border-color:var(--primary)':''}" onclick="socSetForm('tipo','${c}');render()">${c}</button>`;});}
    else{TIPOS_EMPRESA.forEach(t=>{h+=`<button class="btn btn-ghost" style="padding:14px;${f.tipo===t?'background:var(--primary);color:#fff;border-color:var(--primary)':''}" onclick="socSetForm('tipo','${t}');render()">${t}</button>`;});}
    h+=`</div><div style="display:flex;gap:10px;margin-top:18px"><button class="btn btn-ghost" onclick="SOC.diagStep=0;render()">← Voltar</button><button class="btn btn-primary" onclick="SOC.diagStep=2;render()" ${!f.tipo&&!f.objetivo?'disabled':''}>Próximo →</button></div></div>`;
  }
  if(s===2){
    h+=`<div class="card"><h3 style="margin-bottom:14px">Perfil do Cliente</h3><div class="form-grid">`;
    h+=socSelect('Estado civil','estadoCivil',f.estadoCivil,[['','Selecione...'],['solteiro','Solteiro(a)'],['casado','Casado(a)'],['uniao_estavel','União Estável'],['divorciado','Divorciado(a)'],['viuvo','Viúvo(a)']]);
    h+=socSelect('Regime de bens','regimeBens',f.regimeBens,[['','Selecione...'],['parcial','Comunhão parcial'],['comunhao_total','Comunhão total'],['separacao_total','Separação total']]);
    h+=`<div class="form-group"><label>Nº de herdeiros</label><input type="number" min="0" value="${f.herdeiros}" onchange="socSetForm('herdeiros',this.value)"></div>`;
    h+=socSelect('Atividade de risco?','atividadeRisco',f.atividadeRisco,[['nao','Não'],['sim','Sim']]);
    h+=socSelect('Portas abertas ao público?','portasAbertas',f.portasAbertas,[['nao','Não — sede virtual'],['sim','Sim — estabelecimento físico']]);
    h+=socSelect('Funcionários CLT dia 1?','funcionariosCLT',f.funcionariosCLT,[['nao','Não'],['sim','Sim']]);
    h+=socSelect('Sócios 50/50?','sociosDivergem',f.sociosDivergem,[['nao','Não — majoritário'],['sim','Sim — 50/50']]);
    h+=`</div><div style="display:flex;gap:10px;margin-top:18px"><button class="btn btn-ghost" onclick="SOC.diagStep=1;render()">← Voltar</button><button class="btn btn-primary" onclick="SOC.diagStep=3;render()">Próximo →</button></div></div>`;
  }
  if(s===3){
    h+=`<div class="card"><h3 style="margin-bottom:14px">Dados financeiros</h3><div class="form-grid">`;
    h+=`<div class="form-group"><label>Receita Anual Estimada (R$)</label><input type="number" placeholder="ex: 204000" value="${f.receita}" onchange="socSetForm('receita',this.value)"></div>`;
    h+=socSelect('Regime Tributário','regime',f.regime,[['','Selecione...'],...REGIMES_TRIB.map(r=>[r,r])]);
    h+=socSelect('Processo judicial ativo?','processoJudicial',f.processoJudicial,[['nao','Não'],['sim','Sim']]);
    h+=socSelect('Sócio Pessoa Jurídica?','socioTipoPJ',f.socioTipoPJ,[['nao','Não'],['sim','Sim']]);
    h+=`</div><div style="display:flex;gap:10px;margin-top:18px"><button class="btn btn-ghost" onclick="SOC.diagStep=2;render()">← Voltar</button><button class="btn btn-primary" onclick="SOC.diagStep=4;render()">Próximo →</button></div></div>`;
  }
  if(s===4){
    h+=`<div class="card"><h3 style="margin-bottom:14px">Validação Técnica</h3><div class="form-grid">`;
    h+=socSelect('CNAE compatível com endereço?','cnaeCompativel',f.cnaeCompativel,[['sim','Sim'],['nao','❌ Não']]);
    h+=socSelect('Divergência DBE x Contrato?','divergenciaDBE',f.divergenciaDBE,[['nao','Não'],['sim','❌ Sim']]);
    h+=socSelect('CPF com restrição?','cpfIrregular',f.cpfIrregular,[['nao','Não'],['sim','❌ Sim']]);
    h+=socSelect('Objeto social genérico?','objetoGenerico',f.objetoGenerico,[['nao','Não'],['sim','🟡 Sim']]);
    h+=socSelect('Capital muito baixo?','capitalBaixo',f.capitalBaixo,[['nao','Não'],['sim','🟡 Sim']]);
    h+=socSelect('Sem certificado digital?','semCertificado',f.semCertificado,[['nao','Não — já tem'],['sim','🟡 Sim']]);
    if(f.tipo==='Holding Familiar'){
      h+=socSelect('Objetivo claro?','objetivoClaro',f.objetivoClaro,[['sim','Sim'],['nao','❌ Não']]);
      h+=socSelect('Patrimônio justifica holding?','patrimonioJustifica',f.patrimonioJustifica,[['sim','Sim'],['nao','❌ Não']]);
      h+=socSelect('Integralização viável?','integViavel',f.integViavel,[['sim','Sim'],['nao','❌ Não']]);
    }
    h+=`</div><div style="display:flex;gap:10px;margin-top:18px"><button class="btn btn-ghost" onclick="SOC.diagStep=3;render()">← Voltar</button><button class="btn btn-primary" onclick="SOC.diagResult=rodarEngine(SOC.diagForm);SOC.diagStep=5;render()">Gerar Diagnóstico →</button></div></div>`;
  }
  if(s===5&&r){
    const rc=r.recomendacao,sc=rc==='FAZER'?'#10b981':rc==='NÃO FAZER'?'#ef4444':'#f59e0b';
    h+=`<div class="card mb-4" style="border-left:5px solid ${sc}"><div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap"><h3 style="margin:0">Resultado Motor Antigravity</h3><span class="badge" style="background:${sc}22;color:${sc};border:1px solid ${sc}">${r.status}</span></div>`;
    h+=`<div style="padding:12px 16px;background:${sc}0d;border:1px solid ${sc}44;border-radius:10px;margin-bottom:18px"><strong style="color:${sc};font-size:15px">⚖️ Recomendação: ${rc}</strong></div>`;
    if(r.bloqueios.length){h+=`<div style="margin-bottom:16px"><div style="font-weight:700;color:#fca5a5;margin-bottom:8px">🔴 Bloqueios Críticos (${r.bloqueios.length})</div>`;r.bloqueios.forEach(b=>{h+=`<div style="padding:10px 14px;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.15);border-radius:8px;margin-bottom:6px;font-size:13px"><strong>${b.msg}</strong><div class="text-sm text-muted" style="margin-top:2px">Base: ${b.lei}</div></div>`;});h+=`</div>`;}
    if(r.alertas.length){h+=`<div style="margin-bottom:16px"><div style="font-weight:700;color:#f59e0b;margin-bottom:8px">🟡 Alertas (${r.alertas.length})</div>`;r.alertas.forEach(a=>{h+=`<div style="padding:10px 14px;background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.15);border-radius:8px;margin-bottom:6px;font-size:13px">${a.msg}<div class="text-sm" style="color:#f59e0b;margin-top:2px">Ação: ${a.acao}</div></div>`;});h+=`</div>`;}
    if(r.oportunidades.length){h+=`<div style="margin-bottom:16px"><div style="font-weight:700;color:#10b981;margin-bottom:8px">🟢 Oportunidades (${r.oportunidades.length})</div>`;r.oportunidades.forEach(o=>{h+=`<div style="padding:10px 14px;background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.15);border-radius:8px;margin-bottom:6px;font-size:13px;color:#10b981">${o.msg}<div class="text-sm" style="opacity:.7;margin-top:2px">Base: ${o.base}</div></div>`;});h+=`</div>`;}
    // Checklist
    h+=`<div style="margin-bottom:16px"><div style="font-weight:700;margin-bottom:8px">✅ Checklist — ${f.operacao} · ${f.tipo||f.objetivo}</div>`;
    r.checks.forEach(c=>{h+=`<div style="padding:6px 0;font-size:13px;color:var(--text-muted)">☐ ${c}</div>`;});
    h+=`</div>`;
    // Tributário
    h+=`<div style="background:var(--bg);padding:16px;border-radius:10px"><div style="font-weight:700;margin-bottom:8px">💰 Análise Tributária</div>`;
    h+=`<div style="font-size:13px;color:var(--text-muted)">Regime: ${f.regime||'N/I'}</div>`;
    h+=`<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:10px">`;
    h+=`<div><div class="text-sm text-muted">Receita/mês</div><div style="font-weight:700">R$ ${(parseFloat(f.receita||0)/12).toLocaleString('pt-BR',{minimumFractionDigits:2})}</div></div>`;
    h+=`<div><div class="text-sm text-muted">Imposto/mês</div><div style="font-weight:700;color:#ef4444">R$ ${parseFloat(r.trib.imposto).toLocaleString('pt-BR',{minimumFractionDigits:2})}</div></div>`;
    h+=`<div><div class="text-sm text-muted">Carga Efetiva</div><div style="font-weight:700;color:var(--gold)">${r.trib.efetiva}%</div></div></div>`;
    h+=`<div class="text-sm text-muted" style="margin-top:6px">${r.trib.obs}</div></div>`;
    h+=`<button class="btn btn-ghost" style="margin-top:18px" onclick="SOC.diagStep=0;SOC.diagForm=socFormDefault();SOC.diagResult=null;render()">← Novo Diagnóstico</button></div>`;
  }
  return h;
}
function socSelect(label,key,val,opts){let h=`<div class="form-group"><label>${label}</label><select onchange="socSetForm('${key}',this.value)">`;opts.forEach(([v,t])=>{h+=`<option value="${v}" ${val===v?'selected':''}>${t}</option>`;});return h+`</select></div>`;}
window.socSetForm=function(k,v){SOC.diagForm[k]=v;};

// ═══════════════════════════════════════════
// RENDER: SIMULADOR TRIBUTÁRIO
// ═══════════════════════════════════════════
function renderSimulador(){
  let h=`<div class="card mb-4"><div style="font-weight:800;font-size:16px;color:var(--primary)">💰 Simulador Multi-Regime</div><p class="text-muted text-sm">Compare MEI, Simples, Presumido e Real lado a lado.</p></div>`;
  h+=`<div class="card mb-4"><div class="form-group" style="max-width:380px;margin-bottom:14px"><label>Receita Mensal (R$)</label><input type="number" placeholder="ex: 17000" value="${SOC.simReceita}" oninput="SOC.simReceita=this.value;SOC.simMostrar=false"></div><button class="btn btn-primary" onclick="SOC.simMostrar=true;render()" ${!SOC.simReceita?'disabled':''}>Simular todos os regimes →</button></div>`;
  if(SOC.simMostrar&&parseFloat(SOC.simReceita)>0){
    const mensal=parseFloat(SOC.simReceita);
    const res=REGIMES_TRIB.map(r=>{const{imposto,efetiva,obs}=calcTrib(mensal,r);return{regime:r,imposto,efetiva:parseFloat(efetiva),obs};});
    const melhor=[...res].sort((a,b)=>a.imposto-b.imposto)[0];
    h+=`<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px">`;
    res.forEach(r=>{
      const best=r.regime===melhor.regime;
      h+=`<div class="card" style="text-align:center;${best?'border:2px solid var(--primary);box-shadow:var(--shadow-md)':''}">`;
      if(best) h+=`<div style="font-size:11px;font-weight:700;color:var(--primary);margin-bottom:8px">⭐ MAIS EFICIENTE</div>`;
      h+=`<div style="font-weight:700;font-size:13px;margin-bottom:10px">${r.regime}</div>`;
      h+=`<div style="font-size:28px;font-weight:800;color:var(--primary)">${r.efetiva}%</div><div class="text-sm text-muted">Carga Efetiva</div>`;
      h+=`<div style="font-size:18px;font-weight:700;color:#ef4444;margin-top:10px">R$ ${r.imposto.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div><div class="text-sm text-muted">Imposto/mês</div>`;
      h+=`<div class="text-sm text-muted" style="margin-top:10px;font-size:11px">${r.obs}</div></div>`;
    });
    h+=`</div>`;
    if(mensal*12>81000) h+=`<div class="card mb-4" style="border-left:4px solid #ef4444;padding:12px 16px;font-size:13px"><strong style="color:#ef4444">⚠ MEI:</strong> Faturamento excede R$81k/ano. Vedado.</div>`;
    if(mensal*12>4800000) h+=`<div class="card mb-4" style="border-left:4px solid #ef4444;padding:12px 16px;font-size:13px"><strong style="color:#ef4444">⚠ Simples:</strong> Faturamento excede R$4,8M/ano. Exclusão obrigatória.</div>`;
    h+=`<div class="card" style="text-align:center;background:var(--bg)"><span>💡 Economia anual vs. pior regime: </span><strong style="color:var(--primary);font-size:18px">R$ ${((Math.max(...res.map(r=>r.imposto))-melhor.imposto)*12).toLocaleString('pt-BR',{minimumFractionDigits:2})}</strong></div>`;
  }
  return h;
}

// ═══════════════════════════════════════════
// RENDER: GERADOR DE DOCUMENTOS
// ═══════════════════════════════════════════
function renderGeradorDocumentos(){
  const d=SOC.docDados,t=SOC.docTipo;
  const TIPOS_DOC=['Contrato Social — LTDA','Contrato Social — SLU','Ata de Distribuição de Lucros','Ata de Dissolução','Contrato de Participação — Sócio Anjo'];
  const dt=new Date().toLocaleDateString('pt-BR');
  const templates={
    'Contrato Social — LTDA':`CONTRATO SOCIAL DE ${(d.empresa||'[NOME]').toUpperCase()} LTDA\n\nPARTES:\n□ ${d.socio1||'[SÓCIO 1]'}, CPF ${d.cpf1||'XXX.XXX.XXX-XX'}\n□ ${d.socio2||'[SÓCIO 2]'}\n\nDENOMINAÇÃO: ${d.empresa||'[NOME]'} LTDA\nSEDE: ${d.sede||'[ENDEREÇO]'}\nOBJETO: ${d.objeto||'[OBJETO SOCIAL]'}\nCAPITAL: R$ ${parseFloat(d.capital||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}\nADMINISTRAÇÃO: ${d.admin||d.socio1||'[ADMINISTRADOR]'}\n\nCLÁUSULAS PROTETIVAS:\n□ Quotas INALIENÁVEIS a terceiros sem anuência unânime\n□ Direito de preferência na cessão de quotas\n□ Vedação de uso da PJ para fins pessoais\n\nPorto Alegre, ${dt}.\n\n_________________________ _________________________\n${d.socio1||'Sócio 1'}          ${d.socio2||'Sócio 2'}`,
    'Contrato Social — SLU':`CONTRATO SOCIAL DE ${(d.empresa||'[NOME]').toUpperCase()} SLU\n(Sociedade Limitada Unipessoal — Lei 14.195/2021)\n\nTITULAR: ${d.socio1||'[NOME]'}, CPF ${d.cpf1||'XXX.XXX.XXX-XX'}\nSEDE: ${d.sede||'[ENDEREÇO]'}\nOBJETO: ${d.objeto||'[OBJETO]'}\nCAPITAL: R$ ${parseFloat(d.capital||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}\nADMINISTRADOR: ${d.admin||d.socio1||'[NOME]'}\n\nPorto Alegre, ${dt}.\n\n_________________________\n${d.socio1||'Titular'}`,
    'Ata de Distribuição de Lucros':`ATA DE REUNIÃO — DISTRIBUIÇÃO DE LUCROS\n${(d.empresa||'[EMPRESA]').toUpperCase()} LTDA — CNPJ: ${d.cnpj||'XX.XXX.XXX/0001-XX'}\n\nDATA: ${dt} | SEDE: ${d.sede||'[ENDEREÇO]'}\nPRESENTES: ${d.socio1||'[SÓCIO]'}${d.socio2?' e '+d.socio2:''}\n\nDELIBERAÇÕES:\n1. Resultado apurado: R$ [VALOR] conforme DRE.\n2. Distribuição ISENTA de IR (Lei 9.249/1995, art. 10).\n3. Reserva mínima de [X]% para capital de giro.\n\nPorto Alegre, ${dt}.\n_________________________\n${d.admin||d.socio1||'Administrador'}`,
    'Ata de Dissolução':`ATA DE DISSOLUÇÃO E DISTRATO SOCIAL\n${(d.empresa||'[NOME]').toUpperCase()} LTDA — CNPJ: ${d.cnpj||'XX.XXX.XXX/0001-XX'}\n\nDATA: ${dt}\n\nDELIBERAÇÃO UNÂNIME: dissolução e liquidação.\nLIQUIDANTE: ${d.admin||'[LIQUIDANTE]'}\n\nPROVIDÊNCIAS:\n□ Quitação débitos fiscais\n□ Baixa Junta/CNPJ/Prefeitura/Estado\n□ DCTF finais\n□ Partilha saldo remanescente\n\nPorto Alegre, ${dt}.\n_________________________ _________________________\n${d.socio1||'Sócio 1'}          ${d.socio2||'Sócio 2'}`,
    'Contrato de Participação — Sócio Anjo':`CONTRATO DE PARTICIPAÇÃO — INVESTIDOR-ANJO\n(Art. 61-A da LC 123/2006, LC 155/2016)\n\nEMPRESA: ${d.empresa||'[RAZÃO SOCIAL]'} — CNPJ: ${d.cnpj||'XX.XXX.XXX/0001-XX'}\nRepresentada por: ${d.socio1||'[ADMINISTRADOR]'}, CPF ${d.cpf1||'XXX'}\n\nINVESTIDOR-ANJO: ${d.investidor||'[INVESTIDOR]'}\nCPF: ${d.cpfInvestidor||'XXX'}\n\nAPORTE: R$ ${parseFloat(d.valorAporte||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}\nPRAZO: ${d.prazoAnos||'5'} anos | REMUNERAÇÃO: ${d.percentualResultados||'[X]'}% dos lucros\n\nVEDAÇÕES: O investidor NÃO pode administrar, votar ou exercer gerência.\nRESPONSABILIDADE: limitada ao aporte.\n\nPorto Alegre, ${dt}.\n_________________________ _________________________\n${d.socio1||'Empresa'}              ${d.investidor||'Investidor-Anjo'}`
  };
  const isAnjo=t.includes('Anjo');
  let h=`<div class="card mb-4"><div style="font-weight:800;font-size:16px;color:var(--primary)">📑 Gerador de Documentos Societários</div><p class="text-muted text-sm">Modelos com preenchimento automático. Copie e revise com assessoria jurídica.</p></div>`;
  h+=`<div style="display:grid;grid-template-columns:1fr 1.3fr;gap:18px">`;
  // Form
  h+=`<div class="card"><div class="form-group" style="margin-bottom:14px"><label>Tipo de Documento</label><select onchange="SOC.docTipo=this.value;SOC.docGerado=false;render()"><option value="">Selecione...</option>`;
  TIPOS_DOC.forEach(td=>{h+=`<option ${t===td?'selected':''}>${td}</option>`;});
  h+=`</select></div>`;
  h+=socDocField('Empresa','empresa',d.empresa);
  h+=socDocField('CNPJ','cnpj',d.cnpj,'XX.XXX.XXX/0001-XX');
  h+=socDocField('Sócio/Titular 1','socio1',d.socio1);
  h+=socDocField('CPF','cpf1',d.cpf1);
  h+=socDocField('Sócio 2','socio2',d.socio2);
  h+=socDocField('Sede','sede',d.sede);
  h+=socDocField('Objeto Social','objeto',d.objeto);
  if(!isAnjo){h+=socDocField('Capital Social (R$)','capital',d.capital,'100000','number');h+=socDocField('Administrador','admin',d.admin);}
  if(isAnjo){h+=socDocField('Investidor-Anjo','investidor',d.investidor);h+=socDocField('CPF Investidor','cpfInvestidor',d.cpfInvestidor);h+=socDocField('Valor Aporte (R$)','valorAporte',d.valorAporte,'50000','number');h+=socDocField('Prazo (anos)','prazoAnos',d.prazoAnos,'5','number');h+=socDocField('% Resultados','percentualResultados',d.percentualResultados,'15','number');}
  h+=`<button class="btn btn-primary" style="width:100%;margin-top:10px" onclick="SOC.docGerado=true;render()" ${!t?'disabled':''}>Gerar Documento →</button></div>`;
  // Preview
  h+=`<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><strong>📄 ${t||'Pré-visualização'}</strong>`;
  if(SOC.docGerado) h+=`<button class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText(document.getElementById('doc-text').textContent);this.textContent='✅ Copiado!'">📋 Copiar</button>`;
  h+=`</div><pre id="doc-text" style="background:var(--bg);padding:18px;border-radius:10px;font-size:12px;white-space:pre-wrap;line-height:1.7;max-height:600px;overflow-y:auto;font-family:'Inter',sans-serif">${SOC.docGerado?(templates[t]||'Modelo não encontrado.'):'[ Preencha os dados e clique em Gerar ]'}</pre>`;
  if(SOC.docGerado) h+=`<div class="text-sm text-muted" style="margin-top:10px">⚠️ Modelo orientativo — revise com assessoria jurídica antes de protocolar.</div>`;
  h+=`</div></div>`;
  return h;
}
function socDocField(label,key,val,ph,type){return `<div class="form-group" style="margin-bottom:10px"><label style="font-size:11px">${label}</label><input type="${type||'text'}" placeholder="${ph||''}" value="${val||''}" onchange="SOC.docDados['${key}']=this.value"></div>`;}

// ═══════════════════════════════════════════
// RENDER: PLAYBOOK EXECUTOR
// ═══════════════════════════════════════════
const PB_ETAPAS=[
  {id:1,nome:'Diagnóstico',resp:'Consultor',checks:['Atividade definida','Faturamento estimado','Endereço definido','Sócios identificados','Risco jurídico avaliado']},
  {id:2,nome:'Viabilidade',resp:'Analista',checks:['Acesso JucisRS/Redesim','CNAE validado no endereço','Nome empresarial disponível']},
  {id:3,nome:'DBE / CNPJ',resp:'Analista',checks:['QSA preenchido','CNAE principal definido','Capital social registrado','Regime tributário selecionado']},
  {id:4,nome:'Contrato Social',resp:'Consultor+Analista',checks:['Objeto social específico','Quotas distribuídas','Administração definida','Cláusulas obrigatórias','Coerência com DBE']},
  {id:5,nome:'Registro Junta',resp:'Analista',checks:['PDF-A gerado','Assinatura digital gov.br','DARE paga','Protocolo gerado','NIRE emitido']},
  {id:6,nome:'MAT (CNPJ)',resp:'Contabilista',checks:['Botão MAT visível','Acesso GOV.BR prata','Protocolo Redesim','Regime definido','Ciência DTE','Dados revisados','Assinatura digital','Transmitido','CNPJ emitido']},
  {id:7,nome:'Validação',resp:'Revisor',checks:['DBE conferido','Contrato conferido','Documentos completos','CNPJ ativo no e-CAC']},
  {id:8,nome:'Inscrições',resp:'Analista',checks:['Verificar IM automática','Verificar IE automática','IM manual se necessário','IE manual se necessário']},
  {id:9,nome:'Licenciamento',resp:'Analista',checks:['Alvará funcionamento','Bombeiros (se aplicável)','Vigilância sanitária (se aplicável)']},
  {id:10,nome:'Operacional',resp:'Consultor',checks:['Certificado e-CNPJ','Conta bancária PJ','NFS-e habilitada','Contabilidade implantada','Balanço abertura (CPC 26)']},
];

function renderPlaybook(){
  if(!SOC.pbChecks) SOC.pbChecks=PB_ETAPAS.map(e=>e.checks.map(()=>false));
  const i=SOC.pbEtapa,e=PB_ETAPAS[i];
  const allDone=SOC.pbChecks[i].every(c=>c);
  let h=`<div class="card mb-4"><div style="font-weight:800;font-size:16px;color:var(--primary)">📋 Playbook Executor — Abertura de Empresa</div><p class="text-muted text-sm">Processo guiado em 10 etapas com validação automática.</p></div>`;
  h+=`<div class="card mb-4" style="display:flex;gap:6px;flex-wrap:wrap;padding:14px">`;
  PB_ETAPAS.forEach((et,idx)=>{
    const done=SOC.pbChecks[idx]?.every(c=>c);
    const col=done?'var(--success)':idx===i?'var(--primary)':'var(--text-muted)';
    h+=`<button class="btn ${idx===i?'btn-primary':'btn-ghost'}" style="font-size:11px;padding:6px 12px;${done?'border-color:var(--success);color:var(--success)':''}" onclick="SOC.pbEtapa=${idx};render()">${et.id}. ${et.nome} ${done?'✓':''}</button>`;
  });
  h+=`</div>`;
  h+=`<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><div><div style="font-weight:700;font-size:15px;color:var(--primary)">Etapa ${e.id} — ${e.nome}</div><div class="text-sm text-muted">Responsável: ${e.resp}</div></div><span class="badge ${allDone?'badge-green':'badge-blue'}">${allDone?'✅ Concluído':'🔄 Em andamento'}</span></div>`;
  e.checks.forEach((c,ci)=>{
    const checked=SOC.pbChecks[i][ci];
    h+=`<label style="display:flex;align-items:center;gap:10px;padding:8px 0;cursor:pointer;font-size:13px;color:${checked?'var(--success)':'var(--text-muted)'}"><input type="checkbox" ${checked?'checked':''} onchange="SOC.pbChecks[${i}][${ci}]=this.checked;render()" style="accent-color:var(--primary);width:16px;height:16px"><span style="text-decoration:${checked?'line-through':'none'}">${c}</span></label>`;
  });
  h+=`<div style="display:flex;gap:10px;margin-top:18px"><button class="btn btn-ghost" ${i===0?'disabled':''} onclick="SOC.pbEtapa=${i-1};render()">← Anterior</button><button class="btn btn-primary" ${!allDone||i===PB_ETAPAS.length-1?'disabled':''} onclick="SOC.pbEtapa=${i+1};render()">Próxima →</button></div>`;
  if(i===PB_ETAPAS.length-1&&allDone) h+=`<div style="margin-top:18px;padding:18px;background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.2);border-radius:12px;text-align:center"><div style="font-size:28px">🎉</div><div style="font-weight:700;color:var(--success);font-size:16px">Empresa aberta com sucesso!</div><div class="text-sm text-muted">Todas as 10 etapas concluídas.</div></div>`;
  h+=`</div>`;
  return h;
}

// ═══════════════════════════════════════════
// RENDER: ACADEMIA (15 módulos com provas)
// ═══════════════════════════════════════════
const ACAD_MODULOS=[
  {id:1,titulo:'Experiência do Cliente',desc:'Fundamento CX, escuta ativa, reunião, onboarding premium.',qtd:5},
  {id:2,titulo:'Jornada do Cliente',desc:'8 etapas CX + scripts de comunicação.',qtd:4},
  {id:3,titulo:'Setor Societário Básico',desc:'Tipos jurídicos, operações, MP 881 (SLU).',qtd:4},
  {id:4,titulo:'Contrato Social',desc:'Cláusulas obrigatórias, requisitos, administração.',qtd:4},
  {id:5,titulo:'DBE e CNPJ',desc:'Documento Básico de Entrada, Viabilidade, Redesim.',qtd:3},
  {id:6,titulo:'Procurações e Certificados',desc:'e-CPF, e-CNPJ, tipos A1/A3.',qtd:3},
  {id:7,titulo:'Órgãos e Licenciamento',desc:'Junta, Receita, Prefeitura, SEFAZ, Alvará.',qtd:3},
  {id:8,titulo:'Tributação Empresarial',desc:'MEI, Simples (5 Anexos), Presumido, Real.',qtd:5},
  {id:9,titulo:'Análise e Prevenção',desc:'Erros bloqueantes, alertas do Motor, baixa de empresas.',qtd:4},
  {id:10,titulo:'Organização e KPIs',desc:'Rotina produtiva, comunicação, indicadores.',qtd:2},
  {id:11,titulo:'Associações e 3º Setor',desc:'Associações, OSCIP, OS, Fundações.',qtd:4},
  {id:12,titulo:'Viabilidade e Abertura RS',desc:'Consulta, Redesim, JucisRS — processo completo.',qtd:3},
  {id:13,titulo:'Unipessoalidade',desc:'MP 881/2019, EIRELI extinta, SLU, Lei Liberdade Econômica.',qtd:4},
  {id:14,titulo:'MROSC — Lei 13.019',desc:'Fomento, Colaboração, Cooperação, Prestação de Contas.',qtd:5},
  {id:15,titulo:'Investidor-Anjo',desc:'LC 155/2016, Contrato de Participação, vedações.',qtd:6},
];

function renderAcademiaSoc(){
  let h=`<div class="card mb-4"><div style="font-weight:800;font-size:16px;color:var(--primary)">🎓 Academia Societária — Treinamento da Equipe</div><p class="text-muted text-sm">15 módulos com material de estudo e provas de validação.</p></div>`;
  h+=`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">`;
  ACAD_MODULOS.forEach(m=>{
    h+=`<div class="card" style="display:flex;flex-direction:column"><div style="font-size:11px;font-weight:700;color:var(--primary);margin-bottom:4px">MÓDULO ${m.id}</div><div style="font-weight:700;font-size:14px;margin-bottom:6px">${m.titulo}</div><div class="text-sm text-muted" style="flex:1;margin-bottom:12px">${m.desc}</div><div class="text-sm text-muted" style="margin-bottom:8px">${m.qtd} questões</div><button class="btn btn-primary btn-sm" onclick="window.open('https://automacoesclientes.vercel.app/','_self')">📘 Ver no Sistema Societário</button></div>`;
  });
  h+=`</div>`;
  h+=`<div class="card" style="margin-top:18px;text-align:center;background:var(--bg)"><div class="text-sm text-muted">💡 Os módulos completos com conteúdo de estudo e provas de validação estão disponíveis no sistema Societário dedicado.</div></div>`;
  return h;
}

// ═══════════════════════════════════════════
// EXPORTS globais para router
// ═══════════════════════════════════════════
window.renderDiagnostico = renderDiagnostico;
window.renderSimulador = renderSimulador;
window.renderGeradorDocumentos = renderGeradorDocumentos;
window.renderPlaybook = renderPlaybook;
window.renderAcademiaSoc = renderAcademiaSoc;
