BEGIN;

-- Add unique constraint on chat_id to enable proper upserts
-- This ensures only one summary per chat exists
ALTER TABLE summaries ADD CONSTRAINT summaries_chat_id_unique UNIQUE (chat_id);

COMMIT;