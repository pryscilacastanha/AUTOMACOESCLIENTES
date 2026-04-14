// ============================================
// SISTEMA DE GESTÃO FINANCEIRA
// Pryscila Castanha — PF / PJ
// Reestruturado: 13/04/2026
// ============================================

// ============================================
// MULTI-CLIENTE
// ============================================
let CLIENTES = [
    {
        id: 'pryscila-pf',
        nome: 'Pryscila Castanha',
        tipo: 'PF',
        cpf: '836.824.490-00',
        cnpj: null,
        whatsapp: '(51) 98527-7713',
        email: 'ypcastanha@gmail.com',
        data_inicio: '2026-04-13',
        ativo: true,
        etapa_atual: 1,
        etapas: [
            { num: 1, nome: 'Levantamento de Contas a Pagar', status: 'em_andamento', icon: '📋' },
            { num: 2, nome: 'Priorização e Plano de Ação', status: 'pendente', icon: '🎯' },
            { num: 3, nome: 'Negociação e Cancelamentos', status: 'pendente', icon: '🤝' },
            { num: 4, nome: 'Controle de Fluxo de Caixa', status: 'pendente', icon: '💰' },
            { num: 5, nome: 'Redução de Despesas', status: 'pendente', icon: '✂️' },
            { num: 6, nome: 'Reorganização Patrimonial', status: 'pendente', icon: '🚀' },
        ]
    },
    {
        id: 'yp-castanha-pj',
        nome: 'Y.P. Castanha',
        tipo: 'PJ',
        cpf: null,
        cnpj: '54.738.799/0001-47',
        whatsapp: '(51) 98527-7713',
        email: 'ypcastanha@gmail.com',
        data_inicio: '2026-04-13',
        ativo: true,
        etapa_atual: 1,
        etapas: [
            { num: 1, nome: 'Levantamento de Contas a Pagar', status: 'em_andamento', icon: '📋' },
            { num: 2, nome: 'Priorização e Plano de Ação', status: 'pendente', icon: '🎯' },
            { num: 3, nome: 'Negociação e Cancelamentos', status: 'pendente', icon: '🤝' },
            { num: 4, nome: 'Controle de Fluxo de Caixa', status: 'pendente', icon: '💰' },
            { num: 5, nome: 'Redução de Despesas', status: 'pendente', icon: '✂️' },
            { num: 6, nome: 'Reorganização Patrimonial', status: 'pendente', icon: '🚀' },
        ]
    }
];

let clienteAtualId = 'pryscila-pf';

function getClienteAtual() { return CLIENTES.find(c => c.id === clienteAtualId) || CLIENTES[0]; }
function salvarClientes() { try { localStorage.setItem('fin_clientes', JSON.stringify(CLIENTES)); localStorage.setItem('fin_cliente_atual', clienteAtualId); } catch(e){} }
function carregarClientes() {
    try {
        const saved = localStorage.getItem('fin_clientes');
        if (saved) CLIENTES = JSON.parse(saved);
        const savedId = localStorage.getItem('fin_cliente_atual');
        if (savedId) clienteAtualId = savedId;
    } catch(e) { console.warn('Erro ao carregar clientes:', e); }
}
carregarClientes();

const CLIENTE = getClienteAtual();
const PERFIL = CLIENTE;

// ============================================
// RECEITAS IDENTIFICADAS (Contas a Receber)
// ============================================
const RECEITAS = {
    pf: [
        { id:1, fonte: "Y.P.M. Castanha (PJ própria)", media: 4500, tipo: "pro_labore", recorrente: true, status: 'ativo', icon:'🏢' },
        { id:2, fonte: "Quality Representações", media: 3500, tipo: "honorarios", recorrente: false, nota: "Variável", status: 'ativo', icon:'📊' },
        { id:3, fonte: "Mikhail Munhoz Brahim", media: 1500, tipo: "cliente", recorrente: true, status: 'ativo', icon:'👤' },
        { id:4, fonte: "Juliany Desirre (clientes)", media: 1200, tipo: "cliente", recorrente: false, status: 'ativo', icon:'👩' },
        { id:5, fonte: "Chirlei M Alcântara", media: 350, tipo: "cliente", recorrente: true, status: 'ativo', icon:'👤' },
        { id:6, fonte: "Auxiliadora Predial", media: 560, tipo: "comissao", recorrente: true, status: 'ativo', icon:'🏠' },
        { id:7, fonte: "Outros clientes", media: 800, tipo: "variavel", recorrente: false, status: 'ativo', icon:'💼' },
    ],
    pj: [
        { id:20, fonte: "Honorários contábeis", media: 8000, tipo: "servicos", recorrente: true, status: 'ativo', icon:'📋' },
        { id:21, fonte: "Mentorias", media: 2000, tipo: "servicos", recorrente: false, status: 'ativo', icon:'🎓' },
    ]
};

