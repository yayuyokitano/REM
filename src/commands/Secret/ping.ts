import Command from "../../discord/command";

export default class Ping extends Command {
	category = "Secret";
	description = "Pong.";
	usage = [""];

	async run(args:string) {

		this.reply("pong");

	}
}
