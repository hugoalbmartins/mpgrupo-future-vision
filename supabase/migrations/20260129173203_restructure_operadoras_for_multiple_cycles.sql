/*
  # Restructure Operadoras for Multiple Pricing Cycles

  1. Changes
    - Add `ciclos_disponiveis` array column to track which pricing cycles the operator supports
    - Add `tarifas` JSONB column to store cycle-specific pricing and daily power costs
    - Remove old individual pricing columns (will be migrated to new structure)
    - Preserve existing data by migrating to new structure

  2. New Structure
    - ciclos_disponiveis: array of 'simples', 'bi-horario', 'tri-horario'
    - tarifas: {
        "simples": {
          "valor_kwh": number,
          "valor_diario_potencias": {...}
        },
        "bi-horario": {
          "valor_kwh_vazio": number,
          "valor_kwh_fora_vazio": number,
          "valor_diario_potencias": {...}
        },
        "tri-horario": {
          "valor_kwh_vazio": number,
          "valor_kwh_cheias": number,
          "valor_kwh_ponta": number,
          "valor_diario_potencias": {...}
        }
      }
*/

-- Add new columns
ALTER TABLE operadoras 
ADD COLUMN IF NOT EXISTS ciclos_disponiveis text[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS tarifas jsonb DEFAULT '{}'::jsonb;

-- Migrate existing data to new structure
UPDATE operadoras
SET 
  ciclos_disponiveis = ARRAY['simples', 'bi-horario', 'tri-horario']::text[],
  tarifas = jsonb_build_object(
    'simples', jsonb_build_object(
      'valor_kwh', valor_kwh_simples,
      'valor_diario_potencias', valor_diario_potencias
    ),
    'bi-horario', jsonb_build_object(
      'valor_kwh_vazio', valor_kwh_vazio,
      'valor_kwh_fora_vazio', valor_kwh_fora_vazio,
      'valor_diario_potencias', valor_diario_potencias
    ),
    'tri-horario', jsonb_build_object(
      'valor_kwh_vazio', valor_kwh_vazio,
      'valor_kwh_cheias', valor_kwh_cheias,
      'valor_kwh_ponta', valor_kwh_ponta,
      'valor_diario_potencias', valor_diario_potencias
    )
  )
WHERE ciclos_disponiveis = ARRAY[]::text[];

-- Drop old columns (keeping them for now for backwards compatibility during transition)
-- Will be removed in a future migration after confirming everything works
-- ALTER TABLE operadoras 
-- DROP COLUMN IF EXISTS valor_kwh_simples,
-- DROP COLUMN IF EXISTS valor_kwh_vazio,
-- DROP COLUMN IF EXISTS valor_kwh_fora_vazio,
-- DROP COLUMN IF EXISTS valor_kwh_ponta,
-- DROP COLUMN IF EXISTS valor_kwh_cheias,
-- DROP COLUMN IF EXISTS valor_diario_potencias;