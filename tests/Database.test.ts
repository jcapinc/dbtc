import { describe, test, expect, jest } from "@jest/globals";
import { Database, FileManager } from "../src/lib";
import * as originalFS from "fs";
import dbdata from "../static/test-db.json";

const fs = originalFS as Record<string, jest.MockedFunction<any>>;
const dbpath = "static/test-db.json";

jest.mock("fs");

describe("the database system", () => {
	const db: Database = Database.parse(dbdata);

	const modImplementation = (...args) => {
		const callback = args[2] as Function;
		setTimeout(() => callback(null), 10);
	};

	[fs.writeFile, fs.copyFile].map((fn: jest.MockedFunction<any>) => {
		fn.mockImplementation(modImplementation);
	});

	fs.readFile.mockImplementation((...args) => {
		setTimeout(() => {
			args[1](null, db.toString());
		}, 10);
	});

	fs.access.mockImplementation((...args) => {
		setTimeout(() => {
			args[2](null, db.toString());
		});
	});

	const fm = new FileManager(dbpath);

	test("the loading process", async (done) => {
		const db = await fm.load();
		const expdb = expect(db);
		expdb.toBeDefined();
		["streaks", "settings", "profile"].map((prop) =>
			expdb.toHaveProperty(prop)
		);
		done();
	});

	test("the save process", async (done) => {
		await fm.save(db);
		expect(fs.writeFile).toHaveBeenCalled();
		done();
	});

	test("the backup process", async (done) => {
		await fm.backup();
		expect(fs.copyFile).toHaveBeenCalled();
		done();
	});

	test("find streak by member", async (done) => {
		db.streaks.push({ memberid: "1", ...({} as any) });
		const member = db.findStreakByMember("1");
		expect(member).toBeDefined();
		const badMember = db.findStreakByMember("100");
		expect(badMember).toBeUndefined();
		done();
	});
});
