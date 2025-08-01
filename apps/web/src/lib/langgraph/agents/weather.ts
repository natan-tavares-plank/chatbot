import { makeAgentNode } from ".";

export const weatherAgent = makeAgentNode({
	name: "weather_agent",
	destinations: ["supervisor"],
	systemPrompt: [
		"You are a weather agent. You are responsible for finding the latest weather in a given location.",
		"If you need general information, ask 'supervisor' for help. ",
		"If you have enough information to respond to the user, return 'finish'. ",
		"Never mention other agents by name.",
	].join(" "),
});

// TODO: Add a tool to search the web for the latest weather
