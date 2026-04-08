const AI_AGENT = {
  isOpen: false,
  history: [],
  
  toggle() {
    this.isOpen = !this.isOpen;
    document.getElementById('ai-chat-window').classList.toggle('open', this.isOpen);
    if(this.isOpen && this.history.length === 0) {
      this.addMessage('Olá! Sou a Assistente de IA da Criscontab. Posso ajudar analisando os dados dos seus clientes ou auxiliando com a plataforma. Como posso ajudar hoje?', 'ai');
    }
    if(this.isOpen) {
      setTimeout(() => document.getElementById('ai-chat-input-text').focus(), 100);
    }
  },

  addMessage(text, sender) {
    const chatMsgs = document.getElementById('ai-chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${sender}`;
    // Simple markdown formatting for bold
    msgDiv.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    chatMsgs.appendChild(msgDiv);
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
  },

  async sendMessage() {
    const inputField = document.getElementById('ai-chat-input-text');
    const btn = document.getElementById('ai-chat-submit');
    const text = inputField.value.trim();
    if(!text) return;

    if (!getApiKey()) {
      alert("Por favor, configure sua chave da API do Gemini na tela de configurações primeiro.");
      return;
    }

    // Add user msg
    this.addMessage(text, 'user');
    inputField.value = '';
    btn.disabled = true;

    // Build context state
    const clientes = DB.get('clientes') || [];
    const context = `
      CONTEXTO DO SISTEMA (Base de dados atual do escritório Criscontab & Madeira):
      - Total de Clientes: ${clientes.length}
      - Snapshot dos Clientes (ID, Nome, Documento, Status): ${JSON.stringify(clientes.map(c => ({id:c.id, nome:c.nome, doc:c.cnpj||c.cpf, status:c.status})))}
      (Para detalhes mais profundos, peça ao usuário para fornecer mais informações).
      O usuário é o contador ou administrador utilizando a plataforma SPA contábil.
      Responda de forma profissional mas amigável e concisa.
    `;

    this.history.push({ role: 'user', parts: [{ text }]});

    try {
      const response = await fetch(`${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${getApiKey()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: context }] },
          contents: this.history
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Erro na API');

      const aiText = data.candidates[0].content.parts[0].text;
      this.history.push({ role: 'model', parts: [{ text: aiText }]});
      this.addMessage(aiText, 'ai');

    } catch(err) {
      this.addMessage("Me desculpe, ocorreu um erro ao conectar com o meu motor de inteligência: " + err.message, 'ai');
    } finally {
      btn.disabled = false;
      inputField.focus();
    }
  }
};
