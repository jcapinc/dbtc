import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { Role } from "discord.js";
import {
	CommandDictionary,
	Database,
	Streak,
	StreakGroup,
	UserCommand,
} from "../src/lib";

function makeStreak(memberid: string): Streak {
	const dt = new Date();
	dt.setHours(dt.getHours() - 1);
	return Object.assign<Streak, Partial<Streak>>(new Streak(), {
		memberid,
		streak: 100,
		start: dt.toString(),
	});
}

function makeStreakGroup(interval: number): StreakGroup {
	const name = "BANANA!";
	return {
		endInterval: interval,
		name,
		channel: { name },
		...({} as any),
	};
}

jest.mock("../src/lib/models/Database", () => ({
	FileManager: function () {
		this.load = function () {
			return new Promise<Database>((resolve) =>
				resolve({
					streaks: ["1", "2", "3", "20"].map(makeStreak),
					settings: {},
					profile: [50, 200, 500, 100, Number.MAX_SAFE_INTEGER].map(
						makeStreakGroup
					),
					findStreakByMember: (member) => makeStreak(member),
				})
			);
		};
		this.save = jest.fn();
		this.backup = jest.fn();
	},
}));

describe("The commands", () => {
	let message: any;
	let send = jest.fn();
	let fetchMember = jest.fn();
	let isAdmin = true;

	const role: Role = {
		id: "",
		...({} as any),
	};

	const roles = {
		get: () => role,
		has: () => true,
	};

	let createChannel = jest.fn();
	let createRole = jest.fn();
	let makeGuild = () => ({ roles, createChannel, createRole, fetchMember });

	let makeMember = () => ({
		hasPermission: () => isAdmin,
		guild: makeGuild(),
		roles,
	});

	let member = makeMember();
	createChannel.mockReturnValue({ name: "herpder", id: "1" });
	fetchMember.mockReturnValue(member);
	createRole.mockReturnValue(role);

	let guild = makeGuild();

	beforeEach(() => {
		member = makeMember();
		isAdmin = true;
		UserCommand.clearCommands();
		[fetchMember, send, createChannel].map((fn) => fn.mockClear());
		guild = makeGuild();
		message = {
			channel: { send },
			guild,
			client: { fetchUser: () => ({ username: "herpderp" }) },
			author: { id: "1" },
		};
	});

	test("jest mock function expectations", async (done) => {
		expect(fetchMember).not.toHaveBeenCalled();
		const member = fetchMember();
		expect(fetchMember).toHaveBeenCalled();
		expect(member).toBeDefined();
		const compareMember = makeMember();
		Object.keys(compareMember).map((key) => {
			expect(member[key]).toBeDefined();
		});
		fetchMember.mockClear();
		expect(fetchMember).not.toHaveBeenCalled();
		done();
	});

	test("the help command", async (done) => {
		const msg = { content: "!help", ...message };
		UserCommand.register(CommandDictionary["help"]);
		await UserCommand.process(msg);
		expect(send).toHaveBeenCalled();
		const adminMatch = /.+\![Aa]dmin.+/;
		expect(send.mock.calls[0][0]).toMatch(adminMatch);
		isAdmin = false;
		await UserCommand.process(msg);
		expect(send.mock.calls[1][0]).not.toMatch(adminMatch);
		done();
	});

	test("the basic relapse", async (done) => {
		UserCommand.register(CommandDictionary["relapse"]);
		await UserCommand.process({ content: "!relapse", ...message });
		expect(send).toHaveBeenCalled();
		expect(send.mock.calls[0][0]).toMatch(/.+0\s[Dd]ays/);
		done();
	});

	test("the relapse with one arg", async (done) => {
		UserCommand.register(CommandDictionary["relapseOne"]);
		await UserCommand.process({ content: "!relapse 1", ...message });
		expect(send).toHaveBeenCalled();
		expect(send.mock.calls[0][0]).toMatch(/.+1\s[Dd]ays/);
		done();
	});

	test("the relapse with two args", async (done) => {
		UserCommand.register(CommandDictionary["relapseTwo"]);
		await UserCommand.process({ content: "!relapse 1 1", ...message });
		expect(send).toHaveBeenCalled();
		expect(send.mock.calls[0][0]).toMatch(/.+1\s[Dd]ays/);
		done();
	});

	test("the update command", async (done) => {
		UserCommand.register(CommandDictionary["update"]);
		await UserCommand.process({ content: "!update", ...message });
		expect(send).toHaveBeenCalled();
		const result = expect(send.mock.calls[0][0]);
		result.toMatch(/^Streak\sstarted.+/);
		result.not.toMatch(/.*Error.*/);
		done();
	});

	test("the stats command", async (done) => {
		UserCommand.register(CommandDictionary["stats"]);
		message.contents = "!stats";
		await UserCommand.process({ content: "!stats", ...message });
		expect(send).toHaveBeenCalled();
		const result = expect(send.mock.calls[0][0]);
		result.toMatch(/.*The average streak.*/);
		result.toMatch(/.*the longest streak is.*/);
		done();
	});

	test("the groupsstats command", async (done) => {
		UserCommand.register(CommandDictionary["groupstats"]);
		message.contents = "!groupstats";
		await UserCommand.process({ content: "!groupstats", ...message });
		expect(send).toHaveBeenCalled();
		expect(send.mock.calls[0][0]).toMatch(/^Streak\sGroup\sStats.+/);
		done();
	});

	test("the basic rank command", async (done) => {
		UserCommand.register(CommandDictionary["rank"]);
		await UserCommand.process({ content: "!rank", ...message });
		expect(send).toHaveBeenCalled();
		const result = expect(send.mock.calls[0][0]);
		result.toMatch(/.*Top Updated Streaks.+/);
		result.toMatch(/.+\!myrank.+/);
		done();
	});

	test("the ranged rank command", async (done) => {
		UserCommand.register(CommandDictionary["rankRange"]);
		await UserCommand.process({ content: "!rank 10-20", ...message });
		expect(send).toHaveBeenCalled();
		expect(send.mock.calls[0][0]).toMatch(/.*Top Updated Streaks.+/);
		done();
	});

	test("the myrank command", async (done) => {
		UserCommand.register(CommandDictionary["myrank"]);
		await UserCommand.process({ content: "!myrank", ...message });
		expect(send).toHaveBeenCalled();
		expect(send.mock.calls[0][0]).toMatch(/.*Top Updated Streaks.+/);
		done();
	});

	test("the guide command", async (done) => {
		UserCommand.register(CommandDictionary["guide"]);
		await UserCommand.process({ content: "!guide", ...message });
		expect(send).toHaveBeenCalled();
		expect(send.mock.calls[0][0]).toMatch(/.+\!relapse.+/);
		done();
	});

	test("the initialize command", async (done) => {
		UserCommand.register(CommandDictionary["initialize"]);
		const msg = { content: "!initialize", ...message };
		await UserCommand.process(msg);
		expect(send).toHaveBeenCalled();
		expect(send.mock.calls[0][0]).toMatch(/^Received.+/);
		expect(send.mock.calls[1][0]).toMatch(/^Channels.+/);
		expect(createChannel).toHaveBeenCalled();
		isAdmin = false;
		await UserCommand.process(msg);
		expect(send).toHaveBeenCalled();
		expect(send.mock.calls[2][0]).toMatch(/.+admin\-only.+/);
		done();
	});

	test("the admin command", async (done) => {
		UserCommand.register(CommandDictionary["admin"]);
		const msg = { content: "!admin", ...message };
		await UserCommand.process(msg);
		expect(send).toHaveBeenCalled();
		isAdmin = false;
		await UserCommand.process(msg);
		expect(send).toHaveBeenCalled();
		expect(send.mock.calls[1][0]).toMatch(/.+admin\-only.+/);
		done();
	});

	test("the admin restrict command", async (done) => {
		UserCommand.register(CommandDictionary["adminRestrict"]);
		const msg = { content: "!admin restrict", ...message };
		await UserCommand.process(msg);
		expect(send).toHaveBeenCalled();
		expect(send.mock.calls[0][0]).toMatch(/^Updates and Relapses.+/);
		isAdmin = false;
		await UserCommand.process(msg);
		expect(send).toHaveBeenCalled();
		expect(send.mock.calls[1][0]).toMatch(/.+admin\-only.+/);
		done();
	});

	test("the admin unrestrict command", async (done) => {
		UserCommand.register(CommandDictionary["adminUnrestrict"]);
		const msg = { content: "!admin unrestrict", ...message };
		await UserCommand.process(msg);
		expect(send).toHaveBeenCalled();
		expect(send.mock.calls[0][0]).toMatch(/^Restriction remove.+/);
		isAdmin = false;
		await UserCommand.process(msg);
		expect(send).toHaveBeenCalled();
		expect(send.mock.calls[1][0]).toMatch(/.+admin\-only.+/);
		done();
	});

	test("the admin backup command", async (done) => {
		UserCommand.register(CommandDictionary["adminBackup"]);
		const msg = { content: "!admin backup", ...message };
		await UserCommand.process(msg);
		expect(send).toHaveBeenCalled();
		expect(send.mock.calls[0][0]).toMatch(/^new backup.+/);
		isAdmin = false;
		await UserCommand.process(msg);
		expect(send).toHaveBeenCalled();
		expect(send.mock.calls[1][0]).toMatch(/.+admin\-only.+/);
		done();
	});

	test("the admin delete command", async (done) => {
		UserCommand.register(CommandDictionary["adminDelete"]);
		const msg = { content: "!admin delete 4", ...message };
		await UserCommand.process(msg);
		await UserCommand.process({ content: "!admin delete 1", ...message });
		expect(send).toHaveBeenCalled();
		expect(send.mock.calls[0][0]).toMatch(/^user identified.+/);
		expect(send.mock.calls[1][0]).toMatch(/^user\(s\)\s.+/);
		isAdmin = false;
		await UserCommand.process(msg);
		expect(send).toHaveBeenCalled();
		expect(send.mock.calls[2][0]).toMatch(
			/.+do not have elevated permissions.+/
		);
		done();
	});

	test("the admin streak group command", async (done) => {
		UserCommand.register(CommandDictionary["adminStreakgroup"]);
		const msg = { content: "!admin streakgroups", ...message };
		await UserCommand.process(msg);
		expect(send).toHaveBeenCalled();
		isAdmin = false;
		await UserCommand.process(msg);
		expect(send).toHaveBeenCalled();
		expect(send.mock.calls[1][0]).toMatch(/.+admin\-only.+/);
		done();
	});

	test("the admin change interval command", async (done) => {
		UserCommand.register(CommandDictionary["adminChangeInterval"]);
		const msg = { content: "!admin changeinterval 1 1", ...message };
		await UserCommand.process(msg);
		expect(send).toHaveBeenCalled();
		isAdmin = false;
		await UserCommand.process(msg);
		expect(send).toHaveBeenCalled();
		expect(send.mock.calls[1][0]).toMatch(/.+admin\-only.+/);
		done();
	});

	test("the admin old streaks command", async (done) => {
		UserCommand.register(CommandDictionary["adminOldStreaks"]);
		const msg = { content: "!admin oldstreaks", ...message };
		await UserCommand.process(msg);
		expect(send).toHaveBeenCalled();
		isAdmin = false;
		await UserCommand.process(msg);
		expect(send).toHaveBeenCalled();
		expect(send.mock.calls[1][0]).toMatch(/.+admin\-only.+/);
		done();
	});
});
