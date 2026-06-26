import { addCommand } from "./commands/add";
import { helpCommand } from "./commands/help";
import { notifyTestCommand } from "./commands/notifyTest";
import { todayCommand } from "./commands/today";
import { tomorrowCommand } from "./commands/tomorrow";
import { weekCommand } from "./commands/week";

export const commandBuilders = [
  helpCommand,
  addCommand,
  notifyTestCommand,
  todayCommand,
  tomorrowCommand,
  weekCommand,
] as const;
export const commands = commandBuilders.map((command) => command.toJSON());
