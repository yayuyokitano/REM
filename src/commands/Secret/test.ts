import LastFMCommand from "../../helpers/lastfmCommand";

function sleep(ms:number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default class Test extends LastFMCommand {
	category = "Secret Commands";
	description = "Yeet";
	usage = [""];

	async run(args:string) {

		if (this.message.author.id !== "196249128286552064") {
			throw "No.";
		}

		await sleep(5000);

		let embed = this.initEmbed();
		embed.setDescription("eee");
		this.reply(embed);

	}
}
