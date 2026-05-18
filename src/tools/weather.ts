import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { logToolCall } from "../logger";

const BLOOMINGTON_LAT = 39.1653;
const BLOOMINGTON_LON = -86.5264;

const WMO_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with heavy hail",
};

interface GeoResult {
  latitude: number;
  longitude: number;
  name?: string;
}

interface WeatherCurrent {
  temperature_2m?: number;
  relative_humidity_2m?: number;
  windspeed_10m?: number;
  weathercode?: number;
}

export function registerWeatherTools(server: McpServer): void {
  server.tool(
    "get_weather",
    "Get current weather. Defaults to Bloomington, IN.",
    { location: z.string().optional().describe("City name, or leave empty for Bloomington, IN") },
    async ({ location }) => {
      const t0 = performance.now();
      try {
        let lat = BLOOMINGTON_LAT;
        let lon = BLOOMINGTON_LON;
        let locationName = "Bloomington, IN";

        if (location?.trim()) {
          const geoResp = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location.trim())}&count=1`,
          );
          if (geoResp.ok) {
            const geoData = (await geoResp.json()) as { results?: GeoResult[] };
            const results = geoData.results ?? [];
            if (results.length) {
              lat = results[0].latitude;
              lon = results[0].longitude;
              locationName = results[0].name ?? location;
            }
          }
        }

        const params = new URLSearchParams({
          latitude: String(lat),
          longitude: String(lon),
          current: "temperature_2m,weathercode,windspeed_10m,relative_humidity_2m",
          temperature_unit: "fahrenheit",
          windspeed_unit: "mph",
        });

        const resp = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
        if (!resp.ok) throw new Error(`Weather API returned ${resp.status}`);

        const data = (await resp.json()) as { current?: WeatherCurrent };
        const current = data.current ?? {};
        const temp = current.temperature_2m ?? "?";
        const humidity = current.relative_humidity_2m ?? "?";
        const wind = current.windspeed_10m ?? "?";
        const code = current.weathercode ?? -1;
        const condition = WMO_CODES[code] ?? `Unknown (${code})`;

        const text = `Weather in ${locationName}: ${temp}\u00b0F, ${condition}. Humidity ${humidity}%, wind ${wind} mph.`;
        logToolCall("get_weather", performance.now() - t0, "ok");
        return { content: [{ type: "text" as const, text }] };
      } catch (e) {
        logToolCall("get_weather", performance.now() - t0, "error", String(e));
        return { content: [{ type: "text" as const, text: `Error: ${e}` }], isError: true };
      }
    },
  );
}
