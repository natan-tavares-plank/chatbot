import { tool } from "@langchain/core/tools";
import z from "zod";
import { env } from "@/env";

const baseUrl = "https://api.openweathermap.org/data/2.5/weather";

export const weatherTool = tool(
	async ({ query }) => {
		const response = await fetch(
			`${baseUrl}?q=${query}&appid=${env.OPENWEATHER_API_KEY}&units=metric`,
		);
		const data = await response.json();

		console.log(data);

		return data;
	},
	{
		name: "weather",
		description: "Call to get the weather.",
		returnDirect: true,
		schema: z.object({
			query: z.string().describe("The city to get the weather."),
		}),
	},
);
