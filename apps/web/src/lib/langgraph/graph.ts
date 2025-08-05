import type { BaseMessage } from "@langchain/core/messages";
import {
	Annotation,
	StateGraph,
} from "@langchain/langgraph";
import { routerNode } from "./agents";
import { chatAgent } from "./agents/chat.agent";
import { newsAgent } from "./agents/news.agent";
import { weatherAgent } from "./agents/weather.agent";


const StateAnnotation = Annotation.Root({
	messages: Annotation<BaseMessage[]>({
		reducer: (_existing, update) => {
			return _existing.concat(Array.isArray(update) ? update : [update]);
		},
		default: () => [],
	}),
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
});

const graph = new StateGraph(StateAnnotation)
	.addNode("router", routerNode)

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

	.addEdge("chat_agent", "__end__");

export const agent = graph.compile();
