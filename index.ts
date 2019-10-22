import { Client, Message } from "discord.js";
import { config } from "dotenv";
import UserCommand from "./models/UserCommand";
import Initializer, { StreakGroup } from "./models/Initializer";
import { Streak } from "./models/Streak";
import { Assigner } from "./models/Assigner";
import Stats from "./models/Stats";
import Rank from "./models/Rank";
import Restrict from "./models/Restrict";
import { FileManager } from "./models/Database";
import * as fs from 'fs';

//#region Setup

config();

if(!process.env.TOKEN){
	console.log("No token available in the environment, exiting");
	process.exit(0);
}

const client = new Client();

const day = 60 * 60 * 24 * 1000;

const restricted = async (message: Message) => {
	const ChannelName = await Restrict.isRestricted(message);
	if(ChannelName){
		message.channel.send("Please post updates to the streak update channel: #" + ChannelName);
		return true;
	}
	return false;
};

//#endregion

//#region User Commands
UserCommand.register(new UserCommand(/^\!help$/, async function(message){
	try{
		const helptext = await new Promise((resolve, reject) => {
			fs.readFile('./help.txt',(err, data) => {
				if(err) reject(err);
				resolve(data.toString());
			});
		});
		let admin = '';
		if(message.member.hasPermission("ADMINISTRATOR")){
			admin = "Type `!admin` to learn about admin commands";
		}
		message.channel.send(helptext+admin);
	} catch(err) {
		message.channel.send(err + '.');
	}
}));

UserCommand.register(new UserCommand(/^\!relapse$/, async function(message){
	try{
		if(await restricted(message)) return false;
		const streak = await Streak.relapse(message.member.user);
		await Assigner.assign(message,streak);
		message.channel.send("Don't be dejected. Shame can only drive you further into relapse.\r\n"+streak.update());
	} catch(err) {
		let ex: Error = err;
		message.channel.send(ex.message);
		console.log(ex);
	}
}));

