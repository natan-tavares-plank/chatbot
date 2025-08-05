import {
	Annotation,
	MemorySaver,
	MessagesAnnotation,
	StateGraph,
} from "@langchain/langgraph";
import { routerNode } from "./agents";
import { chatAgent } from "./agents/chat.agent";
import { newsAgent } from "./agents/news.agent";
import { weatherAgent } from "./agents/weather.agent";
import { summarizeMessages } from "./memory-manager";

export const StateAnnotation = Annotation.Root({
	...MessagesAnnotation.spec,
	goto: Annotation<string>({
		value: (_existing, update) => update,
		default: () => "chat_agent",
	}),
	weather_data: Annotation<string | null>({
		value: (_existing, update) => update,
		default: () => null,
	}),
	news_data: Annotation<string | null>({
		value: (_existing, update) => update,
		default: () => null,
	}),
	current_agent: Annotation<string>({
		value: (_existing, update) => update,
		default: () => "",
	}),
	summary: Annotation<string>({
		value: (_, update) => update,
		default: () => "",
	}),
});

const graph = new StateGraph(StateAnnotation)
	.addNode("router", routerNode)
	.addNode("summarize_conversation", summarizeMessages)

	// Agent nodes
	.addNode("chat_agent", chatAgent)
	.addNode("news_agent", newsAgent)
	.addNode("weather_agent", weatherAgent)

	// edges
	.addEdge("__start__", "router")

	.addConditionalEdges("router", (state) => state.goto, {
		chat_agent: "chat_agent",
		weather_agent: "weather_agent",
		news_agent: "news_agent",
		default: "chat_agent",
	})

	.addEdge("weather_agent", "chat_agent")
	.addEdge("news_agent", "chat_agent")

	.addEdge("chat_agent", "summarize_conversation")
	.addEdge("summarize_conversation", "__end__");

// Create a function to get the agent with a custom memory manager
export function createAgent(memoryManager?: any) {
	return graph.compile({
		checkpointer: memoryManager || new MemorySaver(),
	});
}

// Default agent with MemorySaver for backward compatibility
export const agent = createAgent();
