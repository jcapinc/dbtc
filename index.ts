import { Client } from "discord.js";
import { config } from "dotenv";

import UserCommand from "./models/UserCommand";
import Initializer from "./models/Initializer";
import { Streak } from "./models/Streak";

config();

if(!process.env.TOKEN){
	console.log("No token available in the environment, exiting");
	process.exit(0);
}

const client = new Client();

UserCommand.register(new UserCommand(/^\!initialize/, async function(message){
	message.channel.sendMessage("Received, initializing....");
	try{
		const init = new Initializer(message);
		init.streakGroupNames = ["1st Day", "2nd-3rd Day", "4th-7th Day", "2nd Week"];
		await init.initialize();
		message.channel.sendMessage("Channels should be created");
	} catch(err) {
		let ex: Error = err;
		message.channel.send(ex.message);
		console.log(ex);
	}
}));

UserCommand.register(new UserCommand(/^\!relapse$/, async function(message){
	const streak = await Streak.relapse(message.member.user);
	message.channel.send("Don't be dejected. Shame can only drive you further into relapse.\r\n"+streak.update());
}));

UserCommand.register(new UserCommand(/^!relapse\s+([0-9]+)$/, async function(this:UserCommand, message){
	const results = this.matcher.exec(message.content);
	const streak = await Streak.relapse(message.member.user, parseInt(results[1]));
	message.channel.send(streak.update());
}));

UserCommand.register(new UserCommand(/^!relapse\s+([0-9]+)\s+([0-9]+)$/, async function(this:UserCommand, message){
	const results = this.matcher.exec(message.content);
	const streak = await Streak.relapse(message.member.user, parseInt(results[1]), parseInt(results[2]));
	message.channel.send(streak.update());
}));

UserCommand.register(new UserCommand(/^\!update/, async function(message){
	message.channel.send(await Streak.update(message.member.user));
}))

client.on('ready', () => console.log(`Logged in as ${client.user.tag}`));
client.on('message', message => UserCommand.process(message));
client.login(process.env.TOKEN);
