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
  { id:'1',   nome:'ALINY PACHECO MADEIRA',                                            cnpj:'13.886.410/0001-23', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Intermediário' },
  { id:'3',   nome:'TOPOGRAFIA',                                                       cnpj:'09.035.469/0001-30', regime:'Lucro Presumido',  status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Intermediário' },
  { id:'5',   nome:'ASSOCIACAO COMERCIAL DAS AGROPECUARIAS E AGROVETERINARIAS DA REGIAO METROPOLITANA DE PORTO ALEGRE RS', cnpj:'13.373.835/0001-39', regime:'Simples Nacional', status:'Ativo', tipo_operacao:'Serviço', complexidade:'Alta', obs:'Avaliar enquadramento' },
  { id:'15',  nome:'SILVA MARTINS & MADEIRA LTDA',                                     cnpj:'02.773.274/0001-49', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'17',  nome:'DEIVI TEIXEIRA HOMEM SOLUCOES EM CLIMATIZACAO LTDA',               cnpj:'19.679.735/0001-11', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Intermediário' },
  { id:'25',  nome:'CRUZ E NUNES LTDA',                                                cnpj:'29.081.138/0001-44', regime:'Lucro Presumido',  status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Intermediário' },
  { id:'27',  nome:'MARIA A MACHADO DA SILVA',                                         cnpj:'30.168.377/0001-15', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'30',  nome:'Claudio Dias & Ferreira Ltda',                                     cnpj:'31.953.090/0001-69', regime:'Simples Nacional', status:'Inativo', tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'31',  nome:'TANIA MARIA DA SILVA PEREIRA',                                     cnpj:'31.099.512/0001-80', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'39',  nome:'Jackson S. Alves Ltda',                                            cnpj:'28.878.131/0001-95', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Comércio', complexidade:'Simples' },
  { id:'40',  nome:'GRUPO ESCOTEIRO LACADOR 358/RS',                                   cnpj:'32.267.461/0001-11', regime:'Simples Nacional', status:'Inativo', tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'42',  nome:'SRS MARMORES E GRANITOS LTDA',                                     cnpj:'38.657.850/0001-30', regime:'Simples Nacional', status:'Inativo', tipo_operacao:'Indústria', complexidade:'Intermediário' },
  { id:'43',  nome:'Andrea C. Lopes Ltda',                                             cnpj:'40.344.162/0001-61', regime:'Lucro Presumido',  status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Intermediário' },
  { id:'44',  nome:'DSS OFICINA MECANICA LTDA',                                        cnpj:'41.594.175/0001-51', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'46',  nome:'A S BRITO TOPOGRAFIA LTDA',                                        cnpj:'41.608.774/0001-87', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'50',  nome:'JORNAL OPINIAO DE VIAMAO LTDA',                                    cnpj:'03.080.511/0001-59', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Intermediário' },
  { id:'54',  nome:'V R POLICARPO & M L AQUINI ATIVIDADES VETERINARIAS LTDA',          cnpj:'43.971.841/0001-59', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'56',  nome:'ERNESTO W. SIEGLE & FERNANDA S. DA SILVA LTDA',                   cnpj:'19.191.198/0001-66', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'59',  nome:'BERENICE DA ROSA SPADER PSICOLOGIA LTDA',                          cnpj:'45.418.211/0001-87', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'61',  nome:'CM SILVA & AGM SILVA LTDA.',                                       cnpj:'19.534.212/0001-87', regime:'Lucro Presumido',  status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Intermediário' },
  { id:'63',  nome:'TATIANE C. NUNES LTDA',                                            cnpj:'46.098.911/0001-02', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'64',  nome:'J. S. DE MENEZES LTDA',                                            cnpj:'27.880.916/0001-30', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Comércio', complexidade:'Simples' },
  { id:'71',  nome:'V. M. C. Rodrigues',                                               cnpj:'45.887.448/0001-07', regime:'Simples Nacional', status:'Inativo', tipo_operacao:'Serviço', complexidade:'Simples', obs:'Encerrada' },
  { id:'72',  nome:'M. V. D. DA SILVEIRA LTDA',                                        cnpj:'26.911.525/0001-72', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'73',  nome:'P. H. M. Cabeleira',                                               cnpj:'50.136.729/0001-68', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'74',  nome:'P. J. Rolim Blum Ltda',                                            cnpj:'50.163.065/0001-26', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'75',  nome:'Pietrizze Ltda',                                                   cnpj:'50.595.713/0001-13', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Comércio', complexidade:'Simples' },
  { id:'77',  nome:'CAMILA OLIVEIRA DA COSTA LTDA',                                    cnpj:'50.738.200/0001-14', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'78',  nome:'C. O. DA COSTA LTDA',                                              cnpj:'51.473.994/0001-02', regime:'Simples Nacional', status:'Inativo', tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'79',  nome:'BUNKER 784 GASTROBAR LTDA',                                        cnpj:'44.679.580/0001-60', regime:'Simples Nacional', status:'Inativo', tipo_operacao:'Serviço', complexidade:'Intermediário' },
  { id:'80',  nome:'ADIR WEBBER DE MELO',                                              cnpj:'18.742.086/0001-93', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'81',  nome:'CRISTIANE SANTTANNA PEREIRA DA SILVA',                             cnpj:'51.228.779/0001-00', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'82',  nome:'GUILHERME DE OLIVEIRA NICOLAIT ME',                                cnpj:'15.359.960/0001-10', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'84',  nome:'SILVEIRA & SARAIVA REPRESENTACAO COMERCIAL LTDA',                  cnpj:'30.646.826/0001-93', regime:'Lucro Presumido',  status:'Ativo',   tipo_operacao:'Comércio', complexidade:'Intermediário' },
  { id:'88',  nome:'SPS SERVIÇOS DE CONTABILIDADE E ESTAMPARIA LTDA',                  cnpj:'21.973.245/0001-75', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Intermediário' },
  { id:'89',  nome:'KF TUR TRANSPORTES LTDA',                                          cnpj:'06.256.034/0001-28', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Intermediário' },
  { id:'90',  nome:'ALVAREZ COSTA DA SILVEIRA - ALVASERV',                             cnpj:'22.075.504/0001-03', regime:'Simples Nacional', status:'Inativo', tipo_operacao:'Serviço', complexidade:'Simples', obs:'Não é mais cliente' },
  { id:'91',  nome:'Partido Democratico Trabalhista',                                   cnpj:'91.744.912/0001-23', regime:'Lucro Presumido',  status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Alta' },
  { id:'97',  nome:'NOBRE RESIDENCIAL TERAPEUTICO LTDA',                               cnpj:'41.266.568/0001-36', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Intermediário' },
  { id:'98',  nome:'BONANZA FC',                                                        cnpj:'94.435.187/0001-08', regime:'Lucro Presumido',  status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Intermediário' },
  { id:'99',  nome:'RESIDENCIAL TERAPEUTICO LINEA LTDA',                               cnpj:'30.719.029/0001-99', regime:'Lucro Presumido',  status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Alta' },
  { id:'103', nome:'CLUBE DE MÃES COLMÉIA',                                            cnpj:'90.091.059/0001-25', regime:'Lucro Presumido',  status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'104', nome:'ANA DANIELA DA S. RODRIGUES',                                      cnpj:'17.205.225/0001-87', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'111', nome:'PATAS DO MUNDO VET ASSISTENCE LTDA',                               cnpj:'43.511.808/0002-27', regime:'Lucro Presumido',  status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Intermediário' },
  { id:'112', nome:'GERSON ROJAS DA SILVEIRA',                                         cnpj:'33.598.021/0001-00', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'113', nome:'GAUTEC TECNOLOGIA E SERVICOS LTDA',                                cnpj:'10.821.321/0001-00', regime:'Lucro Presumido',  status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Alta' },
  { id:'115', nome:'J.V. PAOLAZZI SALVI',                                              cnpj:'50.512.267/0001-36', regime:'Lucro Real',       status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Alta' },
  { id:'116', nome:'ANDREA GUEDES MENDES',                                             cnpj:'49.998.531/0001-04', regime:'Simples Nacional', status:'Inativo', tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'119', nome:'LEDIANE SCARIOT SALLA',                                            cnpj:'51.733.375/0001-00', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'120', nome:'VINICIUS ELSNER LANFREDI LTDA',                                    cnpj:'23.685.717/0001-10', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'121', nome:'CRISTIAN A MORALES YEPES LTDA',                                    cnpj:'52.658.733/0001-11', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'122', nome:'REIS E GONCALVES REPRESENTACOES LTDA',                             cnpj:'36.834.126/0001-09', regime:'Simples Nacional', status:'Inativo', tipo_operacao:'Comércio', complexidade:'Simples' },
  { id:'123', nome:'47.468.156 DAIANE PEREIRA DA SILVA',                               cnpj:'47.468.156/0001-65', regime:'MEI',             status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'124', nome:'RODRIGO DOS PASSOS',                                               cnpj:'45.081.410/0001-42', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'125', nome:'C. O. DA COSTA & D. C. RODRIGUES LTDA',                           cnpj:'50.714.685/0001-06', regime:'Simples Nacional', status:'Inativo', tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'126', nome:'R. P. CHIMENES',                                                   cnpj:'36.492.896/0001-10', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'127', nome:'RENATA DOS REIS DOS SANTOS LTDA',                                  cnpj:'55.881.669/0001-21', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'128', nome:'CENTRO DE TRADICOES GAUCHAS VAQUEANOS DA CULTURA',                 cnpj:'29.275.771/0001-73', regime:'Lucro Presumido',  status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Intermediário' },
  { id:'129', nome:'P. J. ROLIM BLUM LTDA',                                            cnpj:'50.163.065/0002-07', regime:'Lucro Presumido',  status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Intermediário' },
  { id:'130', nome:'V. GONCALVES DA SILVA LTDA',                                       cnpj:'56.659.939/0001-17', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'131', nome:'MARCOS ANTONIO DA ROSA DANTAS',                                    cnpj:'36.937.569/0001-25', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'132', nome:'TAIS DE ARAUJO PEREIRA',                                           cnpj:'31.266.357/0001-40', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'133', nome:'G. S. GOULART LTDA',                                               cnpj:'58.607.484/0001-11', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'134', nome:'RHISSAN KHALEK PACHECO',                                           cnpj:'57.850.064/0001-07', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'135', nome:'E. AMARAL DA SILVA LTDA',                                          cnpj:'56.970.630/0001-43', regime:'Lucro Presumido',  status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Intermediário' },
  { id:'136', nome:'ALVAREZ K. JUNIOR & CAMILA O. DA COSTA LTDA',                     cnpj:'58.652.716/0001-53', regime:'Lucro Presumido',  status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Intermediário' },
  { id:'137', nome:'DIEGO VIEIRA ALVES LTDA',                                          cnpj:'60.223.059/0001-70', regime:'Lucro Presumido',  status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Intermediário' },
  { id:'138', nome:'PAMELA PAOLA OLIVEIRA ALVES LTDA',                                 cnpj:'53.507.129/0001-57', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'139', nome:'A. DA LUZ BRILHANTE LTDA',                                        cnpj:'60.945.272/0001-96', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'140', nome:'CARLOS ALEXANDRE ALMEIDA SEVERO',                                  cnpj:'38.164.377/0001-59', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'141', nome:'GAUTEC TECNOLOGIA E SERVICOS LTDA (filial 02)',                    cnpj:'10.821.321/0002-91', regime:'Lucro Presumido',  status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Alta' },
  { id:'142', nome:'GAUTEC TECNOLOGIA E SERVICOS LTDA (filial 03)',                    cnpj:'10.821.321/0003-72', regime:'Lucro Presumido',  status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Alta' },
  { id:'143', nome:'PARTIDO SOCIAL DEMOCRATICO - VIAMAO - RS - MUNICIPAL',             cnpj:'23.974.235/0001-80', regime:'Lucro Presumido',  status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Intermediário' },
  { id:'144', nome:'FORTE GASTRONOMIA LTDA.',                                          cnpj:'58.468.980/0001-31', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Intermediário', obs:'Preciso do PDF dos Extratos.' },
  { id:'145', nome:'PRADO GASTRONOMIA LTDA.',                                          cnpj:'52.513.378/0001-92', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Intermediário' },
  { id:'146', nome:'IMOBILIARIA ROSPIDE LTDA ME',                                      cnpj:'92.490.804/0001-34', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'147', nome:'ROSPIDE SERVICOS E APOIO A EDIFICIOS LTDA',                        cnpj:'04.352.348/0001-07', regime:'Lucro Presumido',  status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Intermediário' },
  { id:'148', nome:'CONDOMINIO DO EDIFICIO SETEMBRINA SOLAR CENTER',                   cnpj:'45.201.315/0001-35', regime:'Lucro Presumido',  status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'149', nome:'CONDOMINIO QUERENCIA DAS AGUAS CLARAS',                            cnpj:'08.491.952/0001-67', regime:'Lucro Presumido',  status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'150', nome:'CONDOMINIO RESIDENCIAL SANTORINI',                                  cnpj:'30.043.959/0001-75', regime:'Lucro Presumido',  status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'151', nome:'ANA PAULA MORAES DE ANDRADE LTDA',                                 cnpj:'61.707.179/0001-06', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'152', nome:'CRISTIANE LUTTJOHANN LTDA',                                        cnpj:'62.038.213/0001-60', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'153', nome:'ROGER DA SILVA MARTINS',                                           cnpj:'62.137.845/0001-80', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'154', nome:'RESIDENCIAL TERAPEUTICO NOBRE LTDA',                               cnpj:'63.149.106/0001-71', regime:'Lucro Real',       status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Alta' },
  { id:'155', nome:'ANA PAULA PASCHOAL DA ROSA',                                       cnpj:'63.020.070/0001-21', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'156', nome:'63.102.868 PABLO FABIANO CHAVES DO NASCIMENTO',                   cnpj:'63.102.868/0001-12', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
  { id:'157', nome:'ANDREA CRISTIANE LOPES LTDA',                                      cnpj:'63.248.560/0001-80', regime:'Simples Nacional', status:'Ativo',   tipo_operacao:'Serviço', complexidade:'Simples' },
];

// ─── Merge: keeps existing client data, only adds missing clients ───
function seedClientes() {
  const existing = DB.get('clientes') || [];
  const existingIds = new Set(existing.map(c => c.id));
  let added = 0;

  CLIENTES_SEED.forEach(seed => {
    if (!existingIds.has(seed.id)) {
      existing.push({
        ...seed,
        cnae: '', erp: 'Domínio Único', responsavel: '', whatsapp: '', email: '',
        im: '', ie: '', fat_medio: '', qtd_socios: '', obs_diag: '',
        fiscal_integrado: false, folha_integrada: false, financeiro_integrado: false,
        tem_caixa: false, tem_estoque: false, tem_prolabore: true, tem_folha: false,
        bancos: [], banco_outro: '', parc_federal: false, parc_estadual: false,
        parc_pref: false, parc_pgfn: false, drive_url: '',
        d_sintegra:false, d_dime:false, d_simples:false, d_sped_f:false, d_sped_c:false,
        d_ecd:false, d_ecf:false, d_div_rfb:false, d_div_pgfn:false, d_div_pref:false,
        d_div_est:false, d_mei_eme:false, d_sn_geral:false,
        qtd_funcionarios: '', criado_em: new Date().toISOString(),
      });
      added++;
    }
  });

  if (added > 0) {
    DB.set('clientes', existing);
    console.log(`[Seed] ${added} clientes adicionados. Total: ${existing.length}`);
  }
  return added;
}

// ─── Auto-seed on first load ───
document.addEventListener('DOMContentLoaded', () => {
  // Wait for DB to initialize first (slight delay)
  setTimeout(() => {
    const clientes = DB.get('clientes') || [];
    if (clientes.length === 0) {
      seedClientes();
    }
    // Always seed DEFIS data (safe — won't overwrite existing)
    seedDefis();
  }, 200);
});

