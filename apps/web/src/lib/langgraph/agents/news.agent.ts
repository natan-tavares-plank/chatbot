import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { Command } from "@langchain/langgraph";
import { newsTool } from "../tools/news.tool";
import type { ChatState } from "../types";
import { llm } from ".";

const systemPrompt = [
	"You are a news specialist.",
	"Your job is to gather news information using your news tool.",
	"Provide a brief, factual summary of the news information you gather.",
	"Keep your responses focused and concise.",
	"You must use the news tool to get the news data.",
].join(" ");

export const newsAgent = async (state: ChatState): Promise<Command> => {
	const messages = [new SystemMessage(systemPrompt), ...state.messages];

	const response = await llm
		.bindTools([newsTool], { strict: true, recursionLimit: 3 })
		.invoke(messages);

	let finalContent = response.content;
	let newsData = null;

	// If the LLM decided to use the news tool, execute it
	if (response.tool_calls && response.tool_calls.length > 0) {
		const toolCall = response.tool_calls[0];
		if (toolCall.name === "news_tool") {
			try {
				const toolResult = await newsTool.invoke(toolCall);
				newsData = String(toolResult.content) || String(toolResult);
			} catch (error) {
				finalContent = `Sorry, I couldn't get the news information. Error: ${error}`;
			}
		}
	}

	const aiMessage = new AIMessage({
		content: finalContent,
		name: "news_agent",
	});

	return new Command({
		goto: "chat_agent",
		update: {
			messages: [aiMessage],
			current_agent: "news_agent",
			news_data: newsData,
		},
	});
};
