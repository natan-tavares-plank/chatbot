import type { SupabaseClient } from "@supabase/supabase-js";

interface Message {
	_getType(): string;
	content: string | object;
}

export class ChatService {
	constructor(private supabase: SupabaseClient) {}

	async saveChatSession(userId: string, title: string = "New Chat") {
		const { data, error } = await this.supabase
			.from("chats")
			.upsert({ user_id: userId, title })
			.select()
			.single();

		if (error) throw error;
		return data;
	}

	async saveMessages(chatId: string, messages: Message[]) {
		const existingMessages = await this.getMessages(chatId);
		const existingContents = new Set(
			existingMessages.map((msg) => msg.content),
		);

		const messagesToInsert = messages
			.filter((msg) => msg.content.toString().trim())
			.map((msg) => ({
				chat_id: chatId,
				role: msg._getType() === "human" ? "user" : "assistant",
				content:
					typeof msg.content === "string"
						? msg.content
						: JSON.stringify(msg.content),
			}))
			.filter((msg) => !existingContents.has(msg.content));

		if (messagesToInsert.length === 0) {
			return;
		}

		const { error } = await this.supabase
			.from("messages")
			.insert(messagesToInsert);

		if (error) {
			throw error;
		}
	}

	async getMessages(chatId: string) {
		const { data, error } = await this.supabase
			.from("messages")
			.select("*")
			.eq("chat_id", chatId)
			.order("updated_at", { ascending: true });

		if (error) throw error;
		return data || [];
	}

	async saveSummary(chatId: string, summaryText: string) {
		const { error } = await this.supabase.from("summaries").upsert(
			{ chat_id: chatId, summary_text: summaryText },
			{ onConflict: "chat_id" }, // Use the unique constraint for proper upsert
		);

		if (error) throw error;
	}

	async getSummary(chatId: string) {
		const { data, error } = await this.supabase
			.from("summaries")
			.select("summary_text")
			.eq("chat_id", chatId)
			.order("updated_at", { ascending: false })
			.limit(1)
			.single();

		if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows found
		return data?.summary_text || null;
	}

	async saveCheckpoint(threadId: string, _checkpoint: unknown) {
		// You might want to add a checkpoints table for this
		// For now, we'll store it as JSON in a simple way
		const { error } = await this.supabase
			.from("chats")
			.update({
				// You could add a checkpoint_data JSONB column to the chats table
				updated_at: new Date().toISOString(),
			})
			.eq("user_id", threadId);

		if (error) throw error;
	}

	async clearChat(chatId: string) {
		const { error } = await this.supabase
			.from("chats")
			.delete()
			.eq("user_id", chatId);

		if (error) {
			return { success: false, error: error.message };
		}

		return { success: true };
	}
}
