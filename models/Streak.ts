import { User, Message, GuildMember } from "discord.js";
import { FileManager } from "./Database";
import Rank from "./Rank";

export type deleteCode = "DELETED" | "NOT_FOUND" | "IDENTIFIED";

export interface deleteResponse{
	code: deleteCode;
	message: string;
}

export class Streak{
	public memberid: string;
	public start: string;
	public streak: number = 0;
	public membername: string;

	public static async relapse(member: User | string, days?: number, hours?: number ): Promise<Streak>{
		const manager = new FileManager();
		const db = await manager.load();
		const memberid = this.resolveMember(member);
		let streak = db.findStreakByMember(memberid);
		if(streak !== undefined){
			streak.relapse(days, hours);
			await manager.save(db);
			return streak;
		}
		streak = new Streak();
		streak.memberid = memberid;
		streak.relapse(days,hours);
		db.streaks.push(streak);
		await manager.save(db);
		return streak;
	}

	public static async update(member: User | string): Promise<string>{
		const manager = new FileManager();
		const db = await manager.load();
		const memberid = this.resolveMember(member);
		const streak = db.findStreakByMember(memberid);
		if(streak === undefined){
			return "!guide You have no streak on record, type `!relapse` to begin your streak, or `!relapse <days> <hours>";
		}
		const result = streak.update();
		manager.save(db);
		return result;
	}

	public update(): string{
		const rawDifference = (new Date()).getTime() - this.getStartDate().getTime();
		const rawDays = rawDifference / (1000*60*60*24);
		const days = Math.floor(rawDays);
		const hours = Math.floor((rawDays - days) * 24);
		this.streak = rawDifference;

		return `Streak started ${days} days and ${hours} hours ago`;
	}

	public static async find(member: User | string): Promise<Streak | undefined> {
		const manager = new FileManager();
		const db = await manager.load();
		const memberid = this.resolveMember(member);
		return db.findStreakByMember(memberid);
	}

	private static resolveMember(member: User | string): string{
		if(member instanceof User) return member.id;
		return member;
	}

	public relapse(days?: number, hours?: number): Date {
		const date = new Date();
		if(days) date.setDate(date.getDate() - days);
		if(hours) date.setHours(date.getHours() - hours);
		this.start = date.toString();
		this.streak = (new Date()).getTime() - date.getTime();
		return date;
	}

	public getStartDate(): Date {
		return new Date(this.start);
	}

	public static async delete(ids: string[], message: Message): Promise<deleteResponse> {
		const manager = new FileManager();
		const db = await manager.load();
		const streaks: Streak[] = [];
		for(let i = 0; i < ids.length; i++){
			const streak = db.streaks.findIndex(streak => streak.memberid === ids[i]);
			if(streak === -1){
				const rank = new Rank(db);
				const sorted = rank.getSortedStreaks();
				if(!sorted[parseInt(ids[i]) - 1]){
					continue;
				} else {
					const member = await message.client.fetchUser(sorted[parseInt(ids[i]) - 1].memberid);
					return {
						code: "IDENTIFIED",
						message: `user identified by rank ${ids[i]}. \nType \`!admin delete ${sorted[parseInt(ids[i]) - 1].memberid}\` to delete the streak of the user named ${member.username}`
					}
				}
			}
			streaks.push(db.streaks.splice(streak,1)[0]);
		}
		manager.save(db);

		const userList = (await Promise.all(streaks.map(async (streak) => {
			return (await message.client.fetchUser(streak.memberid)).username;
		}))).join(", ")
		return {
			code: "DELETED",
			message: `user(s) '${userList}' streak(s) was deleted`
		}
	}

	public static async old(message: Message, start: number = 0, end: number = 20){
		const manager = new FileManager();
		const db = await manager.load();
		const streaks = db.streaks.map(streak => Object.assign({}, streak, {
			age: (new Date()).getTime() - streak.streak - streak.getStartDate().getTime(),
			name: (message.guild.members.get(streak.memberid) || {displayName: "*missing user*"}).displayName
		})).sort((a,b) => {
			if(a.age === b.age) return 0;
			if(a.age < b.age) return 1;
			return -1;
		}).slice(start, end);
		const maxLength = streaks.reduce((carry, streak) => Math.max(carry,streak.name.length), 0);
		return '```' + streaks.map(streak => {
			const age = Math.round(streak.age / (60 * 60 * 24 * 1000)).toString();
			const nameBuffer = ' '.repeat(maxLength + 1 - streak.name.length);
			const ageBuffer = ' '.repeat(5 - age.length + 1);
			return `${streak.name}${nameBuffer}${age}${ageBuffer}${streak.memberid}`
		}).join("\n") + '```';
	}
}