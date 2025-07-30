import { AuthForm } from "./_components/form";

export default async function Page() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/10">
			<div className="w-full max-w-md p-6">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
						AI Character Chat
					</h1>
					<p className="text-muted-foreground mt-2">
						Enter the world of intelligent conversations
					</p>

					<AuthForm />
				</div>
			</div>
		</div>
	);
}
