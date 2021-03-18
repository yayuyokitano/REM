import LastFMCommand from "../../helpers/lastfmCommand";

export default class Test extends LastFMCommand {
	category = "Secret Commands";
	description = "Yeet";
	usage = [""];

	async run(args:string) {

		if (this.message.author.id !== "196249128286552064") {
			throw "No.";
		}

		this.reply(this.getLocalizedTime(new Date(), await this.getTimezone()));

	}
}
