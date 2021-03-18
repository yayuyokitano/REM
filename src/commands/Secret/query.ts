import LastFMCommand from "../../helpers/lastfmCommand";

export default class Query extends LastFMCommand {
	category = "Secret Commands";
	description = "queries db";
	usage = [""];

	async run(args:string) {

		if (this.message.author.id !== "196249128286552064") {
			throw "No.";
		}

		if (this.message.guild.id !== "819508800448233473") {
			throw "You're prolly about to leak some shit, stop that. Go to your private server for that command.";
		}

		let res = await this.pool.query(args);
		this.debugLog(JSON.stringify(res[0]));

	}
}
