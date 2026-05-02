import fs from "node:fs";

const envPath = new URL("../.env", import.meta.url);
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);

const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase env vars in mobile/.env");
  process.exit(1);
}

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 8000);

const response = await fetch(`${supabaseUrl}/rest/v1/profiles?select=id&limit=1`, {
  headers: {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  },
  signal: controller.signal,
});

clearTimeout(timeout);

if (!response.ok) {
  console.error("Supabase check failed:", response.status, await response.text());
  process.exit(1);
}

const data = await response.json();

console.log("Supabase connection OK");
console.log(`Profiles query returned ${data.length} row(s) for anonymous access.`);
