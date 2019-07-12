import { Client } from "discord.js";
import { config } from "dotenv";

import UserCommand from "./models/UserCommand";
import Initializer from "./models/Initializer";

config();

if(!process.env.TOKEN){
	console.log("No token available in the environment, exiting");
	process.exit(0);
}

const client = new Client();

UserCommand.register(new UserCommand(/\!initialize/, async function(message){
	message.channel.sendMessage("Received, initializing....");
	try{
		const init = new Initializer(message);
		init.streakGroupNames = ["1st Day", "2nd-3rd Day", "4th-7th Day", "2nd Week"];
		await init.initialize();
		message.channel.sendMessage("Channels should be created");
	} catch(err){
		let ex: Error = err;
		message.channel.send(ex.message);
		console.log(ex);
	}
}));

client.on('ready', () => console.log(`Logged in as ${client.user.tag}`));
client.on('message', message => UserCommand.process(message));
client.login(process.env.TOKEN);