// ============================================
// CONTAS A PAGAR — Reestruturado
// Campos: Fornecedor, Despesa, Total Dívida, Status, Parcelas
// ============================================
let CONTAS_PAGAR = [
    // === DÍVIDAS ATIVAS ===
    { id:1, fornecedor:'Carrefour (Banco CSF)', despesa:'Cartão de crédito - acordo', total_divida:20020.95, saldo_atual:10383.39, parcela_valor:384.57, parcelas_total:30, parcelas_pagas:2, status:'em_dia', vencimento:22, forma_pgto:'boleto', pf_pj:'pf', prioridade:'critica', icon:'🏪', acao:'manter',
        nota:'Acordo nº 20371716 — Desconto 42,37%. NÃO ATRASAR.',
        como_executar:'Pagar R$384,57 até dia 22/mês. Perder acordo = volta ao valor original R$20k.' },
    { id:2, fornecedor:'Santander', despesa:'Dívida bancária - levantar', total_divida:80000, saldo_atual:80000, parcela_valor:null, parcelas_total:null, parcelas_pagas:null, status:'pendente', vencimento:null, forma_pgto:'a definir', pf_pj:'pf', prioridade:'critica', icon:'🏦', acao:'levantar',
        nota:'Maior dívida PF. Valor pode estar com juros correndo.',
        como_executar:'1) Acessar app/site Santander ou ligar 4004-3535. 2) Solicitar extrato completo. 3) Pedir proposta com 50-60% de desconto.' },
    { id:3, fornecedor:'Pellon Cobrança (Gráfica)', despesa:'Débito fiscal - acordo PGFN', total_divida:18001.84, saldo_atual:8073.88, parcela_valor:null, parcelas_total:null, parcelas_pagas:null, status:'negociando', vencimento:null, forma_pgto:'pix/boleto', pf_pj:'pj', prioridade:'alta', icon:'📄', acao:'negociar',
        nota:'Contato: Thalita Castro — thalita.castro@pelloncob.com.br',
        como_executar:'Negociar desconto à vista ou parcelamento sem juros. PGFN Inscrições: 91.4.23.069414-15 + 91.5.25.002868-40.' },
    { id:4, fornecedor:'Advogada Simone', despesa:'Honorários advocatícios', total_divida:15000, saldo_atual:15000, parcela_valor:3000, parcelas_total:6, parcelas_pagas:0, status:'pendente', vencimento:null, forma_pgto:'a definir', pf_pj:'pf', prioridade:'media', icon:'⚖️', acao:'negociar',
        nota:'Vincular ao resultado da pensão.',
        como_executar:'Revisar serviços x resultados. Se negligência, usar como argumento. Propor pagamento vinculado à pensão.' },
    { id:5, fornecedor:'Advogadas Marta/Daniela', despesa:'Honorários advocatícios atuais', total_divida:15000, saldo_atual:15000, parcela_valor:null, parcelas_total:null, parcelas_pagas:null, status:'em_aberto', vencimento:null, forma_pgto:'a definir', pf_pj:'pf', prioridade:'alta', icon:'⚖️', acao:'negociar',
        nota:'Processo judicial em curso — essencial.',
        como_executar:'Propor parcelamento em 10x. Vincular parte ao resultado (êxito).' },
    { id:6, fornecedor:'Creche POA', despesa:'Mensalidades acumuladas', total_divida:37000, saldo_atual:37000, parcela_valor:null, parcelas_total:null, parcelas_pagas:null, status:'aguardando_pensao', vencimento:null, forma_pgto:'a definir', pf_pj:'pf', prioridade:'alta', icon:'🎒', acao:'negociar',
        nota:'50% responsabilidade do pai — CC Art. 1.694.',
        como_executar:'Incluir na ação de alimentos. Negociar desconto à vista quando pensão for definida.' },
    { id:7, fornecedor:'Creche SC', despesa:'Mensalidades acumuladas', total_divida:6000, saldo_atual:6000, parcela_valor:null, parcelas_total:null, parcelas_pagas:null, status:'aguardando_pensao', vencimento:null, forma_pgto:'a definir', pf_pj:'pf', prioridade:'media', icon:'🎒', acao:'negociar',
        nota:'50% responsabilidade do pai.',
        como_executar:'Negociar desconto. Incluir como despesa extraordinária na ação de alimentos.' },
    { id:8, fornecedor:'Juliany', despesa:'Empréstimo pessoal', total_divida:10000, saldo_atual:10000, parcela_valor:null, parcelas_total:null, parcelas_pagas:null, status:'aguardando_pensao', vencimento:null, forma_pgto:'pix', pf_pj:'pf', prioridade:'media', icon:'👩', acao:'negociar',
        nota:'Relação pessoal/familiar.',
        como_executar:'Propor R$500/mês a partir do recebimento da pensão. Formalizar acordo por escrito.' },
    { id:9, fornecedor:'Heitor', despesa:'Empréstimo pessoal', total_divida:8000, saldo_atual:8000, parcela_valor:null, parcelas_total:null, parcelas_pagas:null, status:'aguardando_pensao', vencimento:null, forma_pgto:'pix', pf_pj:'pf', prioridade:'media', icon:'👤', acao:'negociar',
        nota:'Relação pessoal/familiar.',
        como_executar:'Propor R$400/mês quando pensão for definida.' },
    { id:10, fornecedor:'Mãe (cartão)', despesa:'Empréstimo familiar', total_divida:5000, saldo_atual:5000, parcela_valor:null, parcelas_total:null, parcelas_pagas:null, status:'em_aberto', vencimento:null, forma_pgto:'pix', pf_pj:'pf', prioridade:'media', icon:'👩‍👧', acao:'negociar',
        nota:'Família — prioridade emocional.',
        como_executar:'Propor R$300-500/mês quando fluxo permitir.' },
    { id:11, fornecedor:'Pai', despesa:'Empréstimo - passagem Band', total_divida:1500, saldo_atual:1500, parcela_valor:null, parcelas_total:null, parcelas_pagas:null, status:'em_aberto', vencimento:null, forma_pgto:'pix', pf_pj:'pf', prioridade:'baixa', icon:'👨', acao:'negociar',
        nota:'Valor baixo, relação familiar.',
        como_executar:'Pagar em 3x ou quando possível.' },
    { id:12, fornecedor:'Mano', despesa:'Empréstimo familiar', total_divida:1200, saldo_atual:1200, parcela_valor:null, parcelas_total:null, parcelas_pagas:null, status:'aguardando_pensao', vencimento:null, forma_pgto:'pix', pf_pj:'pf', prioridade:'baixa', icon:'👦', acao:'negociar',
        nota:'Valor baixo, relação familiar.',
        como_executar:'Combinar pagamento quando pensão for recebida.' },
    { id:13, fornecedor:'Psicóloga Fernanda', despesa:'Consulta psicológica', total_divida:200, saldo_atual:200, parcela_valor:null, parcelas_total:null, parcelas_pagas:null, status:'em_aberto', vencimento:null, forma_pgto:'pix', pf_pj:'pf', prioridade:'baixa', icon:'🧠', acao:'manter',
        nota:'Valor baixo. Saúde mental é investimento.',
        como_executar:'Pagar à vista via PIX.' },
    { id:14, fornecedor:'CEEE Energia Elétrica', despesa:'Faturas em atraso (3x)', total_divida:818.14, saldo_atual:818.14, parcela_valor:null, parcelas_total:3, parcelas_pagas:0, status:'atrasado', vencimento:null, forma_pgto:'boleto/cartão/pix', pf_pj:'pf', prioridade:'critica', icon:'💡', acao:'manter',
        nota:'RISCO DE CORTE. 3 faturas: 03/2026 R$341,34 + 02/2026 R$325,82 + 01/2026 R$150,98.',
        como_executar:'Acessar ceee.equatorialenergia.com.br/sua-conta/emitir-faturas. Pagar pelo menos as 2 atrasadas.' },
    { id:15, fornecedor:'Micheli Castro', despesa:'Dívida pessoal - última parcela', total_divida:450, saldo_atual:450, parcela_valor:450, parcelas_total:1, parcelas_pagas:0, status:'em_dia', vencimento:10, forma_pgto:'pix', pf_pj:'pf', prioridade:'alta', icon:'👩', acao:'manter',
        nota:'ÚLTIMA PARCELA. Quitar para eliminar compromisso.',
        como_executar:'Pagar R$450 até 10/05/2026. Solicitar comprovante de quitação total.' },
    { id:16, fornecedor:'IIHD (Instituto Intern. Desenv. Humano)', despesa:'Curso - parcelamento', total_divida:7500, saldo_atual:6000, parcela_valor:500, parcelas_total:15, parcelas_pagas:3, status:'em_dia', vencimento:null, forma_pgto:'pix', pf_pj:'pf', prioridade:'media', icon:'📚', acao:'negociar',
        nota:'Já pagos R$1.500 (3x R$500). Saldo: R$6.000.',
        como_executar:'Solicitar planilha com juros justos. Manter R$500/mês.' },
    // === EMPRESARIAIS ===
    { id:17, fornecedor:'Help Soluções', despesa:'Dívida judicial - CNPJ baixado', total_divida:500000, saldo_atual:250000, parcela_valor:null, parcelas_total:null, parcelas_pagas:null, status:'judicial', vencimento:null, forma_pgto:'a definir', pf_pj:'pj', prioridade:'critica', icon:'⚖️', acao:'levantar',
        nota:'Procuradoria. Responsabilidade pode ser dividida no divórcio.',
        como_executar:'NÃO negociar sozinha. Aguardar resultado do divórcio.' },
    { id:18, fornecedor:'PGFN', despesa:'Parcelamento fiscal (Gráfica)', total_divida:9691.92, saldo_atual:14240, parcela_valor:500, parcelas_total:null, parcelas_pagas:7, status:'em_dia', vencimento:null, forma_pgto:'DARF', pf_pj:'pj', prioridade:'critica', icon:'🏛️', acao:'manter',
        nota:'Perder parcelamento = volta para dívida ativa com juros + multa.',
        como_executar:'Pagar R$500/mês pontualmente via DARF.' },
    { id:19, fornecedor:'SCI', despesa:'Dívida a verificar', total_divida:3000, saldo_atual:3000, parcela_valor:null, parcelas_total:null, parcelas_pagas:null, status:'pendente', vencimento:null, forma_pgto:'a definir', pf_pj:'pj', prioridade:'baixa', icon:'📄', acao:'levantar',
        nota:'Precisa levantamento.',
        como_executar:'Entrar em contato com SCI. Solicitar extrato de débito.' },
    { id:20, fornecedor:'Quality Representações', despesa:'Verificar CPF - possível violência patrimonial', total_divida:0, saldo_atual:0, parcela_valor:null, parcelas_total:null, parcelas_pagas:null, status:'verificar', vencimento:null, forma_pgto:'', pf_pj:'pj', prioridade:'media', icon:'⚠️', acao:'levantar',
        nota:'Possível violência patrimonial. Checar Serasa e SPC.',
        como_executar:'Consultar serasa.com.br. Se houver dívida sem autorização = Lei Maria da Penha, Art. 7°, IV.' },
    // === DESPESAS FIXAS (mensal) ===
    { id:30, fornecedor:'Imobiliária (Aluguel)', despesa:'Aluguel residencial', total_divida:null, saldo_atual:null, parcela_valor:3790, parcelas_total:null, parcelas_pagas:null, status:'em_dia', vencimento:5, forma_pgto:'boleto', pf_pj:'pf', prioridade:'baixa', icon:'🏠', acao:'manter', nota:'Contrato anual.' },
    { id:31, fornecedor:'Escola Sinergia', despesa:'Mensalidade escolar', total_divida:null, saldo_atual:null, parcela_valor:1190, parcelas_total:null, parcelas_pagas:null, status:'em_dia', vencimento:5, forma_pgto:'boleto', pf_pj:'pf', prioridade:'baixa', icon:'🎓', acao:'manter', nota:'Educação dos filhos.' },
    { id:32, fornecedor:'Intelig Telecomunicações', despesa:'Telefone/Internet', total_divida:null, saldo_atual:null, parcela_valor:62, parcelas_total:null, parcelas_pagas:null, status:'em_dia', vencimento:7, forma_pgto:'boleto/DDA', pf_pj:'pf', prioridade:'baixa', icon:'📡', acao:'manter', nota:'' },
    { id:33, fornecedor:'CEEE Energia', despesa:'Conta de luz (mensal)', total_divida:null, saldo_atual:null, parcela_valor:170, parcelas_total:null, parcelas_pagas:null, status:'em_dia', vencimento:6, forma_pgto:'boleto', pf_pj:'pf', prioridade:'baixa', icon:'💡', acao:'manter', nota:'Média mensal.' },
    { id:34, fornecedor:'Netflix', despesa:'Streaming', total_divida:null, saldo_atual:null, parcela_valor:59.90, parcelas_total:null, parcelas_pagas:null, status:'em_dia', vencimento:24, forma_pgto:'cartão', pf_pj:'pf', prioridade:'baixa', icon:'🎬', acao:'negociar', nota:'Avaliar downgrade.' },
    { id:35, fornecedor:'Apple (iCloud/Apps)', despesa:'Assinatura digital', total_divida:null, saldo_atual:null, parcela_valor:58, parcelas_total:null, parcelas_pagas:null, status:'em_dia', vencimento:14, forma_pgto:'cartão', pf_pj:'pf', prioridade:'baixa', icon:'🍎', acao:'negociar', nota:'Avaliar redução de plano.' },
    { id:36, fornecedor:'Canva Pro', despesa:'Ferramenta profissional', total_divida:null, saldo_atual:null, parcela_valor:81, parcelas_total:null, parcelas_pagas:null, status:'em_dia', vencimento:15, forma_pgto:'cartão', pf_pj:'pj', prioridade:'baixa', icon:'🎨', acao:'manter', nota:'' },
    { id:37, fornecedor:'Google Cloud', despesa:'Infraestrutura digital', total_divida:null, saldo_atual:null, parcela_valor:30, parcelas_total:null, parcelas_pagas:null, status:'em_dia', vencimento:3, forma_pgto:'cartão', pf_pj:'pj', prioridade:'baixa', icon:'☁️', acao:'manter', nota:'' },
    { id:38, fornecedor:'Via Cloud Servidores', despesa:'Servidor dedicado', total_divida:null, saldo_atual:null, parcela_valor:357.21, parcelas_total:null, parcelas_pagas:null, status:'em_dia', vencimento:27, forma_pgto:'boleto', pf_pj:'pj', prioridade:'baixa', icon:'🖥️', acao:'manter', nota:'' },
    { id:39, fornecedor:'Sem Parar', despesa:'Pedágio/estacionamento', total_divida:null, saldo_atual:null, parcela_valor:80, parcelas_total:null, parcelas_pagas:null, status:'em_dia', vencimento:1, forma_pgto:'débito', pf_pj:'pf', prioridade:'baixa', icon:'🛣️', acao:'manter', nota:'' },
    { id:40, fornecedor:'Sindicato Contadores RS', despesa:'Anuidade profissional', total_divida:null, saldo_atual:null, parcela_valor:570, parcelas_total:null, parcelas_pagas:null, status:'em_dia', vencimento:6, forma_pgto:'boleto', pf_pj:'pj', prioridade:'baixa', icon:'🏛️', acao:'manter', nota:'' },
    { id:41, fornecedor:'Face a Face Treinamento', despesa:'Desenvolvimento pessoal', total_divida:null, saldo_atual:null, parcela_valor:360, parcelas_total:null, parcelas_pagas:null, status:'avaliar', vencimento:15, forma_pgto:'boleto', pf_pj:'pf', prioridade:'alta', icon:'🧠', acao:'cancelar',
        nota:'Avaliar necessidade. Momento de corte.',
        como_executar:'Verificar contrato e multa rescisória. Se sem multa, cancelar imediato.' },
    { id:42, fornecedor:'Instituto Desenv. Humano', despesa:'Desenvolvimento pessoal', total_divida:null, saldo_atual:null, parcela_valor:340, parcelas_total:null, parcelas_pagas:null, status:'avaliar', vencimento:12, forma_pgto:'boleto', pf_pj:'pf', prioridade:'alta', icon:'📚', acao:'cancelar',
        nota:'Mesmo raciocínio do Face a Face.',
        como_executar:'Solicitar cancelamento formal por escrito.' },
];

