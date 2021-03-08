import Command from "../../discord/command";

export default class SetPrefix extends Command {
	category = "Admin";
	description = "Sets the prefix on the server.";
	usage = [""];

	async run(args:string) {

		this.checkPerms("ADMINISTRATOR");

		if (args.length > 10) {
			throw "Prefix cannot be more than 10 characters.";
		}

		await (await this.initDB()).execute("UPDATE servers SET prefix=? WHERE serverid=?", [args, this.message.guild.id]);
		this.reply(`Successfully changed prefix to ${args}`);

	}
}
