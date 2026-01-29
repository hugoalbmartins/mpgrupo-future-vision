/*
  # Create WhatsApp Conversations Table

  ## Purpose
  This migration creates a table to store WhatsApp conversation history for AI-powered chatbot responses.
  The table maintains conversation context and enables personalized, contextual responses.

  ## New Tables
  
  ### `whatsapp_conversations`
  Stores all WhatsApp messages (both incoming from users and outgoing bot responses)
  
  **Columns:**
  - `id` (uuid, primary key) - Unique identifier for each message
  - `phone_number` (text, indexed) - User's phone number in international format
  - `message_text` (text) - Content of the message
  - `sender` (text) - Either 'user' or 'bot' to identify message origin
  - `created_at` (timestamptz) - Timestamp when message was received/sent
  - `metadata` (jsonb, nullable) - Additional data (message ID, status, etc.)

  ## Security

  ### Row Level Security (RLS)
  - RLS is enabled on the table
  - Only service role can access this data (no public policies)
  - This protects customer privacy and conversation data

  ## Indexes
  - Index on `phone_number` for fast conversation retrieval
  - Index on `created_at` for chronological ordering
  - Combined index on `phone_number` and `created_at` for optimal query performance

  ## Notes
  - Table is designed for edge function access via service role key
  - Conversations are preserved indefinitely for quality and training purposes
  - Consider implementing data retention policies in the future
*/

CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  message_text text NOT NULL,
  sender text NOT NULL CHECK (sender IN ('user', 'bot')),
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone 
  ON whatsapp_conversations(phone_number);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_created_at 
  ON whatsapp_conversations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone_created 
  ON whatsapp_conversations(phone_number, created_at DESC);

COMMENT ON TABLE whatsapp_conversations IS 'Stores WhatsApp conversation history for AI-powered chatbot context';
COMMENT ON COLUMN whatsapp_conversations.phone_number IS 'User phone number in international format (e.g., +351912345678)';
COMMENT ON COLUMN whatsapp_conversations.sender IS 'Message origin: user (incoming) or bot (outgoing response)';
COMMENT ON COLUMN whatsapp_conversations.metadata IS 'Additional message data like WhatsApp message ID, delivery status, etc.';
