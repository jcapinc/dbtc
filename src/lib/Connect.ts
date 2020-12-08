import { Client } from "discord.js";
import { UserCommand } from ".";

export function connect(token: string) {
	const client = new Client();
	client.on("ready", () => console.log(`Logged in as ${client.user.tag}`));
	client.on("message", (message) => UserCommand.process(message));
	client.login(token);
}

export function connectAll(tokens: string[]) {
	tokens.map(connect);
}
