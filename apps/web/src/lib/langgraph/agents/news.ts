import { makeAgentNode } from ".";

export const newsAgent = makeAgentNode({
	name: "news_agent",
	destinations: ["supervisor"],
	systemPrompt: [
		"You are a news agent. You are responsible for finding the latest news",
		"If you need general information, ask 'supervisor' for help. ",
		"If you have enough information to respond to the user, return 'finish'. ",
		"Never mention other agents by name.",
	].join(" "),
});

// TODO: Add a tool to search the web for the latest news
