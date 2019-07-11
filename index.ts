import { Client } from "discord.js";
import UserCommand from "./models/UserCommand";
import { config } from "dotenv";
import Initializer from "./models/Initializer";

config();

if(!process.env.TOKEN){
	console.log("No token available in the environment, exiting");
	process.exit(0);
}

const client = new Client();

UserCommand.register(new UserCommand(/\!initialize/, function(message){
	message.channel.sendMessage("Received, initializing....");
	const init = new Initializer(message);
	init.initialize();
}));

client.on('ready', () => console.log(`Logged in as ${client.user.tag}`));
client.on('message', message => UserCommand.process(message));
client.login(process.env.TOKEN);
