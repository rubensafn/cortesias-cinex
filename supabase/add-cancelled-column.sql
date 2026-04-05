-- Adiciona coluna cancelled nas tabelas de códigos importados
ALTER TABLE imported_codes ADD COLUMN IF NOT EXISTS cancelled boolean NOT NULL DEFAULT false;
ALTER TABLE empresa_imported_codes ADD COLUMN IF NOT EXISTS cancelled boolean NOT NULL DEFAULT false;
