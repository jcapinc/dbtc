import { Database, FileManager } from "./Database";
import { Client, Message } from "discord.js";

export default class Rank {
	db: Database;
	constructor(db: Database){
		this.db = db;
	}

	getUserRank(message: Message){
		return this.getSortedStreaks().findIndex(streak => streak.memberid === message.author.id);
	}

	getSortedStreaks(){
		return this.db.streaks.sort((a,b) => {
			if(a.streak == b.streak) return 0;
			if(a.streak > b.streak) return -1;
			return 1;
		})
	}

	async getRank(message: Message, start: number, end: number, client: Client){
		if( end < start ) [start, end] = [end, start];
		if(end - start > 50) end = start + 50; 
		const ps = this.getSortedStreaks().slice(start,end).map(async (streak, index) => {
			const user = await client.users.fetch(streak.memberid);
			const ret = `#${start + index + 1}: ${user.username}: ${Math.round(streak.streak / 60 / 60 / 24 / 1000)} days`
			if(user.id === message.author.id) return `**${ret}**`;
			return ret;
		});
		return `Top Updated Streaks(${start+1} to ${end})\r\n` + (await Promise.all(ps)).join("\r\n");
	}

	static async getMemberRank(message: Message, client: Client){
		const fm = new FileManager();
		const r = new Rank(await fm.load());
		const index = r.getUserRank(message);
		return await r.getRank(message, Math.max(0, index - 5), index + 5, client);
	}

	static async getRank(message: Message, start: number = 0, end: number = 9, client: Client){
		const fm = new FileManager();
		const db = await fm.load();
		const r = new Rank(db);
		return await r.getRank(message, start, end, client);
	}

}