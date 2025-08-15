import { SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import z from "zod";
import { env } from "../../../env";
import { Agent, type ChatState } from "../types";

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
			"Return only the destination in the 'goto' field as one of: 'weather_agent', 'news_agent', 'chat_agent'.",
			"weather_agent: weather/forecast/temperature/precipitation/wind/climate (especially with location/time).",
			"news_agent: current events, headlines, breaking/latest news across any domain.",
			"chat_agent: everything else.",
			"if you need to call a tool, you MUST call an agent to do it! you can never call a tool directly.",
		].join(" "),
	);

	if (!state.messages.length) {
		return { goto: Agent.CHAT, agent_calls: { [Agent.CHAT]: 1 } };
	}

	const responseSchema = z.object({
		goto: z
			.enum(["weather_agent", "news_agent", "chat_agent"])
			.describe("The next agent to call. Must be one of the specified values."),
	});

	const { goto } = await new ChatOpenAI({
		model: "gpt-3.5-turbo",
		temperature: 0,
		openAIApiKey: env.OPENAI_API_KEY,
	})
		.withStructuredOutput(responseSchema, {
			name: "router",
		})
		.invoke([systemPrompt, ...state.messages]);

	return { goto, agent_calls: { [goto]: 1 } };
};
