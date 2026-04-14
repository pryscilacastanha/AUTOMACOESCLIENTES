/* ═══════════════════════════════════════════════════════
   CONTÁBIL ENGINE — Sistema de Classificação Contábil
   Escrituração com plano de contas, filtros e lote
   ═══════════════════════════════════════════════════════ */

const CONTABIL = (() => {
  'use strict';

  // ── PLANO DE CONTAS 90011 (SCI) — carregado de plano-90011.js ──
  const PLANO = (typeof PLANO_90011 !== 'undefined') ? PLANO_90011 : [];

  // ── DADOS DE LANÇAMENTOS ──
  const LANC_KEY = 'contabil_lancamentos';
  let lancamentos = [];

  function loadLanc() {
    try {
      const raw = localStorage.getItem(LANC_KEY);
      lancamentos = raw ? JSON.parse(raw) : getDemoData();
    } catch { lancamentos = getDemoData(); }
  }

  function saveLanc() {
    localStorage.setItem(LANC_KEY, JSON.stringify(lancamentos));
  }

  function getDemoData() {
    return [
      { id:1, dia:'02', historico:'PIX RECEBIDO — VENDAS CARTÃO', documento:'053589', valor:158.56, tipo:'C', conta:'' },
      { id:2, dia:'02', historico:'PAGAMENTO TITULO — FORNECEDOR ALIMENTOS', documento:'514266', valor:1117.78, tipo:'D', conta:'' },
      { id:3, dia:'05', historico:'TARIFA BANCÁRIA MANUTENÇÃO', documento:'000001', valor:28.50, tipo:'D', conta:'04.2.2.02.001' },
      { id:4, dia:'10', historico:'DEP DINHEIRO CAIXA AG', documento:'007764', valor:5410.50, tipo:'C', conta:'' },
      { id:5, dia:'13', historico:'PIX ENVIADO — ALUGUEL IMÓVEL', documento:'571252', valor:5271.57, tipo:'D', conta:'04.2.1.04.001' },
      { id:6, dia:'15', historico:'PIX RECEBIDO — VENDA BALCÃO', documento:'088421', valor:3250.00, tipo:'C', conta:'' },
      { id:7, dia:'18', historico:'PAGAMENTO GPS — INSS FOLHA', documento:'125589', valor:958.66, tipo:'D', conta:'02.1.3.04.001' },
      { id:8, dia:'18', historico:'PAGAMENTO FGTS — CAIXA', documento:'125590', valor:1065.46, tipo:'D', conta:'02.1.3.04.003' },
      { id:9, dia:'20', historico:'PIX ENVIADO — FORNECEDOR BEBIDAS', documento:'629898', valor:10012.23, tipo:'D', conta:'' },
      { id:10, dia:'22', historico:'PIX RECEBIDO — IFOOD/DELIVERY', documento:'741523', valor:4820.30, tipo:'C', conta:'' },
      { id:11, dia:'25', historico:'PAGAMENTO DAS — SIMPLES NACIONAL', documento:'835712', valor:7937.00, tipo:'D', conta:'02.1.4.03.008' },
      { id:12, dia:'28', historico:'PIX RECEBIDO — VENDAS CARTÃO', documento:'912845', valor:6350.00, tipo:'C', conta:'' },
      { id:13, dia:'30', historico:'PAGAMENTO ENERGIA ELÉTRICA', documento:'456123', valor:1850.00, tipo:'D', conta:'04.2.1.04.003' },
      { id:14, dia:'30', historico:'PAGAMENTO HONORÁRIOS CONTÁBEIS', documento:'789456', valor:1200.00, tipo:'D', conta:'04.2.1.99.020' }
    ];
  }

  // ── HELPERS ──
  function fmt(v) { return v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' }); }

  function contaLabel(codigo) {
    if (!codigo) return '';
    const c = PLANO.find(p => p.codigo === codigo);
    return c ? `${c.codigo} — ${c.nome}` : codigo;
  }

  function contasAnaliticas() {
    return PLANO.filter(p => p.tipo === 'analitica');
  }

  // ══════════════════════════════════════════
  // RENDER PRINCIPAL
  // ══════════════════════════════════════════
  function render(el) {
    loadLanc();

    const totalC = lancamentos.filter(l=>l.tipo==='C').reduce((s,l)=>s+l.valor,0);
    const totalD = lancamentos.filter(l=>l.tipo==='D').reduce((s,l)=>s+l.valor,0);
    const classificados = lancamentos.filter(l=>l.conta).length;
    const pendentes = lancamentos.filter(l=>!l.conta).length;
    const pctClass = lancamentos.length ? Math.round(classificados/lancamentos.length*100) : 0;

    el.innerHTML = `
      <div class="ctb-module">
        <!-- KPIs -->
        <div class="kpi-grid" style="grid-template-columns:repeat(5,1fr)">
          <div class="kpi kpi-success"><div class="kpi-icon">📥</div><div class="kpi-label">Entradas (Crédito)</div><div class="kpi-value" style="color:#10b981">${fmt(totalC)}</div></div>
          <div class="kpi kpi-danger"><div class="kpi-icon">📤</div><div class="kpi-label">Saídas (Débito)</div><div class="kpi-value" style="color:#ef4444">${fmt(totalD)}</div></div>
          <div class="kpi kpi-primary"><div class="kpi-icon">💰</div><div class="kpi-label">Saldo</div><div class="kpi-value" style="color:${totalC-totalD>=0?'#10b981':'#ef4444'}">${fmt(totalC-totalD)}</div></div>
          <div class="kpi kpi-success"><div class="kpi-icon">✅</div><div class="kpi-label">Classificados</div><div class="kpi-value">${classificados}/${lancamentos.length}</div></div>
          <div class="kpi kpi-warning"><div class="kpi-icon">⏳</div><div class="kpi-label">Pendentes</div><div class="kpi-value">${pendentes}</div></div>
        </div>

        <!-- Progress -->
        <div class="onb-progress-mini" style="margin-bottom:16px;height:6px;border-radius:99px">
          <div class="onb-progress-mini-bar" style="width:${pctClass}%;background:${pctClass>=80?'#10b981':pctClass>=40?'#f59e0b':'#ef4444'};border-radius:99px"></div>
        </div>

        <!-- Lote -->
        <div class="card" style="margin-bottom:16px">
          <div class="card-body" style="padding:14px 20px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
            <span style="font-size:12px;font-weight:700;color:var(--text-2)">📦 Classificação em Lote:</span>
            <div style="position:relative;flex:1;min-width:250px">
              <input id="ctb-lote-input" type="text" list="ctb-lote-list" placeholder="🔍 Busque por código ou nome da conta..." style="width:100%;padding:8px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:inherit">
              <datalist id="ctb-lote-list">
                ${contasAnaliticas().map(c => `<option value="${c.codigo} — ${c.nome}">`).join('')}
              </datalist>
            </div>
            <select id="ctb-lote-tipo" style="padding:8px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:12px;font-weight:600">
              <option value="todos">Todos</option>
              <option value="D">Somente Débito</option>
              <option value="C">Somente Crédito</option>
              <option value="vazio">Somente sem conta</option>
            </select>
            <button class="btn btn-primary btn-sm" onclick="CONTABIL.aplicarLote()">Aplicar nos filtrados</button>
            <button class="btn btn-secondary btn-sm" onclick="CONTABIL.limparFiltros()">Limpar filtros</button>
          </div>
        </div>

        <!-- Tabela -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Lançamentos Contábeis</div>
            <div style="display:flex;gap:8px">
              <span class="badge badge-gray">${lancamentos.length} lançamentos</span>
              <span class="badge ${pctClass>=80?'badge-success':pctClass>=40?'badge-warning':'badge-danger'}">${pctClass}% classificado</span>
            </div>
          </div>
          <div class="card-body" style="padding:0;overflow-x:auto">
            <table class="ctb-table">
              <thead>
                <tr>
                  <th style="width:50px;text-align:center">Dia</th>
                  <th>Histórico</th>
                  <th style="width:90px">Documento</th>
                  <th style="width:110px;text-align:right">Débito</th>
                  <th style="width:110px;text-align:right">Crédito</th>
                  <th style="width:320px">Conta Contábil</th>
                </tr>
                <tr class="ctb-filter-row">
                  <th><input id="ctb-f-dia" class="ctb-filter" placeholder="Dia" oninput="CONTABIL.filtrar()"></th>
                  <th><input id="ctb-f-hist" class="ctb-filter" placeholder="Buscar histórico..." oninput="CONTABIL.filtrar()"></th>
                  <th><input id="ctb-f-doc" class="ctb-filter" placeholder="Doc" oninput="CONTABIL.filtrar()"></th>
                  <th><input id="ctb-f-deb" class="ctb-filter" placeholder="Valor" oninput="CONTABIL.filtrar()"></th>
                  <th><input id="ctb-f-cred" class="ctb-filter" placeholder="Valor" oninput="CONTABIL.filtrar()"></th>
                  <th><input id="ctb-f-conta" class="ctb-filter" placeholder="Buscar conta..." oninput="CONTABIL.filtrar()"></th>
                </tr>
              </thead>
              <tbody id="ctb-tbody"></tbody>
              <tfoot id="ctb-tfoot"></tfoot>
            </table>
          </div>
        </div>
      </div>
    `;

    filtrar();
  }

  // ══════════════════════════════════════════
  // FILTRAGEM
  // ══════════════════════════════════════════
  function getFiltros() {
    return {
      dia:   (document.getElementById('ctb-f-dia')?.value || '').toLowerCase(),
      hist:  (document.getElementById('ctb-f-hist')?.value || '').toLowerCase(),
      doc:   (document.getElementById('ctb-f-doc')?.value || '').toLowerCase(),
      deb:   (document.getElementById('ctb-f-deb')?.value || ''),
      cred:  (document.getElementById('ctb-f-cred')?.value || ''),
      conta: (document.getElementById('ctb-f-conta')?.value || '').toLowerCase()
    };
  }

  function aplicarFiltros() {
    const f = getFiltros();
    return lancamentos.filter(l => {
      if (f.dia && !l.dia.includes(f.dia)) return false;
      if (f.hist && !l.historico.toLowerCase().includes(f.hist)) return false;
      if (f.doc && !l.documento.toLowerCase().includes(f.doc)) return false;
      if (f.deb && !(l.tipo==='D' && l.valor.toString().includes(f.deb))) return false;
      if (f.cred && !(l.tipo==='C' && l.valor.toString().includes(f.cred))) return false;
      if (f.conta) {
        const cl = contaLabel(l.conta).toLowerCase();
        if (!cl.includes(f.conta) && !(l.conta||'').toLowerCase().includes(f.conta)) return false;
      }
      return true;
    });
  }

  function filtrar() {
    const lista = aplicarFiltros();
    const tbody = document.getElementById('ctb-tbody');
    const tfoot = document.getElementById('ctb-tfoot');
    if (!tbody) return;

    const optionsHtml = contasAnaliticas().map(c =>
      `<option value="${c.codigo} — ${c.nome}">`
    ).join('');

    tbody.innerHTML = lista.map(l => {
      const idx = lancamentos.indexOf(l);
      const deb = l.tipo === 'D' ? fmt(l.valor) : '';
      const cred = l.tipo === 'C' ? fmt(l.valor) : '';
      const contaVal = l.conta ? contaLabel(l.conta) : '';
      const rowClass = l.conta ? 'ctb-classified' : 'ctb-pending';

      return `<tr class="${rowClass}" data-idx="${idx}">
        <td style="text-align:center;font-weight:600">${l.dia}</td>
        <td style="font-size:12.5px">${l.historico}</td>
        <td style="font-family:monospace;font-size:11px;color:var(--text-3)">${l.documento}</td>
        <td style="text-align:right;font-weight:600;color:#ef4444">${deb}</td>
        <td style="text-align:right;font-weight:600;color:#10b981">${cred}</td>
        <td>
          <input type="text" list="ctb-dl-${idx}" value="${contaVal}" placeholder="🔍 Buscar conta..."
                 class="ctb-conta-input ${l.conta?'has-value':''}"
                 onchange="CONTABIL.setConta(${idx}, this.value)"
                 onfocus="this.select()">
          <datalist id="ctb-dl-${idx}">${optionsHtml}</datalist>
        </td>
      </tr>`;
    }).join('');

    // Totals
    let tC=0, tD=0;
    lista.forEach(l => { if(l.tipo==='C') tC+=l.valor; else tD+=l.valor; });

    tfoot.innerHTML = `<tr class="ctb-total-row">
      <td colspan="3" style="text-align:right;font-weight:700;font-size:13px">TOTAIS FILTRADOS →</td>
      <td style="text-align:right;font-weight:800;color:#ef4444;font-size:14px">${fmt(tD)}</td>
      <td style="text-align:right;font-weight:800;color:#10b981;font-size:14px">${fmt(tC)}</td>
      <td style="font-size:12px;color:var(--text-3)">${lista.filter(l=>l.conta).length}/${lista.length} classificados</td>
    </tr>`;
  }

  // ══════════════════════════════════════════
  // CONTA
  // ══════════════════════════════════════════
  function setConta(idx, value) {
    // Parse: "1.1.2 — Bancos" → extract code
    const match = value.match(/^([\d.]+)/);
    if (match) {
      lancamentos[idx].conta = match[1].trim();
    } else {
      lancamentos[idx].conta = '';
    }
    saveLanc();
    // Update row styling without full re-render
    const row = document.querySelector(`tr[data-idx="${idx}"]`);
    if (row) {
      row.className = lancamentos[idx].conta ? 'ctb-classified' : 'ctb-pending';
      const input = row.querySelector('.ctb-conta-input');
      if (input) input.classList.toggle('has-value', !!lancamentos[idx].conta);
    }
    updateKPIs();
  }

  function updateKPIs() {
    const classificados = lancamentos.filter(l=>l.conta).length;
    const pendentes = lancamentos.filter(l=>!l.conta).length;
    const pctClass = lancamentos.length ? Math.round(classificados/lancamentos.length*100) : 0;

    // Update badges
    const badges = document.querySelectorAll('.kpi-value');
    if (badges.length >= 5) {
      badges[3].textContent = `${classificados}/${lancamentos.length}`;
      badges[4].textContent = pendentes;
    }

    // Update progress bar
    const bar = document.querySelector('.onb-progress-mini-bar');
    if (bar) {
      bar.style.width = pctClass + '%';
      bar.style.background = pctClass>=80?'#10b981':pctClass>=40?'#f59e0b':'#ef4444';
    }
  }

  // ══════════════════════════════════════════
  // LOTE
  // ══════════════════════════════════════════
  function aplicarLote() {
    const input = document.getElementById('ctb-lote-input')?.value || '';
    const tipo = document.getElementById('ctb-lote-tipo')?.value || 'todos';

    // Extract code from input
    const match = input.match(/^([\d.]+)/);
    if (!match) {
      if (window.V) V.toast('Selecione ou digite uma conta válida', '⚠️');
      return;
    }
    const codigo = match[1].trim();

    const lista = aplicarFiltros();
    let count = 0;

    lista.forEach(l => {
      let apply = false;
      if (tipo === 'todos') apply = true;
      else if (tipo === 'D' && l.tipo === 'D') apply = true;
      else if (tipo === 'C' && l.tipo === 'C') apply = true;
      else if (tipo === 'vazio' && !l.conta) apply = true;

      if (apply) { l.conta = codigo; count++; }
    });

    saveLanc();
    filtrar();
    updateKPIs();

    if (window.V) V.toast(`${count} lançamento(s) classificados como ${contaLabel(codigo)}`, '✅');
  }

  function limparFiltros() {
    ['ctb-f-dia','ctb-f-hist','ctb-f-doc','ctb-f-deb','ctb-f-cred','ctb-f-conta'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    filtrar();
  }

  // ── PUBLIC API ──
  return { render, filtrar, setConta, aplicarLote, limparFiltros };
})();
