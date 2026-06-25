import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
} from "discord.js";

import { parseNaturalText } from "../../parser/parseNaturalText";
import type { ParsedEventCandidate } from "../../parser/types";
import {
  deletePendingEvent,
  getPendingEvent,
  savePendingEvent,
} from "../../storage/pendingEvents";

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = "Asia/Tokyo";
const ADD_TEXT_OPTION_NAME = "text";
const ADD_CONFIRM_CUSTOM_ID_PREFIX = "pending-event:confirm:";
const ADD_CANCEL_CUSTOM_ID_PREFIX = "pending-event:cancel:";

export const ADD_COMMAND_NAME = "add";

export const addCommand = new SlashCommandBuilder()
  .setName(ADD_COMMAND_NAME)
  .setDescription("自然文から予定候補を作成します")
  .addStringOption((option) =>
    option
      .setName(ADD_TEXT_OPTION_NAME)
      .setDescription("例: 明日17時から23時バイト")
      .setRequired(true),
  );

export async function handleAddCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const text = interaction.options.getString(ADD_TEXT_OPTION_NAME, true);
  const candidate = parseNaturalText(text, new Date());
  const pendingEvent = savePendingEvent({
    userId: interaction.user.id,
    channelId: interaction.channelId,
    candidate,
  });

  await interaction.reply({
    embeds: [buildCandidateEmbed(candidate)],
    components: [buildConfirmationButtons(pendingEvent.id)],
  });
}

export function isAddButtonCustomId(customId: string): boolean {
  return (
    customId.startsWith(ADD_CONFIRM_CUSTOM_ID_PREFIX) ||
    customId.startsWith(ADD_CANCEL_CUSTOM_ID_PREFIX)
  );
}

export async function handleAddButton(interaction: ButtonInteraction): Promise<void> {
  const button = parseAddButtonCustomId(interaction.customId);

  if (!button) {
    return;
  }

  const pendingEvent = getPendingEvent(button.pendingEventId);
  if (!pendingEvent) {
    await interaction.reply({
      content: "予定候補が見つかりません。もう一度 `/add` から作成してください。",
      ephemeral: true,
    });
    return;
  }

  if (pendingEvent.userId !== interaction.user.id) {
    await interaction.reply({
      content: "このボタンは `/add` を実行した本人だけが使えます。",
      ephemeral: true,
    });
    return;
  }

  if (button.action === "confirm") {
    deletePendingEvent(pendingEvent.id);

    await interaction.update({
      content: "Google Calendar連携は未実装です。登録処理はStep 3で実装予定です。",
      embeds: [],
      components: [],
    });
    return;
  }

  deletePendingEvent(pendingEvent.id);

  await interaction.update({
    content: "予定候補をキャンセルしました。",
    embeds: [],
    components: [],
  });
}

function buildCandidateEmbed(candidate: ParsedEventCandidate): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("予定候補を確認してください")
    .setColor(0x2f80ed)
    .addFields(
      { name: "タイトル", value: candidate.title, inline: true },
      { name: "種別", value: candidate.kind, inline: true },
      { name: "状態", value: candidate.status, inline: true },
      { name: "開始", value: formatDateTime(candidate.start, candidate.allDay), inline: true },
      { name: "終了", value: formatDateTime(candidate.end, false), inline: true },
      {
        name: "登録先",
        value: "Google Calendar予定。登録処理はStep 3で実装予定です。",
        inline: false,
      },
      { name: "元の入力", value: candidate.originalText || "未入力", inline: false },
    )
    .setFooter({ text: `confidence: ${candidate.confidence}` });
}

function buildConfirmationButtons(
  pendingEventId: string,
): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${ADD_CONFIRM_CUSTOM_ID_PREFIX}${pendingEventId}`)
      .setLabel("登録する")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`${ADD_CANCEL_CUSTOM_ID_PREFIX}${pendingEventId}`)
      .setLabel("キャンセル")
      .setStyle(ButtonStyle.Secondary),
  );
}

function parseAddButtonCustomId(
  customId: string,
): { action: "confirm" | "cancel"; pendingEventId: string } | null {
  if (customId.startsWith(ADD_CONFIRM_CUSTOM_ID_PREFIX)) {
    return {
      action: "confirm",
      pendingEventId: customId.slice(ADD_CONFIRM_CUSTOM_ID_PREFIX.length),
    };
  }

  if (customId.startsWith(ADD_CANCEL_CUSTOM_ID_PREFIX)) {
    return {
      action: "cancel",
      pendingEventId: customId.slice(ADD_CANCEL_CUSTOM_ID_PREFIX.length),
    };
  }

  return null;
}

function formatDateTime(value: string | null, allDay: boolean): string {
  if (!value) {
    return "未判定";
  }

  return dayjs(value)
    .tz(TIMEZONE)
    .format(allDay ? "YYYY-MM-DD" : "YYYY-MM-DD HH:mm");
}