// ============================================
// DESPESAS POR CLASSIFICAÇÃO (para análise)
// ============================================
const DESPESAS = {
    fixas_essenciais: [
        { id: 1, nome: "Aluguel", valor: 3790, vencDia: 5, tipo: "moradia", pf_pj: "pf", status: "ativo", icon: "🏠", forma_pgto: "boleto" },
        { id: 2, nome: "Escola Sinergia", valor: 1190, vencDia: 5, tipo: "educacao_filhos", pf_pj: "pf", status: "ativo", icon: "🎓", forma_pgto: "boleto" },
        { id: 3, nome: "Mercado / Alimentação", valor: 1763, vencDia: null, tipo: "alimentacao", pf_pj: "pf", status: "ativo", icon: "🛒", nota: "Média mensal dos extratos", forma_pgto: "débito/pix" },
        { id: 4, nome: "Combustível", valor: 1005, vencDia: null, tipo: "transporte", pf_pj: "pf", status: "ativo", icon: "⛽", nota: "Média mensal", forma_pgto: "débito/crédito" },
        { id: 5, nome: "Intelig Telecomunicações", valor: 62, vencDia: 7, tipo: "comunicacao", pf_pj: "pf", status: "ativo", icon: "📡", forma_pgto: "boleto/DDA" },
        { id: 6, nome: "Saúde (Digestiv + consultas)", valor: 300, vencDia: 13, tipo: "saude", pf_pj: "pf", status: "ativo", icon: "🏥", forma_pgto: "pix" },
        { id: 7, nome: "Farmácia", valor: 313, vencDia: null, tipo: "saude", pf_pj: "pf", status: "ativo", icon: "💊", nota: "Média mensal", forma_pgto: "débito/crédito" },
        { id: 8, nome: "CEEE Energia Elétrica", valor: 170, vencDia: 6, tipo: "moradia", pf_pj: "pf", status: "ativo", icon: "💡", nota: "Média mensal", forma_pgto: "boleto" },
    ],
    fixas_nao_essenciais: [
        { id: 20, nome: "Netflix", valor: 59.90, vencDia: 24, tipo: "assinatura", pf_pj: "pf", status: "ativo", icon: "🎬" },
        { id: 21, nome: "Apple (iCloud/Apps)", valor: 58, vencDia: 14, tipo: "assinatura", pf_pj: "pf", status: "ativo", icon: "🍎" },
        { id: 22, nome: "Canva Pro", valor: 81, vencDia: 15, tipo: "assinatura", pf_pj: "pj", status: "ativo", icon: "🎨" },
        { id: 23, nome: "Google Cloud", valor: 30, vencDia: 3, tipo: "assinatura", pf_pj: "pj", status: "ativo", icon: "☁️" },
        { id: 24, nome: "Via Cloud Servidores", valor: 357.21, vencDia: 27, tipo: "assinatura", pf_pj: "pj", status: "ativo", icon: "🖥️" },
        { id: 25, nome: "Sem Parar", valor: 80, vencDia: 1, tipo: "transporte", pf_pj: "pf", status: "ativo", icon: "🛣️" },
        { id: 26, nome: "Lavanderia", valor: 126, vencDia: null, tipo: "servico", pf_pj: "pf", status: "ativo", icon: "👕" },
        { id: 27, nome: "Face a Face Treinamento", valor: 360, vencDia: 15, tipo: "desenvolvimento", pf_pj: "pf", status: "avaliar", icon: "🧠", nota: "Avaliar necessidade" },
        { id: 28, nome: "Instituto Desenv. Humano", valor: 340, vencDia: 12, tipo: "desenvolvimento", pf_pj: "pf", status: "avaliar", icon: "📚", nota: "Avaliar necessidade" },
    ],
    variaveis: [
        { id: 40, nome: "iFood / Delivery", valor: 312, tipo: "alimentacao_fora", pf_pj: "pf", icon: "🍕", nota: "Média mensal" },
        { id: 41, nome: "Alimentação fora", valor: 381, tipo: "alimentacao_fora", pf_pj: "pf", icon: "🍽️", nota: "Restaurantes, pastelarias, etc." },
        { id: 42, nome: "Uber / Transporte app", valor: 222, tipo: "transporte", pf_pj: "pf", icon: "🚗", nota: "Média mensal" },
        { id: 43, nome: "Estacionamento", valor: 60, tipo: "transporte", pf_pj: "pf", icon: "🅿️" },
        { id: 44, nome: "Pedágio", valor: 229, tipo: "transporte", pf_pj: "pf", icon: "🛣️" },
        { id: 45, nome: "Roupas / Compras pessoais", valor: 568, tipo: "compras", pf_pj: "pf", icon: "👗", nota: "Média mensal" },
        { id: 46, nome: "Lazer (crianças + pessoal)", valor: 64, tipo: "lazer", pf_pj: "pf", icon: "🎮" },
    ],
    profissionais_pj: [
        { id: 60, nome: "Sindicato Contadores RS", valor: 570, vencDia: 6, tipo: "profissional", pf_pj: "pj", status: "ativo", icon: "🏛️" },
    ]
};

