import type { MessagesAnnotation } from "@langchain/langgraph";

export type ChatState = typeof MessagesAnnotation.State & {
	conversation_id: string;
	summary?: string;
	route?: Agent;
	weather_data: string | null;
	news_data: string | null;
	agents_calls: Record<Agent, number>;
};

/**
 * The agents that can be used in the chat.
 */
export enum Agent {
	CHAT = "chat_agent",
	WEATHER = "weather_agent",
	NEWS = "news_agent",
}
