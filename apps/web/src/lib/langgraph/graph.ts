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
import { MemoryManager } from "./memory-manager";

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
	agent_calls: Annotation<Record<string, number>>({
		reducer: (existing, update) => {
			const result: Record<string, number> = { ...existing };
			for (const [key, value] of Object.entries(update || {})) {
				const incoming = Number(value ?? 0);
				result[key] = (result[key] ?? 0) + incoming;
			}
			return result;
		},
		default: () => ({}),
	}),
	summary: Annotation<string>({
		value: (_, update) => update,
		default: () => "",
	}),
	turn: Annotation<number>({
		value: (_, update) => update,
		default: () => 0,
	}),
});

const graph = new StateGraph(StateAnnotation)
	.addNode("router", routerNode)
	.addNode("summarize_conversation", MemoryManager.summarizeMessages)

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

	.addConditionalEdges(
		"chat_agent",
		(state) => {
			const turn = state.turn ?? 1;
			const shouldSummarize = turn >= 10 && turn % 5 === 0;

			return shouldSummarize ? "summarize_conversation" : "__end__";
		},
		{
			summarize_conversation: "summarize_conversation",
			__end__: "__end__",
		},
	)
	.addEdge("summarize_conversation", "__end__");

// Create a function to get the agent with a custom memory manager
export function createAgent(memoryManager?: MemorySaver) {
	return graph.compile({
		checkpointer: memoryManager || new MemorySaver(),
	});

	// return graph.compile();
}

// Default agent with MemorySaver for backward compatibility
export const agent = createAgent();
