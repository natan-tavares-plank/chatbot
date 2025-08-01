import { Command, type MessagesAnnotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import z from "zod";
import { env } from "../../../env";

const llm = new ChatOpenAI({
	openAIApiKey: env.OPENAI_API_KEY,
	model: "gpt-4o-mini",
	temperature: 0.1,
});

export const makeAgentNode = (params: {
	name: string;
	destinations: string[];
	systemPrompt: string;
}) => {
	return async (state: typeof MessagesAnnotation.State) => {
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
				role: "system",
				content: params.systemPrompt,
			},
			...state.messages,
		];

		const response = await llm
			.withStructuredOutput(responseSchema, {
				name: "router",
			})
			.invoke(messages);

		// handoff to another agent or halt
		const aiMessage = {
			role: "assistant",
			content: response.response,
			name: params.name,
		};

		return new Command({
			goto: response.goto,
			update: { messages: aiMessage },
		});
	};
};
