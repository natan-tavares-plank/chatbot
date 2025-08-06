import { type NextRequest, NextResponse } from "next/server";
import "@/lib/langgraph/langsmith";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { createAgentWithMemory } from "@/lib/langgraph/agent-factory";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
	try {
		const { auth } = await createClient();
		const {
			data: { user },
		} = await auth.getUser();
		if (!user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { messages } = await req.json();
		if (!messages?.length) {
			return NextResponse.json({ error: "No messages" }, { status: 400 });
		}

		// Convert messages to LangChain format
		const langChainMessages = messages.map(
			(msg: { role: string; content: string; agent_name?: string }) =>
				msg.role === "user"
					? new HumanMessage(msg.content)
					: new AIMessage({
							content: msg.content,
							name: msg.agent_name,
						}),
		);

		const { agent: currentAgent, memoryManager } = await createAgentWithMemory(
			user.id,
		);

		// Load previous state from database
		const previousState = await memoryManager.loadState();
		if (previousState.messages?.length) {
			langChainMessages.unshift(...previousState.messages);
		}

		// Create stream
		const stream = new ReadableStream({
			async start(controller) {
				try {
					const agentStream = await currentAgent.stream(
						{
							messages: langChainMessages,
							summary: previousState.summary || "",
						},
						{
							configurable: {
								thread_id: user.id,
								user_id: user.id,
							},
						},
					);

					const processed = new Set<string>();

					for await (const chunk of agentStream) {
						const content = extractNewContent(chunk, processed);
						if (content) {
							for (const char of content) {
								controller.enqueue(new TextEncoder().encode(char));
								await new Promise((resolve) => setTimeout(resolve, 5));
							}
						}
					}

					controller.close();
				} catch (error) {
					console.error("Stream error:", error);
					controller.error(error);
				}
			},
		});

		return new Response(stream, {
			headers: {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
			},
		});
	} catch (error) {
		console.error("API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// Simple content extraction - just get the latest content from any format
function extractNewContent(chunk: any, processed: Set<string>): string | null {
	// Try to find content in various chunk formats
	const content = findContentInChunk(chunk);
	if (!content || processed.has(content)) return null;

	processed.add(content);
	return content;
}

function findContentInChunk(chunk: any): string | null {
	// Handle different chunk formats
	if (typeof chunk === "string") return chunk;
	if (chunk?.content) return String(chunk.content);

	// Look for messages array
	if (Array.isArray(chunk)) {
		const lastMsg = chunk[chunk.length - 1];
		return lastMsg?.content ? String(lastMsg.content) : null;
	}

	// Look through object keys
	for (const value of Object.values(chunk || {})) {
		if (value && typeof value === "object" && "content" in value) {
			return String((value as any).content);
		}
		if (Array.isArray(value)) {
			const lastMsg = value[value.length - 1];
			if (lastMsg?.content) return String(lastMsg.content);
		}
		if (value && typeof value === "object" && "messages" in value) {
			const messages = (value as any).messages;
			if (Array.isArray(messages)) {
				const lastMsg = messages[messages.length - 1];
				if (lastMsg?.content) return String(lastMsg.content);
			}
		}
	}

	return null;
}
