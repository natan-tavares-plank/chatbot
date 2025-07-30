"use client";

import { useState } from "react";
import { Button, Card, Input, Label, Tabs } from "@/components/ui";

type AuthFormProps = {
	signInAction: (formData: FormData) => Promise<{ error?: string }>;
	signUpAction: (formData: FormData) => Promise<{ error?: string }>;
};

type Credentials = {
	email: string;
	password: string;
	confirmPassword: string;
};

export const AuthForm = ({ signInAction, signUpAction }: AuthFormProps) => {
	const [credentials, setCredentials] = useState<Credentials>({
		email: "natan.tavares@joinplank.com",
		password: "123456",
		confirmPassword: "123456",
	});

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();

		const formData = new FormData();
		formData.append("email", credentials.email);
		formData.append("password", credentials.password);

		const { error } = await signInAction(formData);
		if (error) {
			console.error(error);
		}
	};

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();

		if (credentials.password !== credentials.confirmPassword) {
			console.error("Passwords do not match");
			return;
		}

		const formData = new FormData();
		formData.append("email", credentials.email);
		formData.append("password", credentials.password);

		const { error } = await signUpAction(formData);
		if (error) {
			console.error(error);
		}
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
									value={credentials.email}
									onChange={(e) =>
										setCredentials({ ...credentials, email: e.target.value })
									}
									required
								/>
							</div>
							<div className="text-start space-y-2">
								<Label htmlFor="login-password">Password</Label>
								<Input
									id="login-password"
									type="password"
									placeholder="Enter your password"
									value={credentials.password}
									onChange={(e) =>
										setCredentials({ ...credentials, password: e.target.value })
									}
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
									value={credentials.email}
									onChange={(e) =>
										setCredentials({ ...credentials, email: e.target.value })
									}
									required
								/>
							</div>
							<div className="text-start space-y-2">
								<Label htmlFor="register-password">Password</Label>
								<Input
									id="register-password"
									type="password"
									placeholder="Create a password"
									value={credentials.password}
									onChange={(e) =>
										setCredentials({ ...credentials, password: e.target.value })
									}
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
									value={credentials.confirmPassword}
									onChange={(e) =>
										setCredentials({
											...credentials,
											confirmPassword: e.target.value,
										})
									}
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
