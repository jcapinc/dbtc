import { Message, Role, RoleData, Channel, ChannelData, Guild, PermissionOverwrites, CategoryChannel } from "discord.js";

export default class Initializer {
	message: Message;
	profile: Array<StreakGroup>;
	categoryChannel: Channel;
	streakGroupNames: Array<string> = [
		"1st Day",
		"2nd to 3rd Day",
		"1st Week",
		"2nd Week",
		"1st Month",
		"2nd Month",
		"3rd Month",
		"4rd to 5th Month",
		"6th to 11th Month",
		"2nd Year",
		"3rd Year to 6th Year",
		"6th Year and Beyond"
	];

	constructor(initializationMessage: Message) {
		this.message = initializationMessage;
	}

	public async initialize(profile?:Array<StreakGroup>): Promise<Initializer> {
		if(!profile) profile = await this.generateStreakGroup();
		this.profile = profile;
		return await Promise.all(profile.map<Promise<void>>(this.initializeGroup)).then(() => this);
	}

	public async initializeGroup(group:StreakGroup): Promise<void> {
		return group.initialize(this.message.guild);
	}

	private async generateStreakGroup(): Promise<Array<StreakGroup>> {
		this.categoryChannel = await this.message.guild.createChannel("Streaks",{type:"category"});
		return this.streakGroupNames.map(name => {
			const grp = new StreakGroup(name);
			grp.channel.parent = this.categoryChannel;
			return grp;
		});
	}
}

export class StreakGroup {
	role: RoleData;
	channel: ChannelData;
	generatedRole: Role;
	generatedChannel: Channel;

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
		return await guild.createRole(this.role);
	}

	async initializeChannel(guild:Guild, role: Role): Promise<Channel> {
		const channel =  await guild.createChannel(this.channel.name,"text")
		channel.overwritePermissions(guild.defaultRole,{VIEW_CHANNEL: false});
		channel.overwritePermissions(role,{VIEW_CHANNEL: true});
		channel.overwritePermissions(guild.owner,{VIEW_CHANNEL:true});
		return channel;
	}
}
