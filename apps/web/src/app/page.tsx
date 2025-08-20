import {
	ArrowRight,
	Bot,
	Brain,
	LogOut,
	MessageCircle,
	PlayCircle,
	Shield,
	Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "./auth/action";

export default async function Home() {
	const supabase = await createClient();
	const { data: user } = await supabase.auth.getUser();

	return (
		<div className="min-h-screen bg-gradient-to-br from-zinc-800 via-zinc-900 to-indigo-950 overflow-hidden">
			{/* Header */}
			<header className="w-full border-b border-zinc-600 bg-transparent backdrop-blur-sm sticky top-0 z-50">
				<div className="container mx-auto px-4 py-2 flex items-center justify-between">
					<nav className="flex items-center justify-between w-full">
						<div className="flex items-center space-x-4">
							<Bot className="h-6 w-6 text-zinc-500" />
							<h1 className="text-lg font-bold text-zinc-50">
								Ai Character Chat
							</h1>
						</div>

						<div className="flex items-center space-x-4">
							<Button
								asChild
								size="sm"
								className="bg-rose-500 hover:bg-rose-700"
							>
								<Link href="/chat">Get Started</Link>
							</Button>

							{user.user && (
								<Button
									type="button"
									className="bg-zinc-950 hover:bg-zinc-700"
									size="sm"
									onClick={signOutAction}
								>
									<LogOut className="mr-1" />
									Logout
								</Button>
							)}
						</div>
					</nav>
				</div>
			</header>

			{/* Hero Section */}
			<section className="relative pt-20 pb-32">
				{/* Gradient Background */}
				<div
					className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5"
					style={{
						backgroundImage:
							"radial-gradient(circle at 20% 50%, hsl(var(--primary) / 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(var(--accent) / 0.1) 0%, transparent 50%)",
					}}
				/>

				<div className="container mx-auto px-6 relative z-10">
					<div className="max-w-4xl mx-auto text-center">
						{/* Main Headline */}
						<div className="mb-8">
							<div className="inline-flex items-center px-4 py-2 rounded-full bg-zinc-800 text-primary text-sm font-medium mb-6">
								<Sparkles className="h-4 w-4 mr-2" />
								Powered by Advanced AI
							</div>
							<h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-zinc-300">
								Chat with{" "}
								<span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
									AI Characters
								</span>
							</h1>
							<p className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
								Experience conversations with personality-driven AI agents that
								remember your history and provide specialized assistance for
								weather, news, and engaging dialogue.
							</p>
						</div>

						{/* CTA Buttons */}
						<div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
							<Button
								asChild
								size="lg"
								className="group h-12 px-8 text-base hover:bg-accent"
							>
								<Link href="/chat" prefetch>
									<span className="mr-2">Start Chatting</span>
									<ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
								</Link>
							</Button>
							<Button
								// variant="outline"
								size="lg"
								asChild
								className="group h-12 px-8 text-base bg-zinc-800 hover:bg-zinc-700"
							>
								<Link href="/chat" prefetch>
									<PlayCircle className="h-4 w-4 mr-2" />
									<span>Watch Demo</span>
								</Link>
							</Button>
						</div>

						{/* Product Preview */}
						<div className="relative max-w-4xl mx-auto">
							<div className="absolute inset-0 bg-gradient-to-r from-rose-900 to-indigo-900 blur-3xl opacity-60 rounded-3xl" />
							<div className="relative bg-zinc-900 backdrop-blur-xl rounded-2xl border border-zinc-700 p-4 shadow-2xl">
								<div className="flex items-center space-x-3 mb-6">
									<div className="flex space-x-2">
										<div className="w-3 h-3 rounded-full bg-red-400" />
										<div className="w-3 h-3 rounded-full bg-yellow-400" />
										<div className="w-3 h-3 rounded-full bg-green-400" />
									</div>
									<div className="text-sm text-zinc-400 font-medium">
										AI Character Chat - Captain Byte
									</div>
								</div>

								<div className="space-y-4 text-left">
									<div className="flex items-start space-x-3">
										<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
											<Bot className="h-4 w-4 text-primary" />
										</div>
										<div className=" max-w-xs">
											<p className="text-sm text-zinc-300">
												Ahoy there! I'm Captain Byte, your AI companion. What
												adventure shall we embark on today?
											</p>
										</div>
									</div>

									<div className="flex items-start space-x-3 justify-end">
										<div className="bg-gradient-to-br from-rose-700 to-rose-900 px-3 py-2 max-w-xs rounded-lg">
											<p className="text-sm text-primary-foreground">
												Tell me about the weather in New York
											</p>
										</div>
										<div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
											<span className="text-xs font-medium">You</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="py-24 relative">
				<div className="container mx-auto px-6">
					<div className="text-center mb-16">
						<h2 className="text-3xl md:text-4xl font-bold mb-4 text-zinc-300">
							Why Choose Our AI Characters?
						</h2>
						<p className="text-xl text-zinc-400 max-w-2xl mx-auto">
							Discover the power of personality-driven AI with advanced
							capabilities and seamless interactions.
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-8">
						<Card.Root className="group border-0 bg-zinc-950 backdrop-blur-sm hover:bg-zinc-900 transition-all duration-300 hover:shadow-xl">
							<Card.Header className="text-center pb-4">
								<div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
									<MessageCircle className="h-8 w-8 text-primary" />
								</div>
								<Card.Title className="text-xl mb-2 text-zinc-300">
									Personality-Driven Chat
								</Card.Title>
								<Card.Description className="text-base leading-relaxed text-zinc-400">
									Meet Captain Byte, a witty pirate AI with unique personality
									that remembers your conversations and evolves with each
									interaction.
								</Card.Description>
							</Card.Header>
						</Card.Root>

						<Card.Root className="group border-0 bg-zinc-950 backdrop-blur-sm hover:bg-zinc-900 transition-all duration-300 hover:shadow-xl">
							<Card.Header className="text-center pb-4">
								<div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
									<Brain className="h-8 w-8 text-primary" />
								</div>
								<Card.Title className="text-xl mb-2 text-zinc-300">
									Multi-Agent Intelligence
								</Card.Title>
								<Card.Description className="text-base leading-relaxed text-zinc-400">
									Powered by specialized agents for weather updates, news
									summaries, and engaging conversations with seamless context
									switching.
								</Card.Description>
							</Card.Header>
						</Card.Root>

						<Card.Root className="group border-0 bg-zinc-950 backdrop-blur-sm hover:bg-zinc-900 transition-all duration-300 hover:shadow-xl">
							<Card.Header className="text-center pb-4">
								<div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
									<Shield className="h-8 w-8 text-primary" />
								</div>
								<Card.Title className="text-xl mb-2 text-zinc-300">
									Secure & Private
								</Card.Title>
								<Card.Description className="text-base leading-relaxed text-zinc-400">
									Enterprise-grade security with user authentication and
									encrypted conversation history storage for completely
									personalized experiences.
								</Card.Description>
							</Card.Header>
						</Card.Root>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-24 relative">
				<div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10" />
				<div className="container mx-auto px-6 relative z-10">
					<div className="max-w-4xl mx-auto text-center">
						<div className="mb-8">
							<h2 className="text-4xl md:text-5xl font-bold mb-6 text-zinc-300">
								Ready to Start Your{" "}
								<span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
									AI Journey?
								</span>
							</h2>
							<p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
								Join thousands of users experiencing the future of AI
								conversation. Your intelligent companion awaits.
							</p>
						</div>

						<div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
							<Button asChild size="lg" className="h-12 px-8 text-base">
								<Link href="/chat" prefetch>
									<span className="mr-2">Get Started Free</span>
									<Sparkles className="h-4 w-4" />
								</Link>
							</Button>
							<Button
								size="lg"
								asChild
								className="h-12 px-8 text-base bg-zinc-800 hover:bg-zinc-700"
							>
								<Link href="/chat" prefetch>
									<PlayCircle className="h-4 w-4 mr-2" />
									<span>Try Demo</span>
								</Link>
							</Button>
						</div>

						{/* Stats */}
						<div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
							<div className="text-center">
								<div className="text-2xl font-bold text-primary mb-1">
									1000+
								</div>
								<div className="text-sm text-zinc-400">Active Users</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-primary mb-1">50K+</div>
								<div className="text-sm text-zinc-400">Conversations</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-primary mb-1">
									99.9%
								</div>
								<div className="text-sm text-zinc-400">Uptime</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-border/40 py-8">
				<div className="container mx-auto px-6">
					<div className="flex flex-col md:flex-row items-center justify-between">
						<div className="flex items-center space-x-2 mb-4 md:mb-0">
							<Bot className="h-6 w-6 text-primary" />
							<span className="font-semibold text-zinc-300">
								AI Character Chat
							</span>
						</div>
						<div className="text-sm text-zinc-400">
							<strong className="text-primary">Natan Plank</strong> © 2025 AI
							Character Chat.
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
