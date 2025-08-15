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

		const temp = data.main?.temp ?? "unknown";
		const description = data.weather?.[0]?.description ?? "no data";
		return `The weather in ${query} is ${temp}°C with ${description}.`;
	},
	{
		name: "weather_tool",
		description: "Call to get the weather data.",
		returnDirect: true,
		schema: z.object({
			query: z
				.string()
				.describe(
					"The city or country to get the weather. not search for places, just the name of the city or country.",
				),
		}),
		responseFormat: "content",
	},
);