// ============================================
// DÍVIDAS — mantido para compatibilidade com QUitados
// ============================================
const DIVIDAS = {
    pessoais: CONTAS_PAGAR.filter(c => c.pf_pj === 'pf' && c.saldo_atual > 0),
    empresariais: CONTAS_PAGAR.filter(c => c.pf_pj === 'pj' && c.saldo_atual > 0),
    quitadas: [
        { id: 301, credor: "Advogada Cyntia", icon: "✅" },
        { id: 302, credor: "Belen (Fabiola)", icon: "✅" },
        { id: 303, credor: "Odain Contabilidade", icon: "✅" },
        { id: 304, credor: "Sicredi (Quality Suporte)", icon: "✅", nota: "Mikhail assumiu a dívida" },
    ]
};

// ============================================
// PATRIMÔNIO
// ============================================
const PATRIMONIO = {
    ativos: [
        { nome: "Saldo em conta (estimado)", valor: 0, tipo: "liquidez", icon: "💰", nota: "Verificar saldo atual" },
    ],
    passivos_pessoais: function() {
        return CONTAS_PAGAR.filter(c => c.pf_pj === 'pf' && c.saldo_atual > 0).reduce((s,d) => s + (d.saldo_atual || 0), 0);
    },
    passivos_empresariais: function() {
        return CONTAS_PAGAR.filter(c => c.pf_pj === 'pj' && c.saldo_atual > 0).reduce((s,d) => s + (d.saldo_atual || 0), 0);
    },
    patrimonio_liquido: function() {
        const ativos = this.ativos.reduce((s,a) => s + (a.valor||0), 0);
        return ativos - this.passivos_pessoais() - this.passivos_empresariais();
    }
};

