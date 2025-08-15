import { SystemMessage } from "@langchain/core/messages";
import { Command } from "@langchain/langgraph";
import { weatherTool } from "../tools/weather.tool";
import { Agent, type ChatState } from "../types";
import { llm } from ".";

const systemPrompt = [
	"You are a weather specialist.",
	"Use the weather tool to fetch current conditions. you must pass only name of city or country.",
	"Return a succinct, factual summary of what you found.",
].join(" ");

export const weatherAgent = async (state: ChatState): Promise<Command> => {
	const messages = [new SystemMessage(systemPrompt), ...state.messages];

	const response = await llm
		.bindTools([weatherTool], { strict: true, recursionLimit: 2 })
		.invoke(messages);

	let weatherData: string | null = null;

	// If the LLM decided to use the weather tool, execute it
	if (response.tool_calls?.length) {
		const toolCall = response.tool_calls[0] as {
			name: string;
			args?: { query?: unknown };
			arguments?: { query?: unknown };
		};
		if (toolCall.name === "weather_tool") {
			try {
				const toolArgs = (toolCall.args ?? toolCall.arguments ?? {}) as {
					query?: unknown;
				};
				const query = String(toolArgs.query ?? "");
				const toolResult = await weatherTool.invoke({ query });
				const content =
					typeof toolResult === "string"
						? toolResult
						: String((toolResult as any)?.content ?? toolResult ?? "");
				weatherData = content;
			} catch (error) {
				weatherData = `Error getting weather information: ${error}`;
			}
		}
	}

	return new Command({
		goto: "chat_agent",
		update: {
			weather_data: weatherData,
			agent_calls: {
				[Agent.WEATHER]: 1,
			},
		},
	});
};
