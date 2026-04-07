// ──────────────────────────────────────────────
//  gemini.js — Integração com Google Gemini API
//  Leitura inteligente de PDFs, XMLs, Extratos
// ──────────────────────────────────────────────

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_BASE  = 'https://generativelanguage.googleapis.com/v1beta/models';

// ─── Obtém a API key do localStorage ───
function getApiKey() {
  return localStorage.getItem('gemini_api_key') || '';
}

// ─── Converte File para base64 ───
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Monta o MIME type correto ───
function getMimeType(file) {
  if (file.type) return file.type;
  const ext = file.name.split('.').pop().toLowerCase();
  const map = { pdf:'application/pdf', xml:'text/xml', csv:'text/csv',
                png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg',
                ofx:'text/plain', txt:'text/plain' };
  return map[ext] || 'application/octet-stream';
}

// ─── Prompt por tipo de documento ───
function buildPrompt(tipoDoc, nomeCliente) {
  const base = `Você é um assistente especializado em contabilidade brasileira. Analise este documento do cliente "${nomeCliente}" e extraia as informações estruturadas.`;

  const prompts = {
    extrato: `${base}
Este é um extrato bancário. Extraia e retorne um JSON com:
{
  "banco": "nome do banco",
  "conta": "número da conta se visível",
  "periodo": "período de referência (mês/ano)",
  "saldo_inicial": número,
  "saldo_final": número,
  "total_creditos": número,
  "total_debitos": número,
  "transacoes": [{ "data": "dd/mm", "descricao": "...", "valor": número, "tipo": "credito|debito" }],
  "observacoes": "qualquer irregularidade ou ponto de atenção"
}`,

    nfe_xml: `${base}
Este é um arquivo XML de Nota Fiscal (NF-e ou NFS-e). Extraia e retorne um JSON com:
{
  "tipo": "NFe|NFSe",
  "numero": "número da nota",
  "data_emissao": "dd/mm/aaaa",
  "emitente": "razão social",
  "cnpj_emitente": "CNPJ",
  "destinatario": "razão social",
  "cnpj_destinatario": "CNPJ",
  "valor_total": número,
  "valor_impostos": número,
  "descricao_servico_produto": "descrição",
  "natureza_operacao": "...",
  "status": "autorizada|cancelada|outra"
}`,

    fatura_cartao: `${base}
Esta é uma fatura de cartão de crédito empresarial. Extraia e retorne um JSON com:
{
  "banco_cartao": "nome do banco/operadora",
  "vencimento": "dd/mm/aaaa",
  "valor_total": número,
  "valor_minimo": número,
  "lancamentos": [{ "data": "dd/mm", "descricao": "...", "valor": número, "parcelas": "x/y ou null" }],
  "observacoes": "despesas suspeitas ou sem comprovante"
}`,

    folha: `${base}
Este é um documento de folha de pagamento / holerite. Extraia e retorne um JSON com:
{
  "competencia": "mês/ano",
  "empresa": "nome",
  "total_bruto": número,
  "total_descontos": número,
  "total_liquido": número,
  "total_inss_empregador": número,
  "total_fgts": número,
  "funcionarios": [{ "nome": "...", "cargo": "...", "salario_bruto": número, "liquido": número }],
  "observacoes": ""
}`,

    guia_imposto: `${base}
Este é um documento de guia/DARF/DAS/GPS de imposto. Extraia e retorne um JSON com:
{
  "tipo_guia": "DAS|DARF|GPS|DAM|outro",
  "competencia": "mês/ano",
  "vencimento": "dd/mm/aaaa",
  "valor": número,
  "codigo_receita": "...",
  "cnpj": "...",
  "situacao": "paga|em aberto|vencida",
  "observacoes": ""
}`,

    generico: `${base}
Analise este documento contábil/financeiro e extraia as principais informações relevantes. Retorne um JSON com:
{
  "tipo_documento": "identificação do tipo",
  "data_referencia": "data ou período",
  "valores_principais": {},
  "informacoes_relevantes": {},
  "pontos_de_atencao": [],
  "resumo": "breve descrição do documento em 2-3 frases"
}`,
  };

  return prompts[tipoDoc] || prompts.generico;
}

// ─── Chamada principal à Gemini API ───
async function analisarDocumento(file, tipoDoc, nomeCliente) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('API Key do Google AI Studio não configurada.');

  const base64 = await fileToBase64(file);
  const mimeType = getMimeType(file);
  const prompt = buildPrompt(tipoDoc, nomeCliente);

  const body = {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: mimeType, data: base64 } }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    }
  };

  const url = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `Erro ${res.status} na API Gemini`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

// ─── Mapeia resultado para items do checklist ───
function mapResultToChecklist(tipoDoc, result) {
  const mapa = {
    extrato:      ['extrato_bb','extrato_brad','extrato_cef','extrato_itau','extrato_sant','extrato_bans','extrato_sic','extrato_sicoob','extrato_inter','extrato_nu','extrato_outro'],
    nfe_xml:      result?.tipo === 'NFSe' ? ['nf_emitidas'] : ['nf_entrada','xml_entrada','xml_saida'],
    fatura_cartao:['cartao'],
    folha:        ['folha','inss_fgts'],
    guia_imposto: ['guias_pagas','apur_impostos'],
  };
  return mapa[tipoDoc] || [];
}
