import { createDiscordClient, startDiscordBot } from "./discord/client";

export { parseScheduleText } from "./parser/parseScheduleText";
export type {
  ParsedSchedule,
  ScheduleSource,
  ScheduleType,
} from "./types/schedule";
export { createDiscordClient, startDiscordBot };

if (require.main === module) {
  startDiscordBot().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