UserCommand.register(new UserCommand(/^\!relapse\s+([0-9]+)$/, async function(this:UserCommand, message){
	try{
		if(await restricted(message)) return false;
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

UserCommand.register(new UserCommand(/^\!relapse\s+([0-9]+)\s+([0-9]+)$/, async function(this:UserCommand, message){
	try{
		if(await restricted(message)) return false;
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
		if(await restricted(message)) return false;
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

UserCommand.register(new UserCommand(/^\!groupstats/, async function(message){
	try{
		message.channel.send(await Stats.getGroupStats());
		return;
	} catch(err) {
		let ex: Error = err;
		message.channel.send(ex.message);
		console.log(ex);
	}
}))

UserCommand.register(new UserCommand(/^\!rank\s?$/, async function(message){
	try{
		message.channel.send(await Rank.getRank(message) + "\r\n\r\nTry `!rank 10-20` or `!myrank` for more information");
		return;
	} catch(err){
		let ex: Error = err;
		message.channel.send(ex.message);
		console.log(ex);
	}
}));

UserCommand.register(new UserCommand(/^\!rank\s([0-9]+)\-([0-9]+)\s?$/, async function(message){
	try{
		const match = this.matcher.exec(message.content);
		const start = parseInt(match[1]) || 1;
		const end = parseInt(match[2]) || 10;
		message.channel.send(await Rank.getRank(message, start - 1, end - 1));
	} catch(err){
		let ex: Error = err;
		message.channel.send(ex.message);
		console.log(ex);
	}
}));

UserCommand.register(new UserCommand(/^\!myrank/, async function(message){
	try{
		return message.channel.send(await Rank.getMemberRank(message));
	} catch(err){
		let ex: Error = err;
		message.channel.send(ex.message);
		console.log(ex);
	}
}));

UserCommand.register(new UserCommand(/^\!guide/, async function(message){
	message.channel.send("Type `!relapse <days> <hours>` to start a streak, \r\n"+
		"or just `!relapse` to start a streak now. For Example:\r\n"+
		"If you relapsed three days ago, type `relapse 3`. \r\n"+
		"if you relapsed 12 hours ago, type `!relapse 0 12`\r\n\r\n "+
		"Type `!update` after you have started a streak to update statistics \r\n"+
		"and find out how long you have been tracking your streak\r\n"+
		"Type `!rank` and `!stats` to see additional rank or stats");
}));
//#endregion

//#region Admin Commands
UserCommand.register(new UserCommand(/^\!initialize/, async function(message){
	if(!message.member.hasPermission("ADMINISTRATOR")){
		message.channel.send("this is an admin-only command");
		return;
	}
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

UserCommand.register(new UserCommand(/^\!admin$/, async function(message){
	if(!message.member.hasPermission("ADMINISTRATOR")){
		message.channel.send("This is an admin-only command");
		return;
	}
	try{
		message.channel.send(await new Promise((resolve, reject) => {
			fs.readFile('./adminhelp.txt',(err, data) => {
				if(err) reject(err);
				resolve(data.toString());
			});
		}));
	}
	catch(err){
		message.channel.send(err+'.');
	}
}));

UserCommand.register(new UserCommand(/^\!admin\srestrict/, async function(message){
	if(!message.member.hasPermission("ADMINISTRATOR")){
		message.channel.send("this is an admin-only command");
		return;
	}
	Restrict.Restrict(message);
	message.channel.send("Updates and Relapses are restricted to this channel. Type !unrestrict to remove this restriction")
}));

UserCommand.register(new UserCommand(/^\!admin\sunrestrict/, async function(message){
	if(!message.member.hasPermission("ADMINISTRATOR")){
		message.channel.send("this is an admin-only command");
		return;
	}
	Restrict.Unrestrict();
	message.channel.send("Restriction remove, updates and relapses can be made from any channel");
}));

UserCommand.register(new UserCommand(/^\!admin\sbackup.*/, async function(message){
	if(!message.member.hasPermission("ADMINISTRATOR")){
		message.channel.send("this is an admin-only command");
		return;
	}
	try{
		const result = await (new FileManager()).backup();
		message.channel.send(`new backup created: ${result}`);
	}
	catch(e){
		message.channel.send(e);
		return;
	}
}));

UserCommand.register(new UserCommand(/^\!admin\sdelete\s(.+)/, async function(message){
	if(!message.member.hasPermission("BAN_MEMBERS")){
		message.channel.send("You do not have elevated permissions to delete user streaks");
		return;
	}
	try{
		const results = this.matcher.exec(message.content);
		message.channel.send((await Streak.delete(results[1],message)).message);
		return;
	}
	catch(exception){
		message.channel.send(exception+".");
	}
}));

UserCommand.register(new UserCommand(/^\!admin\sstreakgroups$/, async function(message){
	if(!message.member.hasPermission("ADMINISTRATOR")){
		message.channel.send("this is an admin-only command");
		return;
	}
	try{
		message.channel.send('```'+(await StreakGroup.list())+'```');
	}
	catch(exception){
		message.channel.send(exception+'.');
	}
}));

UserCommand.register(new UserCommand(/^\!admin\schangeinterval\s([0-9]+)\s([0-9]+)/, async function(message){
	if(!message.member.hasPermission("ADMINISTRATOR")){
		message.channel.send("this is an admin-only command");
		return;
	}
	try{
		const results = this.matcher.exec(message.content);
		message.channel.send('```'+(await StreakGroup.changeStreakInterval(parseInt(results[1]),parseInt(results[2])))+'```');
	}
	catch(exception){
		message.channel.send(exception+'.');
	}
}));
//#endregion

client.on('ready', () => console.log(`Logged in as ${client.user.tag}`));
client.on('message', message => UserCommand.process(message));
client.login(process.env.TOKEN);
