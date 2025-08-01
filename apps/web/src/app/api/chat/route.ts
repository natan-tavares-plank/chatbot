import { type NextRequest, NextResponse } from "next/server";
import "@/lib/langgraph/langsmith"; // Import LangSmith configuration
import { agent } from "@/lib/langgraph/agents/graph";

export const runtime = "edge";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const bodyMessages = body.messages ?? [];
		if (bodyMessages.length === 0) {
			return NextResponse.json(
				{ error: "No messages provided" },
				{ status: 400 },
			);
		}

		const currentMessageContent = bodyMessages[bodyMessages.length - 1].content;

		const readableStream = new ReadableStream({
			async start(controller) {
				try {
					const stream = await agent.stream({
						messages: [
							{
								role: "user",
								content: currentMessageContent,
							},
						],
					});

					for await (const chunk of stream) {
						for (const agentKey in chunk) {
							const update = chunk[agentKey as keyof typeof chunk];

							if (Array.isArray(update)) {
								const lastMessage = update[update.length - 1];
								if (lastMessage.content) {
									controller.enqueue(
										new TextEncoder().encode(
											`data: ${JSON.stringify({ content: lastMessage.content })}\n\n`,
										),
									);
								}
							} else if (update && "content" in update) {
								controller.enqueue(
									new TextEncoder().encode(
										`data: ${JSON.stringify({ content: update.content })}\n\n`,
									),
								);
							}
						}
					}
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
				"X-Agent-Type": "chat",
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
