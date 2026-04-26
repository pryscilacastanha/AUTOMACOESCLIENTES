// ─── SEED DATA — Gerado de 06_Documentacao/Escrituração EM andamento.csv ───
// Carregado automaticamente se não houver clientes cadastrados

// ─── DEFIS SEED — Gerado de Downloads/Criscontab & Madeira - Defis - Entregues.csv ───
// Status DEFIS 2025 por cliente (entregue, ecd_ecf, sem_entrega, inativo)
const DEFIS_SEED = [
  { id:'73',  acao:'entregue', resp:'Aliny', obs:'Valéria: Não tem contato do cliente. Aliny ficou de enviar a documentação 17/03' },
  { id:'64',  acao:'entregue', resp:'Aliny', obs:'Somente 3 notas ano de 2025' },
  { id:'120', acao:'entregue', resp:'Aliny', obs:'' },
  { id:'50',  acao:'entregue', resp:'Aliny', obs:'TEM VALORES EXPRESSIVOS - SE PRECISAR REVISAMOS' },
  { id:'89',  acao:'entregue', resp:'Cris',  obs:'Não tem movimentação' },
  { id:'156', acao:'entregue', resp:'Aliny', obs:'Não tem movimentação. Está em inventário' },
  { id:'56',  acao:'entregue', resp:'Aliny', obs:'O cliente Maria informou que está aguardando a documentação' },
  { id:'17',  acao:'entregue', resp:'Aliny', obs:'Não tenho o contato do cliente' },
  { id:'72',  acao:'entregue', resp:'Aliny', obs:'Cliente não emite nota. Tem folha de pagamento alto. Fazer nota explicativa para notificar o cliente.' },
  { id:'39',  acao:'entregue', resp:'Aliny', obs:'Entregue apenas Estoque. Aguardando o cliente mandar o documento.' },
  { id:'132', acao:'entregue', resp:'Cris',  obs:'Enviou extrato mas nunca tirou nota' },
  { id:'27',  acao:'entregue', resp:'Aliny', obs:'Não tenho o contato do cliente' },
  { id:'15',  acao:'entregue', resp:'Aliny', obs:'Somente Extrato e Estoque' },
  { id:'1',   acao:'entregue', resp:'Aliny', obs:'Somente Extrato e Estoque. Entregar com as informações que contem no fiscal. Não tem folha de pagamento.' },
  { id:'80',  acao:'entregue', resp:'Aliny', obs:'Algumas notas emitidas. Verificar se tem conta PJ. Fechar com o que tem.' },
  { id:'31',  acao:'entregue', resp:'Aliny', obs:'Solicitado documentação. Aliny solicitando extrato do Banrisul.' },
  { id:'140', acao:'entregue', resp:'Cris',  obs:'Fazer sem movimento. Cliente precisa de ajuda para tirar os extratos.' },
  { id:'44',  acao:'entregue', resp:'Aliny', obs:'Entregue como está e tem encerramento. Baixa 2026. Não tem documentação.' },
  { id:'124', acao:'entregue', resp:'Cris',  obs:'Lançar contabilização do Parcelamento. Não tira nota. Fecha como tem. Não envia extrato.' },
  { id:'59',  acao:'entregue', resp:'Aliny', obs:'' },
  { id:'63',  acao:'entregue', resp:'Aliny', obs:'Não emite nota e não envia extrato. Somente prolabore. Entrega como está.' },
  { id:'74',  acao:'entregue', resp:'Aliny', obs:'Vai solicitar documentação.' },
  { id:'75',  acao:'entregue', resp:'Aliny', obs:'Conferindo se precisa entregar DEFIS' },
  { id:'119', acao:'entregue', resp:'Cris',  obs:'Sem movimento em 2025. Fiscal/Folha. Não tem extrato — Só entregar.' },
  { id:'46',  acao:'entregue', resp:'Aliny', obs:'Pedindo extrato. Recebe em Dólar. Não vem recebendo na conta PJ.' },
  { id:'121', acao:'entregue', resp:'Aliny', obs:'Já solicitado aguardando' },
  { id:'127', acao:'entregue', resp:'Cris',  obs:'Enviou extrato. Fechado não tem nada só aberto CNPJ.' },
  { id:'145', acao:'entregue', resp:'Cris',  obs:'Simples — DEFIS' },
  { id:'144', acao:'entregue', resp:'Cris',  obs:'Simples — DEFIS' },
  { id:'151', acao:'entregue', resp:'Cris',  obs:'' },
  { id:'152', acao:'entregue', resp:'Cris',  obs:'Entregar sem o extrato. Fechar com o fiscal e contábil.' },
  { id:'153', acao:'entregue', resp:'Cris',  obs:'Cris: não precisa fazer agora' },
  { id:'155', acao:'entregue', resp:'Cris',  obs:'' },
  { id:'54',  acao:'entregue', resp:'Aliny', obs:'Vão fazer mas ainda está juntando a documentação' },
  { id:'138', acao:'entregue', resp:'Cris',  obs:'Enviou extratos mas em pdf, aguardando relação de bens.' },
  { id:'97',  acao:'entregue', resp:'Cris',  obs:'Não tem mais documentos, fechar com o que tem.' },
  { id:'146', acao:'entregue', resp:'Cris',  obs:'Simples — DEFIS' },
  { id:'126', acao:'entregue', resp:'Cris',  obs:'Mandou os extratos, aguardando o estoque' },
  { id:'131', acao:'entregue', resp:'Cris',  obs:'Enviou extratos, aguardando ofx' },
  { id:'134', acao:'entregue', resp:'Cris',  obs:'Duda: não enviou ainda' },
  { id:'82',  acao:'entregue', resp:'Cris',  obs:'Enviou extratos, vai enviar sobre financiamento, não tem estoque' },
  { id:'112', acao:'entregue', resp:'Cris',  obs:'Pedi doc aguardando' },
  { id:'157', acao:'entregue', resp:'Cris',  obs:'' },
  { id:'104', acao:'entregue', resp:'Cris',  obs:'Verificar se 2025 era simples' },
  { id:'130', acao:'entregue', resp:'Aliny', obs:'Cliente Elis' },
  { id:'133', acao:'entregue', resp:'Aliny', obs:'Cris: vou entregar depois' },
  { id:'139', acao:'entregue', resp:'CM',    obs:'Entregar' },
  { id:'129', acao:'entregue', resp:'Aliny', obs:'Conferir Matriz' },
  // Lucro Presumido / Lucro Real — Entregar ECD/ECF
  { id:'3',   acao:'ecd_ecf',  resp:'Aliny', obs:'Não tenho o contato do cliente' },
  { id:'5',   acao:'ecd_ecf',  resp:'Aliny', obs:'Verificando documentação' },
  { id:'98',  acao:'ecd_ecf',  resp:'Cris',  obs:'Associação. Tem fiscal/Folha - Sem extrato. Corrigir percentual sócio.' },
  { id:'40',  acao:'ecd_ecf',  resp:'Aliny', obs:'Entrei em contato e o cliente não deu retorno' },
  { id:'103', acao:'ecd_ecf',  resp:'Cris',  obs:'Associação. Não vai entregar.' },
  { id:'43',  acao:'ecd_ecf',  resp:'Aliny', obs:'Fazer com os dados que tem no sistema' },
  { id:'61',  acao:'ecd_ecf',  resp:'Aliny', obs:'Não tem contato do cliente' },
  { id:'113', acao:'ecd_ecf',  resp:'Cris',  obs:'' },
  { id:'115', acao:'ecd_ecf',  resp:'Cris',  obs:'Enviar com o que tem — Lucro Real' },
  { id:'123', acao:'ecd_ecf',  resp:'',      obs:'MEI — verificar obrigatoriedade' },
  { id:'141', acao:'ecd_ecf',  resp:'Aliny', obs:'Sem movimento' },
  { id:'142', acao:'ecd_ecf',  resp:'Aliny', obs:'Verificar se tem extrato' },
  { id:'143', acao:'ecd_ecf',  resp:'',      obs:'Lucro Presumido' },
  { id:'147', acao:'ecd_ecf',  resp:'',      obs:'Presumido — ECD/ECF' },
  { id:'148', acao:'ecd_ecf',  resp:'',      obs:'Lucro Presumido' },
  { id:'149', acao:'ecd_ecf',  resp:'',      obs:'Lucro Presumido' },
  { id:'150', acao:'ecd_ecf',  resp:'',      obs:'Lucro Presumido' },
  { id:'84',  acao:'ecd_ecf',  resp:'Cris',  obs:'Presumido — ECD/ECF' },
  { id:'91',  acao:'ecd_ecf',  resp:'',      obs:'Troca de contador — não entrega' },
  { id:'154', acao:'ecd_ecf',  resp:'Cris',  obs:'Lucro Real — enviar com o que tem' },
  // Sem entrega / Inativos
  { id:'88',  acao:'sem_entrega', resp:'Cris', obs:'Alex: tem toda a movimentação, livro caixa e extratos PDF e OFX' },
  { id:'81',  acao:'sem_entrega', resp:'Cris', obs:'Somente cadastro CPF' },
  { id:'71',  acao:'inativo',     resp:'Aliny', obs:'Encerrada' },
  { id:'30',  acao:'inativo',     resp:'Aliny', obs:'Empresa fechada' },
  { id:'42',  acao:'inativo',     resp:'Aliny', obs:'' },
  { id:'77',  acao:'inativo',     resp:'Aliny', obs:'Enviado extrato em PDF e OFX' },
  { id:'78',  acao:'inativo',     resp:'Aliny', obs:'Inventário, extratos. Não tem livro caixa. Revisar sócios na DEFIS.' },
  { id:'116', acao:'inativo',     resp:'Cris', obs:'Não tem movimento. Extratos.' },
  { id:'79',  acao:'inativo',     resp:'Aliny', obs:'' },
  { id:'122', acao:'inativo',     resp:'',     obs:'' },
  { id:'125', acao:'inativo',     resp:'',     obs:'' },
  { id:'90',  acao:'inativo',     resp:'Cris', obs:'Não é mais cliente — Não entregar obrigação de 2025' },
  { id:'99',  acao:'inativo',     resp:'Cris', obs:'Não é mais cliente — não vai entregar. Enviar com o que tem.' },
  { id:'111', acao:'inativo',     resp:'Cris', obs:'Não é mais cliente. Nada em 2025. Somente entregar.' },
  { id:'136', acao:'cliente_elis',resp:'Cris', obs:'Entregar do jeito que está' },
  { id:'128', acao:'ecd_ecf',     resp:'Cris', obs:'Associação. Não enviar. Enviou extrato e simples.' },
  { id:'135', acao:'cliente_elis',resp:'Cris', obs:'Enviar com o que tem' },
  { id:'137', acao:'cliente_elis',resp:'Aliny', obs:'' },
  { id:'25',  acao:'sem_procuracao', resp:'Aliny', obs:'Sem Procuração para entregar' },
];

