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
import { z } from "zod";
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
		this.chatService = new ChatService(supabase);
	}

	private async initChatService() {
		return this.chatService;
	}

	async getTuple(config: RunnableConfig): Promise<CheckpointTuple | undefined> {
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
				const chatService = await this.initChatService();

				// Extract state from checkpoint
				if (checkpoint.channel_values) {
					const state = checkpoint.channel_values;
					await this.persistState(state as typeof StateAnnotation.State);
				}

				// Also save checkpoint metadata if needed
				await chatService.saveCheckpoint(threadId, { checkpoint, metadata });
			}
		} catch (error) {
			console.error("Error in put method:", error);
		}
		return config;
	}

	async putWrites(
		_config: RunnableConfig,
		_writes: Array<[string, unknown]>,
		_taskId: string,
	): Promise<void> {
		// Implementation for putting writes - can be empty for now
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
			const { messages, summary, agent_calls } = state;
			const chatService = await this.initChatService();
			await chatService.saveChatSession(this.threadId);

			if (messages && messages.length > 0) {
				// Determine agents for the last assistant message from agent_calls keys
				const agentsForLastAssistant = agent_calls
					? Object.keys(agent_calls)
					: undefined;
				await chatService.saveMessages(
					this.threadId,
					messages,
					agentsForLastAssistant,
				);
			}

			if (summary) {
				await chatService.saveSummary(this.threadId, summary);
			}
		} catch (error) {
			throw error;
		}
	}

	async loadState(): Promise<Partial<typeof StateAnnotation.State>> {
		try {
			const chatService = await this.initChatService();

			const [allMessages, summary] = await Promise.all([
				chatService.getMessages(this.threadId),
				chatService.getSummary(this.threadId),
			]);

			const messagesToLoad = summary ? allMessages.slice(-5) : allMessages;

			return {
				messages: messagesToLoad.map((msg) => {
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

	if (messages.length < 8) {
		return state;
	}

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
			id: state?.messages[0]?.id || "unknown",
			content: summaryMessage,
		}),
	];

	const responseSchema = z.object({
		summary: z.string().describe("The summary of the conversation"),
	});

	const response = await llm
		.withStructuredOutput(responseSchema, {
			name: "summarize_conversation",
		})
		.invoke(allMessages);

	if (typeof response.summary !== "string") {
		throw new Error("Expected a string response from the model");
	}

	const recentMessages = messages.slice(-5);
	const messagesToRemoveFromState = messages.slice(0, -5);

	const removeFromState = messagesToRemoveFromState.map(
		(msg) => new RemoveMessage({ id: msg.id || "unknown" }),
	);

	return {
		...state,
		summary: response.summary,
		messages: [...removeFromState, ...recentMessages],
		// goto: state.goto,
		// weather_data: state.weather_data,
		// news_data: state.news_data,
		// agent_calls: state.agent_calls,
	};
}
