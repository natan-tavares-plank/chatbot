import {
	AIMessage,
	HumanMessage,
	SystemMessage,
} from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const MAX_MESSAGES_BEFORE_SUMMARY = 20;
const SUMMARY_KEEP_RECENT = 5;

interface ChatState {
	user_id: string;
	conversation_id: string;
	messages: (HumanMessage | AIMessage | SystemMessage)[];
	summary?: string;
	total_messages: number;
}

/**
 * MemoryManager is a class that manages the memory of the chatbot.
 * It is responsible for loading the conversation history from the database,
 * saving the messages to the database, and creating a summary of the conversation.
 * It also checks if the conversation has reached a certain number of messages
 * and creates a summary of the older messages.
 */
export class MemoryManager {
	private llm: ChatOpenAI;
	private supabase: SupabaseClient | null = null;

	constructor() {
		this.llm = new ChatOpenAI({
			modelName: "gpt-4o-mini",
			temperature: 0,
		});

		console.log("max messages before summary", MAX_MESSAGES_BEFORE_SUMMARY);
		console.log("summary keep recent", SUMMARY_KEEP_RECENT);
	}

	private async getSupabaseClient(): Promise<SupabaseClient> {
		if (!this.supabase) {
			this.supabase = await createClient();
		}
		return this.supabase;
	}

	async loadConversationHistory(
		userId: string,
		conversationId: string,
	): Promise<ChatState> {
		try {
			const supabase = await this.getSupabaseClient();

			// Get latest conversation summary
			const { data: summaryData } = await supabase
				.from("conversation_summaries")
				.select("*")
				.eq("user_id", userId)
				.eq("conversation_id", conversationId)
				.order("created_at", { ascending: false })
				.limit(1);

			// Get all messages for this conversation
			const { data: messagesData } = await supabase
				.from("chat_messages")
				.select("*")
				.eq("user_id", userId)
				.eq("conversation_id", conversationId)
				.order("created_at", { ascending: true });

			const state: ChatState = {
				user_id: userId,
				conversation_id: conversationId,
				messages: [],
				summary: undefined,
				total_messages: messagesData?.length || 0,
			};

			// Add summary if exists and get messages after summary
			let messagesToLoad = messagesData || [];

			if (summaryData && summaryData.length > 0) {
				const latestSummary = summaryData[0];
				state.summary = latestSummary.summary_text;

				// Only load messages created after the summary
				messagesToLoad =
					messagesData?.filter(
						(msg) =>
							new Date(msg.created_at) > new Date(latestSummary.created_at),
					) || [];
			}

			// Convert database messages to LangChain format
			for (const msgData of messagesToLoad) {
				let message: HumanMessage | AIMessage | SystemMessage;
				switch (msgData.role) {
					case "human":
						message = new HumanMessage({ content: msgData.content });
						break;
					case "assistant":
						message = new AIMessage({ content: msgData.content });
						break;
					default:
						message = new SystemMessage({ content: msgData.content });
				}
				state.messages.push(message);
			}

			return state;
		} catch (error) {
			console.error("Error loading conversation history:", error);
			return {
				user_id: userId,
				conversation_id: conversationId,
				messages: [],
				total_messages: 0,
			};
		}
	}

	async storeMessage(
		userId: string,
		conversationId: string,
		role: "human" | "assistant" | "system",
		content: string,
	): Promise<boolean> {
		try {
			const supabase = await this.getSupabaseClient();
			const { error } = await supabase.from("chat_messages").insert({
				user_id: userId,
				conversation_id: conversationId,
				role,
				content,
				created_at: new Date().toISOString(),
			});

			if (error) throw error;
			return true;
		} catch (error) {
			console.error("Error saving message:", error);
			return false;
		}
	}

	async createSummary(
		messages: (HumanMessage | AIMessage | SystemMessage)[],
	): Promise<string> {
		try {
			const conversationText = messages
				.map(
					(msg) =>
						`${msg.constructor.name.replace("Message", "")}: ${msg.content}`,
				)
				.join("\n");

			const summaryPrompt = `
          Please create a concise summary of the following conversation that captures:
          1. Main topics discussed
          2. Key decisions or conclusions
          3. Important context for future reference
          4. User preferences or requirements mentioned
  
          Conversation:
          ${conversationText}
  
          Summary:
        `;

			const response = await this.llm.invoke([
				new SystemMessage({ content: summaryPrompt }),
			]);

			return response.content as string;
		} catch (error) {
			console.error("Error creating summary:", error);
			return "Summary generation failed";
		}
	}

	async checkAndSummarize(state: ChatState): Promise<ChatState> {
		const currentMessageCount = state.messages.length;

		if (currentMessageCount >= MAX_MESSAGES_BEFORE_SUMMARY) {
			// Create summary of older messages (keep recent ones)
			const messagesToSummarize = state.messages.slice(0, -SUMMARY_KEEP_RECENT);
			const recentMessages = state.messages.slice(-SUMMARY_KEEP_RECENT);

			const newSummary = await this.createSummary(messagesToSummarize);

			// Combine with existing summary if present
			const combinedSummary = state.summary
				? `${state.summary}\n\nRecent activity:\n${newSummary}`
				: newSummary;

			// Save summary to database
			await this.storeSummary(
				state.user_id,
				state.conversation_id,
				combinedSummary,
				state.total_messages,
			);

			// Update state
			return {
				...state,
				messages: recentMessages,
				summary: combinedSummary,
			};
		}

		return state;
	}

	async storeSummary(
		userId: string,
		conversationId: string,
		summaryText: string,
		messageCount: number,
	): Promise<boolean> {
		try {
			const supabase = await this.getSupabaseClient();
			const { error } = await supabase.from("conversation_summaries").insert({
				user_id: userId,
				conversation_id: conversationId,
				summary_text: summaryText,
				message_count: messageCount,
				created_at: new Date().toISOString(),
			});

			if (error) throw error;
			return true;
		} catch (error) {
			console.error("Error saving summary:", error);
			return false;
		}
	}

	async deleteUserMessages(
		userId: string,
		conversationId: string,
		messageIds?: string[],
	): Promise<boolean> {
		try {
			const supabase = await this.getSupabaseClient();
			let query = supabase
				.from("chat_messages")
				.delete()
				.eq("user_id", userId)
				.eq("conversation_id", conversationId);

			if (messageIds && messageIds.length > 0) {
				query = query.in("id", messageIds);
			}

			const { error } = await query;
			if (error) throw error;

			// Also delete related summaries if all messages are deleted
			if (!messageIds) {
				await supabase
					.from("conversation_summaries")
					.delete()
					.eq("user_id", userId)
					.eq("conversation_id", conversationId);
			}

			return true;
		} catch (error) {
			console.error("Error deleting messages:", error);
			return false;
		}
	}
}
