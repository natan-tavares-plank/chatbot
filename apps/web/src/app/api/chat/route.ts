import { type NextRequest, NextResponse } from "next/server";
import "@/lib/langgraph/langsmith";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { UnauthorizedError } from "@/@errors";
import { createAgentWithMemory } from "@/lib/langgraph/agent-factory";
import type { StateAnnotation } from "@/lib/langgraph/graph";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
	try {
		const { auth } = await createClient();
		const {
			data: { user },
		} = await auth.getUser();
		if (!user?.id) {
			return NextResponse.json(
				{
					error: new UnauthorizedError(
						"User id is required to perform this action",
					),
				},
				{ status: 401 },
			);
		}

		const { messages } = await req.json();
		if (!messages?.length) {
			return NextResponse.json(
				{ error: "No messages provided" },
				{ status: 400 },
			);
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

		// Non-streaming invocation: return JSON with content and involved agents
		const finalState: typeof StateAnnotation.State = await currentAgent.invoke(
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

		// Extract the final assistant content
		const allMessages = Array.isArray(finalState?.messages)
			? (finalState.messages as (AIMessage | HumanMessage)[])
			: [];
		const lastAiMessage = [...allMessages]
			.reverse()
			.find((m) => m instanceof AIMessage) as AIMessage | undefined;
		const content = String(lastAiMessage?.content ?? "");

		const agents = finalState?.agent_calls
			? Object.keys(finalState.agent_calls)
			: [];

		return NextResponse.json({
			content,
			agents,
			weather_data: finalState?.weather_data ?? null,
			news_data: finalState?.news_data ?? null,
		});
	} catch (error) {
		console.error("API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
