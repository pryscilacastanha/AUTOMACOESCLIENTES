// ──────────────────────────────────────────────
// supabase-client.js — Inicialização Nuvem
// Integrado para migrar de localStorage puro
// ──────────────────────────────────────────────

// As variáveis podem ser lidas via window.location ou podem ser fixadas (desde que Anon Key)
// Mas aqui passamos as chaves que você configurou
const SUPA_URL = 'https://ejoebtfxrxondkeftsgf.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqb2VidGZ4cnhvbmRrZWZ0c2dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MjIxMzEsImV4cCI6MjA5MTE5ODEzMX0.ZaxU9y1RHH3nNH3IejqdAI7Ambm2YmbkAQrzyRCRq-s';

// Client global
window.supabase = window.supabase || null;
if (window.supabase && window.supabase.createClient) {
  window.supabaseAPI = window.supabase.createClient(SUPA_URL, SUPA_ANON);
}

window.CloudDB = {
  async pullAll() {
    if (!window.supabaseAPI) return;
    try {
      const { data, error } = await window.supabaseAPI.from('app_data').select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        data.forEach(row => {
          // Atualiza localStorage com o que veio da nuvem
          localStorage.setItem(row.id, JSON.stringify(row.data));
        });
      }
    } catch (e) {
      console.warn("Aviso: Supabase app_data ainda nao existe ou vazio.", e);
    }
  },

  async push(key, val) {
    if (!window.supabaseAPI) return;
    try {
      await window.supabaseAPI.from('app_data').upsert({ id: key, data: val });
    } catch (e) {
      console.warn("Aviso CloudDB Push:", e);
    }
  }
};
