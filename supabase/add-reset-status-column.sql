/*
  # Adicionar coluna reset_status nas tabelas de usuários

  Rodar no SQL Editor do Supabase:
  https://supabase.com/dashboard/project/gdtfwmqbvsqtxtccrydv/sql/new

  Valores possíveis:
    NULL     → normal (sem recuperação em andamento)
    'pending' → usuário solicitou recuperação, aguardando aprovação
    'approved' → aprovado — na próxima tentativa de login, bypass de senha e troca forçada
*/

ALTER TABLE user_accounts
  ADD COLUMN IF NOT EXISTS reset_status text DEFAULT NULL;

ALTER TABLE empresa_user_accounts
  ADD COLUMN IF NOT EXISTS reset_status text DEFAULT NULL;
