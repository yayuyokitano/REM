import LastFMCommand from "../../helpers/lastfmCommand";
import calculatePearson from "../../helpers/math/pearson";

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

		console.log(await this.lastfm.artist.getCorrection(args));

	}
}
