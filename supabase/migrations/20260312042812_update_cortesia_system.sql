/*
  # Updated Cortesia (Courtesy Ticket) System

  1. New Fields
    - `ticket_codes` table: Stores all generated ticket codes with unique identifiers
    - `users` profile table: Stores user roles (admin, user)
    - Updated `cortesias` table with new fields

  2. New Tables
    - `ticket_codes`: Individual courtesy ticket codes
      - `id` (uuid, primary key)
      - `code` (text, unique) - Format: CINEX00001
      - `cortesia_request_id` (uuid) - Links to cortesia request
      - `status` (text) - pending, redeemed, expired
      - `created_at` (timestamp)
      
    - `user_profiles`: User role management
      - `user_id` (uuid, primary key)
      - `role` (text) - 'admin' or 'user'
      - `created_at` (timestamp)

  3. Modified Tables
    - `cortesias` with new fields:
      - `numero_ingressos` (integer) - Number of tickets
      - `unidade` (text) - Unit (Cinex Goiânia, Cinex Araguaína, Cinex Palmas, Cinex Gurupi, Cinex São Luís)
      - `solicitante` (text) - Requester name
      - `motivo` (text) - Reason for courtesy tickets
      - `data_validade` (date) - Expiration date
      - `email_entrega` (text) - Delivery email
      - `codigo_inicial` (text) - Starting code for this request (e.g., CINEX00001)

  4. Security
    - Enable RLS on all tables
    - Admin can view all requests and codes
    - Users can only view their own requests
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cortesias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  numero_ingressos integer NOT NULL,
  unidade text NOT NULL,
  solicitante text NOT NULL,
  motivo text NOT NULL,
  data_validade date NOT NULL,
  email_entrega text NOT NULL,
  codigo_inicial text NOT NULL,
  status text NOT NULL DEFAULT 'generated',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ticket_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cortesia_id uuid REFERENCES cortesias(id) ON DELETE CASCADE NOT NULL,
  code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  redeemed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cortesias ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can view own cortesias"
  ON cortesias FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can create cortesias"
  ON cortesias FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cortesias"
  ON cortesias FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can view own ticket codes"
  ON ticket_codes FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM cortesias WHERE cortesias.id = ticket_codes.cortesia_id 
    AND (cortesias.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'
    ))
  ));

CREATE POLICY "Users can create ticket codes"
  ON ticket_codes FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM cortesias WHERE cortesias.id = ticket_codes.cortesia_id 
    AND cortesias.user_id = auth.uid()
  ));
