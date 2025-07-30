"use client";

import { useState } from "react";
import { Button, Card, Input, Label, Tabs } from "@/components/ui";

export const AuthForm = () => {
	const [loginEmail, setLoginEmail] = useState("");
	const [loginPassword, setLoginPassword] = useState("");
	const [registerEmail, setRegisterEmail] = useState("");
	const [registerPassword, setRegisterPassword] = useState("");
	const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");

	const handleLogin = (e: React.FormEvent) => {
		e.preventDefault();
		// TODO: Implement login logic
		console.log("Login attempt:", {
			email: loginEmail,
			password: loginPassword,
		});
	};

	const handleRegister = (e: React.FormEvent) => {
		e.preventDefault();
		// TODO: Implement register logic
		console.log("Register attempt:", {
			email: registerEmail,
			password: registerPassword,
			confirmPassword: registerConfirmPassword,
		});
	};

	return (
		<Card.Root className="shadow-xl border-border/50">
			<Card.Header>
				<Card.Title className="text-center">Welcome</Card.Title>
				<Card.Description className="text-center">
					Sign in to your account or create a new one
				</Card.Description>
			</Card.Header>

			<Card.Content>
				<Tabs.Root defaultValue="login" className="w-full">
					<Tabs.List className="grid w-full grid-cols-2">
						<Tabs.Trigger value="login">Login</Tabs.Trigger>
						<Tabs.Trigger value="register">Register</Tabs.Trigger>
					</Tabs.List>

					<Tabs.Content value="login" className="space-y-4">
						<form onSubmit={handleLogin} className="space-y-4" noValidate>
							<div className="text-start space-y-2">
								<Label htmlFor="login-email">Email</Label>
								<Input
									id="login-email"
									type="email"
									placeholder="Enter your email"
									value={loginEmail}
									onChange={(e) => setLoginEmail(e.target.value)}
									required
								/>
							</div>
							<div className="text-start space-y-2">
								<Label htmlFor="login-password">Password</Label>
								<Input
									id="login-password"
									type="password"
									placeholder="Enter your password"
									value={loginPassword}
									onChange={(e) => setLoginPassword(e.target.value)}
									required
								/>
							</div>
							<Button type="submit" className="w-full">
								Sign In
							</Button>
						</form>
					</Tabs.Content>

					<Tabs.Content value="register" className="space-y-4">
						<form onSubmit={handleRegister} className="space-y-4" noValidate>
							<div className="text-start space-y-2">
								<Label htmlFor="register-email">Email</Label>
								<Input
									id="register-email"
									type="email"
									placeholder="Enter your email"
									value={registerEmail}
									onChange={(e) => setRegisterEmail(e.target.value)}
									required
								/>
							</div>
							<div className="text-start space-y-2">
								<Label htmlFor="register-password">Password</Label>
								<Input
									id="register-password"
									type="password"
									placeholder="Create a password"
									value={registerPassword}
									onChange={(e) => setRegisterPassword(e.target.value)}
									required
								/>
							</div>
							<div className="text-start space-y-2">
								<Label htmlFor="register-confirm-password">
									Confirm Password
								</Label>
								<Input
									id="register-confirm-password"
									type="password"
									placeholder="Confirm your password"
									value={registerConfirmPassword}
									onChange={(e) => setRegisterConfirmPassword(e.target.value)}
									required
								/>
							</div>
							<Button type="submit" className="w-full">
								Create Account
							</Button>
						</form>
					</Tabs.Content>
				</Tabs.Root>
			</Card.Content>
		</Card.Root>
	);
};
