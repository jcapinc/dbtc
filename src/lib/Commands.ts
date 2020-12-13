import * as fs from "fs";
import {
	Initializer,
	StreakGroup,
	Streak,
	Assigner,
	FileManager,
	UserCommand,
	Stats,
	Rank,
	Restrict,
} from ".";
import { Message } from "discord.js";

const restricted = async (message: Message) => {
	const ChannelName = await Restrict.isRestricted(message);
	if (ChannelName) {
		message.channel.send(
			"Please post updates to the streak update channel: #" + ChannelName
		);
		return true;
	}
	return false;
};

//#region User Commands
export const CommandDictionary: Record<string, UserCommand> = {
	help: new UserCommand(/^\!help$/, async function (message) {
		const guildMember = await message.guild.fetchMember(message.author);
		try {
			const helptext = await new Promise((resolve, reject) => {
				fs.readFile("./static/help.txt", (err, data) => {
					if (err) reject(err);
					resolve(data.toString());
				});
			});
			let admin = "";
			if (guildMember.hasPermission("ADMINISTRATOR")) {
				admin = "Type `!admin` to learn about admin commands";
			}
			message.channel.send(helptext + admin);
		} catch (err) {
			message.channel.send(err + ".");
		}
	}),

	relapse: new UserCommand(/^\!relapse$/, async function (message) {
		try {
			if (await restricted(message)) return false;
			const streak = await Streak.relapse(message.author);
			await Assigner.assign(message, streak);
			message.channel.send(
				"Don't be dejected. Shame can only drive you further into relapse.\r\n" +
					streak.update()
			);
		} catch (err) {
			let ex: Error = err;
			message.channel.send(ex.message);
			console.log(ex);
		}
	}),

	relapseOne: new UserCommand(
		/^\!relapse\s+([0-9]+)$/,
		async function (this: UserCommand, message) {
			try {
				if (await restricted(message)) return false;
				const results = this.matcher.exec(message.content);
				const streak = await Streak.relapse(
					message.author,
					parseInt(results[1])
				);
				await Assigner.assign(message, streak);
				message.channel.send(streak.update());
			} catch (err) {
				let ex: Error = err;
				message.channel.send(ex.message);
				console.log(ex);
			}
		}
	),

	relapseTwo: new UserCommand(
		/^\!relapse\s+([0-9]+)\s+([0-9]+)$/,
		async function (this: UserCommand, message) {
			try {
				if (await restricted(message)) return false;
				const results = this.matcher.exec(message.content);
				const streak = await Streak.relapse(
					message.author,
					parseInt(results[1]),
					parseInt(results[2])
				);
				await Assigner.assign(message, streak);
				message.channel.send(streak.update());
			} catch (err) {
				let ex: Error = err;
				message.channel.send(ex.message);
				console.log(ex);
			}
		}
	),

	update: new UserCommand(/^\!update/, async function (message) {
		try {
			if (await restricted(message)) return false;
			await Assigner.assign(message);
			return message.channel.send(await Streak.update(message.author));
		} catch (err) {
			let ex: Error = err;
			message.channel.send(ex.message);
			return console.log(ex);
		}
	}),

	stats: new UserCommand(/^\!stats/, async function (message) {
		try {
			const stats = await Stats.getStats();
			message.channel.send(stats);
			return;
		} catch (err) {
			let ex: Error = err;
			message.channel.send(ex.message);
			console.log(ex);
		}
	}),

	groupstats: new UserCommand(/^\!groupstats/, async function (message) {
		try {
			message.channel.send(await Stats.getGroupStats());
			return;
		} catch (err) {
			let ex: Error = err;
			message.channel.send(ex.message);
			console.log(ex);
		}
	}),

	rank: new UserCommand(/^\!rank\s?$/, async function (message) {
		try {
			message.channel.send(
				(await Rank.getRank(message)) +
					"\r\n\r\nTry `!rank 10-20` or `!myrank` for more information"
			);
			return;
		} catch (err) {
			let ex: Error = err;
			message.channel.send(ex.message);
			console.log(ex);
		}
	}),

	rankRange: new UserCommand(
		/^\!rank\s([0-9]+)\-([0-9]+)\s?$/,
		async function (message) {
			try {
				const match = this.matcher.exec(message.content);
				const start = parseInt(match[1]) || 1;
				const end = parseInt(match[2]) || 10;
				message.channel.send(await Rank.getRank(message, start - 1, end - 1));
			} catch (err) {
				let ex: Error = err;
				message.channel.send(ex.message);
				console.log(ex);
			}
		}
	),

	myrank: new UserCommand(/^\!myrank/, async function (message) {
		try {
			return message.channel.send(await Rank.getMemberRank(message));
		} catch (err) {
			let ex: Error = err;
			message.channel.send(ex.message);
			console.log(ex);
		}
	}),

	guide: new UserCommand(/^\!guide/, async function (message) {
		message.channel.send(
			"Type `!relapse <days> <hours>` to start a streak, \r\n" +
				"or just `!relapse` to start a streak now. For Example:\r\n" +
				"If you relapsed three days ago, type `relapse 3`. \r\n" +
				"if you relapsed 12 hours ago, type `!relapse 0 12`\r\n\r\n " +
				"Type `!update` after you have started a streak to update statistics \r\n" +
				"and find out how long you have been tracking your streak\r\n" +
				"Type `!rank` and `!stats` to see additional rank or stats"
		);
	}),
	//#endregion

	//#region Admin Commands
	initialize: new UserCommand(/^\!initialize/, async function (message) {
		const guildMember = await message.guild.fetchMember(message.author);
		if (typeof guildMember !== "object") {
			message.channel.send(
				"Cannot find guild member to ascertain permissions, access denied"
			);
			return;
		}
		if (!guildMember.hasPermission("ADMINISTRATOR")) {
			message.channel.send("this is an admin-only command");
			return;
		}
		try {
			message.channel.send("Received, initializing....");
			const init = new Initializer(message);
			await init.initialize();
			message.channel.send("Channels should be created");
		} catch (err) {
			let ex: Error = err;
			message.channel.send(ex.message);
			console.log(ex);
		}
	}),

	admin: new UserCommand(/^\!admin$/, async function (message) {
		const guildMember = await message.guild.fetchMember(message.author);
		if (!guildMember.hasPermission("BAN_MEMBERS")) {
			message.channel.send("This is an admin-only command");
			return;
		}
		try {
			message.channel.send(
				await new Promise((resolve, reject) => {
					fs.readFile("./static/adminhelp.txt", (err, data) => {
						if (err) reject(err);
						resolve(data.toString());
					});
				})
			);
		} catch (err) {
			message.channel.send(err + ".");
		}
	}),

	adminRestrict: new UserCommand(
		/^\!admin\srestrict/,
		async function (message) {
			const guildMember = await message.guild.fetchMember(message.author);
			if (!guildMember.hasPermission("ADMINISTRATOR")) {
				message.channel.send("this is an admin-only command");
				return;
			}
			Restrict.Restrict(message);
			message.channel.send(
				"Updates and Relapses are restricted to this channel. " +
					"Type !unrestrict to remove this restriction"
			);
		}
	),

	adminUnrestrict: new UserCommand(
		/^\!admin\sunrestrict/,
		async function (message) {
			const guildMember = await message.guild.fetchMember(message.author);
			if (!guildMember.hasPermission("ADMINISTRATOR")) {
				message.channel.send("this is an admin-only command");
				return;
			}
			Restrict.Unrestrict();
			message.channel.send(
				"Restriction remove, updates and relapses can be made from any channel"
			);
		}
	),

	adminBackup: new UserCommand(/^\!admin\sbackup.*/, async function (message) {
		const guildMember = await message.guild.fetchMember(message.author);
		if (!guildMember.hasPermission("ADMINISTRATOR")) {
			message.channel.send("this is an admin-only command");
			return;
		}
		try {
			const result = await new FileManager().backup();
			message.channel.send(`new backup created: ${result}`);
		} catch (e) {
			message.channel.send(e);
			return;
		}
	}),

	adminDelete: new UserCommand(
		/^\!admin\sdelete\s(.+)/,
		async function (message) {
			const guildMember = await message.guild.fetchMember(message.author);
			if (!guildMember.hasPermission("BAN_MEMBERS")) {
				message.channel.send(
					"You do not have elevated permissions to delete user streaks"
				);
				return;
			}
			try {
				const results = this.matcher.exec(message.content);
				const ids = results[1].split(" ");
				message.channel.send((await Streak.delete(ids, message)).message);
				return;
			} catch (exception) {
				message.channel.send(exception + ".");
			}
		}
	),

	adminStreakgroup: new UserCommand(
		/^\!admin\sstreakgroups$/,
		async function (message) {
			const guildMember = await message.guild.fetchMember(message.author);
			if (!guildMember.hasPermission("BAN_MEMBERS")) {
				message.channel.send("this is an admin-only command");
				return;
			}
			try {
				message.channel.send("```" + (await StreakGroup.list()) + "```");
			} catch (exception) {
				message.channel.send(exception + ".");
			}
		}
	),

	adminChangeInterval: new UserCommand(
		/^\!admin\schangeinterval\s([0-9]+)\s([0-9]+)/,
		async function (message) {
			const guildMember = await message.guild.fetchMember(message.author);
			if (!guildMember.hasPermission("ADMINISTRATOR")) {
				message.channel.send("this is an admin-only command");
				return;
			}
			try {
				const results = this.matcher.exec(message.content);
				const streakMessage = await StreakGroup.changeStreakInterval(
					parseInt(results[1]),
					parseInt(results[2])
				);
				message.channel.send("```" + streakMessage + "```");
			} catch (exception) {
				message.channel.send(exception + ".");
			}
		}
	),

	adminOldStreaks: new UserCommand(
		/^\!admin\soldstreaks$/,
		async function (message) {
			const guildMember = await message.guild.fetchMember(message.author);
			if (!guildMember.hasPermission("BAN_MEMBERS")) {
				message.channel.send("this is an admin-only command");
				return;
			}
			try {
				message.channel.send(await Streak.old(message));
			} catch (exception) {
				message.channel.send(exception + ".");
			}
		}
	),
};

export const Commands = Object.values(CommandDictionary);
//#endregion
