import Command from "../../discord/command";

export default class Invite extends Command {
	category = "Other";
	description = "Get invite link.";
	usage = [""];

	async run(args:string) {

		let embed = this.initEmbed();
		embed.setTitle("Thank you for enjoying my features!")
			.setDescription(`You can add me to your server by clicking [this link](https://discord.com/api/oauth2/authorize?client_id=${this.message.client.user.id}&permissions=271903808&scope=bot)\nAdditionally, you can join the REM server [here](https://discord.gg/abyKvB9yt8) where you can discuss the bot, report issues, and the server also has a channel with updates you can follow to get update messages into a channel on your server.`)
			.setURL(`https://discord.com/api/oauth2/authorize?client_id=${this.message.client.user.id}&permissions=271903808&scope=bot`);

		this.reply(embed);
	}
}
