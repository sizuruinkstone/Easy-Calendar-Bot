import { addCommand } from "./commands/add";
import { helpCommand } from "./commands/help";
import { todayCommand } from "./commands/today";

export const commandBuilders = [helpCommand, addCommand, todayCommand] as const;
export const commands = commandBuilders.map((command) => command.toJSON());
