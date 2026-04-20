// ============================================================
//  UNICO-EXPORT.JS  —  Conversor Excel → Leiaute TXT Único
//  Criscontab & Madeira — v1.0
// ============================================================
// Leiaute TXT Único (campos obrigatórios por linha):
//   001,002,003,004,005,006,007[,008,009,...,118,119,...]
//   001 = Sequência I6
//   002 = Data AAAAMMDD A8
//   003 = Conta débito A8
//   004 = Conta crédito A8
//   005 = Valor N15,2 (ponto decimal)
//   006 = Código histórico A8
//   007 = Complemento histórico A200
//   008 = Número documento (DCTO + nro)  opcional
//   118 = CNPJ/CPF participante débito   opcional
//   119 = CNPJ/CPF participante crédito  opcional
// ============================================================

const UnicoExport = (() => {

  // ── CONFIGURAÇÕES PADRÃO (editáveis pela UI) ──────────────
  // O usuário configura via modal antes de gerar
  let _config = {
    // Plano de contas — contas a usar por tipo de lançamento
    // Entradas: débito = banco, crédito = receita
    contaDebito:   '00003001',  // Conta Caixa/Banco
    contaCredito:  '00004001',  // Conta Receitas

    // Saídas: débito = despesa, crédito = banco
    contaDebitoSaida:  '00005001', // Conta Despesas
    contaCreditoSaida: '00003001', // Conta Caixa/Banco

    codigoHistorico: '00000001',   // Código histórico padrão
    cnpjDebito:  '',               // CNPJ participante débito
    cnpjCredito: '',               // CNPJ participante crédito
    cnpjEmpresa: '',               // CNPJ da empresa (campo 123)
    incluirDocumento: true,        // Incluir campo 008 (DCTO)
    filtroMes: '',                 // '2025-01' ou '' para todos
  };

  // ── UTILITÁRIOS ───────────────────────────────────────────
  function pad(str, len, char = ' ') {
    str = String(str ?? '');
    return str.substring(0, len).padEnd(len, char);
  }

  function toYYYYMMDD(excelDate) {
    // Excel date serial → JS Date
    if (typeof excelDate === 'number') {
      const d = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${y}${m}${day}`;
    }
    // Já string formato dd/mm/aaaa
    if (typeof excelDate === 'string') {
      const parts = excelDate.split(/[\/\-]/);
      if (parts.length === 3) {
        if (parts[2].length === 4) return `${parts[2]}${parts[1].padStart(2,'0')}${parts[0].padStart(2,'0')}`;
        return parts.join(''); // já AAAAMMDD
      }
    }
    return String(excelDate);
  }

  function formatValor(n) {
    // Valor com 2 casas decimais, ponto separador
    const v = Math.abs(parseFloat(n) || 0);
    return v.toFixed(2);
  }

  function buildHistorico(row, config) {
    // Monta complemento histórico (campo 007, máx 200 chars)
    const banco = row['Banco'] || '';
    const conta = row['CONTA'] || '';
    const doc   = row['DOCUMENTO'] || '';
    const desc  = row['DESCRICAO'] || '';
    const comp  = `${banco} ${conta} ${desc} DOC:${doc}`.trim();
    return comp.substring(0, 200);
  }

  function buildDocumento(row, config) {
    if (!config.incluirDocumento) return '';
    const doc = String(row['DOCUMENTO'] || '').replace(/\D/g, '');
    if (!doc) return 'DCTO';
    return ('DCTO' + doc).substring(0, 15);
  }

  // ── PARSE XLSX via FileReader (browser) ───────────────────
  function parseExcelFile(file) {
    return new Promise((resolve, reject) => {
      if (typeof XLSX === 'undefined') {
        reject(new Error('Biblioteca XLSX não carregada. Adicione SheetJS ao index.html.'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target.result, { type: 'binary' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
          resolve(data);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsBinaryString(file);
    });
  }

  // ── CONVERSÃO PRINCIPAL ───────────────────────────────────
  function convertRows(rows, config) {
    const cfg = Object.assign({}, _config, config);
    const lines = [];
    let seq = 1;

    rows.forEach((row) => {
      // Filtro por mês/ano se configurado
      if (cfg.filtroMes) {
        const [anoFiltro, mesFiltro] = cfg.filtroMes.split('-').map(Number);
        if (row['ANO'] !== anoFiltro || row['MES'] !== mesFiltro) return;
      }

      const valor = parseFloat(row['VALOR'] || 0);
      if (!valor) return; // pula linhas sem valor

      const isEntrada = (parseFloat(row['ENTRADAS'] || 0) > 0);
      const data    = toYYYYMMDD(row['DATA']);
      const valStr  = formatValor(valor);

      // Débito e crédito conforme tipo
      const debito  = isEntrada ? cfg.contaDebito : cfg.contaDebitoSaida;
      const credito = isEntrada ? cfg.contaCredito : cfg.contaCreditoSaida;

      const hist  = buildHistorico(row, cfg);
      const docto = buildDocumento(row, cfg);

      // Campos 001-007 obrigatórios
      const campos = [
        String(seq).padStart(6, '0'),  // 001 sequência
        data,                          // 002 data AAAAMMDD
        debito,                        // 003 conta débito
        credito,                       // 004 conta crédito
        valStr,                        // 005 valor
        cfg.codigoHistorico,           // 006 código histórico
        hist,                          // 007 complemento
      ];

      // Campo 008 — número do documento (opcional)
      if (cfg.incluirDocumento) campos.push(docto);
      else campos.push('');

      // Campo 009 (Lote) — vazio
      campos.push('');

      // Campos 010..117 — rateio CC — vazio (sem CC)
      // Adicionamos placeholder até campo 117
      // Na prática basta deixar separadores vazios
      // Por simplicidade emitimos apenas os obrigatórios + opcionais usados

      // Campos 118/119 — CNPJ participantes
      const cnpjD = cfg.cnpjDebito.replace(/\D/g, '');
      const cnpjC = cfg.cnpjCredito.replace(/\D/g, '');
      // Preenchemos até campo 117 com vírgulas vazias
      while (campos.length < 117) campos.push('');
      campos.push(cnpjD);   // 118
      campos.push(cnpjC);   // 119

      lines.push(campos.join(','));
      seq++;
    });

    return lines.join('\r\n');
  }

  // ── DOWNLOAD ──────────────────────────────────────────────
  function download(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'exportacao_unico.txt';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
  }

  // ── RENDER UI (integrado ao sistema) ─────────────────────
  function renderPage(clienteId) {
    const cliente = (window.AppState?.clientes || []).find(c => c.id == clienteId) || {};

    return `
<div class="unico-page">
  <div class="page-header-bar" style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
    <div style="width:42px;height:42px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px">📤</div>
    <div>
      <h1 style="font-size:20px;font-weight:700;color:#f1f5f9;margin:0">Exportar para Único Contábil</h1>
      <p style="color:#94a3b8;font-size:13px;margin:0">Converte extrato Excel → Leiaute TXT Único módulo contábil</p>
    </div>
  </div>

  <!-- PASSO 1 — Upload Excel -->
  <div class="unico-card" id="unico-step1">
    <div class="unico-card-header">
      <span class="unico-step-badge">1</span>
      <span>Selecionar arquivo Excel (resultado_normalizado)</span>
    </div>
    <div class="unico-drop-zone" id="unico-drop-zone"
         ondrop="UnicoExport.onDrop(event)"
         ondragover="event.preventDefault()"
         ondragleave="this.classList.remove('drag-over')"
         ondragenter="this.classList.add('drag-over')"
         onclick="document.getElementById('unico-file-input').click()">
      <div style="font-size:36px;margin-bottom:8px">📊</div>
      <div style="font-size:15px;font-weight:600;color:#e2e8f0">Clique ou arraste o arquivo Excel aqui</div>
      <div style="font-size:12px;color:#64748b;margin-top:4px">Formato: resultado_normalizado.xlsx</div>
      <div id="unico-file-name" style="margin-top:10px;font-size:12px;color:#6366f1;font-weight:600"></div>
    </div>
    <input type="file" id="unico-file-input" accept=".xlsx,.xls" style="display:none"
           onchange="UnicoExport.onFileSelect(this.files[0])">
  </div>

  <!-- PASSO 2 — Configurações -->
  <div class="unico-card" id="unico-step2" style="opacity:.4;pointer-events:none">
    <div class="unico-card-header">
      <span class="unico-step-badge">2</span>
      <span>Configurar Plano de Contas e Dados</span>
    </div>

    <div class="unico-form-grid">
      <div class="unico-form-group">
        <label>Conta Débito — Entradas (banco)</label>
        <input id="uc-contaDebito" class="unico-input" placeholder="Ex: 00003001" value="00003001">
        <small>Conta que recebe crédito bancário (entradas)</small>
      </div>
      <div class="unico-form-group">
        <label>Conta Crédito — Entradas (receita)</label>
        <input id="uc-contaCredito" class="unico-input" placeholder="Ex: 00004001" value="00004001">
        <small>Conta de receita contrapartida</small>
      </div>
      <div class="unico-form-group">
        <label>Conta Débito — Saídas (despesa)</label>
        <input id="uc-contaDebitoSaida" class="unico-input" placeholder="Ex: 00005001" value="00005001">
        <small>Conta de despesa para débito nas saídas</small>
      </div>
      <div class="unico-form-group">
        <label>Conta Crédito — Saídas (banco)</label>
        <input id="uc-contaCreditoSaida" class="unico-input" placeholder="Ex: 00003001" value="00003001">
        <small>Conta bancária na saída (crédito)</small>
      </div>
      <div class="unico-form-group">
        <label>Código do Histórico (campo 006)</label>
        <input id="uc-codigoHistorico" class="unico-input" placeholder="Ex: 00000001" value="00000001">
        <small>Código cadastrado no Único</small>
      </div>
      <div class="unico-form-group">
        <label>Filtro Competência (opcional)</label>
        <input type="month" id="uc-filtroMes" class="unico-input">
        <small>Deixe em branco para exportar todos os meses</small>
      </div>
      <div class="unico-form-group">
        <label>CNPJ/CPF Participante Débito (campo 118)</label>
        <input id="uc-cnpjDebito" class="unico-input" placeholder="Apenas números">
        <small>Opcional — deixe vazio se conta não é do tipo participante</small>
      </div>
      <div class="unico-form-group">
        <label>CNPJ/CPF Participante Crédito (campo 119)</label>
        <input id="uc-cnpjCredito" class="unico-input" placeholder="Apenas números">
        <small>Opcional</small>
      </div>
      <div class="unico-form-group" style="grid-column:1/-1">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="uc-incluirDocumento" checked style="width:16px;height:16px">
          Incluir número do documento (campo 008 — DCTO)
        </label>
      </div>
    </div>
  </div>

  <!-- PASSO 3 — Preview e Export -->
  <div class="unico-card" id="unico-step3" style="opacity:.4;pointer-events:none">
    <div class="unico-card-header">
      <span class="unico-step-badge">3</span>
      <span>Preview e Exportar</span>
    </div>
    <div id="unico-stats" style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px"></div>
    <div id="unico-preview" class="unico-preview-box"></div>
    <div style="display:flex;gap:12px;margin-top:16px;flex-wrap:wrap">
      <button class="btn btn-primary" onclick="UnicoExport.generateAndDownload()" style="gap:6px;display:flex;align-items:center">
        <span>📥</span> Baixar TXT Único
      </button>
      <button class="btn" style="background:#1e293b;color:#94a3b8;border:1px solid #334155" onclick="UnicoExport.copyToClipboard()">
        📋 Copiar texto
      </button>
    </div>
  </div>

  <div id="unico-toast" style="display:none;position:fixed;bottom:32px;right:32px;background:#10b981;color:#fff;padding:12px 20px;border-radius:10px;font-weight:600;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.4)"></div>
</div>
`;
  }

  // ── ESTADO INTERNO ────────────────────────────────────────
  let _rows = [];
  let _lastTxt = '';

  function onDrop(e) {
    e.preventDefault();
    document.getElementById('unico-drop-zone').classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  }

  function onFileSelect(file) {
    if (!file) return;
    document.getElementById('unico-file-name').textContent = `✅ ${file.name} (${(file.size/1024).toFixed(0)} KB)`;
    parseExcelFile(file).then(rows => {
      _rows = rows;
      // Ativa passo 2 e 3
      document.getElementById('unico-step2').style.opacity = '1';
      document.getElementById('unico-step2').style.pointerEvents = 'auto';
      document.getElementById('unico-step3').style.opacity = '1';
      document.getElementById('unico-step3').style.pointerEvents = 'auto';
      updatePreview();
      showToast(`📊 ${rows.length} transações carregadas`);
    }).catch(err => {
      showToast('❌ Erro ao ler Excel: ' + err.message, true);
    });
  }

  function getConfig() {
    return {
      contaDebito:        document.getElementById('uc-contaDebito')?.value?.trim() || '00003001',
      contaCredito:       document.getElementById('uc-contaCredito')?.value?.trim() || '00004001',
      contaDebitoSaida:   document.getElementById('uc-contaDebitoSaida')?.value?.trim() || '00005001',
      contaCreditoSaida:  document.getElementById('uc-contaCreditoSaida')?.value?.trim() || '00003001',
      codigoHistorico:    document.getElementById('uc-codigoHistorico')?.value?.trim() || '00000001',
      filtroMes:          document.getElementById('uc-filtroMes')?.value || '',
      cnpjDebito:         (document.getElementById('uc-cnpjDebito')?.value || '').replace(/\D/g,''),
      cnpjCredito:        (document.getElementById('uc-cnpjCredito')?.value || '').replace(/\D/g,''),
      incluirDocumento:   document.getElementById('uc-incluirDocumento')?.checked ?? true,
    };
  }

  function updatePreview() {
    if (!_rows.length) return;
    const cfg = getConfig();
    const txt = convertRows(_rows, cfg);
    _lastTxt = txt;

    const lines = txt.split('\r\n');
    const statsEl = document.getElementById('unico-stats');
    if (statsEl) {
      const totalEntradas = _rows.filter(r => parseFloat(r['ENTRADAS']||0) > 0).length;
      const totalSaidas   = _rows.filter(r => parseFloat(r['SAIDAS']||0) > 0).length;
      statsEl.innerHTML = `
        <div class="unico-stat-badge">📋 ${lines.length} linhas</div>
        <div class="unico-stat-badge" style="background:#0f4c2a;color:#34d399">📥 ${totalEntradas} entradas</div>
        <div class="unico-stat-badge" style="background:#4c0f0f;color:#f87171">📤 ${totalSaidas} saídas</div>
      `;
    }

    const prev = document.getElementById('unico-preview');
    if (prev) {
      const preview = lines.slice(0, 10).map(l =>
        `<div class="unico-preview-line">${escapeHtml(l)}</div>`
      ).join('');
      prev.innerHTML = preview + (lines.length > 10
        ? `<div style="color:#64748b;font-size:11px;margin-top:8px">... e mais ${lines.length - 10} linhas</div>`
        : '');
    }
  }

  function generateAndDownload() {
    if (!_rows.length) { showToast('❌ Nenhum arquivo carregado', true); return; }
    const cfg = getConfig();
    const txt = convertRows(_rows, cfg);
    _lastTxt = txt;
    const mes = cfg.filtroMes ? `_${cfg.filtroMes}` : '';
    download(txt, `exportacao_unico${mes}.txt`);
    showToast('✅ Arquivo TXT Único gerado!');
  }

  function copyToClipboard() {
    if (!_lastTxt) { showToast('❌ Gere o arquivo primeiro', true); return; }
    navigator.clipboard.writeText(_lastTxt).then(() => {
      showToast('📋 Copiado para área de transferência!');
    });
  }

  function showToast(msg, isError = false) {
    const el = document.getElementById('unico-toast');
    if (!el) return;
    el.textContent = msg;
    el.style.background = isError ? '#ef4444' : '#10b981';
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 3500);
  }

  function escapeHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // API pública
  return { renderPage, onDrop, onFileSelect, updatePreview, generateAndDownload, copyToClipboard, convertRows };

})();

// Tornar global
window.UnicoExport = UnicoExport;
