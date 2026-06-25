import { REST, Routes } from "discord.js";

import { requireDiscordCommandConfig } from "../config";
import { commands } from "./commands";

export async function registerCommands(): Promise<void> {
  const { token, clientId, guildId } = requireDiscordCommandConfig();
  const rest = new REST({ version: "10" }).setToken(token);

  await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
    body: commands,
  });

  console.log(`Registered ${commands.length} slash command(s) for guild ${guildId}.`);
}

if (require.main === module) {
  registerCommands().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
