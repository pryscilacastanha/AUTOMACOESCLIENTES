// ─── CLIENTES_SEED está definido em seed.js (fonte única de dados) ───

// ─── BANCOS FEBRABAN + BANRISUL ───
const BANCOS = [
  {cod:"001", nome:"Banco do Brasil"},
  {cod:"033", nome:"Santander"},
  {cod:"041", nome:"Banrisul"},
  {cod:"077", nome:"Banco Inter"},
  {cod:"104", nome:"Caixa Econômica Federal"},
  {cod:"208", nome:"BTG Pactual"},
  {cod:"237", nome:"Bradesco"},
  {cod:"260", nome:"Nubank"},
  {cod:"341", nome:"Itaú"},
  {cod:"380", nome:"PicPay"},
  {cod:"422", nome:"Safra"},
  {cod:"748", nome:"Sicredi"},
  {cod:"756", nome:"Sicoob / Bancoob"},
];

const CHECKLIST_TEMPLATE = [
  // ── 1. ATIVO ─────────────────────────────────────────────────────────────
  { cat:"🏦 1.1 ATIVO — CAIXA", icon:"🏦", items:[] },
  { cat:"🏦 1.2 ATIVO — BANCOS", icon:"🏦", items:[
    {key:"operadoras",    nome:"Extrato de Operadoras de Cartão (múltiplas)", regimes:["todos"], condicao:"mf_cc_multi",   obs:"Cielo, Stone, PagSeguro, etc. Consolidado"},
    {key:"antecipacao",   nome:"Relatório de Antecipação de Recebíveis",  regimes:["todos"], condicao:"mf_cc_antec",       obs:"⚠️ Essencial para conciliação BRUTO x LÍQUIDO"},
    {key:"cambio",        nome:"Extrato em Moeda Estrangeira + Conversão Câmbio", regimes:["todos"], condicao:"mf_oe_moeda", obs:"⚠️ Variação ativa obrigatória"}
  ]},
  { cat:"📈 1.3 ATIVO — RELATÓRIOS E CONTAS A RECEBER", icon:"📈", items:[
    {key:"cr",           nome:"Relatório de Contas a Receber",                      regimes:["todos"], condicao:null,       obs:"Clientes e vencimentos"},
    {key:"pix_estrut",   nome:"Relatório de Recebimentos via PIX Estruturado", regimes:["todos"], condicao:"mf_oe_pix",   obs:""},
    {key:"subvencao",    nome:"Comprovante de Subvenção / Incentivo Fiscal", regimes:["todos"], condicao:"mf_oe_subv",    obs:"Direitos a receber ou já realizados"},
  ]},
  { cat:"💰 1.4 ATIVO — APLICAÇÕES FINANCEIRAS", icon:"💰", items:[
    {key:"aplicacoes",    nome:"Extrato de Aplicações Financeiras (CDB/RDB/Conta Rem)", regimes:["todos"], condicao:"mf_ia_auto", obs:"Rendimentos e IRRF retido"},
    {key:"fundos",        nome:"Extrato de Fundos de Investimento",       regimes:["todos"], condicao:"mf_ia_fundo",       obs:"Valor de cota e rendimentos mensais"},
    {key:"tesouro",       nome:"Extrato Tesouro Direto",                  regimes:["todos"], condicao:"mf_ia_td",          obs:"Via B3/XP/Corretora"},
    {key:"outras_invest", nome:"Comprovante de Investimentos em Outras Empresas", regimes:["todos"], condicao:"mf_ia_outras", obs:"Participações societárias"},
    {key:"cripto",       nome:"Extrato de Criptoativos + Registro IN 1888", regimes:["todos"], condicao:"mf_oe_cripto",   obs:"Apesar de intangível, classificado aqui (Ativo Misto)"},
    {key:"consorte",     nome:"Extrato de Consórcio",                     regimes:["todos"], condicao:"mf_oe_cons",       obs:""},
  ]},
  { cat:"🏭 1.5 ATIVO — BENS E ESTOQUES", icon:"🏭", items:[
    {key:"estoque",      nome:"Inventário / Movimentação de Estoque",               regimes:["todos"], condicao:"tem_estoque", obs:"Entradas, saídas e saldo final"},
    {key:"imobilizado",  nome:"Imobilizado — Relação de Aquisições e Baixas 2025", regimes:["todos"], condicao:null,       obs:"Bens com nota fiscal e data de compra"},
    {key:"dep_rel",      nome:"Planilha de Depreciação (se controle próprio)",      regimes:["todos"], condicao:"ci_bens_depr", obs:""},
  ]},

  // ── 2. PASSIVO ───────────────────────────────────────────────────────────
  { cat:"📋 2. PASSIVO OPERACIONAL", icon:"📋", items:[
    // Fornecedores
    {key:"cp",           nome:"Relatório de Contas a Pagar (Fornecedores)",         regimes:["todos"], condicao:null,       obs:"Fornecedores e vencimentos"},

    // Empréstimos e financiamentos
    {key:"contratos_fin", nome:"Contratos de Empréstimos/Financiamentos", regimes:["todos"], condicao:"mf_ef_banc",        obs:"Tabela SAC/PRICE para apropriação de juros e principal"},
    {key:"boletos_fin",   nome:"Boletos de Financiamento Pagos",          regimes:["todos"], condicao:"mf_ef_finan",       obs:"Veículos, máquinas, imóveis"},
    {key:"emprestimos",  nome:"Empréstimos e Financiamentos — Saldo Devedor Anual", regimes:["todos"], condicao:null,       obs:""},
    {key:"cgiro",         nome:"Extrato de Capital de Giro",              regimes:["todos"], condicao:"mf_ef_capgiro",     obs:"(Passivo Bancário)"},
    {key:"reneg",         nome:"Acordo/Renegociação — Extrato Atualizado",regimes:["todos"], condicao:"mf_ef_reneg",       obs:"Parcelas ativas e saldo devedor"},

    // Obrigações Trabalhistas e Sócios
    {key:"folha",        nome:"Folha de Pagamento 2025 — Todos os meses",           regimes:["todos"], condicao:"tem_folha",    obs:""},
    {key:"prolabore",    nome:"Controle de Lucros Distribuídos (e Pró-Labore)",     regimes:["todos"], condicao:"tem_prolabore",obs:"Relatórios, comprovantes ou registros de distribuição"},
    {key:"inss_fgts",    nome:"INSS e FGTS — Guias e Comprovantes de Pagamento",   regimes:["todos"], condicao:"tem_folha",    obs:"GPS e GFIP/SEFIP 2025"},
    {key:"rescisoes",    nome:"Rescisões, Admissões e Afastamentos",                regimes:["todos"], condicao:"tem_folha",    obs:"Se houver movimentação em 2025"},
    {key:"rpa",          nome:"RPA — Recibo de Pagamento a Autônomo",               regimes:["todos"], condicao:"mf_tem_aut",  obs:"Todos os autônomos contratados"},
    {key:"estagio",      nome:"Contrato de Estágio + Comprovantes",                regimes:["todos"], condicao:"mf_tem_estag", obs:""},
    {key:"obrig_trab",   nome:"Obrigações Trabalhistas (eSocial) — Relatório",     regimes:["todos"], condicao:"tem_folha",    obs:"SST implementado conforme diagnóstico"},
  ]},

  // ── 3. BLOCO TRIBUTÁRIO ───────────────────────────────────────────────────
  { cat:"🏛️ 3. BLOCO TRIBUTÁRIO", icon:"🏛️", items:[
    // 3.1 Parcelamentos e Débitos Fiscais
    {key:"parc_rfb",     nome:"Parcelamento / Débitos — RFB",                       regimes:["todos"], condicao:"div_rfb",      obs:""},
    {key:"parc_pgfn",    nome:"Parcelamento / Débitos — PGFN",                      regimes:["todos"], condicao:"div_pgfn",     obs:""},
    {key:"parc_estado",  nome:"Parcelamento / Débitos — Estadual",                  regimes:["todos"], condicao:"div_estado",   obs:""},
    {key:"parc_pref",    nome:"Parcelamento / Débitos — Municipal",                 regimes:["todos"], condicao:"div_pref",     obs:""},

    // 3.2 Guias e Comprovações
    {key:"guias_pagas",  nome:"Guias Pagas (DAS, impostos diversos)",               regimes:["todos"], condicao:null,           obs:"Todos os meses de 2025"},
    {key:"comp_fiscais", nome:"Comprovantes de Pagamento Diversos",                 regimes:["todos"], condicao:null,           obs:""},
    {key:"apur_impostos",nome:"Relatórios de Apuração (quando aplicável)",          regimes:["todos"], condicao:null,           obs:"Resumo por mês"},
  ]},

  // ── 4. PATRIMÔNIO LÍQUIDO ────────────────────────────────────────────────────────
  { cat:"🏛️ 4. PATRIMÔNIO LÍQUIDO", icon:"🏛️", items:[
    {key:"alt_contratual",nome:"Alterações Contratuais (alteração de contrato social)", regimes:["todos"], condicao:null, obs:"Enviar se houver em 2025"},
    {key:"integ_capital", nome:"Integralização de Capital",                         regimes:["todos"], condicao:null,  obs:"Enviar se houver"},
    {key:"dist_lucros",   nome:"Distribuição de Lucros — Comprovante",              regimes:["Lucro Presumido","Lucro Real"], condicao:null, obs:""},
  ]},

  // ── 5. RECEITAS ──────────────────────────────────────────────────────────
  { cat:"💵 5. RECEITAS", icon:"💵", items:[
    {key:"nf_emitidas",  nome:"Notas Fiscais Emitidas — XMLs (NF-e e NFS-e)",       regimes:["todos"], condicao:null,  obs:"Arquivo XML de todas as NF emitidas em 2025"},
    {key:"xml_saida",    nome:"XMLs de NFe de Saída (SPED Fiscal)",                regimes:["todos"], condicao:"fiscal_integrado", obs:""},
    {key:"faturamento",  nome:"Relatório de Faturamento Anual 2025",                regimes:["todos"], condicao:null,  obs:"Por competência, separado por mês"},
    {key:"maquininha_rep",nome:"Relatório de Vendas — Maquininha",        regimes:["todos"], condicao:"mf_cc_maq",         obs:"Cielo, Stone, PagSeguro, Rede etc."},
    {key:"serv_sem_nf",  nome:"Relação de Serviços Prestados ou Receitas sem NF",   regimes:["todos"], condicao:null,  obs:"⚠️ Ponto crítico — declarar todos para evitar omissão de receita"},
  ]},

  // ── 6. DESPESAS E CUSTOS ──────────────────────────────────────────────────────────
  { cat:"💸 6. DESPESAS E CUSTOS", icon:"💸", items:[
    // Custos diretos / Entradas
    {key:"nf_entrada",   nome:"Notas Fiscais de Entrada — XMLs",                    regimes:["todos"], condicao:null,  obs:"NF-e recebidas de fornecedores"},
    {key:"xml_entrada",  nome:"XMLs de NFe de Entrada (SPED Fiscal)",              regimes:["todos"], condicao:"fiscal_integrado", obs:""},
    {key:"serv_tomados", nome:"Relação de Serviços Tomados sem NF",                regimes:["todos"], condicao:null,  obs:""},

    // Despesas operacionais
    {key:"desp_op",      nome:"Comprovantes de Despesas Operacionais",              regimes:["todos"], condicao:null,  obs:"Aluguéis, energia, internet, contas"},
    {key:"conta_pessoal",nome:"⚠️ ATENÇÃO: Comprovante de separação Conta PF x PJ",regimes:["todos"], condicao:"mf_sa_mistura", obs:"Conta pessoal misturada detectada — exigir separação formal"},

    // Despesas Financeiras
    {key:"fatura_cartao", nome:"Fatura(s) do Cartão de Crédito Corporativo", regimes:["todos"], condicao:"mf_cc_corp",    obs:"Contempla Juros/Anuidade (PJ), todas as faturas do ano"},
  ]},
];


