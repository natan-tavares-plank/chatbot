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
		<form
			onSubmit={onSubmit}
			// bg-zinc-700
			className={`mx-auto min-w-[480px] relative border rounded-xl border-zinc-600 backdrop-blur-sm flex space-x-2 items-center px-4 py-2 ${
				variant === "center"
					? "bg-zinc-700"
					: "w-[calc(100%-32px)] sticky bottom-4 bg-transparent"
			}`}
		>
			<div className="flex flex-1 items-center">
				<Search className="h-4 w-4 text-zinc-400 mr-2" />

				<Input
					value={input}
					placeholder="Ask about weather, news or just chat..."
					className="flex-1 bg-transparent text-white text-lg font-bold"
					disabled={isLoading}
					onChange={handleInputChange}
				/>
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
		</form>
	);
};
