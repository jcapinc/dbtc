import { UserCommand } from "../models/UserCommand";
import { describe, it } from "mocha";
import { expect } from "chai";

describe("The command system", () => {
	it("executes commands based on regex",() => {
		const input = "value";
		UserCommand.register(new UserCommand(/.+/,str => {
			expect(str).to.equal(input);
		}));
		UserCommand.process(input);
	});
});

describe("the stock commands",() => {
	it("", () => {
	});
});

