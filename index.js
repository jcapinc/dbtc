"use strict";
exports.__esModule = true;
var discord = require("discord.js");
var UserCommand_1 = require("./models/UserCommand");
var dotenv_1 = require("dotenv");
dotenv_1.config();
if (!process.env.TOKEN) {
    console.log("No token available in the environment, exiting");
    process.exit(0);
}
var client = new discord.Client();
UserCommand_1.UserCommand.register(new UserCommand_1.UserCommand(/\!initialize/, function (message) {
    message.guild.createChannel("test");
    message.guild.createRole({ name: "test" });
}));
client.on('ready', function () { return console.log("Logged in as " + client.user.tag); });
client.on('message', function (message) { return UserCommand_1.UserCommand.process(message); });
client.login(process.env.TOKEN);
