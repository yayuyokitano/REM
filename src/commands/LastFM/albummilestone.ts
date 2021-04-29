import LastFMCommand from "../../helpers/lastfmCommand";

export default class AlbumMilestone extends LastFMCommand {

	category = "Last.FM";
	description = "Gets album milestone on last.fm";
	usage = ["", "@mention"];
	alias = ["lmls"];

	async run(args:string) {

		const lastfmSessions = (await this.getRelevantLFM());
		const lastfmSession = lastfmSessions.session[0];
		const lastfmSafe = lastfmSessions.safe[0];

		if (typeof lastfmSession === "undefined") {
			throw `User is not logged in to last.fm. You can login using \`${await this.getPrefix()}login\``
		}

		const num = parseInt(this.removeMentions(args));

		if (isNaN(num)) {
			throw "Please enter a valid number";
		}

		try {
			const album = (await this.pool.execute("SELECT artist, album, MIN(timestamp) AS `firstScrobbled`, COUNT(*) AS `scrobbleCount` FROM scrobbles WHERE lastfmsession = ? AND album != '' GROUP BY artist, album ORDER BY firstScrobbled LIMIT 1 OFFSET " + (num - 1), [lastfmSession]))[0][0];

			let embed = this.initEmbed(`${lastfmSafe}'s ${this.getOrdinalNumber(num)} Album`);

			embed.setTitle(`${album.artist} - ${album.album}`)
				.setURL(this.getAlbumURL(album.artist, album.album))
				.setDescription(`${lastfmSafe} has now scrobbled **${album.album}** ${album.scrobbleCount} time${album.scrobbleCount > 1 ? "s" : ""}`)
				.setFooter(`First scrobbled on ${this.getLocalizedTime(new Date(Number(album.firstScrobbled) * 1000), await this.getTimezone())}`);
			
			await this.reply(embed);

		} catch(err) {
			throw "User has not scrobbled that many albums";
		}

	}

}