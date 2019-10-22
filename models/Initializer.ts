import { Message, Role, RoleData, Channel, ChannelData, Guild } from "discord.js";
import { FileManager } from "./Database";

export interface StreakGroupNames {
	[key: string]: number
}
const day = 60 * 60 * 24 * 1000;
export default class Initializer {
	message: Message;
	profile: Array<StreakGroup>;
	categoryChannel: Channel;
	streakGroupNames: StreakGroupNames = {
		"1st Day":             day,
		"2nd to 3rd Day":      day * 3,
		"1st Week":            day * 7,
		"2nd Week":            day * 14,
		"1st Month":           day * 30,
		"2nd Month":           day * 60,
		"3rd Month":           day * 90,
		"4rd to 5th Month":    day * 150,
		"6th to 11th Month":   day * 365,
		"2nd Year":            day * 730,
		"3rd Year to 6th Year":day * 1095,
		"6th Year and Beyond": Number.MAX_SAFE_INTEGER
	};

	constructor(initializationMessage: Message) {
		this.message = initializationMessage;
		if(!this.message.member.hasPermission("MANAGE_CHANNELS")){
			throw new Error("User does not have permission to modify channels");
		}
	}

	public async initialize(profile?:Array<StreakGroup>): Promise<Initializer> {
		if(!profile) profile = await this.generateStreakGroup();
		this.profile = profile;
		await Promise.all(profile.map<Promise<void>>(g => this.initializeGroup(g)));
		const manager = new FileManager();
		const db = await manager.load();
		db.profile = profile;
		await manager.save(db);
		return this;
	}

	public async initializeGroup(group:StreakGroup): Promise<void> {
		return group.initialize(this.message.guild);
	}

	private async generateStreakGroup(): Promise<Array<StreakGroup>> {
		this.categoryChannel = await this.message.guild.createChannel("Streaks",{type:"category"});
		return Object.keys(this.streakGroupNames).map(name => {
			const grp = new StreakGroup(name);
			grp.channel.parent = this.categoryChannel;
			grp.endInterval = this.streakGroupNames[name];
			return grp;
		});
	}
}

export class StreakGroup {
	role: RoleData;
	channel: ChannelData;
	generatedRole: Role;
	generatedChannel: Channel;
	roleid: string;
	channelid: string;
	endInterval: number;

	constructor(name: string){
		this.role = {
			name: name
		};
		this.channel = {
			name: name,
			nsfw: false,
			type:"text"
		};
	}

	async initialize(guild: Guild): Promise<void> {
		this.generatedRole = await this.initializeRole(guild);
		this.generatedChannel = await this.initializeChannel(guild, this.generatedRole);
	}

	async initializeRole(guild: Guild): Promise<Role> {
		const role = await guild.createRole(this.role);
		this.roleid = role.id;
		return role;
	}

	async initializeChannel(guild:Guild, role: Role): Promise<Channel> {
		this.channel.permissionOverwrites = this.channel.permissionOverwrites || [
			{id: guild.defaultRole, deny:  "VIEW_CHANNEL" },
			{id: role,              allow: "VIEW_CHANNEL" }
		];
		const channel =  await guild.createChannel(this.channel.name,this.channel);
		return channel;
	}

	static async list(){
		const fm = new FileManager();
		const db = await fm.load();
		const profiles = db.profile.map(record => ({
			days: Math.round(record.endInterval / 1000 / 60 / 60 / 24),
			name: record.channel.name
		}));
		const maxLength = profiles.reduce((carry, record) => 
			Math.max(carry, record.name.length + 1),0)
		const columns = ["Streak Group", "End Days"];
		const title = `##  ${columns[0]}${' '.repeat(maxLength - columns[0].length)}${columns[1]}\n` + 
			`--  ${'-'.repeat(columns[0].length)}${' '.repeat(maxLength - columns[0].length)}${'-'.repeat(columns[1].length)}\n`;
		return profiles.reduce((carry, record, index) => carry + ' '.repeat(2 - index.toString().length) + index.toString() +
			`  ${record.name}${' '.repeat(maxLength - record.name.length)}${record.days}\n`,title);
	}

	static async changeStreakInterval(streakIndex, newIntervalDays){
		const fm = new FileManager();
		const db = await fm.load();
		db.profile[streakIndex].endInterval = newIntervalDays * 24 * 60 * 60 * 1000;
		await fm.save(db);
		return this.list();
	}
}
