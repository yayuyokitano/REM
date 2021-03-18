import Command from "../../discord/command";

export default class Ping extends Command {
	category = "Secret Commands";
	description = "Pong.";
	usage = [""];

	async run(args:string) {

		this.reply("pong");

	}
}
