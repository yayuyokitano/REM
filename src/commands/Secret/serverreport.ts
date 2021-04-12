import Command from "../../discord/command";

export default class ServerReport extends Command {
	category = "Secret Commands";
	description = "show servers rem is in";
	usage = [""];

	async run(args:string) {

		if (this.message.author.id !== "196249128286552064") {
			throw "No.";
		}

		let serverList = this.message.client.guilds.cache;

		let embed = this.initEmbed();
		embed.setTitle("Servers I am in");

		let serverPrepared = serverList.map(server => [server.memberCount, server.name]) as [number, string][];
		const total = serverPrepared.reduce((acc, cur) => acc + cur[0], 0);
		this.createTableMessage(embed, serverPrepared, ["member", "members"], `**${total.toLocaleString("fr")} members from ${serverPrepared.length} servers**\n\n`);

	}
}
