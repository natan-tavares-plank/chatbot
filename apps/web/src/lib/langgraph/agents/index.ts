import {
	AIMessage,
	HumanMessage,
	SystemMessage,
} from "@langchain/core/messages";
import { Command } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import z from "zod";
import { env } from "../../../env";
import type { ChatState } from "../types";

const llm = new ChatOpenAI({
	openAIApiKey: env.OPENAI_API_KEY,
	model: "gpt-4o-mini",
	temperature: 0,
});

/**
 * This is the base agent node that all other agents inherit from.
 * @param params.name - The name of the agent.
 * @param params.destinations - The possible destinations for the agent.
 * @param params.systemPrompt - The system prompt for the agent.
 * @returns - The agent node.
 */
export const makeAgentNode = (params: {
	name: string;
	destinations: string[];
	systemPrompt: string;
}) => {
	return async (state: ChatState) => {
		const possibleDestinations = ["__end__", ...params.destinations] as const;

		const responseSchema = z.object({
			response: z
				.string()
				.describe(
					"A human readable response to the original question. Does not need to be a final response. Will be streamed back to the user.",
				),
			goto: z
				.enum(possibleDestinations)
				.describe(
					"The next agent to call, or __end__ if the user's query has been resolved. Must be one of the specified values.",
				),
		});

		const messages = [
			{
				role: "system" as const,
				content: params.systemPrompt,
			},
			...state.messages,
		];

		const response = await llm
			.withStructuredOutput(responseSchema, {
				name: "router",
			})
			.invoke(messages);

		const aiMessage = new AIMessage({
			content: response.response,
			name: params.name,
		});

		return new Command({
			goto: response.goto,
			update: {
				messages: [aiMessage],
				current_agent: params.name,
			},
		});
	};
};

/**
 * This is the router node that decides which agent to call next.
 * @param state - The current state of the chat.
 * @returns - The next agent to call.
 */
export const routerNode = async (state: ChatState) => {
	const systemPrompt = new SystemMessage(
		[
			"Classify the user's query into one of the following: 'weather_agent', 'news_agent', 'captain_byte'.",
			"Valid destinations are: 'weather_agent', 'news_agent', 'captain_byte'.",
			"If the user asks about weather conditions, forecasts, or climate, direct them to the 'weather_agent'.",
			"If the user asks about current events, news, or recent happenings, direct them to the 'news_agent'.",
			"For general conversation asks, direct them to the 'captain_byte'.",
			"You must return just the destination on the goto field.",
		].join(" "),
	);

	// Get the most recent human message (should be the current user input)
	const humanMessages = state.messages.filter((m) => m instanceof HumanMessage);
	const lastMessage = humanMessages[humanMessages.length - 1];

	if (!lastMessage) {
		console.log("No human message found, defaulting to captain_byte");
		return { goto: "captain_byte" };
	}

	console.log("Router analyzing message:", lastMessage.content);

	const responseSchema = z.object({
		goto: z
			.enum(["weather_agent", "news_agent", "captain_byte"])
			.describe("The next agent to call. Must be one of the specified values."),
	});

	const { goto } = await llm
		.withStructuredOutput(responseSchema, {
			name: "router",
		})
		.invoke([systemPrompt, lastMessage]);

	console.log("Router decided to go to:", goto);
	return { goto };
};
