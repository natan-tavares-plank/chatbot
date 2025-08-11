import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import z from "zod";
import { env } from "../../../env";
import { Agent, type ChatState } from "../types";

/**
 * This is the base LLM that all agents use.
 */
export const llm = new ChatOpenAI({
	openAIApiKey: env.OPENAI_API_KEY,
	model: "gpt-4o-mini",
	temperature: 0,
});

/**
 * This is the router node that decides which agent to call next.
 * @param state - The current state of the chat.
 * @returns - The next agent to call.
 */
export const routerNode = async (state: ChatState) => {
	const systemPrompt = new SystemMessage(
		[
			"Classify the user's query into one of the following: 'weather_agent', 'news_agent', 'chat_agent'.",
			"Valid destinations are: 'weather_agent', 'news_agent', 'chat_agent'.",
			"If the user asks about weather conditions, forecasts, or climate, direct them to the 'weather_agent'.",
			"If the user asks about current events, news, or recent happenings, direct them to the 'news_agent'.",
			"For general conversation asks, direct them to the 'chat_agent'.",
			"You must return just the destination on the goto field.",
		].join(" "),
	);

	// Get the most recent human message (should be the current user input)
	const humanMessages = state.messages.filter((m) => m instanceof HumanMessage);
	const lastMessage = humanMessages[humanMessages.length - 1];

	if (!lastMessage) {
		return { goto: Agent.CHAT, agent_calls: { [Agent.CHAT]: 1 } };
	}

	const responseSchema = z.object({
		goto: z
			.enum(["weather_agent", "news_agent", "chat_agent"])
			.describe("The next agent to call. Must be one of the specified values."),
	});

	const { goto } = await llm
		.withStructuredOutput(responseSchema, {
			name: "router",
		})
		.invoke([systemPrompt, lastMessage]);

	return { goto, agent_calls: { [goto]: 1 } };
};
