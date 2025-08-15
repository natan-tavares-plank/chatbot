import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { Command } from "@langchain/langgraph";
import { newsTool } from "../tools/news.tool";
import { Agent, type ChatState } from "../types";
import { llm } from ".";

const systemPrompt = [
	"You are a news specialist.",
	"Use the news tool to fetch up to 3 relevant headlines.",
	"Return a succinct, factual summary of what you found.",
].join(" ");

export const newsAgent = async (state: ChatState): Promise<Command> => {
	const messages = [new SystemMessage(systemPrompt), ...state.messages];

	const response = await llm
		.bindTools([newsTool], { strict: true, recursionLimit: 2 })
		.invoke(messages);

	let newsData: string | null = null;

	// If the LLM decided to use the news tool, execute it
	if (response.tool_calls && response.tool_calls.length > 0) {
		const toolCall = response.tool_calls[0] as {
			name: string;
			args?: { query?: unknown };
			arguments?: { query?: unknown };
		};
		if (toolCall.name === "news_tool") {
			try {
				const toolArgs = (toolCall.args ?? toolCall.arguments ?? {}) as {
					query?: unknown;
				};
				const query = String(toolArgs.query ?? "");
				const toolResult = await newsTool.invoke({ query });
				const content =
					typeof toolResult === "string"
						? toolResult
						: String((toolResult as any)?.content ?? toolResult ?? "");
				newsData = content;
			} catch (error) {
				newsData = `Error getting news information: ${error}`;
			}
		}
	}

	return new Command({
		goto: "chat_agent",
		update: {
			news_data: newsData,
			agent_calls: {
				[Agent.NEWS]: 1,
			},
		},
	});
};
