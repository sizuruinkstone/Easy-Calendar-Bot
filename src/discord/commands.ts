import { addCommand } from "./commands/add";
import { helpCommand } from "./commands/help";
import { todayCommand } from "./commands/today";
import { tomorrowCommand } from "./commands/tomorrow";

export const commandBuilders = [helpCommand, addCommand, todayCommand, tomorrowCommand] as const;
export const commands = commandBuilders.map((command) => command.toJSON());