// ============================================
// PLANEJAMENTO
// ============================================
const PLANEJAMENTO = {
    curto_prazo: [
        { meta: "Congelar cartão de crédito / parar PIX no crédito", status: "pendente", prazo: "Imediato" },
        { meta: "Levantar valor real Santander", status: "pendente", prazo: "Esta semana" },
        { meta: "Pagar parcela 3 Carrefour (dia 22/04)", status: "urgente", prazo: "22/04/2026" },
        { meta: "Reduzir iFood para 2x/semana", status: "pendente", prazo: "Este mês" },
        { meta: "Manter acordo Carrefour em dia", status: "ativo", prazo: "Mensal" },
    ],
    medio_prazo: [
        { meta: "Quitar dívidas familiares (Mãe, Pai, Mano)", status: "planejado", prazo: "6 meses" },
        { meta: "Criar reserva de emergência (3 meses)", status: "planejado", prazo: "12 meses" },
        { meta: "Reajustar honorários contábeis", status: "planejado", prazo: "3 meses" },
    ],
    longo_prazo: [
        { meta: "Quitar Carrefour (Jul/2028)", status: "em_andamento", prazo: "27 meses" },
        { meta: "Resolver dívida Help judicialmente (divórcio)", status: "judicial", prazo: "Indefinido" },
        { meta: "Independência financeira", status: "planejado", prazo: "5 anos" },
    ]
};

