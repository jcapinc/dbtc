import UserCommand from "../models/UserCommand";
import { describe, it, before, after } from "mocha";
import { expect } from "chai";
import * as sinon from "sinon";
import { Message, Channel, Client, TextChannel, Guild } from "discord.js";

describe("The command system", () => {
	it("executes commands based on regex",() => {
		const client = new Client();
		const guild = new Guild(client,{});
		const channel = new TextChannel(guild,{name:"test"})
		const input = "!value";
		const message = new Message(channel,{content: input},client);
		let ran = false;
		UserCommand.register(new UserCommand(/.+/,str => {
			expect(message.content).to.equal(message.content);
			ran = true;
		}));
		UserCommand.process(message);
		expect(ran).to.equal(true);
	});
});

