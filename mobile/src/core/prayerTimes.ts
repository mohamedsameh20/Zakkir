export const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
export type PrayerName = typeof PRAYERS[number];
export type PrayerTimes = { timings: Record<PrayerName, string>; next: { name: PrayerName; time: string } };

export async function fetchPrayerTimes(city: string, country: string, method = 5): Promise<PrayerTimes> {
  const date = new Date().toISOString().slice(0, 10).split("-").reverse().join("-");
  const response = await fetch(`https://api.aladhan.com/v1/timingsByCity/${date}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`);
  if (!response.ok) throw new Error(`Prayer API failed: ${response.status}`);
  const data = await response.json();
  const raw = data?.data?.timings;
  if (!raw) throw new Error("Prayer API returned no timings");
  const timings = Object.fromEntries(PRAYERS.map((name) => [name, raw[name].split(" ")[0]])) as Record<PrayerName, string>;
  const now = new Date().getHours() * 60 + new Date().getMinutes();
  const upcoming = PRAYERS.map((name) => ({ name, time: timings[name], minutes: toMinutes(timings[name]) })).find((item) => item.minutes > now) ?? { name: "Fajr" as PrayerName, time: timings.Fajr, minutes: 0 };
  return { timings, next: upcoming };
}

function toMinutes(value: string) { const [hours, minutes] = value.split(":").map(Number); return hours * 60 + minutes; }
