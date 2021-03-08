export interface CommandList {
	[key:string]:any;
}

export interface CommandConstructor {
	new (): BaseCommand;
}

export interface BaseCommand {
	[key:string]:any;
}