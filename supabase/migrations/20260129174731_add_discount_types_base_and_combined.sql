/*
  # Adicionar tipos de desconto: Base e DD+FE Combinado

  ## Descrição
  Esta migração adiciona novas colunas à tabela `configuracoes_descontos` para permitir
  a configuração de descontos em 4 cenários diferentes:
  
  1. **Desconto Base** (sem DD nem FE) - desconto direto aplicável sem condições
  2. **Desconto DD** (apenas Débito Direto) - já existente
  3. **Desconto FE** (apenas Fatura Eletrónica) - já existente
  4. **Desconto DD+FE** (ambos combinados) - novo, desconto adicional quando ambos são aplicados
  
  ## Mudanças
  
  ### Novas Colunas em `configuracoes_descontos`:
  - `desconto_base_potencia` (decimal) - % de desconto no termo de potência sem DD/FE
  - `desconto_base_energia` (decimal) - % de desconto no termo de energia sem DD/FE
  - `desconto_dd_fe_potencia` (decimal) - % de desconto no termo de potência com DD+FE
  - `desconto_dd_fe_energia` (decimal) - % de desconto no termo de energia com DD+FE
  
  ## Notas
  - Todos os descontos são opcionais e podem ser zero
  - Os valores padrão são 0 (sem desconto)
  - A lógica de aplicação será: base + DD + FE + DD_FE (se aplicável)
*/

-- Adicionar colunas de desconto base (sem DD nem FE)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'configuracoes_descontos' AND column_name = 'desconto_base_potencia'
  ) THEN
    ALTER TABLE configuracoes_descontos 
    ADD COLUMN desconto_base_potencia decimal(5, 2) DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'configuracoes_descontos' AND column_name = 'desconto_base_energia'
  ) THEN
    ALTER TABLE configuracoes_descontos 
    ADD COLUMN desconto_base_energia decimal(5, 2) DEFAULT 0;
  END IF;
END $$;

-- Adicionar colunas de desconto combinado DD+FE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'configuracoes_descontos' AND column_name = 'desconto_dd_fe_potencia'
  ) THEN
    ALTER TABLE configuracoes_descontos 
    ADD COLUMN desconto_dd_fe_potencia decimal(5, 2) DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'configuracoes_descontos' AND column_name = 'desconto_dd_fe_energia'
  ) THEN
    ALTER TABLE configuracoes_descontos 
    ADD COLUMN desconto_dd_fe_energia decimal(5, 2) DEFAULT 0;
  END IF;
END $$;

-- Adicionar comentários para documentação
COMMENT ON COLUMN configuracoes_descontos.desconto_base_potencia IS 
  'Desconto base no termo de potência (aplicável sem DD nem FE)';
  
COMMENT ON COLUMN configuracoes_descontos.desconto_base_energia IS 
  'Desconto base no termo de energia (aplicável sem DD nem FE)';
  
COMMENT ON COLUMN configuracoes_descontos.desconto_dd_potencia IS 
  'Desconto adicional no termo de potência com Débito Direto';
  
COMMENT ON COLUMN configuracoes_descontos.desconto_dd_energia IS 
  'Desconto adicional no termo de energia com Débito Direto';
  
COMMENT ON COLUMN configuracoes_descontos.desconto_fe_potencia IS 
  'Desconto adicional no termo de potência com Fatura Eletrónica';
  
COMMENT ON COLUMN configuracoes_descontos.desconto_fe_energia IS 
  'Desconto adicional no termo de energia com Fatura Eletrónica';
  
COMMENT ON COLUMN configuracoes_descontos.desconto_dd_fe_potencia IS 
  'Desconto adicional no termo de potência quando DD e FE são aplicados juntos';
  
COMMENT ON COLUMN configuracoes_descontos.desconto_dd_fe_energia IS 
  'Desconto adicional no termo de energia quando DD e FE são aplicados juntos';
