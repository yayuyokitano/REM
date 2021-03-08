import LastFMCommand from "../../helpers/lastfmCommand";

export default class Test extends LastFMCommand {
	category = "Secret";
	description = "Yeet";
	usage = [""];

	async run(args:string) {

		if (this.message.author.id !== "196249128286552064") {
			throw "No.";
		}

		console.log(this.message.guild.members.cache.keyArray());
		console.log(this.message.guild.members.cache.keyArray());

	}
}
