import { Client, Message } from "discord.js";
import { config } from "dotenv";

import UserCommand from "./models/UserCommand";
import Initializer from "./models/Initializer";
import { Streak } from "./models/Streak";
import { Assigner } from "./models/Assigner";
import Stats from "./models/Stats";

config();

if(!process.env.TOKEN){
	console.log("No token available in the environment, exiting");
	process.exit(0);
}

const client = new Client();

const day = 60 * 60 * 24 * 1000;
UserCommand.register(new UserCommand(/^\!initialize/, async function(message){
	try{
		message.channel.sendMessage("Received, initializing....");
		const init = new Initializer(message);
		await init.initialize();
		message.channel.sendMessage("Channels should be created");
	} catch(err) {
		let ex: Error = err;
		message.channel.send(ex.message);
		console.log(ex);
	}
}));

UserCommand.register(new UserCommand(/^\!relapse$/, async function(message){
	try{
		const streak = await Streak.relapse(message.member.user);
		await Assigner.assign(message,streak);
		message.channel.send("Don't be dejected. Shame can only drive you further into relapse.\r\n"+streak.update());
	} catch(err) {
		let ex: Error = err;
		message.channel.send(ex.message);
		console.log(ex);
	}
}));

UserCommand.register(new UserCommand(/^!relapse\s+([0-9]+)$/, async function(this:UserCommand, message){
	try{
		const results = this.matcher.exec(message.content);
		const streak = await Streak.relapse(message.member.user, parseInt(results[1]));
		await Assigner.assign(message, streak);
		message.channel.send(streak.update());
	} catch(err) {
		let ex: Error = err;
		message.channel.send(ex.message);
		console.log(ex);
	}
}));

UserCommand.register(new UserCommand(/^!relapse\s+([0-9]+)\s+([0-9]+)$/, async function(this:UserCommand, message){
	try{
		const results = this.matcher.exec(message.content);
		const streak = await Streak.relapse(message.member.user, parseInt(results[1]), parseInt(results[2]));
		await Assigner.assign(message,streak);
		message.channel.send(streak.update());
	} catch(err) {
		let ex: Error = err;
		message.channel.send(ex.message);
		console.log(ex);
	}
}));

UserCommand.register(new UserCommand(/^\!update/, async function(message){
	try{
		await Assigner.assign(message);
		message.channel.send(await Streak.update(message.member.user));
	} catch(err) {
		let ex: Error = err;
		message.channel.send(ex.message);
		console.log(ex);
	}
}));

UserCommand.register(new UserCommand(/^\!stats/, async function(message){
	try{
		message.channel.send( await Stats.getStats());
		return;
	} catch(err) {
		let ex: Error = err;
		message.channel.send(ex.message);
		console.log(ex);
	}
}));

client.on('ready', () => console.log(`Logged in as ${client.user.tag}`));
client.on('message', message => UserCommand.process(message));
client.login(process.env.TOKEN);
