import { Client, Events, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";

import { parseScheduleText } from "../parser/parseScheduleText";

dotenv.config();

export function createBot(): Client {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once(Events.ClientReady, (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}`);
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand() || interaction.commandName !== "parse") {
      return;
    }

    const text = interaction.options.getString("text", true);
    const parsed = parseScheduleText(text, new Date(), "discord");

    await interaction.reply([
      "予定候補:",
      `タイトル: ${parsed.title}`,
      `開始: ${parsed.start ?? "未判定"}`,
      `種類: ${parsed.type}`,
      `信頼度: ${parsed.confidence}`,
    ].join("\n"));
  });

  return client;
}

export async function startBot(): Promise<void> {
  const token = process.env.DISCORD_BOT_TOKEN;

  if (!token) {
    throw new Error("DISCORD_BOT_TOKEN is required to start the Discord bot.");
  }

  await createBot().login(token);
}
