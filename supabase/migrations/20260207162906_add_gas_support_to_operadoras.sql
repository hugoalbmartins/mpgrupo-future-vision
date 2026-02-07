/*
  # Adicionar Suporte de Gás às Operadoras

  1. Alterações na Tabela `operadoras`
    - Adicionar coluna `tipos_energia` (array de text) para indicar se a operadora suporta 'eletricidade', 'gas' ou ambos
    - Por defeito, todas as operadoras existentes terão apenas 'eletricidade'
  
  2. Alterações na Tabela `operadoras`
    - Adicionar campos de tarifas de gás no objeto JSON `tarifas`:
      - `valor_diario_escalao_1` (EUR/dia)
      - `valor_diario_escalao_2` (EUR/dia)
      - `valor_diario_escalao_3` (EUR/dia)
      - `valor_diario_escalao_4` (EUR/dia)
      - `valor_kwh_gas` (EUR/kWh)
  
  3. Alterações na Tabela `configuracoes_descontos`
    - Adicionar coluna `tipo_energia` (text) para indicar se o desconto é para 'eletricidade', 'gas' ou 'dual'
    - Por defeito, todos os descontos existentes serão marcados como 'eletricidade'

  4. Notas
    - Não existem campos para remover, apenas adições
    - Todas as operadoras existentes continuarão a funcionar normalmente (apenas eletricidade)
    - Os descontos existentes continuarão a funcionar normalmente (apenas eletricidade)
*/

-- Adicionar coluna tipos_energia à tabela operadoras
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operadoras' AND column_name = 'tipos_energia'
  ) THEN
    ALTER TABLE operadoras 
    ADD COLUMN tipos_energia text[] DEFAULT ARRAY['eletricidade'];
  END IF;
END $$;

-- Adicionar coluna tipo_energia à tabela configuracoes_descontos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'configuracoes_descontos' AND column_name = 'tipo_energia'
  ) THEN
    ALTER TABLE configuracoes_descontos 
    ADD COLUMN tipo_energia text DEFAULT 'eletricidade';
  END IF;
END $$;

-- Atualizar operadoras existentes para ter tipos_energia
UPDATE operadoras 
SET tipos_energia = ARRAY['eletricidade']
WHERE tipos_energia IS NULL OR tipos_energia = ARRAY[]::text[];

-- Atualizar descontos existentes para ter tipo_energia
UPDATE configuracoes_descontos 
SET tipo_energia = 'eletricidade'
WHERE tipo_energia IS NULL;
