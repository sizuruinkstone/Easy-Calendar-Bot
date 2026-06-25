import "dotenv/config";

import { z } from "zod";

const optionalEnvValue = z
  .union([z.string().min(1), z.literal("").transform(() => undefined)])
  .optional();

const envSchema = z.object({
  DISCORD_TOKEN: optionalEnvValue,
  DISCORD_CLIENT_ID: optionalEnvValue,
  DISCORD_GUILD_ID: optionalEnvValue,
  GOOGLE_CLIENT_ID: optionalEnvValue,
  GOOGLE_CLIENT_SECRET: optionalEnvValue,
  GOOGLE_REFRESH_TOKEN: optionalEnvValue,
  GOOGLE_CALENDAR_ID: z
    .union([z.string().min(1), z.literal("").transform(() => "primary")])
    .optional()
    .default("primary"),
  TIMEZONE: z
    .union([z.string().min(1), z.literal("").transform(() => "Asia/Tokyo")])
    .optional()
    .default("Asia/Tokyo"),
});

const env = envSchema.parse(process.env);

export const config = {
  discordToken: env.DISCORD_TOKEN,
  discordClientId: env.DISCORD_CLIENT_ID,
  discordGuildId: env.DISCORD_GUILD_ID,
  googleClientId: env.GOOGLE_CLIENT_ID,
  googleClientSecret: env.GOOGLE_CLIENT_SECRET,
  googleRefreshToken: env.GOOGLE_REFRESH_TOKEN,
  googleCalendarId: env.GOOGLE_CALENDAR_ID,
  timezone: env.TIMEZONE,
};

function requireConfigValue(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} is required. Copy .env.example to .env and set ${name}.`);
  }

  return value;
}

export function requireDiscordToken(): string {
  return requireConfigValue("DISCORD_TOKEN", config.discordToken);
}

export function requireDiscordCommandConfig(): {
  token: string;
  clientId: string;
  guildId: string;
} {
  return {
    token: requireDiscordToken(),
    clientId: requireConfigValue("DISCORD_CLIENT_ID", config.discordClientId),
    guildId: requireConfigValue("DISCORD_GUILD_ID", config.discordGuildId),
  };
}
