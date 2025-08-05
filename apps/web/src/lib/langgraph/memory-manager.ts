import {
	AIMessage,
	HumanMessage,
	RemoveMessage,
} from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";
import {
	BaseCheckpointSaver,
	type Checkpoint,
	type CheckpointTuple,
} from "@langchain/langgraph";
import type { createClient } from "../supabase/server";
import { ChatService } from "../supabase/service";
import { llm } from "./agents";
import type { StateAnnotation } from "./graph";

export class MemoryManager extends BaseCheckpointSaver<string> {
	private chatService: ChatService;

	constructor(
		private readonly supabase: Awaited<ReturnType<typeof createClient>>,
		private readonly threadId: string,
	) {
		super();
		// Initialize chat service directly since we have the client
		console.log("🔧 Initializing MemoryManager for thread:", threadId);
		this.chatService = new ChatService(supabase);
		console.log("✅ MemoryManager initialized");
	}

	private async initChatService() {
		return this.chatService;
	}

	async getTuple(config: RunnableConfig): Promise<CheckpointTuple | undefined> {
		// This is a simplified implementation
		// In a real scenario, you'd store and retrieve checkpoints from the database
		try {
			const threadId = config.configurable?.thread_id as string;
			if (!threadId) return undefined;

			// For now, return undefined to let LangGraph handle it
			// You could implement checkpoint storage/retrieval here
			return undefined;
		} catch (error) {
			console.error("Error getting checkpoint:", error);
			return undefined;
		}
	}

	async put(
		config: RunnableConfig,
		checkpoint: Checkpoint,
		metadata: Record<string, unknown>,
	): Promise<RunnableConfig> {
		try {
			const threadId = config.configurable?.thread_id as string;
			if (threadId) {
				console.log("💾 LangGraph put called for thread:", threadId);
				console.log("📦 Checkpoint data:", checkpoint);

				const chatService = await this.initChatService();

				// Extract state from checkpoint
				if (checkpoint.channel_values) {
					const state = checkpoint.channel_values;
					console.log("🔍 State in checkpoint:", state);

					// Save the state using our persistState method
					await this.persistState(state as typeof StateAnnotation.State);
				}

				// Also save checkpoint metadata if needed
				await chatService.saveCheckpoint(threadId, { checkpoint, metadata });
			}
		} catch (error) {
			console.error("❌ Error in put method:", error);
			console.error("🔍 Error details:", {
				threadId: config.configurable?.thread_id,
				checkpointKeys: checkpoint ? Object.keys(checkpoint) : "no checkpoint",
				errorMessage: error instanceof Error ? error.message : String(error),
			});
		}
		return config;
	}

	async putWrites(
		config: RunnableConfig,
		writes: Array<[string, unknown]>,
		taskId: string,
	): Promise<void> {
		// Implementation for putting writes - can be empty for now
		console.log("putWrites called", { config, writes, taskId });
	}

	async *list(
		_config: RunnableConfig,
		_options?: { limit?: number },
	): AsyncGenerator<CheckpointTuple> {
		// Return empty generator for now - implement if you need checkpoint history
		// You can add actual checkpoint retrieval logic here
		// This is an empty generator - no checkpoints to yield
	}

	async deleteThread(threadId: string): Promise<void> {
		try {
			const { error } = await this.supabase
				.from("messages")
				.delete()
				.eq("chat_id", threadId);

			if (error) throw error;
		} catch (error) {
			console.error("Error deleting thread:", error);
		}
	}

	async persistState(state: typeof StateAnnotation.State) {
		try {
			const { messages, summary } = state;
			const chatService = await this.initChatService();

			console.log("🔄 Persisting state for thread:", this.threadId);
			console.log("📝 Messages to save:", messages?.length || 0);

			// Ensure chat session exists
			await chatService.saveChatSession(this.threadId);
			console.log("✅ Chat session saved/updated");

			// Save messages to database
			if (messages && messages.length > 0) {
				console.log("💾 Saving messages...");
				await chatService.saveMessages(this.threadId, messages);
				console.log("✅ Messages saved successfully");
			}

			// Save summary if exists
			if (summary) {
				console.log("📄 Saving summary...");
				await chatService.saveSummary(this.threadId, summary);
				console.log("✅ Summary saved");
			}
		} catch (error) {
			console.error("❌ Error persisting state:", error);
			console.error("🔍 Error details:", {
				threadId: this.threadId,
				messageCount: state.messages?.length || 0,
				errorMessage: error instanceof Error ? error.message : String(error),
				errorStack: error instanceof Error ? error.stack : undefined,
			});
			// Re-throw the error so we can see it in the API response
			throw error;
		}
	}

	async loadState(): Promise<Partial<typeof StateAnnotation.State>> {
		try {
			const chatService = await this.initChatService();
			const [messages, summary] = await Promise.all([
				chatService.getMessages(this.threadId),
				chatService.getSummary(this.threadId),
			]);

			return {
				messages: messages.map((msg) => {
					if (msg.role === "user") {
						return new HumanMessage(msg.content);
					} else {
						return new AIMessage(msg.content);
					}
				}),
				summary: summary || "",
			};
		} catch (error) {
			console.error("Error loading state:", error);
			return {};
		}
	}

	async clearState(threadId: string) {
		try {
			// Clear from database
			const { error } = await this.supabase
				.from("messages")
				.delete()
				.eq("chat_id", threadId);

			if (error) throw error;
		} catch (err) {
			console.error("Error clearing state:", err);
		}
	}
}

// Export the summarizeMessages function for use in the graph
export async function summarizeMessages(state: typeof StateAnnotation.State) {
	const { summary, messages } = state;
	let summaryMessage = "";
	if (summary) {
		summaryMessage =
			`This is summary of the conversation to date: ${summary}\n\n` +
			"Extend the summary by taking into account the new messages above:";
	} else {
		summaryMessage = "Create a summary of the conversation above:";
	}

	const allMessages = [
		...messages,
		new HumanMessage({
			id: "<user-id>",
			content: summaryMessage,
		}),
	];

	const response = await llm.invoke(allMessages);
	const deleteMessages = messages.slice(0, -5).map((message) => {
		return new RemoveMessage({
			id: message.id || "unknown",
		});
	});

	if (typeof response.content !== "string") {
		throw new Error("Expected a string response from the model");
	}

	return { summary: response.content, messages: deleteMessages };
}
