import CacheService from "../../database/cacheService";
import LastFMCommand from "../../helpers/lastfmCommand";

export default class FMUpdate extends LastFMCommand {
	category = "LastFM";
	alias = ["update"];
	description = "Updates your cache for Last.FM commands";
	usage = [""];

	async run(args:string) {

		this.reply("WIP: Updating cache.")
		await new CacheService().cacheIndividual(this.message.author.id);

	}
}
