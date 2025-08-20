import { UnauthorizedError } from "@/@errors";
import { createAgentWithMemory } from "@/lib/langgraph/agent-factory";
import "@/lib/langgraph/langsmith";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";
import { type NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { verifyUser } from "./actions";
export const runtime = "edge";

const payloadSchema = z.object({
	messages: z
		.array(
			z.object({
				role: z.enum(["user", "assistant", "system"]),
				content: z.string().min(1, "Message content is required"),
				agent_name: z.string().optional(),
			}),
		)
		.min(1, "At least one message is required")
		.max(50, "You reached the maximum number of messages for this chat"),
});

export async function GET() {
	return NextResponse.json({
		status: "healthy",
		timestamp: new Date().toISOString(),
	});
}

// export async function POST(req: NextRequest) {
// 	try {
// 		const { authenticated, user } = await verifyUser();
// 		if (!authenticated || !user) {
// 			return NextResponse.json(
// 				{ error: new UnauthorizedError() },
// 				{ status: 401 },
// 			);
// 		}

// 		const { messages } = await payloadSchema.parseAsync(await req.json());

// 		const lastIncoming = messages[messages.length - 1];
// 		const latestLangChainMessage = createMessage(lastIncoming);

// 		const { agent, memoryManager } = await createAgentWithMemory(user.id);
// 		const previousState = await memoryManager.loadState();

// 		const messagesForAgent = [
// 			...(previousState.summary
// 				? [new SystemMessage(previousState.summary)]
// 				: []),
// 			...(previousState.messages || []),
// 			...(latestLangChainMessage ? [latestLangChainMessage] : []),
// 		];

// 		const stream = new ReadableStream({
// 			async start(controller) {
// 				try {
// 					const stream = await agent.stream(
// 						{ ...previousState, messages: messagesForAgent },
// 						{
// 							streamMode: "values",
// 							configurable: {
// 								thread_id: user.id,
// 								user_id: user.id,
// 							},
// 						},
// 					);

// 					let lastMessage: BaseMessage | null = null;
// 					let finalMessage: BaseMessage | null = null;

// 					for await (const chunk of stream) {
// 						const currentMessage = chunk.messages;
// 						const latestMessage = currentMessage[currentMessage.length - 1];

// 						if (latestMessage && latestMessage !== lastMessage) {
// 							lastMessage = latestMessage;
// 							finalMessage = latestMessage;

// 							const messageData = {
// 								...lastMessage,
// 								role:
// 									lastMessage instanceof HumanMessage ? "user" : "assistant",
// 								isThinking: true,
// 							};

// 							console.log("Sending streaming message:", messageData);

// 							// Send each message with a newline to separate JSON objects
// 							controller.enqueue(
// 								new TextEncoder().encode(JSON.stringify(messageData) + "\n"),
// 							);
// 						}
// 					}

// 					// Send final message without isThinking flag
// 					if (finalMessage) {
// 						const finalMessageData = {
// 							...finalMessage,
// 							role: finalMessage instanceof HumanMessage ? "user" : "assistant",
// 							isThinking: false,
// 						};

// 						console.log("Sending final message:", finalMessageData);

// 						controller.enqueue(
// 							new TextEncoder().encode(JSON.stringify(finalMessageData) + "\n"),
// 						);
// 					}

// 					controller.close();
// 				} catch (error) {
// 					console.error("Streaming error:", error);
// 					const errorMessage = {
// 						error: "Sorry, I encountered an error. Please try again.",
// 						isThinking: false,
// 					};
// 					controller.enqueue(
// 						new TextEncoder().encode(JSON.stringify(errorMessage) + "\n"),
// 					);
// 					controller.close();
// 				}
// 			},
// 		});

// 		return new Response(stream, {
// 			headers: {
// 				"Content-Type": "text/plain; charset=utf-8",
// 				"Cache-Control": "no-cache",
// 				Connection: "keep-alive",

// 				"Access-Control-Allow-Origin": "http://localhost:3000",
// 				"Access-Control-Allow-Methods": "POST, OPTIONS",
// 				"Access-Control-Allow-Headers": "Content-Type, Authorization",
// 			},
// 		});
// 	} catch (error) {
// 		console.error("API error:", error);
// 		const message =
// 			(error as any)?.message ||
// 			(error as any)?.toString?.() ||
// 			"Internal server error";
// 		return NextResponse.json({ error: message }, { status: 500 });
// 	}
// }

export async function POST(req: NextRequest) {
	const { user } = await verifyUser();
	if (!user) {
		return NextResponse.json(
			{ error: new UnauthorizedError(), success: false },
			{ status: 401 },
		);
	}

	// const { data, error } = payloadSchema.safeParse(req.body);
	// if (error) {
	// 	return NextResponse.json(
	// 		{ error: "Invalid body", message: error.message, success: false },
	// 		{ status: 400 },
	// 	);
	// }

	try {
		const data = await payloadSchema.parseAsync(await req.json());

		const input = data.messages[data.messages.length - 1];
		if (input.role !== "user") {
			throw new Error("unable to use your message as a question");
		}

		const { agent, memoryManager } = await createAgentWithMemory(user.id);
		const prevState = await memoryManager.loadState();

		const state = {
			...prevState,
			messages: [
				...(prevState.summary ? [new SystemMessage(prevState.summary)] : []),
				...(prevState.messages ?? []),
				new HumanMessage(input.content),
			],
		};

		const config: RunnableConfig = {
			timeout: 30_000,
			recursionLimit: 7,
			configurable: {
				thread_id: user.id,
				user_id: user.id,
			},
		};
		const answer = await agent.invoke(state, config);

		return new Response(
			JSON.stringify(answer.messages[answer.messages.length - 1].content),
			{
				headers: {
					"Content-Type": "text/plain; charset=utf-8",
					"Cache-Control": "no-cache",

					"X-Agents-Calls": JSON.stringify(answer.agent_calls),
				},
			},
		);
	} catch (error) {
		console.error("API error:", error);
		let message = "Internal server error";

		if (error instanceof ZodError) {
			message = error.issues.map((e) => e.message).join(", ") ?? message;
		}

		if (error instanceof Error) {
			message = error.message;
		} else if (error && typeof error === "object" && "toString" in error) {
			message = error.toString?.() ?? message;
		}

		return NextResponse.json(
			{ error: message, success: false },
			{ status: 500 },
		);
	}
}
