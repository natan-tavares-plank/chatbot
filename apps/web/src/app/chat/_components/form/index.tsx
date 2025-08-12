import { motion } from "framer-motion";
import { ArrowUp, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormProps = {
	input: string;
	onSubmit: (e: React.FormEvent) => void;
	handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	isLoading: boolean;
	variant?: "center" | "bottom";
};

export const Form = (props: FormProps) => {
	const {
		input,
		onSubmit,
		isLoading,
		handleInputChange,
		variant = "bottom",
	} = props;

	return (
		<motion.form
			onSubmit={onSubmit}
			className={`mx-auto min-w-[480px] relative border rounded-xl border-zinc-600 backdrop-blur-sm flex flex-col space-y-2 px-4 py-2 ${
				variant === "center"
					? "bg-zinc-700"
					: "max-w-4xl w-[calc(100%-32px)] sticky bottom-4 bg-transparent"
			}`}
			layout
			initial={{ opacity: 0, y: variant === "center" ? -12 : 24 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ type: "spring", stiffness: 140, damping: 18 }}
		>
			<div className="flex flex-1 items-center w-full">
				<Search className="h-4 w-4 text-zinc-400 mr-2" />

				<Input
					value={input}
					placeholder="Ask about weather, news or just chat..."
					className="flex-1 bg-transparent text-white text-lg font-bold"
					disabled={isLoading}
					onChange={handleInputChange}
				/>
			</div>

			<div className="flex items-center space-x-2">
				<button
					type="button"
					className="bg-zinc-600 hover:bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded-md transition-colors"
					onClick={() => {
						handleInputChange({
							target: { value: "Weather at London" },
						} as React.ChangeEvent<HTMLInputElement>);
					}}
				>
					Weather at London
				</button>

				<button
					type="button"
					className="bg-zinc-600 hover:bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded-md transition-colors"
					onClick={() => {
						handleInputChange({
							target: { value: "News about AI" },
						} as React.ChangeEvent<HTMLInputElement>);
					}}
				>
					News about AI
				</button>
			</div>

			<Button
				type="submit"
				disabled={isLoading || !input.trim()}
				shape="circle"
				size="icon"
				className="absolute right-2 bottom-2 bg-zinc-600 hover:bg-indigo-900"
			>
				{isLoading ? (
					<Loader2 className="h-4 w-4 animate-spin" />
				) : (
					<ArrowUp className="h-4 w-4" />
				)}
			</Button>
		</motion.form>
	);
};
