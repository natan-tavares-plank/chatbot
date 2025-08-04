import type { BaseMessage } from "@langchain/core/messages";
import { Annotation, StateGraph } from "@langchain/langgraph";
import { routerNode } from "./agents";
import { captainByteAgent } from "./agents/captain.agent";
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
		default: () => "captain_byte",
	}),
});

const graph = new StateGraph(StateAnnotation)
	.addNode("router", routerNode)

	// Agent nodes
	.addNode("captain_byte", captainByteAgent)
	.addNode("news_agent", newsAgent)
	.addNode("weather_agent", weatherAgent)

	// edges
	.addEdge("__start__", "router")
	.addConditionalEdges("router", (state) => state.goto, {
		captain_byte: "captain_byte",
		weather_agent: "weather_agent",
		news_agent: "news_agent",
		default: "captain_byte",
	})
	.addEdge("news_agent", "captain_byte")
	.addEdge("weather_agent", "captain_byte")
	.addEdge("captain_byte", "__end__");

export const agent = graph.compile();
