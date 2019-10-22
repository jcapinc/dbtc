import { User, Message } from "discord.js";
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

	public static async delete(input: string, message: Message): Promise<deleteResponse> {
		const manager = new FileManager();
		const db = await manager.load();
		const streak = db.streaks.findIndex(streak => streak.memberid === input);
		if(streak === -1){
			const rank = new Rank(db);
			const sorted = rank.getSortedStreaks();
			if(!sorted[parseInt(input) - 1]){
				throw new Error("Could not find a streak that matches that input. Please type `!delete <ranknumber>` or `!delete <memberid>`");
			}
			const member = await message.client.fetchUser(sorted[parseInt(input) - 1].memberid);
			return {
				code: "IDENTIFIED",
				message: `user identified by rank ${input}. \nType \`!delete ${sorted[parseInt(input) - 1].memberid}\` to delete the streak of the user named ${member.username}`
			}
		}
		const [member] = db.streaks.splice(streak,1);
		manager.save(db);
		return {
			code: "DELETED",
			message: `user ${(await message.client.fetchUser(member.memberid)).username}'s streak was deleted`
		}
	}
}