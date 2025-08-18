"use client";

interface WeatherProps {
  location: string;
  temperature: number;
  weather: string;
  toolCallId: string;
}

export function Weather({
  location,
  temperature,
  weather,
  toolCallId,
}: WeatherProps) {
  return (
    <div
      key={toolCallId}
      className={`p-4 rounded-lg w-full ${
        weather === "Sunny"
          ? "bg-amber-100 text-amber-900"
          : "bg-slate-200 text-slate-900"
      }`}
      >
      <div className="flex items-center justify-between">
        <div className="text-lg font-medium">{location}</div>
        <div className="text-2xl font-bold">{temperature}°C</div>
      </div>
      <div className="mt-2 text-sm opacity-75">{weather}</div>
    </div>
  );
}