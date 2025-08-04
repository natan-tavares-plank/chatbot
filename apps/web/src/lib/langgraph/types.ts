import type { MessagesAnnotation } from "@langchain/langgraph";

export type ChatState = typeof MessagesAnnotation.State & {
	conversation_id: string;
	summary?: string;
	current_agent?: string;
	route?: "weather_agent" | "news_agent" | "captain_byte";
};
