import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

describe("config", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.resetModules();
  });

  it("reads NOTIFY_CHANNEL_ID when it is configured", async () => {
    const { config, requireNotifyChannelId } = await importConfigWithEnv({
      NOTIFY_CHANNEL_ID: "notify-channel-1",
    });

    expect(config.notifyChannelId).toBe("notify-channel-1");
    expect(requireNotifyChannelId()).toBe("notify-channel-1");
  });

  it("does not require NOTIFY_CHANNEL_ID for existing Discord startup config", async () => {
    const { config, requireDiscordCommandConfig, requireDiscordToken } =
      await importConfigWithEnv({
        DISCORD_TOKEN: "discord-token",
        DISCORD_CLIENT_ID: "client-id",
        DISCORD_GUILD_ID: "guild-id",
      });

    expect(config.notifyChannelId).toBeUndefined();
    expect(requireDiscordToken()).toBe("discord-token");
    expect(requireDiscordCommandConfig()).toEqual({
      token: "discord-token",
      clientId: "client-id",
      guildId: "guild-id",
    });
  });

  it("throws only when requireNotifyChannelId is called without NOTIFY_CHANNEL_ID", async () => {
    const { config, requireNotifyChannelId } = await importConfigWithEnv({});

    expect(config.notifyChannelId).toBeUndefined();
    expect(() => requireNotifyChannelId()).toThrow(
      "NOTIFY_CHANNEL_ID is required. Copy .env.example to .env and set NOTIFY_CHANNEL_ID.",
    );
  });
});

async function importConfigWithEnv(env: NodeJS.ProcessEnv): Promise<
  typeof import("../src/config")
> {
  vi.resetModules();
  process.env = { ...ORIGINAL_ENV, ...env };

  return import("../src/config");
}
