import { UnauthorizedError } from "@/@errors";
import {
	createAgentWithMemory,
	createMessage,
} from "@/lib/langgraph/agent-factory";
import { createClient } from "@/lib/supabase/server";
import "@/lib/langgraph/langsmith";
import { SystemMessage } from "@langchain/core/messages";
import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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

export async function POST(req: NextRequest) {
	try {
		const { authenticated, user } = await verifyUser();
		if (!authenticated || !user) {
			return NextResponse.json(
				{ error: new UnauthorizedError() },
				{ status: 401 },
			);
		}

		const { messages } = await payloadSchema.parseAsync(await req.json());
		const lastIncoming = messages[messages.length - 1];
		const latestLangChainMessage = createMessage(lastIncoming);

		const { agent, memoryManager } = await createAgentWithMemory(user.id);
		const previousState = await memoryManager.loadState();

		const messagesForAgent = [
			...(previousState.summary
				? [new SystemMessage(previousState.summary)]
				: []),
			...(previousState.messages || []),
			...(latestLangChainMessage ? [latestLangChainMessage] : []),
		];

		const stream = new ReadableStream({
			async start(controller) {
				try {
					const events = agent.streamEvents(
						{ ...previousState, messages: messagesForAgent },
						{
							version: "v2",
							configurable: {
								thread_id: user.id,
								user_id: user.id,
							},
						},
					);

					for await (const e of events) {
						const langgraphNode = e.metadata?.langgraph_node;
						const content = e.data?.chunk?.content;

						if (e.event === "on_chain_start" || e.event === "on_chain_end") {
							const nodeName = langgraphNode || "agent";
							const thoughtMaker = `\n [${nodeName.toUpperCase()}]: `;
							controller.enqueue(new TextEncoder().encode(thoughtMaker));
						}

						if (e.event === "on_tool_start") {
							const toolName = e?.name || "tool";
							const toolInput = e.data?.input || {};
							const toolMarker = `\n [USING ${toolName.toUpperCase()}]: ${JSON.stringify(toolInput)}\n`;
							controller.enqueue(new TextEncoder().encode(toolMarker));
						}

						if (e.event === "on_tool_end") {
							const toolOutput = e.data?.output || "No output";
							const outputMarker = `\n [TOOL OUTPUT]: ${toolOutput}\n`;
							controller.enqueue(new TextEncoder().encode(outputMarker));
						}

						if (e.event === "on_llm_start") {
							const prompt = e.data?.input || "Processing...";
							const reasoningMarker = `\n [REASONING]: ${prompt.substring(0, 100)}...\n`;
							controller.enqueue(new TextEncoder().encode(reasoningMarker));
						}

						if (content?.trim()) {
							try {
								const encodedChunk = new TextEncoder().encode(content);
								controller.enqueue(encodedChunk);
							} catch (encodeError) {
								console.error("Encoding error for chunk:", encodeError);
							}
						}

						if (e.event === "on_chain_end") {
							const stepMarker = `\n [STEP COMPLETED]\n`;
							controller.enqueue(new TextEncoder().encode(stepMarker));
						}
					}

					controller.close();
				} catch (error) {
					console.error("Streaming error:", error);
					const errorMessage =
						"Sorry, I encountered an error. Please try again.";
					controller.enqueue(new TextEncoder().encode(errorMessage));
					controller.close();
				}
			},
		});

		// Return the streaming response with metadata in headers
		return new Response(stream, {
			headers: {
				"Content-Type": "text/plain; charset=utf-8",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",

				"Access-Control-Allow-Origin": "http://localhost:3000",
				"Access-Control-Allow-Methods": "POST, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",

				// Include metadata in custom headers
				"X-Agents": JSON.stringify([]), // Will be updated after streaming
				"X-Weather-Data": JSON.stringify(null),
				"X-News-Data": JSON.stringify(null),
			},
		});
	} catch (error) {
		console.error("API error:", error);
		const message =
			(error as any)?.message ||
			(error as any)?.toString?.() ||
			"Internal server error";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

const verifyUser = async (): Promise<{
	authenticated: boolean;
	user: User | null;
}> => {
	const { auth } = await createClient();
	const {
		data: { user },
	} = await auth.getUser();
	if (!user?.id) {
		return { authenticated: false, user: null };
	}
	return { authenticated: true, user };
};
