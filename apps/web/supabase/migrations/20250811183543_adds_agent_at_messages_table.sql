BEGIN;

ALTER TABLE messages ADD COLUMN agents VARCHAR[] DEFAULT '{"chat_agent"}';

COMMIT;