import { readFile, writeFile, access, constants } from "fs";
import { Streak } from "./Streak";
import { StreakGroup } from "./Initializer";

export class Database {
	public streaks: Array<Streak>;
	public profile: Array<StreakGroup>;

	public toString(): string {
		return JSON.stringify({
			streaks: this.streaks,
			profile: this.profile.map(s => {
				return {
					roleid:  s.roleid,
					channelid:  s.channelid,
					channel:  s.channel,
					role:  s.role,
					endInterval: s.endInterval
				};
			})
		});
	}

	public static parse(value:any): Database {
		const db = new Database()
		db.streaks = value.streaks ? value.streaks.map(s => Object.assign(new Streak(),s)): [];
		db.profile = value.profile ? value.profile.map(s => Object.assign(new StreakGroup(""),s)): [];
		return db;
	}

	public findStreakByMember(memberid: string): Streak | undefined {
		let streak: Streak;
		this.streaks.map((s,i) => {
			if(s.memberid === memberid){
				streak = this.streaks[i];
			}
		});
		return streak;
	}
}

export class FileManager {
	filename: string;

	constructor(filename: string = "db.json"){
		this.filename = filename;
	}

	public async save(db: Database): Promise<void> {
		return await new Promise<void>((resolve, reject) => {
			writeFile(this.filename,db.toString(),(err) =>{
				if(err) reject(err);
				resolve();
			});
		});
	}

	public async load(): Promise<Database> {
		const exists = await new Promise<boolean>(resolve => {
			access(this.filename, constants.F_OK.valueOf(), function(err){
				if(err) resolve(false)
				else resolve(true);
			});
		});
		if(!exists) return Database.parse({});
		const promise = new Promise<string>((resolve,reject) => readFile(this.filename,function(err,data){
			if(err) reject(err);
			else resolve(data.toString());
		}));
		return Database.parse(JSON.parse(await promise));
	}
}