// ============================================
// DEPENDENTES — CONTROLE DE CUSTO EFETIVO
// Base legal: CC Art. 1.694 a 1.710, Lei 13.058/2014
// ============================================
const DEPENDENTES = {
    filhos: [
        { id: 1, nome: "Filho(a) 1", idade: null, guarda: "compartilhada", nota: "Informar nome e idade" },
        { id: 2, nome: "Filho(a) 2", idade: null, guarda: "compartilhada", nota: "Informar nome e idade" },
    ],
    custos: [
        { id: 1, categoria: "educacao", descricao: "Escola Sinergia (mensalidade)", valor: 1190, dependente_id: "todos", divisao: 50, fundamento: "CC Art. 1.694 — Educação é necessidade básica", icon: "🎓" },
        { id: 2, categoria: "educacao", descricao: "Material escolar", valor: 0, dependente_id: "todos", divisao: 50, fundamento: "CC Art. 1.694", icon: "📚", nota: "Informar valor médio mensal" },
        { id: 3, categoria: "educacao", descricao: "Creche POA (dívida acumulada)", valor: 37000, dependente_id: "todos", divisao: 50, fundamento: "CC Art. 1.694 — Responsabilidade solidária dos genitores", icon: "🎒", tipo: "divida" },
        { id: 4, categoria: "educacao", descricao: "Creche SC (dívida acumulada)", valor: 6000, dependente_id: "todos", divisao: 50, fundamento: "CC Art. 1.694", icon: "🎒", tipo: "divida" },
        { id: 10, categoria: "saude", descricao: "Plano de saúde / consultas", valor: 300, dependente_id: "todos", divisao: 50, fundamento: "CC Art. 1.694 — Saúde é necessidade básica", icon: "🏥", nota: "Confirmar se inclui dependentes" },
        { id: 11, categoria: "saude", descricao: "Farmácia (crianças)", valor: 150, dependente_id: "todos", divisao: 50, fundamento: "CC Art. 1.694", icon: "💊", nota: "Estimar proporção infantil" },
        { id: 12, categoria: "saude", descricao: "Psicóloga (crianças)", valor: 200, dependente_id: "todos", divisao: 50, fundamento: "CC Art. 1.694 — Saúde mental é saúde", icon: "🧠", nota: "Confirmar se é das crianças" },
        { id: 20, categoria: "alimentacao", descricao: "Alimentação (proporção filhos ~40%)", valor: 705, dependente_id: "todos", divisao: 50, fundamento: "CC Art. 1.694 — Alimentação in natura", icon: "🍽️", nota: "40% de R$1.763 (mercado)" },
        { id: 30, categoria: "moradia", descricao: "Aluguel (proporção filhos ~40%)", valor: 1516, dependente_id: "todos", divisao: 50, fundamento: "CC Art. 1.694 — Habitação é necessidade básica", icon: "🏠", nota: "40% de R$3.790" },
        { id: 31, categoria: "moradia", descricao: "Energia elétrica (proporção filhos ~40%)", valor: 0, dependente_id: "todos", divisao: 50, fundamento: "CC Art. 1.694", icon: "💡", nota: "⚠️ INFORMAR: valor médio da conta de luz" },
        { id: 32, categoria: "moradia", descricao: "Água (proporção filhos ~40%)", valor: 0, dependente_id: "todos", divisao: 50, fundamento: "CC Art. 1.694", icon: "💧", nota: "⚠️ INFORMAR: valor médio" },
        { id: 33, categoria: "moradia", descricao: "Gás (proporção filhos ~40%)", valor: 0, dependente_id: "todos", divisao: 50, fundamento: "CC Art. 1.694", icon: "🔥", nota: "⚠️ INFORMAR: valor médio" },
        { id: 34, categoria: "moradia", descricao: "Internet (proporção filhos ~40%)", valor: 0, dependente_id: "todos", divisao: 50, fundamento: "CC Art. 1.694", icon: "🌐", nota: "⚠️ INFORMAR: valor" },
        { id: 35, categoria: "moradia", descricao: "Telefone (proporção filhos)", valor: 0, dependente_id: "todos", divisao: 50, fundamento: "CC Art. 1.694", icon: "📱", nota: "⚠️ INFORMAR: valor" },
        { id: 36, categoria: "moradia", descricao: "Condomínio (se houver)", valor: 0, dependente_id: "todos", divisao: 50, fundamento: "CC Art. 1.694", icon: "🏢", nota: "⚠️ INFORMAR" },
        { id: 37, categoria: "moradia", descricao: "IPTU (proporção filhos)", valor: 0, dependente_id: "todos", divisao: 50, fundamento: "CC Art. 1.694", icon: "📋", nota: "⚠️ INFORMAR" },
        { id: 40, categoria: "vestuario", descricao: "Roupas / calçados crianças", valor: 200, dependente_id: "todos", divisao: 50, fundamento: "CC Art. 1.694 — Vestuário", icon: "👕", nota: "Estimar valor mensal" },
        { id: 50, categoria: "transporte", descricao: "Transporte escolar / deslocamento filhos", valor: 400, dependente_id: "todos", divisao: 50, fundamento: "CC Art. 1.694", icon: "🚗", nota: "Proporção de combustível para escola" },
        { id: 60, categoria: "lazer", descricao: "Lazer / atividades crianças", valor: 64, dependente_id: "todos", divisao: 50, fundamento: "CC Art. 1.694 — Lazer é direito da criança (ECA Art. 4°)", icon: "🎮" },
        { id: 70, categoria: "higiene", descricao: "Produtos de higiene crianças", valor: 100, dependente_id: "todos", divisao: 50, fundamento: "CC Art. 1.694", icon: "🧴", nota: "Estimar valor" },
    ],
    fundamentacao: {
        titulo: "Fundamentação Legal — Pensão Alimentícia",
        artigos: [
            { lei: "Código Civil", artigo: "Art. 1.694", texto: "Podem os parentes, os cônjuges ou companheiros pedir uns aos outros os alimentos de que necessitem para viver de modo compatível com a sua condição social, inclusive para atender às necessidades de sua educação." },
            { lei: "Código Civil", artigo: "Art. 1.695", texto: "São devidos os alimentos quando quem os pretende não tem bens suficientes, nem pode prover, pelo seu trabalho, à própria mantença." },
            { lei: "Código Civil", artigo: "Art. 1.703", texto: "Para a manutenção dos filhos, os cônjuges separados judicialmente contribuirão na proporção de seus recursos." },
            { lei: "Código Civil", artigo: "Art. 1.704", texto: "Se um dos cônjuges separados judicialmente vier a necessitar de alimentos, será o outro obrigado a prestá-los." },
            { lei: "Lei 13.058/2014", artigo: "Art. 1.583 §2°", texto: "Na guarda compartilhada, o tempo de convívio com os filhos deve ser dividido de forma equilibrada." },
            { lei: "Lei 13.058/2014", artigo: "Princípio", texto: "A guarda compartilhada é a regra. Os encargos financeiros devem ser divididos proporcionalmente." },
            { lei: "ECA", artigo: "Art. 4°", texto: "É dever da família assegurar, com absoluta prioridade, a efetivação dos direitos referentes à vida, à saúde, à alimentação, à educação, ao esporte, ao lazer..." },
        ],
        observacoes: [
            "O valor da pensão deve respeitar o BINÔMIO: necessidade do alimentando × possibilidade do alimentante.",
            "Na guarda compartilhada, os custos são divididos proporcionalmente à renda de cada genitor.",
            "O critério de 30% da renda líquida é JURISPRUDENCIAL, não é lei.",
            "Despesas extraordinárias podem ser divididas à parte.",
            "A violência patrimonial (Lei Maria da Penha, Art. 7°, IV) pode fundamentar maior contribuição do genitor agressor.",
        ]
    }
};

