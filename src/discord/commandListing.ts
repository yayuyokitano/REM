import { CommandConstructor } from "./commandInterface";

export default class CommandListing {

	command:CommandConstructor;
	isAlias:boolean;
	category:string;

	constructor(commandConstructor:CommandConstructor, isAlias:boolean, category:string) {
		this.command = commandConstructor;
		this.isAlias = isAlias;
		this.category = category;
	}

}