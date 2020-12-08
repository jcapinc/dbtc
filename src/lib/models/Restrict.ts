import { Database, FileManager } from "./Database";
import { Message } from "discord.js";

export default class Restrict {
	db: Database;
	constructor(db: Database) {
		this.db = db;
	}

	static async isRestricted(message: Message): Promise<string | false> {
		const manager = new FileManager();
		const db = await manager.load();
		if (db.settings.restrictedChannel === undefined) return false;
		if (db.settings.restrictedChannel !== message.channel.id) {
			return message.guild.channels.get(db.settings.restrictedChannel).name;
		}
		return false;
	}

	static async Restrict(message: Message) {
		const manager = new FileManager();
		const db = await manager.load();
		const rest = new this(db);
		rest.restrict(message);
		manager.save(db);
	}

	restrict(message: Message) {
		this.db.settings.restrictedChannel = message.channel.id;
	}

	static async Unrestrict() {
		const manager = new FileManager();
		const db = await manager.load();
		const rest = new this(db);
		rest.unrestrict();
		manager.save(db);
		return undefined;
	}

	unrestrict() {
		this.db.settings.restrictedChannel = undefined;
	}
}