// ─── CHECKLIST ONBOARDING C-006 ───
const C006_TEMPLATE = [
  { section:"Dados do Sócio", items:[
    {cod:"1001", nome:"Certificado Digital (PJ)", obs:"Obrigatório"},
    {cod:"1002", nome:"CNH e/ou Documento com Foto", obs:"Obrigatório"},
    {cod:"1003", nome:"Certidão de Casamento", obs:"Opcional"},
    {cod:"1006", nome:"Comprovante de Endereço", obs:"Opcional"},
    {cod:"—",    nome:"Acesso GOV do Sócio (usuário e senha)", obs:"Salvar em TXT seguro no servidor"},
    {cod:"—",    nome:"Acesso Portal da Prefeitura", obs:""},
  ]},
  { section:"IRPF via App GOV do Sócio", items:[
    {cod:"1201", nome:"IRPF 2024 (ano-base 2023) — Recibo", obs:""},
    {cod:"1202", nome:"IRPF 2024 (ano-base 2023) — Declaração", obs:""},
    {cod:"1203", nome:"IRPF 2024 (ano-base 2023) — Guia", obs:""},
    {cod:"1204", nome:"Relatório Gerencial de Conferência", obs:"Gerado pelo escritório — não solicitar ao cliente"},
  ]},
  { section:"Documentos do CNPJ (solicitar ao cliente)", items:[
    {cod:"1301", nome:"Contrato de MEI", obs:"Se MEI"},
    {cod:"1302", nome:"Contrato ME", obs:"Se ME"},
    {cod:"1303", nome:"Contrato LTDA", obs:"Se LTDA"},
    {cod:"1304", nome:"Alvará", obs:"Obrigatório"},
    {cod:"1305", nome:"Comunicado de Desenquadramento do MEI", obs:"Se houver"},
    {cod:"1310", nome:"Laudo PGR", obs:"Solicitar"},
    {cod:"1311", nome:"Comprovante de Inscrição de IPTU", obs:"Opcional — casos específicos"},
    {cod:"1313", nome:"FCN", obs:"Solicitar"},
    {cod:"1314", nome:"Viabilidade", obs:"Solicitar"},
    {cod:"1315", nome:"DBE", obs:"Solicitar"},
    {cod:"1317", nome:"SST — LTCAT", obs:"Solicitar"},
    {cod:"1318", nome:"SST — PMSO", obs:"Solicitar"},
    {cod:"1319", nome:"SST — Modelo OS", obs:"Opcional"},
    {cod:"1320", nome:"SST — Controle de EPI", obs:"Opcional"},
  ]},
  { section:"Documentos que o Escritório Consulta Online", items:[
    {cod:"1306", nome:"Inscrição Municipal", obs:"Via site da Prefeitura pelo CNPJ"},
    {cod:"1307", nome:"Situação Fiscal", obs:"Via e-CAC"},
    {cod:"1308", nome:"Comprovante de Opção de Regime", obs:"Via e-CAC"},
    {cod:"1309", nome:"Código de Acesso Simples Nacional", obs:"Solicitar ou gerar novo"},
    {cod:"1312", nome:"Inscrição Estadual", obs:"Via site do Governo pelo CNPJ"},
    {cod:"1316", nome:"Recibo DTE (Domicílio Eletrônico)", obs:"Via e-CAC"},
    {cod:"1321", nome:"QSA — Quadro dos Sócios", obs:"Via e-CAC"},
    {cod:"1322", nome:"Optante pelo Simples Nacional", obs:"Verificar"},
    {cod:"1398", nome:"Parecer", obs:"Elaborado pelo escritório"},
    {cod:"1399", nome:"Cartão CNPJ", obs:"Via site de consulta de CNPJ"},
  ]},

  { section:"Parametrizações do Sistema", items:[
    {cod:"3601", nome:"ÚNICO — Cadastrar Empresa", obs:""},
    {cod:"3602", nome:"ÚNICO — Cadastrar Sócios", obs:""},
    {cod:"3603", nome:"ÚNICO — Marcar Tecnologias Web", obs:""},
    {cod:"3604", nome:"TecWeb — Configurar Login e Senha", obs:""},
    {cod:"3605", nome:"TecWeb — Controle de Senha: Configurar Senha GOV", obs:""},
    {cod:"3606", nome:"TecWeb — Senhas recebidas do contador anterior", obs:""},
    {cod:"3612", nome:"e-CAC — Vincular Procuração (Cert. PJ)", obs:""},
    {cod:"3613", nome:"SAT/SEFAZ — Vincular Procuração", obs:""},
    {cod:"3614", nome:"ÚNICO — Configurar Certificado Procuração", obs:""},
    {cod:"3615", nome:"PUSH — Configuração do ISS Legal", obs:""},
  ]},
];
