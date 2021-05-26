import { Streak } from "./Streak";
import { StreakGroup } from "./Initializer";
import { FileManager, Database } from "./Database";
import { Role, Message, GuildMember } from "discord.js";

export class Assigner{
	streak: Streak;
	profile: Array<StreakGroup>;
	assignedRole: Role;
	_db: Database;
	constructor(streak?:Streak,profile?:Array<StreakGroup>) {
		if(streak) this.streak = streak;
		if(profile) this.profile = profile;
	}

	public static async assign(message: Message, streak?: Streak, profile?: Array<StreakGroup>): Promise<Assigner> {
		const inst = new this(streak,profile);
		inst.assignedRole = await inst.assign(message);
		return inst;
	}

	public async assign(message: Message): Promise<Role> {
		const guildMember = await message.guild.member(message.author);
		if(!this.profile) await this.getProfile();
		if(!this.streak)  await this.getStreak(message);
		if(!this.streak) throw new Error(`!guide ${guildMember.displayName} you have no streak on record`);
		let lastStreakInterval = 0;
		const streaktime = (new Date()).getTime() - this.streak.getStartDate().getTime() + 1;
		for(var sg of this.profile){
			const role = await message.guild.roles.fetch(sg.roleid);
			if (streaktime >= lastStreakInterval && streaktime <= sg.endInterval){
				if (!role) {
					throw new Error(`${guildMember.displayName} Something went wrong with server setup, im not able to assign you to your group`);
				}
				this.setRole(guildMember, await message.guild.roles.fetch(sg.roleid));
				return message.guild.roles[sg.roleid];
			}
			lastStreakInterval = sg.endInterval;
		}
		throw new Error("You have transcended all possible streak groups");
	}

	public async setRole(member: GuildMember, role: Role): Promise<void> {
		if(member.roles.cache.has(role.id)) return;
		try {
			for(const profile of this.profile) {
				if (member.roles.cache.has(profile.roleid)) 
				
				await member.roles.remove(profile.roleid, `Streak update, removing ${profile.roleid} to add ${role.id}`);
			}
			await member.roles.add(role.id);
		} catch(e) {
			return;
		}
		return;
	}

	private async getProfile(): Promise<void> {
		const db = await this.getDB();
		this.profile = db.profile;
	}

	private async getStreak(message: Message): Promise<void> {
		const db = await this.getDB();
		this.streak = db.streaks.find(s => s.memberid == message.author.id);
	}

	private async getDB(): Promise<Database> {
		if(this._db) return this._db;
		return (new FileManager()).load();
	}
}
