import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { Command } from "@langchain/langgraph";
import { weatherTool } from "../tools/weather.tool";
import type { ChatState } from "../types";
import { llm } from ".";

const systemPrompt = [
	"You are a weather specialist.",
	"Your job is to gather weather information using your weather tool.",
	"Provide a brief, factual summary of the weather information you gather.",
	"Keep your responses focused and concise.",
	"You must use the weather tool to get the weather data.",
].join("\n");

export const weatherAgent = async (state: ChatState): Promise<Command> => {
	const messages = [new SystemMessage(systemPrompt), ...state.messages];

	const response = await llm
		.bindTools([weatherTool], { strict: true, recursionLimit: 3 })
		.invoke(messages);

	let finalContent = response.content;
	let weatherData = null;

	// If the LLM decided to use the weather tool, execute it
	if (response.tool_calls?.length) {
		const toolCall = response.tool_calls[0];
		if (toolCall.name === "weather_tool") {
			try {
				const toolResult = await weatherTool.invoke(toolCall);
				weatherData = String(toolResult.content) || String(toolResult);
			} catch (error) {
				finalContent = `Sorry, I couldn't get the weather information. Error: ${error}`;
			}
		}
	}

	const aiMessage = new AIMessage({
		content: finalContent,
		name: "weather_agent",
	});

	return new Command({
		goto: "chat_agent",
		update: {
			messages: [aiMessage],
			current_agent: "weather_agent",
			weather_data: weatherData,
		},
	});
};
