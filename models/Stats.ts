import { Database, FileManager } from "./Database";

const hour = 1000 * 60 * 60
const day = hour * 24

export default class Stats{
	private db: Database;
	constructor(db: Database){
		this.db = db;
	}

	static async getStats(){
		const fm = new FileManager();
		const db = await fm.load();
		const stats = new this(db);
		return stats.getStatParagraph();
	}

	getMemberCount(): number {
		return this.db.streaks.length;
	}

	getAverageStreakMS(): number {
		const ct = this.getMemberCount();
		const total = this.getStreakTotalMS();
		if(ct === 0 || total === 0) return 0;
		return Math.round(total / ct);
	}

	getAverageStreakDays(): number {
		return Math.round(this.getAverageStreakMS() / day);
	}

	getMaxStreakMS(): number {
		const now = (new Date()).getTime();
		return this.db.streaks.reduce<number>((carry,streak) => Math.max(now - streak.getStartDate().getTime(), carry),0);
	}
	getMaxStreakDays(): number {
		return Math.round(this.getMaxStreakMS() / day);
	}

	getMinStreakMS(): number {
		const now = (new Date()).getTime();
		return this.db.streaks.reduce<number>((carry,streak) => Math.min(now - streak.getStartDate().getTime(), carry),Number.MAX_SAFE_INTEGER);
	}

	getMinStreakHours(): number {
		return Math.round(this.getMinStreakMS() / hour);
	}

	getStreakTotalMS(): number {
		const now = (new Date()).getTime();
		return this.db.streaks.reduce<number>((carry,streak) => {
			return carry + now - streak.getStartDate().getTime()
		},0);
	}

	getStreakTotalDays(){
		return Math.round(this.getStreakTotalMS() / day)
	}

	getMemberCountMessage(): string {
		return `${this.getMemberCount()} members are currently tracking streaks`;
	}

	getDurationStatMessage(): string {
		return `The average streak is ${this.getAverageStreakDays()} days, totalling ${this.getStreakTotalDays()}`;
	}

	getMinMaxMessage(): string {
		return `The shortest streak is ${this.getMinStreakHours()} hours and the longest streak is ${this.getMaxStreakDays()} days`;
	}

	getStatParagraph(): string {
		return `\n${this.getMemberCountMessage()}\n${this.getMinMaxMessage()}\n${this.getDurationStatMessage()}`;
	}
}
