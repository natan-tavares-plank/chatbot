import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { newsAgent } from "./agents/news";
import { supervisorAgent } from "./agents/supervisor";
import { weatherAgent } from "./agents/weather";

const graph = new StateGraph(MessagesAnnotation)
	.addNode("supervisor", supervisorAgent, {
		ends: ["news_agent", "weather_agent", "__end__"],
	})
	.addNode("news_agent", newsAgent, {
		ends: ["supervisor"],
	})
	.addNode("weather_agent", weatherAgent, {
		ends: ["supervisor"],
	})
	.addEdge("__start__", "supervisor");

export const agent = graph.compile();
