/*
  # Cortesia (Courtesy Ticket) System Database Schema

  1. New Tables
    - `cortesias` (courtesy tickets)
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `nome` (text) - Name
      - `email` (text) - Email
      - `telefone` (text) - Phone
      - `cinema` (text) - Cinema name
      - `filme` (text) - Movie name
      - `data_sessao` (date) - Session date
      - `horario` (text) - Session time
      - `quantidade` (integer) - Number of tickets
      - `observacoes` (text) - Notes/observations
      - `status` (text) - Status (pending, approved, rejected)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `cortesias` table
    - Add policies for authenticated users to:
      - View their own tickets
      - Create new tickets
      - Update their own tickets
      - Delete their own tickets
*/

CREATE TABLE IF NOT EXISTS cortesias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL,
  email text NOT NULL,
  telefone text,
  cinema text NOT NULL,
  filme text NOT NULL,
  data_sessao date NOT NULL,
  horario text NOT NULL,
  quantidade integer NOT NULL DEFAULT 1,
  observacoes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cortesias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets"
  ON cortesias FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets"
  ON cortesias FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tickets"
  ON cortesias FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tickets"
  ON cortesias FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);