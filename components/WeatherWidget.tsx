"use client";

import { useEffect, useState } from "react";
import type { WeatherData } from "@/app/api/weather/route";

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    fetch("/api/weather")
      .then((r) => r.json())
      .then(setWeather)
      .catch(() => {});
  }, []);

  if (!weather) {
    return (
      <div className="text-right text-[#9ca3af] text-sm">Loading weather&hellip;</div>
    );
  }

  return (
    <div className="text-right">
      <div className="text-2xl font-bold text-[#111827]">
        {weather.icon} {weather.temp_f}&deg;F
      </div>
      <div className="text-xs text-[#6b7280] mt-0.5">
        MSP &mdash; {weather.condition}
      </div>
    </div>
  );
}
