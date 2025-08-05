import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { Command } from "@langchain/langgraph";
import z from "zod";
import type { ChatState } from "../types";
import { llm } from ".";

const systemPrompt = [
	"You are Captain Byte, an funny pirate with a crew of specialists.",
	"You are witty, entertaining, and extremely verbose in your responses.",
	"Always maintain your pirate character while being helpful.",
	"Use nautical metaphors and pirate terminology when appropriate.",
	"You are the final agent in the chain. You will be given the weather and news data and you will use it to provide a final response.",
	"You must go to the __end__ node when you are done.",
	"IMPORTANT: You MUST always provide a detailed, helpful response. Never return empty content.",
	"When given news data, summarize the news in your pirate style and provide insights.",
	"When given weather data, describe the weather conditions in your pirate style.",
].join(" ");

export const chatAgent = async (state: ChatState): Promise<Command> => {
	let contextualPrompt = systemPrompt;

	if (state.weather_data) {
		contextualPrompt += ` Weather information has been gathered: ${state.weather_data}. Use this information to provide an accurate weather response.`;
	}

	if (state.news_data) {
		contextualPrompt += ` News information has been gathered: ${state.news_data}. Use this information to provide an accurate news response.`;
	}

	const messages = [new SystemMessage(contextualPrompt), ...state.messages];

	const responseSchema = z.object({
		response: z
			.string()
			.min(1, "Response cannot be empty")
			.describe(
				"A human readable response to the original question. You must provide a detailed, helpful response using the available information. Be verbose and entertaining as Captain Byte.",
			),
	});

	let response: { response: string };
	try {
		response = await llm
			.withStructuredOutput(responseSchema, {
				name: "chat_agent",
			})
			.invoke(messages);
	} catch (error) {
		console.error(
			"Structured output failed, falling back to regular LLM call:",
			error,
		);

		// Fallback: try without structured output
		const fallbackResponse = await llm.invoke(messages);

		const fallbackContent = String(fallbackResponse.content || "");
		if (fallbackContent.trim()) {
			response = {
				response: fallbackContent,
			};
		} else {
			// If even the fallback is empty, provide a default response based on available data
			let defaultResponse =
				"Arr matey! I seem to have lost me bearings. Could ye repeat that question?";

			if (state.news_data) {
				defaultResponse = `Ahoy there! I've gathered some news from the high seas of information: ${state.news_data}. These be the latest tidings from London, me hearties!`;
			} else if (state.weather_data) {
				defaultResponse = `Shiver me timbers! Here's the weather report from the meteorological seas: ${state.weather_data}. May the winds be ever in your favor!`;
			}

			response = {
				response: defaultResponse,
			};
		}
	}

	const aiMessage = new AIMessage({
		content: response.response,
		name: "chat_agent",
	});

	return new Command({
		goto: "__end__",
		update: {
			messages: [aiMessage],
			current_agent: "chat_agent",
		},
	});
};
