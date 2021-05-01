import LastFMCommand from "../../helpers/lastfmCommand";

export default class TrackPlays extends LastFMCommand {

	category = "Last.FM";
	description = "Gets track playcount from Last.FM";
	usage = ["", "KITANO REM - RAINSICK"];
	alias = ["tp"];

	async run(args:string) {

		let lastfmSession = await this.getRelevantLFM();
		let {track} = await this.getRelevantTrackDetailed(args, lastfmSession.session[0]);

		if (typeof lastfmSession === "undefined") {
			throw `User is not logged in to last.fm. You can login using \`${await this.getPrefix()}login\``
		}

		try {
			this.reply(`${this.sanitizeMarkdown(lastfmSession.safe[0])} has ${Number(track.userplaycount).toLocaleString("fr")} scrobbles of ${this.sanitizeMarkdown(track.name)}`);

		} catch(err) {
			throw `There was an error connecting to Last.FM. User may not have connected their Last.FM account, which can be done by doing \`${await this.getPrefix()}login\``;
		}

	}

}