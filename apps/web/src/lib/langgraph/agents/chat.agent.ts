import {
	AIMessage,
	HumanMessage,
	SystemMessage,
} from "@langchain/core/messages";
import { Command } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import z from "zod";
import { env } from "../../../env";
import { Agent, type ChatState } from "../types";

const llm = new ChatOpenAI({
	openAIApiKey: env.OPENAI_API_KEY,
	model: "gpt-4o-mini",
	temperature: 0.7,
});

const systemPrompt = [
	"You are Captain Byte, a witty pirate assistant.",
	"Stay in character, be helpful, and use nautical flair.",
	"You are the final agent: if weather/news context is provided, use it to answer accurately.",
].join(" ");

const responseSchema = z.object({
	response: z
		.string()
		.min(1, "Response cannot be empty")
		.describe(
			"A helpful answer with a bit more detail (more or less than 200 words) in Captain Byte's pirate style. Use provided weather/news context when available.",
		),
});

export const chatAgent = async (state: ChatState): Promise<Command> => {
	const contextualPrompt = systemPrompt;
	const messagesToSend: Array<SystemMessage | HumanMessage | AIMessage> = [
		new SystemMessage(contextualPrompt),
	];

	if (state.summary) {
		messagesToSend.push(
			new SystemMessage(`CONVERSATION CONTEXT:\n${state.summary}`),
		);
	}

	if (state.weather_data) {
		messagesToSend.push(
			new SystemMessage(`WEATHER DATA:\n${state.weather_data}`),
		);
	}

	if (state.news_data) {
		messagesToSend.push(new SystemMessage(`NEWS DATA:\n${state.news_data}`));
	}

	// Rebuild conversation with human + assistant text (skip assistant tool_calls)
	for (const msg of state.messages) {
		const maybeToolCalls = (msg as any)?.additional_kwargs?.tool_calls;
		if (Array.isArray(maybeToolCalls) && maybeToolCalls.length > 0) {
			continue;
		}
		const content = (msg as HumanMessage | AIMessage).content as unknown;
		const contentStr = String(content ?? "").trim();
		if (!contentStr) continue;
		if (msg instanceof HumanMessage) {
			messagesToSend.push(new HumanMessage(contentStr));
		} else if (msg instanceof AIMessage) {
			messagesToSend.push(new AIMessage({ content: contentStr }));
		}
	}

	let result: { response: string };
	try {
		result = await llm
			.withStructuredOutput(responseSchema, {
				name: "chat_agent",
			})
			.invoke(messagesToSend);
	} catch (error) {
		console.error(
			"Structured output failed, falling back to regular LLM call:",
			error,
		);

		let defaultResponse =
			"Arr matey! I seem to have lost me bearings. Could ye repeat that question?";

		if (state.news_data) {
			defaultResponse = `Ahoy! Fresh tidings be fetched: ${state.news_data}`;
		} else if (state.weather_data) {
			defaultResponse = `Shiver me timbers! The skies report: ${state.weather_data}`;
		}

		result = {
			response: defaultResponse,
		};
	}

	const aiMessage = new AIMessage({
		content: result.response,
		name: "chat_agent",
	});

	return new Command({
		update: {
			messages: [aiMessage],
			agent_calls: {
				[Agent.CHAT]: 1,
			},
		},
	});
};
