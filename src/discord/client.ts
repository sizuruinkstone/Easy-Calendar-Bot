import { Client, Events, GatewayIntentBits } from "discord.js";

import { requireDiscordToken } from "../config";
import {
  ADD_COMMAND_NAME,
  handleAddButton,
  handleAddCommand,
  isAddButtonCustomId,
} from "./commands/add";
import { HELP_COMMAND_NAME, HELP_MESSAGE } from "./commands/help";
import {
  handleNotifyTestCommand,
  NOTIFY_TEST_COMMAND_NAME,
} from "./commands/notifyTest";
import { handleTodayCommand, TODAY_COMMAND_NAME } from "./commands/today";
import { handleTomorrowCommand, TOMORROW_COMMAND_NAME } from "./commands/tomorrow";
import { handleWeekCommand, WEEK_COMMAND_NAME } from "./commands/week";

export function createDiscordClient(): Client {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once(Events.ClientReady, (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}`);
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton() && isAddButtonCustomId(interaction.customId)) {
      await handleAddButton(interaction);
      return;
    }

    if (!interaction.isChatInputCommand()) {
      return;
    }

    if (interaction.commandName === ADD_COMMAND_NAME) {
      await handleAddCommand(interaction);
      return;
    }

    if (interaction.commandName === TODAY_COMMAND_NAME) {
      await handleTodayCommand(interaction);
      return;
    }

    if (interaction.commandName === NOTIFY_TEST_COMMAND_NAME) {
      await handleNotifyTestCommand(interaction);
      return;
    }

    if (interaction.commandName === TOMORROW_COMMAND_NAME) {
      await handleTomorrowCommand(interaction);
      return;
    }

    if (interaction.commandName === WEEK_COMMAND_NAME) {
      await handleWeekCommand(interaction);
      return;
    }

    if (interaction.commandName === HELP_COMMAND_NAME) {
      await interaction.reply({
        content: HELP_MESSAGE,
        ephemeral: true,
      });
    }
  });

  return client;
}

export async function startDiscordBot(): Promise<void> {
  const token = requireDiscordToken();
  const client = createDiscordClient();

  await client.login(token);
}
