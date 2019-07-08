export interface iUserCommand {
	shouldHandle(userInput: string): boolean;
	handle(userInput: string): void;
}

export class UserCommand implements iUserCommand {
	static commands: Array<iUserCommand> = [];
	matcher: RegExp;
	controlChar: string;
	action: (commandString: string) => void;

	constructor(matcher: RegExp, action: (commandString: string) => void, controlChar: string = "!"){
		this.action = action;
		this.controlChar = controlChar;
		this.matcher = matcher;
	}

	shouldHandle(userInput): boolean{
		return this.matcher.test(userInput);
	}
	
	static register(command: iUserCommand): void {
		this.commands.push(command);
	}

	static process(userInput: string): void {
		for(let command of this.commands){
			if(command.shouldHandle(userInput)){
				return command.handle(userInput);
			}
		}
	}

	handle(userInput: string): void{
		return this.action.call(this,userInput);
	}
}