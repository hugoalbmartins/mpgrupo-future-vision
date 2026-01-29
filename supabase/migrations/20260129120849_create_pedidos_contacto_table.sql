/*
  # Criar Tabela de Pedidos de Contacto

  1. Nova Tabela
    - `pedidos_contacto`
      - `id` (uuid, primary key)
      - `nome` (text) - Nome do cliente
      - `email` (text) - Email do cliente
      - `telefone` (text) - Telefone do cliente
      - `operadora_interesse` (text) - Operadora de interesse
      - `operadora_atual` (text) - Operadora atual do cliente
      - `potencia` (numeric) - Potência contratada
      - `poupanca_estimada` (numeric) - Poupança estimada da simulação
      - `dados_simulacao` (jsonb) - Dados completos da simulação
      - `mensagem` (text) - Mensagem adicional do cliente
      - `estado` (text) - Estado do pedido (novo, em_progresso, contactado, concluido)
      - `origem` (text) - Origem do pedido (web, whatsapp, simulador)
      - `created_at` (timestamptz) - Data de criação
      - `updated_at` (timestamptz) - Data de atualização

  2. Segurança
    - Habilitar RLS
    - Política para permitir inserção pública (formulário de contato)
    - Política para admin ler todos os pedidos

  3. Índices
    - Índice em `email` para pesquisas rápidas
    - Índice em `estado` para filtros
    - Índice em `created_at` para ordenação
*/

CREATE TABLE IF NOT EXISTS pedidos_contacto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text NOT NULL,
  telefone text,
  operadora_interesse text,
  operadora_atual text,
  potencia numeric,
  poupanca_estimada numeric,
  dados_simulacao jsonb,
  mensagem text,
  estado text DEFAULT 'novo' CHECK (estado IN ('novo', 'em_progresso', 'contactado', 'concluido')),
  origem text DEFAULT 'web' CHECK (origem IN ('web', 'whatsapp', 'simulador', 'outro')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pedidos_contacto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir inserção pública de pedidos de contacto"
  ON pedidos_contacto
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins podem ver todos os pedidos"
  ON pedidos_contacto
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'is_admin' = 'true'
    )
  );

CREATE POLICY "Admins podem atualizar pedidos"
  ON pedidos_contacto
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'is_admin' = 'true'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'is_admin' = 'true'
    )
  );

CREATE INDEX IF NOT EXISTS idx_pedidos_contacto_email ON pedidos_contacto(email);
CREATE INDEX IF NOT EXISTS idx_pedidos_contacto_estado ON pedidos_contacto(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_contacto_created_at ON pedidos_contacto(created_at DESC);

CREATE OR REPLACE FUNCTION update_pedidos_contacto_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pedidos_contacto_updated_at_trigger
  BEFORE UPDATE ON pedidos_contacto
  FOR EACH ROW
  EXECUTE FUNCTION update_pedidos_contacto_updated_at();
