import { UserCommand } from "../models/UserCommand";
import { describe, it, before, after } from "mocha";
import { expect } from "chai";
import * as sinon from "sinon";

describe("The command system", () => {
	it("executes commands based on regex",() => {
		const input = "!value";
		let ran = false;
		UserCommand.register(new UserCommand(/.+/,str => {
			expect(str).to.equal(input);
			ran = true;
		}));
		UserCommand.process(input);
		expect(ran).to.equal(true);
	});
});

