import { getRecentTracks } from "lastfm-typed/dist/interfaces/userInterface";
import LastFMCommand from "../../helpers/lastfmCommand";

export default class Scrobbles extends LastFMCommand {

	category = "Last.FM";
	description = "Gets your scrobble count from Last.FM";
	usage = ["", "@mention", "1m", "lfm:Mexdeep 1m2w", "1 month and 2 weeks"];
	alias = ["s"];

	async run(args:string) {

		let lastfmSession = (await this.getRelevantLFM()).session[0];
		let recenttracks:getRecentTracks;

		if (typeof lastfmSession === "undefined") {
			throw `User is not logged in to last.fm. You can login using \`${await this.getPrefix()}login\``
		}

		let duration = this.getDuration(args);

		try {
			if (duration[0] === 0) {
				recenttracks = await this.lastfm.user.getRecentTracks(lastfmSession, {limit: 1});
			} else {
				recenttracks = await this.lastfm.user.getRecentTracks(lastfmSession, {limit: 1, from: (this.getUnixTime() - duration[0]).toString()});
			}
		} catch(err) {
			throw `There was an error connecting to Last.FM. User may not have connected their Last.FM account, which can be done by doing \`${await this.getPrefix()}login\``
		}

		this.reply(`${this.sanitizeMarkdown(recenttracks.meta.user)} has ${Number(recenttracks.meta.total).toLocaleString("fr")} scrobbles${duration[0] !== 0 ? ` in the last ${duration[1]}`:""}.`);

	}

}