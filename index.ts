interface iUserCommand{
	shouldHandle(userInput: string): boolean;
	handle(userInput: string): void;
}

class UserCommand implements iUserCommand{
	matcher: RegExp;
	action: Function;
	controlChar: string;

	static commands: Array<iUserCommand> = [];
	constructor(matcher: RegExp, action: (commandString: string) => void, controlChar: string = "!"){
		this.action = action;
		this.controlChar = controlChar;
		this.matcher = matcher;
	}

	shouldHandle(): boolean{
		throw new Error("Implement Me");
	}
	
	static register(command:iUserCommand): void{
		this.commands.push(command);
	}

	handle(userInput: string): void{
		throw new Error("Implement Me");
	}
}