import { Database, FileManager } from "./Database";

const hour = 1000 * 60 * 60;
const day = hour * 24;

export default class Stats {
	private db: Database;
	constructor(db: Database) {
		this.db = db;
	}

	static async getStats() {
		const fm = new FileManager();
		const db = await fm.load();
		const stats = new this(db);
		return stats.getStatParagraph();
	}

	static async getGroupStats() {
		const fm = new FileManager();
		const db = await fm.load();
		const stats = new this(db);
		return stats.getGroupStatList();
	}

	getGroupStatList(): string {
		const groups: Record<string, number> = {};
		this.db.profile.map((group) => {
			groups[group.channel.name] = 0;
		});
		this.db.streaks.map((streak) => {
			let lastStreakInterval = 0;
			for (let i = 0; i < Object.keys(groups).length; i++) {
				if (
					streak.streak >= lastStreakInterval &&
					streak.streak < this.db.profile[i].endInterval
				) {
					return groups[Object.keys(groups)[i]]++;
				}
				lastStreakInterval = this.db.profile[i].endInterval;
			}
		});
		const maxNameLength = Object.keys(groups).reduce(
			(carry, groupname) => Math.max(carry, groupname.length),
			0
		);
		const maxCountLength = Object.keys(groups).reduce(
			(carry, groupname) =>
				Math.max(carry, groups[groupname].toString().length),
			0
		);
		return (
			"Streak Group Stats by Streak Group: ```\r\n" +
			Object.keys(groups)
				.map(
					(groupName) =>
						`${groupName}:${" ".repeat(maxNameLength - groupName.length + 1)}` +
						`${" ".repeat(
							maxCountLength - groups[groupName].toString().length
						)}${groups[groupName]}`
				)
				.join("\r\n") +
			"\r\n```"
		);
	}

	getMemberCount(): number {
		return this.db.streaks.length;
	}

	getAverageStreakMS(): number {
		const ct = this.getMemberCount();
		const total = this.getStreakTotalMS();
		if (ct === 0 || total === 0) return 0;
		return Math.round(total / ct);
	}

	getAverageStreakDays(): number {
		return Math.round(this.getAverageStreakMS() / day);
	}

	getMaxStreakMS(): number {
		return this.db.streaks.reduce<number>(
			(carry, streak) => Math.max(streak.streak, carry),
			0
		);
	}

	getMaxStreakDays(): number {
		return Math.round(this.getMaxStreakMS() / day);
	}

	getMinStreakMS(): number {
		return this.db.streaks.reduce(
			(carry, streak) => Math.min(streak.streak, carry),
			Number.MAX_SAFE_INTEGER
		);
	}

	getMinStreakHours(): number {
		return Math.round(this.getMinStreakMS() / hour);
	}

	getStreakTotalMS(): number {
		return this.db.streaks.reduce((carry, streak) => carry + streak.streak, 0);
	}

	getStreakTotalDays() {
		return Math.round(this.getStreakTotalMS() / day);
	}

	getMemberCountMessage(): string {
		return `${this.getMemberCount()} members are tracking streaks`;
	}

	getDurationStatMessage(): string {
		return `The average streak is ${this.getAverageStreakDays()} days. All the streaks combined total ${this.getStreakTotalDays()} days`;
	}

	getMinMaxMessage(): string {
		// old shortest message: The shortest streak is ${this.getMinStreakHours()} hours and
		return `the longest streak is ${this.getMaxStreakDays()} days`;
	}

	getStatParagraph(): string {
		return (
			`\n${this.getMemberCountMessage()}\n${this.getMinMaxMessage()}\n${this.getDurationStatMessage()}` +
			"\r\n\r\n try `!groupstats` for more information"
		);
	}
}
