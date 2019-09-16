import { Database, FileManager } from "./Database";
import { Message } from "discord.js";

export default class Rank {
	db: Database;
	constructor(db: Database){
		this.db = db;
	}

	async getRank(message: Message){
		const ps = this.db.streaks.sort((a,b) => {
			if(a.streak == b.streak) return 0;
			if(a.streak > b.streak) return -1;
			return 1;
		}).slice(0,10).map(async (streak, index) => {
			const user = await message.client.fetchUser(streak.memberid);
			return `#${index + 1}: ${user.username}: ${Math.round(streak.streak / 60 / 60 / 24 / 1000)} days`
		});
		return "Top Ten Updated Streaks\r\n" + (await Promise.all(ps)).join("\r\n");
	}

	static async getRank(message: Message){
		const fm = new FileManager();
		const db = await fm.load();
		const r = new Rank(db);
		return await r.getRank(message);
	}

}