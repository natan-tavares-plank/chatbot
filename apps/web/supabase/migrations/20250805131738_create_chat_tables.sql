BEGIN;

-- Chat sessions table
CREATE TABLE IF NOT EXISTS chats (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat summaries table
CREATE TABLE IF NOT EXISTS summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES chats(user_id) ON DELETE CASCADE,
  summary_text TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table with role-based structure
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES chats(user_id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_chat_user_updated ON chats(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_summaries_chat_id ON summaries(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON messages(chat_id, updated_at DESC);

-- Update trigger function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';


-- Apply update triggers
CREATE OR REPLACE TRIGGER update_chat_updated_at BEFORE UPDATE ON chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_summaries_updated_at BEFORE UPDATE ON summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Optional: Add RLS (Row Level Security) policies if using Supabase
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can only access their own chats" ON chats;
DROP POLICY IF EXISTS "Users can only access summaries of their chats" ON summaries;
DROP POLICY IF EXISTS "Users can only access messages of their chats" ON messages;

CREATE POLICY "Users can only access their own chats" ON chats
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access summaries of their chats" ON summaries
    FOR ALL USING (EXISTS (
        SELECT 1 FROM chats WHERE chats.user_id = summaries.chat_id AND chats.user_id = auth.uid()
    ));

CREATE POLICY "Users can only access messages of their chats" ON messages
    FOR ALL USING (EXISTS (
        SELECT 1 FROM chats WHERE chats.user_id = messages.chat_id AND chats.user_id = auth.uid()
    ));

COMMIT;