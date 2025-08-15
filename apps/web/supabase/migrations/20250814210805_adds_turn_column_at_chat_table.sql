BEGIN;

ALTER TABLE chats ADD COLUMN turn INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION increment_chat_turn(p_chat_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE chats 
    SET turn = turn + 1 
    WHERE user_id = p_chat_id;
END;
$$ LANGUAGE plpgsql;

COMMIT;