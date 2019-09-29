import { User } from "discord.js";
import { FileManager } from "./Database";

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
			return "You have no streak on record, type !relapse to begin your streak, or !relapse (days) (hours)";
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
}