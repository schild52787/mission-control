import { NextResponse } from "next/server";

export interface WeatherData {
  temp_f: number;
  condition: string;
  icon: string;
}

const CONDITION_ICONS: Record<string, string> = {
  sunny: "☀️",
  clear: "🌙",
  cloudy: "☁️",
  overcast: "☁️",
  rain: "🌧️",
  drizzle: "🌦️",
  snow: "❄️",
  sleet: "🌨️",
  thunder: "⛈️",
  fog: "🌫️",
  mist: "🌫️",
  blizzard: "🌨️",
  wind: "💨",
};

function getIcon(description: string): string {
  const lower = description.toLowerCase();
  for (const [key, icon] of Object.entries(CONDITION_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "🌡️";
}

export async function GET() {
  try {
    const res = await fetch("https://wttr.in/MSP?format=j1", {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`wttr.in returned ${res.status}`);
    const data = await res.json();

    const current = data?.current_condition?.[0];
    const temp_f = parseInt(current?.temp_F ?? "0", 10);
    const condition = current?.weatherDesc?.[0]?.value ?? "Unknown";
    const icon = getIcon(condition);

    return NextResponse.json({ temp_f, condition, icon } satisfies WeatherData);
  } catch (err) {
    console.error("Weather API error:", err);
    return NextResponse.json(
      { temp_f: 0, condition: "Unavailable", icon: "🌡️" } satisfies WeatherData,
      { status: 200 }
    );
  }
}
