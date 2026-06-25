import { addCommand } from "./commands/add";
import { helpCommand } from "./commands/help";

export const commandBuilders = [helpCommand, addCommand] as const;
export const commands = commandBuilders.map((command) => command.toJSON());
