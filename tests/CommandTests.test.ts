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
	dt.setHours(dt.getHours() - 1)
	return Object.assign<Streak, Partial<Streak>>(new Streak(), {
		memberid,
		streak: 100,
		start: dt.toString()
	});
}

function makeStreakGroup(interval: number): StreakGroup {
	return {
		endInterval: interval,
		...({} as any),
	};
}

jest.mock("../src/lib/models/Database", () => ({
	FileManager: function () {
		this.load = function () {
			return new Promise<Database>((resolve) =>
				resolve({
					streaks: ["1", "2", "3"].map(makeStreak),
					settings: {},
					profile: [50, 200, 500, 100, Number.MAX_SAFE_INTEGER].map(
						makeStreakGroup
					),
					findStreakByMember: (member) => makeStreak(member),
				})
			);
		};
		this.save = jest.fn();
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

	let member = {
		hasPermission: () => isAdmin,
		guild: { roles },
		roles,
	};

	let guild = { fetchMember, roles };

	beforeEach(() => {
		member = {
			hasPermission: () => isAdmin,
			guild: { roles },
			roles,
		};
		isAdmin = true;
		UserCommand.clearCommands();
		fetchMember = jest.fn();
		send = jest.fn();
		fetchMember.mockReturnValue(new Promise((resolve) => resolve(member)));
		guild = { fetchMember, roles };
		message = {
			channel: { send },
			guild,
			author: { id: "1" },
		};
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
		UserCommand.register(CommandDictionary['update']);
		await UserCommand.process({content: '!update', ...message});
		expect(send).toHaveBeenCalled();
		const result = expect(send.mock.calls[0][0]);
		result.toMatch(/^Streak\sstarted.+/);
		result.not.toMatch(/.*Error.*/);
		done();
	})

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
});
