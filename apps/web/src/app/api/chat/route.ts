import { type NextRequest, NextResponse } from "next/server";
import "@/lib/langgraph/langsmith";
import {
	AIMessage,
	HumanMessage,
	SystemMessage,
} from "@langchain/core/messages";
import { UnauthorizedError } from "@/@errors";
import { createAgentWithMemory } from "@/lib/langgraph/agent-factory";
import type { StateAnnotation } from "@/lib/langgraph/graph";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
	const start = performance.now();
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
		const checkUserTime = performance.now() - start;
		console.log("took to check user", checkUserTime);

		const { messages } = await req.json();
		if (!messages?.length) {
			return NextResponse.json(
				{ error: "No messages provided" },
				{ status: 400 },
			);
		}

		// Convert ONLY the latest incoming message to LangChain format
		const lastIncoming = messages[messages.length - 1] as
			| { role: string; content: string; agent_name?: string }
			| undefined;

		const latestLangChainMessage = lastIncoming
			? lastIncoming.role === "user"
				? new HumanMessage(lastIncoming.content)
				: new AIMessage({
						content: lastIncoming.content,
						name: lastIncoming.agent_name,
					})
			: undefined;

		const { agent: currentAgent, memoryManager } = await createAgentWithMemory(
			user.id,
		);

		const previousState = await memoryManager.loadState();
		const messagesForAgent = [
			...(previousState.summary
				? [new SystemMessage(previousState.summary)]
				: []),
			...(previousState.messages || []),
			...(latestLangChainMessage ? [latestLangChainMessage] : []),
		];
		const loadPreviousStateTime = performance.now() - start - checkUserTime;
		console.log("took to load previous state", loadPreviousStateTime);

		// Non-streaming invocation: return JSON with content and involved agents
		const finalState: typeof StateAnnotation.State = await currentAgent.invoke(
			{ ...previousState, messages: messagesForAgent },
			{
				configurable: {
					thread_id: user.id,
					user_id: user.id,
				},
			},
		);

		const invokeAgentTime = performance.now() - start - loadPreviousStateTime;
		console.log("took to invoke agent", invokeAgentTime);

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

		console.log(`Time taken: ${performance.now() - start} milliseconds`);

		return NextResponse.json({
			content,
			agents,
			weather_data: finalState?.weather_data ?? null,
			news_data: finalState?.news_data ?? null,
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
