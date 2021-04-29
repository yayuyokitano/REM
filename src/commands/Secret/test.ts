import LastFMCommand from "../../helpers/lastfmCommand";
import ytdl from "ytdl-core-discord";
import path from "path";
import fs from "fs";

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

		const conn = await this.message.member.voice.channel.join();
		conn.on("debug", console.log);

		const dispatcher = conn.play(path.resolve("1-02 Rolling Sky.mp3"));

		dispatcher.on("start", () => {console.log("started")});
		dispatcher.on("finish", () => {console.log("finished")});
		dispatcher.on("error", console.error);
		dispatcher.on("debug", console.log);

		/*let stream = ytdl(args, {quality:"highestaudio"});
		stream.on("error", console.error);
		conn.play(stream);*/

	}
}
