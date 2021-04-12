import { Message } from "discord.js";
import CacheService from "../../database/cacheService";
import LastFMCommand from "../../helpers/lastfmCommand";

export default class FMUpdate extends LastFMCommand {
	category = "Last.FM";
	alias = ["update"];
	description = "Updates your cache for Last.FM commands. Use parameter `force` to force a complete recaching, useful if you have edited/deleted scrobbles. Update force has a cooldown of 30 minutes.";
	usage = ["", "force"];
	progress:number;
	currReply:Message;
	messageStart:string;

	async run(args:string) {

		let cacheService = new CacheService(this.pool);
		const isFull = (args.toLowerCase() === "force" || args.toLowerCase() === "full");
		let scrobbleCacher = await cacheService.cacheIndividual(this.message.author.id, isFull);

		this.currReply = await this.reply("WIP: Updating cache. (0%)");
		this.messageStart = this.currReply.content.slice(0, -4);
		this.progress = 0;

		let messageUpdater = setInterval(() => {
			this.currReply.edit(`${this.messageStart}(${Math.round(this.progress)}%)`);
		}, 1500);

		scrobbleCacher.on("data", (data) => {
			this.progress = data.progress * 100;
		});

		scrobbleCacher.on("close", () => {
			clearInterval(messageUpdater);
			this.currReply.edit(`${this.messageStart}(Done!)`);
		});
		
		scrobbleCacher.on("error", () => {
			clearInterval(messageUpdater);
			this.currReply.edit(`${this.messageStart}(An error occurred!)`);
		});

	}
}
