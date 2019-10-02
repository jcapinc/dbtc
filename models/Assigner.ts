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
		if(!this.profile) await this.getProfile();
		if(!this.streak)  await this.getStreak(message);
		if(!this.streak) throw new Error(`!guide ${message.member.displayName} you have no streak on record`);
		let lastStreakInterval = 0;
		const streaktime = (new Date()).getTime() - this.streak.getStartDate().getTime() + 1;
		for(var sg of this.profile){
			if(streaktime >= lastStreakInterval && streaktime <= sg.endInterval){
				if(!message.guild.roles.get(sg.roleid)){
					throw new Error(`${message.member.displayName} Something went wrong with server setup, im not able to assign you to your group`);
				}
				await this.setRole(message.member, message.guild.roles.get(sg.roleid));
				return message.guild.roles[sg.roleid];
			}
			lastStreakInterval = sg.endInterval;
		}
		throw new Error("You have transcended all possible streak groups");
	}

	public async setRole(member: GuildMember, role: Role): Promise<void> {
		if(member.roles.has(role.id)) return;
		await member.removeRoles(this.profile.map(sg => sg.roleid));
		await member.addRole(role.id);
		return;
	}

	private async getProfile(): Promise<void> {
		const db = await this.getDB();
		this.profile = db.profile;
	}

	private async getStreak(message: Message): Promise<void> {
		const db = await this.getDB();
		this.streak = db.streaks.find(s => s.memberid == message.member.id);
	}

	private async getDB(): Promise<Database> {
		if(this._db) return this._db;
		return (new FileManager()).load();
	}
}
