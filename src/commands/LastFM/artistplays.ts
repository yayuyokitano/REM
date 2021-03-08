import LastFMCommand from "../../helpers/lastfmCommand";

export default class ArtistPlays extends LastFMCommand {

	category = "LastFM";
	description = "Gets artist playcount from Last.FM";
	usage = ["", "KITANO REM"];
	alias = ["ap", "p"];

	async run(args:string) {

		let lastfmSession = await this.getRelevantLFM();
		let artist = await this.getRelevantArtistDetailed(args, lastfmSession.session[0]);

		if (typeof lastfmSession === "undefined") {
			throw `User is not logged in to last.fm. You can login using \`${await this.getPrefix()}login\``
		}

		try {
			this.reply(`${lastfmSession.safe[0]} has ${Number(artist.stats.userplaycount).toLocaleString("fr")} scrobbles of ${artist.name}`);

		} catch(err) {
			throw `There was an error connecting to Last.FM. User may not have connected their Last.FM account, which can be done by doing \`${await this.getPrefix()}login\``
		}

	}

}