import { AuthForm } from "./_components/form";
import { signIn, signUp } from "./action";

export default async function Page() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-800 via-zinc-900 to-indigo-950">
			<div className="w-full max-w-md p-6">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
						AI Character Chat
					</h1>

					<p className="text-zinc-300 mt-2 mb-8">
						Enter the world of intelligent conversations
					</p>

					<AuthForm signInAction={signIn} signUpAction={signUp} />

					<span className="absolute bottom-4 left-0 right-0 text-center pt-8 text-xs text-zinc-400">
						Copyright © 2025{" "}
						<strong className="text-zinc-300">Natan Plank</strong>
					</span>
				</div>
			</div>
		</div>
	);
}
