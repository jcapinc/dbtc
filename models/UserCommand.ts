import { Message } from "discord.js";

export interface iUserCommand {
	matcher: RegExp;
	outMethod: (output: string) => void;
	shouldHandle(userInput: Message): boolean;
	handle(userInput: Message): void;
	setOutMethod(method: (output: string) => void): void;
}

export default class UserCommand implements iUserCommand {
	static commands: Array<iUserCommand> = [];
	matcher: RegExp;
	controlChar: string;
	action: (command: Message) => void;
	outMethod: (output: string) => void;

	constructor(matcher: RegExp, action: (message: Message) => void){
		this.action = action;
		this.matcher = matcher;
		this.setOutMethod((output: string) => console.log(output));
	}

	public setOutMethod(method: (output: string) => void): void {
		this.outMethod = method;
	}

	public shouldHandle(userInput: Message): boolean{
		return this.matcher.test(userInput.content);
	}

	public handle(userInput: Message): void{
		return this.action.call(this,userInput);
	}

	public static setAllOutputMethods(method: (output: string) => void): void {
		this.commands.map(cmd => cmd.setOutMethod(method));
	}
	
	public static register(command: iUserCommand): void {
		this.commands.push(command);
	}

	public static getCommandByMatcher(matcher: RegExp): iUserCommand {
		return this.commands.filter(cmd => cmd.matcher === matcher)[0];
	}

	public static process(userInput: Message): void {
		for(let command of this.commands){
			if(command.shouldHandle(userInput)){
				return command.handle(userInput);
			}
		}
	}
}