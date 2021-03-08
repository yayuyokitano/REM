import LastFMCommand from "../../helpers/lastfmCommand";

export default class AlbumPlays extends LastFMCommand {

	category = "LastFM";
	description = "Gets album playcount from Last.FM";
	usage = ["", "KITANO REM - RAINSICK/オレンジ"];
	alias = ["lp"];

	async run(args:string) {

		let lastfmSession = await this.getRelevantLFM();
		let album = await this.getRelevantAlbumDetailed(args, lastfmSession.session[0]);

		if (typeof lastfmSession === "undefined") {
			throw `User is not logged in to last.fm. You can login using \`${await this.getPrefix()}login\``
		}

		try {
			this.reply(`${lastfmSession.safe[0]} has ${Number(album.userplaycount).toLocaleString("fr")} scrobbles of ${album.name}`);

		} catch(err) {
			throw `There was an error connecting to Last.FM. User may not have connected their Last.FM account, which can be done by doing \`${await this.getPrefix()}login\``
		}

	}

}