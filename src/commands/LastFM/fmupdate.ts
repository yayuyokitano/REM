import CacheService from "../../database/cacheService";
import LastFMCommand from "../../helpers/lastfmCommand";

export default class FMUpdate extends LastFMCommand {
	category = "Last.FM";
	alias = ["update"];
	description = "Updates your cache for Last.FM commands. Use parameter `force` to force a complete recaching, useful if you have edited/deleted scrobbles. Update force has a cooldown of 30 minutes.";
	usage = ["", "force"];

	async run(args:string) {

		if (args === "force") {
			await new CacheService(this.pool).cacheIndividual(this.message.author.id, true);
		} else {
			await new CacheService(this.pool).cacheIndividual(this.message.author.id);
		}
		this.reply("WIP: Updating cache.")

	}
}
