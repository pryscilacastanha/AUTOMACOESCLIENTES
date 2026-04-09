// ══════════════════════════════════════════════════════════════════════
// DRIVE SYNC — Sincronização Automática com Google Drive
// Usa: Google Identity Services (OAuth2) + Drive API v3 + Gemini AI
// ══════════════════════════════════════════════════════════════════════

const DriveSync = (() => {
  // ── Config ──────────────────────────────────────────────────────────
  // IMPORTANTE: Este Client ID precisa ser cadastrado no Google Cloud Console
  // → APIs & Services → Credentials → OAuth 2.0 Client ID (Web application)
  // → Authorized JavaScript origins: https://vertice.pryscilacastanha.com.br
  const GOOGLE_CLIENT_ID = window.GOOGLE_CLIENT_ID || '';
  const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
  const DRIVE_API   = 'https://www.googleapis.com/drive/v3';

  let tokenClient = null;
  let accessToken  = null;

  // ── Inicializar OAuth2 (Google Identity Services) ───────────────────
  function initOAuth() {
    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.oauth2) {
        reject(new Error('Google Identity Services não carregado. Verifique o index.html'));
        return;
      }
      if (!GOOGLE_CLIENT_ID) {
        reject(new Error('GOOGLE_CLIENT_ID não configurado. Acesse Configurações → Integrações → Google Drive.'));
        return;
      }
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: DRIVE_SCOPE,
        callback: (resp) => {
          if (resp.error) { reject(new Error('Erro OAuth: ' + resp.error)); return; }
          accessToken = resp.access_token;
          resolve(accessToken);
        },
      });
      resolve(null); // Inicializado, mas ainda não autenticado
    });
  }

  // ── Solicitar autenticação ───────────────────────────────────────────
  async function authenticate() {
    await initOAuth();
    if (accessToken) return accessToken; // Já autenticado

    return new Promise((resolve, reject) => {
      tokenClient.callback = (resp) => {
        if (resp.error) { reject(new Error('Erro ao autenticar: ' + resp.error)); return; }
        accessToken = resp.access_token;
        resolve(accessToken);
      };
      tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }

  // ── Extrair ID da pasta do link do Drive ────────────────────────────
  function extractFolderId(driveUrl) {
    if (!driveUrl) return null;
    // Formatos: /folders/FOLDER_ID, /drive/u/0/folders/FOLDER_ID
    const match = driveUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    // Formato alternativo: ?id=FOLDER_ID
    const idMatch = driveUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    return idMatch ? idMatch[1] : null;
  }

  // ── Listar arquivos da pasta ─────────────────────────────────────────
  async function listFolderFiles(folderId) {
    const token = accessToken || await authenticate();
    const url = `${DRIVE_API}/files?q='${folderId}'+in+parents+and+trashed=false`
      + `&fields=files(id,name,mimeType,createdTime,modifiedTime,size,webViewLink)`
      + `&pageSize=200&orderBy=createdTime desc`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const err = await res.json();
      if (err.error?.code === 401) { accessToken = null; return listFolderFiles(folderId); }
      throw new Error(`Drive API: ${err.error?.message || res.statusText}`);
    }

    const data = await res.json();
    return data.files || [];
  }

  // ── Classificar arquivos com Gemini ─────────────────────────────────
  async function classifyFilesWithGemini(files, clienteRegime, comp) {
    if (typeof window.geminiChat !== 'function') {
      throw new Error('Gemini não configurado. Configure a Gemini API Key em Configurações.');
    }

    // Monta o mapa de keys do checklist para enviar ao Gemini
    const checklistMap = CHECKLIST_TEMPLATE.flatMap(cat =>
      cat.items.map(item => ({
        key: item.key,
        nome: item.nome,
        categoria: cat.cat
      }))
    );

    const [ano, mes] = comp.split('-');
    const mesesNome = ['','Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                       'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const nomeMes = mesesNome[parseInt(mes)] || mes;

    const prompt = `Você é um classificador de documentos contábeis para escrituração.

COMPETÊNCIA: ${nomeMes}/${ano}
REGIME: ${clienteRegime || 'Não informado'}

ARQUIVOS RECEBIDOS NO GOOGLE DRIVE:
${files.map((f, i) => `${i+1}. "${f.name}"`).join('\n')}

CHECKLIST DE DOCUMENTOS ESPERADOS:
${checklistMap.map(i => `- key:"${i.key}" → ${i.nome} (${i.categoria})`).join('\n')}

TAREFA: Para cada arquivo acima, identifique qual "key" do checklist ele corresponde.
Considere variações de nome, siglas e nomes parciais (ex: "Extrato BB" → "extrato_bb", "NF Entrada" → "nf_entrada", "folha jan" → "folha", "DAS" → "guias_pagas", "PGDAS" → "pgdas").
Se um arquivo não corresponde a nenhum item, atribua "null".

RESPONDA APENAS com um JSON válido no formato:
[
  {"arquivo": "nome do arquivo", "key": "key_do_item ou null", "confianca": "alta|media|baixa"},
  ...
]
SEM nenhum texto antes ou depois do JSON.`;

    const resposta = await window.geminiChat(prompt);

    // Parse do JSON retornado pelo Gemini
    try {
      const jsonStr = resposta.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (e) {
      console.warn('[DriveSync] Erro ao parsear resposta Gemini:', resposta);
      return [];
    }
  }

  // ── Aplicar classificação no checklist ──────────────────────────────
  function applyToChecklist(clienteId, comp, classifications, files) {
    const checklists = DB.get('checklists') || {};
    const key = `${clienteId}_${comp}`;
    checklists[key] = checklists[key] || {};

    const matches = [];
    const noMatches = [];
    const lowConfidence = [];

    classifications.forEach((cls, idx) => {
      const arquivo = files[idx];
      if (cls.key && cls.key !== 'null' && cls.key !== null) {
        if (cls.confianca === 'baixa') {
          lowConfidence.push({ ...cls, arquivo: arquivo?.name });
        } else {
          checklists[key][cls.key] = 'recebido';
          matches.push({ key: cls.key, arquivo: arquivo?.name, confianca: cls.confianca });
        }
      } else {
        noMatches.push(arquivo?.name);
      }
    });

    DB.set('checklists', checklists);
    return { matches, noMatches, lowConfidence };
  }

  // ── Função principal: sincronizar ────────────────────────────────────
  async function sync(clienteId, driveUrl, comp) {
    const folderId = extractFolderId(driveUrl);
    if (!folderId) throw new Error('URL do Drive inválida ou pasta não encontrada. Cole o link completo da pasta no campo Drive dos Dados Gerais do cliente.');

    // 1. Autenticar
    _updateSyncStatus('🔐 Autenticando com Google...', 'info');
    await authenticate();

    // 2. Listar arquivos
    _updateSyncStatus('📂 Buscando arquivos no Drive...', 'info');
    const files = await listFolderFiles(folderId);
    if (files.length === 0) {
      _updateSyncStatus('📭 Nenhum arquivo encontrado na pasta do Drive.', 'warn');
      return { files: [], matches: [], noMatches: [], lowConfidence: [] };
    }

    _updateSyncStatus(`🤖 Classificando ${files.length} arquivo(s) com Gemini AI...`, 'info');

    // 3. Classificar com Gemini
    const clientes = DB.get('clientes') || [];
    const cliente  = clientes.find(c => c.id === clienteId);
    const classifications = await classifyFilesWithGemini(files, cliente?.regime, comp);

    // 4. Aplicar no checklist
    const resultado = applyToChecklist(clienteId, comp, classifications, files);

    _updateSyncStatus(
      `✅ Sincronizado! ${resultado.matches.length} documento(s) marcado(s) como Recebido.` +
      (resultado.lowConfidence.length > 0 ? ` ${resultado.lowConfidence.length} precisam de verificação manual.` : ''),
      'success'
    );

    return { files, ...resultado };
  }

  // ── Atualiza o painel de status da sincronização ─────────────────────
  function _updateSyncStatus(msg, type = 'info') {
    const el = document.getElementById('drive-sync-status');
    if (!el) return;
    const colors = {
      info:    '#3b82f6',
      success: '#10b981',
      warn:    '#f59e0b',
      error:   '#ef4444',
    };
    el.style.borderLeftColor = colors[type] || colors.info;
    el.innerHTML = `<span style="font-size:13px;color:${colors[type]}">${msg}</span>`;
    el.style.display = 'block';
  }

  // ── Logout (revogar token) ───────────────────────────────────────────
  function logout() {
    if (accessToken && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(accessToken);
      accessToken = null;
    }
  }

  return { sync, authenticate, extractFolderId, logout, isAuthenticated: () => !!accessToken };
})();

// ══════════════════════════════════════════════════════════════════════
// Window-level: chamado pelo botão no HTML
// ══════════════════════════════════════════════════════════════════════
window.sincronizarDrive = async function(clienteId, driveUrl, comp) {
  const btn = document.getElementById('btn-sync-drive');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Sincronizando...'; }

  try {
    const resultado = await DriveSync.sync(clienteId, driveUrl, comp);

    // Exibir resultado detalhado
    const el = document.getElementById('drive-sync-result');
    if (el && resultado.files.length > 0) {
      const matchHtml = resultado.matches.length > 0
        ? `<div style="margin-top:10px"><strong style="color:#10b981">✅ Marcados como Recebido (${resultado.matches.length}):</strong>
           <ul style="margin:4px 0 0 16px;font-size:12px">${resultado.matches.map(m =>
             `<li><strong>${m.arquivo}</strong> → ${m.key} <span style="color:#94a3b8">(${m.confianca})</span></li>`
           ).join('')}</ul></div>` : '';

      const lowHtml = resultado.lowConfidence.length > 0
        ? `<div style="margin-top:8px"><strong style="color:#f59e0b">⚠️ Baixa confiança — verificar manualmente (${resultado.lowConfidence.length}):</strong>
           <ul style="margin:4px 0 0 16px;font-size:12px">${resultado.lowConfidence.map(m =>
             `<li><strong>${m.arquivo}</strong> → sugerido: ${m.key}</li>`
           ).join('')}</ul></div>` : '';

      const noMatchHtml = resultado.noMatches.length > 0
        ? `<div style="margin-top:8px"><strong style="color:#64748b">📁 Não classificados (${resultado.noMatches.length}):</strong>
           <ul style="margin:4px 0 0 16px;font-size:12px;color:#94a3b8">${resultado.noMatches.map(n =>
             `<li>${n}</li>`
           ).join('')}</ul></div>` : '';

      el.innerHTML = matchHtml + lowHtml + noMatchHtml;
      el.style.display = 'block';
    }

    // Recarregar a tela para refletir os novos status
    setTimeout(() => { if (typeof render === 'function') render(); }, 800);

  } catch (err) {
    const statusEl = document.getElementById('drive-sync-status');
    if (statusEl) {
      statusEl.style.borderLeftColor = '#ef4444';
      statusEl.innerHTML = `<span style="color:#ef4444;font-size:13px">❌ Erro: ${err.message}</span>`;
      statusEl.style.display = 'block';
    }
    console.error('[DriveSync] Erro:', err);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '🔄 Sincronizar Drive'; }
  }
};

window.listarArquivosDrive = async function(clienteId, driveUrl) {
  try {
    await DriveSync.authenticate();
    const folderId = DriveSync.extractFolderId(driveUrl);
    if (!folderId) { alert('URL do Drive inválida.'); return; }
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false`
      + `&fields=files(id,name,mimeType,modifiedTime,webViewLink)&pageSize=100&orderBy=name`,
      { headers: { Authorization: `Bearer DriveSync.isAuthenticated()` }}
    );
    console.log('[DriveSync] Arquivos listados com sucesso');
  } catch(e) { console.error(e); }
};