// ============================================
// FLUXO MENSAL — 2025 completo + 2026
// ============================================
const FLUXO_MENSAL = [
    // 2025 — dados estimados dos extratos PF (Nubank) + PJ (BB)
    { mes: 'Jan', mesNum: 1, ano: 2025, entradas: 12500, saidas: 14800, nota: 'Início do ano — férias, gastos altos' },
    { mes: 'Fev', mesNum: 2, ano: 2025, entradas: 28600, saidas: 24300, nota: 'Quality + Heitor (R$10k empréstimo recebido)' },
    { mes: 'Mar', mesNum: 3, ano: 2025, entradas: 18900, saidas: 17500, nota: 'Fluxo regular' },
    { mes: 'Abr', mesNum: 4, ano: 2025, entradas: 16200, saidas: 18100, nota: 'Déficit leve' },
    { mes: 'Mai', mesNum: 5, ano: 2025, entradas: 19800, saidas: 21400, nota: 'Gastos com transporte + roupas' },
    { mes: 'Jun', mesNum: 6, ano: 2025, entradas: 17500, saidas: 16800, nota: '' },
    { mes: 'Jul', mesNum: 7, ano: 2025, entradas: 18200, saidas: 19600, nota: 'Férias de inverno' },
    { mes: 'Ago', mesNum: 8, ano: 2025, entradas: 20100, saidas: 18400, nota: '' },
    { mes: 'Set', mesNum: 9, ano: 2025, entradas: 19500, saidas: 17800, nota: '' },
    { mes: 'Out', mesNum: 10, ano: 2025, entradas: 21300, saidas: 20200, nota: '' },
    { mes: 'Nov', mesNum: 11, ano: 2025, entradas: 22000, saidas: 21500, nota: '' },
    { mes: 'Dez', mesNum: 12, ano: 2025, entradas: 24500, saidas: 27800, nota: 'Natal + férias + 13º (parte)' },
    // 2026
    { mes: 'Jan', mesNum: 1, ano: 2026, entradas: 20500, saidas: 18200, nota: 'Início do controle' },
    { mes: 'Fev', mesNum: 2, ano: 2026, entradas: 21800, saidas: 19500, nota: 'Acordo Carrefour' },
    { mes: 'Mar', mesNum: 3, ano: 2026, entradas: 22100, saidas: 20800, nota: '' },
    { mes: 'Abr', mesNum: 4, ano: 2026, entradas: 22410, saidas: 19300, nota: 'Mês atual (parcial)' },
    { mes: 'Mai', mesNum: 5, ano: 2026, entradas: 0, saidas: 0, nota: 'Projeção' },
    { mes: 'Jun', mesNum: 6, ano: 2026, entradas: 0, saidas: 0, nota: 'Projeção' },
    { mes: 'Jul', mesNum: 7, ano: 2026, entradas: 0, saidas: 0, nota: 'Projeção' },
    { mes: 'Ago', mesNum: 8, ano: 2026, entradas: 0, saidas: 0, nota: 'Projeção' },
    { mes: 'Set', mesNum: 9, ano: 2026, entradas: 0, saidas: 0, nota: 'Projeção' },
    { mes: 'Out', mesNum: 10, ano: 2026, entradas: 0, saidas: 0, nota: 'Projeção' },
    { mes: 'Nov', mesNum: 11, ano: 2026, entradas: 0, saidas: 0, nota: 'Projeção' },
    { mes: 'Dez', mesNum: 12, ano: 2026, entradas: 0, saidas: 0, nota: 'Projeção' },
];

// ============================================
// FORNECEDORES x DESPESAS
// ============================================
let FORNECEDORES = [
    { id: 1, fornecedor: 'Imobiliária (Aluguel)', categoria: 'Moradia', valor_mensal: 3790, contrato: 'Sim', vencimento: 5, contato: '', obs: 'Contrato anual', pf_pj: 'pf' },
    { id: 2, fornecedor: 'Escola Sinergia', categoria: 'Educação', valor_mensal: 1190, contrato: 'Sim', vencimento: 5, contato: '', obs: 'Matrícula + mensalidade', pf_pj: 'pf' },
    { id: 3, fornecedor: 'Supermercados diversos', categoria: 'Alimentação', valor_mensal: 1763, contrato: 'Não', vencimento: null, contato: '', obs: 'Média mensal extratos', pf_pj: 'pf' },
    { id: 4, fornecedor: 'Postos de combustível', categoria: 'Transporte', valor_mensal: 1005, contrato: 'Não', vencimento: null, contato: '', obs: 'Média mensal', pf_pj: 'pf' },
    { id: 5, fornecedor: 'Intelig Telecomunicações', categoria: 'Comunicação', valor_mensal: 62, contrato: 'Sim', vencimento: 7, contato: '', obs: '', pf_pj: 'pf' },
    { id: 6, fornecedor: 'Netflix', categoria: 'Assinatura', valor_mensal: 59.90, contrato: 'Sim', vencimento: 24, contato: '', obs: 'Streaming', pf_pj: 'pf' },
    { id: 7, fornecedor: 'Apple (iCloud/Apps)', categoria: 'Assinatura', valor_mensal: 58, contrato: 'Sim', vencimento: 14, contato: '', obs: '', pf_pj: 'pf' },
    { id: 8, fornecedor: 'Canva Pro', categoria: 'Assinatura', valor_mensal: 81, contrato: 'Sim', vencimento: 15, contato: '', obs: 'Ferramenta profissional', pf_pj: 'pj' },
    { id: 9, fornecedor: 'Google Cloud', categoria: 'Tecnologia', valor_mensal: 30, contrato: 'Sim', vencimento: 3, contato: '', obs: '', pf_pj: 'pj' },
    { id: 10, fornecedor: 'Via Cloud Servidores', categoria: 'Tecnologia', valor_mensal: 357.21, contrato: 'Sim', vencimento: 27, contato: '', obs: 'Servidor', pf_pj: 'pj' },
    { id: 11, fornecedor: 'Sem Parar', categoria: 'Transporte', valor_mensal: 80, contrato: 'Sim', vencimento: 1, contato: '', obs: 'Pedágio + estacionamento', pf_pj: 'pf' },
    { id: 12, fornecedor: 'Sindicato Contadores RS', categoria: 'Profissional', valor_mensal: 570, contrato: 'Sim', vencimento: 6, contato: '', obs: '', pf_pj: 'pj' },
];

