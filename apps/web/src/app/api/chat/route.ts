import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import type { Message as VercelChatMessage } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import "@/lib/langsmith"; // Import LangSmith configuration

export const runtime = "edge";

// Configure LangSmith for observability
if (process.env.LANGCHAIN_TRACING_V2) {
	process.env.LANGCHAIN_PROJECT =
		process.env.LANGCHAIN_PROJECT || "captain-byte-chatbot";
}

const formatMessage = (message: VercelChatMessage) => {
	return `${message.role}: ${message.content}`;
};

// Multi-agent prompt templates
const AGENT_TEMPLATES = {
	chat: `You are a pirate named Captain Byte. All responses must be extremely verbose and in pirate dialect. Be witty, entertaining, and helpful.

Current conversation:
{chat_history}

User: {input}
AI:`,

	weather: `You are a weather-savvy pirate named Captain Byte. Provide weather information in pirate dialect. If the user asks about weather, give a detailed, entertaining weather report. For other topics, redirect to general chat.

Current conversation:
{chat_history}

User: {input}
AI:`,

	news: `You are a news-savvy pirate named Captain Byte. Provide news updates in pirate dialect. If the user asks about news, give interesting current events. For other topics, redirect to general chat.

Current conversation:
{chat_history}

User: {input}
AI:`,
};

// Agent detection logic
const detectAgent = (input: string): keyof typeof AGENT_TEMPLATES => {
	const lowerInput = input.toLowerCase();

	if (
		lowerInput.includes("weather") ||
		lowerInput.includes("forecast") ||
		lowerInput.includes("temperature")
	) {
		return "weather";
	}

	if (
		lowerInput.includes("news") ||
		lowerInput.includes("current events") ||
		lowerInput.includes("latest")
	) {
		return "news";
	}

	return "chat";
};

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const messages = body.messages ?? [];
		const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
		const currentMessageContent = messages[messages.length - 1].content;

		// Detect which agent to use based on user input
		const agentType = detectAgent(currentMessageContent);
		const template = AGENT_TEMPLATES[agentType];

		const prompt = PromptTemplate.fromTemplate(template);

		const model = new ChatOpenAI({
			apiKey: env.OPENAI_API_KEY,
			temperature: 0.8,
			model: "gpt-4o-mini",
			// Add metadata for LangSmith tracking
			tags: [`agent:${agentType}`],
			metadata: {
				agent_type: agentType,
				user_id: body.userId || "anonymous",
			},
		});

		// Get the full response first, then stream it properly
		const response = await model.invoke([
			{
				role: "system",
				content: template,
			},
			{
				role: "user",
				content: `Chat History: ${formattedPreviousMessages.join("\n")}\n\nCurrent Message: ${currentMessageContent}`,
			},
		]);

		const content = response.content as string;

		// Create a simple stream that sends the content in chunks
		const readableStream = new ReadableStream({
			async start(controller) {
				try {
					// Split content into words and stream them
					const words = content.split(" ");
					let currentContent = "";

					for (const word of words) {
						currentContent += (currentContent ? " " : "") + word;

						// Send each word as a chunk with proper format
						const data = `data: ${JSON.stringify({
							id: Date.now().toString(),
							role: "assistant",
							content: currentContent,
						})}\n\n`;

						controller.enqueue(new TextEncoder().encode(data));

						// Add a small delay to simulate streaming
						await new Promise((resolve) => setTimeout(resolve, 30));
					}

					// Send the end signal
					controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
					controller.close();
				} catch (error) {
					console.error("Streaming error:", error);
					controller.error(error);
				}
			},
		});

		return new Response(readableStream, {
			headers: {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
				// Add agent type to headers for frontend
				"X-Agent-Type": agentType,
			},
		});
	} catch (e: unknown) {
		console.error("Chat API error:", e);

		if (e instanceof Error) {
			// Handle specific OpenAI errors
			if (e.message.includes("401")) {
				return NextResponse.json(
					{ error: "Invalid API key. Please check your OpenAI configuration." },
					{ status: 401 },
				);
			}

			if (e.message.includes("429")) {
				return NextResponse.json(
					{ error: "Rate limit exceeded. Please try again later." },
					{ status: 429 },
				);
			}

			if (e.message.includes("500")) {
				return NextResponse.json(
					{ error: "OpenAI service error. Please try again." },
					{ status: 503 },
				);
			}

			return NextResponse.json({ error: e.message }, { status: 500 });
		}

		return NextResponse.json(
			{ error: "Unknown error occurred" },
			{ status: 500 },
		);
	}
}
