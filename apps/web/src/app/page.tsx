import Link from "next/link";
import { Button } from "@/components/ui";

export default function Home() {
	return (
		<div className="font-sans min-h-screen p-8 pb-20 gap-16 sm:p-20">
			<main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
				<h1 className="text-4xl font-bold">Chatbot</h1>
				<p className="text-lg">
					A Character Chatbot with Personality (Using LangGraph and
					Multi-Agents)
				</p>
				<Link href="/chat">
					<Button>Get Started</Button>
				</Link>
			</main>
		</div>
	);
}
