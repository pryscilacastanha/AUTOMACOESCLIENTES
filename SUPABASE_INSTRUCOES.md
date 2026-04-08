# Conexão com Supabase

Para que os dados persistam de forma definitiva na nuvem (no Supabase) e funcionem perfeitamente onde você abrir seu sistema, precisamos criar apenas uma tabela lá para espelhar nosso sistema.

**Instruções Rápidas em 3 Passos:**

1. Acesse o painel do seu projeto no Supabase (https://supabase.com/dashboard)
2. Vá até a seção **SQL Editor** no menu esquerdo (ícone de </>).
3. Cole e rode o bloco de código abaixo:

```sql
-- Cria a tabela chave-valor para guardar os dados do sistema
CREATE TABLE public.app_data (
    id text primary key,
    data jsonb not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Permite leitura e acesso para os usuários
ALTER TABLE public.app_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso publico"
ON public.app_data
FOR ALL
USING (true)
WITH CHECK (true);
```

Após fazer isso dentro do Supabase, nós poderemos ligar nosso cliente do Frontend para salvar diretamente no banco de dados todas as alterações que você ou outros usuários façam, como as rotinas contábeis de clientes e as checklist!

O código backend do **Supabase** dentro do JavaScript já será construído para conversar com essa tabela `app_data`. Pela flexibilidade dela, todos os seus menus de Clients, Auditoria, Parecer etc. funcionarão de imediato na nuvem!
