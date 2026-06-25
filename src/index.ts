export { parseScheduleText } from "./parser/parseScheduleText";
export type {
  ParsedSchedule,
  ScheduleSource,
  ScheduleType,
} from "./types/schedule";

if (require.main === module) {
  const input = process.argv.slice(2).join(" ") || "明日17時からバイト";
  const parsed = require("./parser/parseScheduleText") as typeof import("./parser/parseScheduleText");

  console.log(JSON.stringify(parsed.parseScheduleText(input, new Date()), null, 2));
}
