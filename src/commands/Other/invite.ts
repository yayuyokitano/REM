import Command from "../../discord/command";

export default class GitHub extends Command {
	category = "Other";
	description = "Get GitHub link.";
	usage = [""];

	async run(args:string) {

		let embed = this.initEmbed();
		embed.setTitle("Thank you for enjoying my features!")
			.setDescription("I am open-source, licensed under the AGPL-3.0 license. You can find my code [here](https://github.com/yayuyokitano/REM). You can also report issues here.")
			.setURL("https://github.com/yayuyokitano/REM");

		this.reply(embed);
	}
}