function seedDefis() {
  const ano = '2025';
  const obrigacoes = DB.get('obrigacoes') || {};
  let added = 0;
  DEFIS_SEED.forEach(d => {
    const acao = d.acao;
    // DEFIS — Simples
    const kDefis = `${d.id}_DEFIS_${ano}`;
    if (!obrigacoes[kDefis]) {
      obrigacoes[kDefis] = {
        status: acao === 'entregue' ? 'entregue' : acao === 'inativo' ? 'nao_aplicavel' : 'pendente',
        data_entrega: acao === 'entregue' ? '2025-03-31' : '',
        responsavel: d.resp,
        obs_defis: d.obs,
      };
      added++;
    }
    // ECD/ECF — Presumido/Real
    if (acao === 'ecd_ecf') {
      ['ECD','ECF'].forEach(cod => {
        const k = `${d.id}_${cod}_${ano}`;
        if (!obrigacoes[k]) {
          obrigacoes[k] = { status: 'pendente', responsavel: d.resp, obs_defis: d.obs };
          added++;
        }
      });
    }
  });
  if (added > 0) DB.set('obrigacoes', obrigacoes);
  return added;
}

const CLIENTES_SEED = [
  { id:'1',   nome:'ALINY PACHECO MADEIRA',   cnpj:'13.886.410/0001-23', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Intermediário'  },
];

// ─── Seed: resets to only seed clients + any manually added ───
function seedClientes() {
  const seedIds = new Set(CLIENTES_SEED.map(c => c.id));
  const existing = DB.get('clientes') || [];
  
  // v3.0 migration: remove old hardcoded clients, keep only seed + manually added
  if (!localStorage.getItem('seed_v3')) {
    // Keep only clients that are in the new seed OR were manually added (id > 157)
    const filtered = existing.filter(c => seedIds.has(c.id) || parseInt(c.id) > 157);
    DB.set('clientes', filtered.length > 0 ? filtered : []);
    localStorage.setItem('seed_v3', '1');
    console.log('[Seed v3] Migração: mantidos', filtered.length, 'clientes');
  }
  
  // Add missing seed clients
  const current = DB.get('clientes') || [];
  const currentIds = new Set(current.map(c => c.id));
  let added = 0;
  CLIENTES_SEED.forEach(seed => {
    if (!currentIds.has(seed.id)) {
      current.push({
        ...seed,
        cnae: seed.cnae || '', erp: seed.erp || '',
        responsavel: seed.responsavel || '', whatsapp: seed.whatsapp || '', email: seed.email || '',
        im: seed.im || '', ie: seed.ie || '', fat_medio: seed.fat_medio || '',
        qtd_socios: seed.qtd_socios || '', obs_diag: seed.obs_diag || '',
        fiscal_integrado: false, folha_integrada: false, financeiro_integrado: false,
        tem_caixa: false, tem_estoque: false, tem_prolabore: true, tem_folha: false,
        bancos: [], banco_outro: '', drive_url: '',
        qtd_funcionarios: '', criado_em: new Date().toISOString(),
      });
      added++;
    }
  });
  if (added > 0) {
    DB.set('clientes', current);
    console.log(`[Seed] ${added} clientes adicionados. Total: ${current.length}`);
  }
  return added;
}

// ─── initSeed: chamada pelo bootstrapApp() em modules.js ANTES do render ───
function initSeed() {
  // Sempre executa merge — adiciona clientes faltantes
  seedClientes();
  // Seed obrigações (DEFIS)
  const nd = seedDefis();
  if (nd > 0) console.log('[Seed] DEFIS carregados:', nd);
  // Atualiza sidebar count sincronamente
  const el = document.getElementById('sidebar-count');
  if (el) {
    const total = (DB.get('clientes') || []).length;
    if (total > 0) el.textContent = total + ' clientes cadastrados';
  }
}