// ============================================
// CÁLCULOS GLOBAIS
// ============================================
function calcReceitaMedia(tipo) {
    const arr = tipo === 'pj' ? RECEITAS.pj : RECEITAS.pf;
    return arr.reduce((s,r) => s + (r.media||0), 0);
}

function calcDespesasMensais() {
    let total = 0;
    for (const cat of Object.values(DESPESAS)) {
        total += cat.reduce((s,d) => s + (d.valor||0), 0);
    }
    return total;
}

function calcTotalDividas(tipo) {
    if (tipo === 'pessoais') return CONTAS_PAGAR.filter(c => c.pf_pj === 'pf' && c.saldo_atual > 0).reduce((s,d) => s + (d.saldo_atual||0), 0);
    if (tipo === 'empresariais') return CONTAS_PAGAR.filter(c => c.pf_pj === 'pj' && c.saldo_atual > 0).reduce((s,d) => s + (d.saldo_atual||0), 0);
    return CONTAS_PAGAR.filter(c => c.saldo_atual > 0).reduce((s,d) => s + (d.saldo_atual||0), 0);
}

function calcParcelasMensais() {
    return CONTAS_PAGAR.filter(c => c.saldo_atual > 0 && c.parcela_valor > 0).reduce((s,d) => s + (d.parcela_valor||0), 0);
}

function calcSaldoMensal() {
    return calcReceitaMedia('pf') + calcReceitaMedia('pj') - calcDespesasMensais() - calcParcelasMensais();
}

function calcCustoDependentes() {
    const custosMensais = DEPENDENTES.custos.filter(c => c.tipo !== 'divida');
    const totalMensal = custosMensais.reduce((s, c) => s + (c.valor || 0), 0);
    const metadeMae = custosMensais.reduce((s, c) => s + ((c.valor || 0) * (c.divisao || 50) / 100), 0);
    const metadePai = totalMensal - metadeMae;
    const dividasDep = DEPENDENTES.custos.filter(c => c.tipo === 'divida');
    const totalDividasDep = dividasDep.reduce((s, c) => s + (c.valor || 0), 0);
    const metadeDividaPai = dividasDep.reduce((s, c) => s + ((c.valor || 0) * (c.divisao || 50) / 100), 0);
    return { totalMensal, metadeMae, metadePai, totalDividasDep, metadeDividaPai };
}

function calcFluxoMensalTotais(ano) {
    const data = ano ? FLUXO_MENSAL.filter(m => m.ano === ano) : FLUXO_MENSAL;
    const mesesComDados = data.filter(m => m.entradas > 0 || m.saidas > 0);
    const totalEntradas = mesesComDados.reduce((s, m) => s + m.entradas, 0);
    const totalSaidas = mesesComDados.reduce((s, m) => s + m.saidas, 0);
    const mediaEntradas = mesesComDados.length > 0 ? totalEntradas / mesesComDados.length : 0;
    const mediaSaidas = mesesComDados.length > 0 ? totalSaidas / mesesComDados.length : 0;
    return { totalEntradas, totalSaidas, mediaEntradas, mediaSaidas, meses: mesesComDados.length };
}

function calcFornecedorPorCategoria() {
    const catMap = {};
    FORNECEDORES.forEach(f => {
        if (!catMap[f.categoria]) catMap[f.categoria] = { total: 0, itens: [] };
        catMap[f.categoria].total += f.valor_mensal;
        catMap[f.categoria].itens.push(f);
    });
    return catMap;
}

function getNextFornecedorId() {
    return FORNECEDORES.length > 0 ? Math.max(...FORNECEDORES.map(f => f.id)) + 1 : 1;
}

// ============================================
// PERSISTENCE
// ============================================
function salvarContas() {
    try { localStorage.setItem('fin_contas_pagar_v2', JSON.stringify(CONTAS_PAGAR)); } catch(e){}
}
function carregarContas() {
    try {
        const saved = localStorage.getItem('fin_contas_pagar_v2');
        if (saved) CONTAS_PAGAR = JSON.parse(saved);
    } catch(e){}
}

function salvarFornecedores() {
    try { localStorage.setItem('financeiro_fornecedores', JSON.stringify(FORNECEDORES)); } catch(e){}
}
function carregarFornecedores() {
    try {
        const saved = localStorage.getItem('financeiro_fornecedores');
        if (saved) FORNECEDORES = JSON.parse(saved);
    } catch(e){}
}

function salvarFluxoMensal() {
    try { localStorage.setItem('financeiro_fluxo_mensal_v2', JSON.stringify(FLUXO_MENSAL)); } catch(e){}
}
function carregarFluxoMensal() {
    try {
        const saved = localStorage.getItem('financeiro_fluxo_mensal_v2');
        if (saved) {
            const parsed = JSON.parse(saved);
            parsed.forEach((s, i) => { if (FLUXO_MENSAL[i]) Object.assign(FLUXO_MENSAL[i], s); });
        }
    } catch(e){}
}

// Load saved data
carregarContas();
carregarFornecedores();
carregarFluxoMensal();
