import LastFMCommand from "../../helpers/lastfmCommand";

export default class ArtistMilestone extends LastFMCommand {

	category = "Last.FM";
	description = "Gets artist milestone on last.fm";
	usage = ["", "@mention"];
	alias = ["amls"];

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
			const artist = (await this.pool.execute("SELECT artist, MIN(timestamp) AS `firstScrobbled`, COUNT(*) AS `scrobbleCount` FROM scrobbles WHERE lastfmsession = ? GROUP BY artist ORDER BY firstScrobbled LIMIT 1 OFFSET " + (num - 1), [lastfmSession]))[0][0];

			let embed = this.initEmbed(`${lastfmSafe}'s ${this.getOrdinalNumber(num)} Artist`);

			embed.setTitle(artist.artist)
				.setURL(this.getArtistURL(artist.artist))
				.setDescription(`${this.sanitizeMarkdown(lastfmSafe)} has now scrobbled **${this.sanitizeMarkdown(artist.artist)}** ${artist.scrobbleCount} time${artist.scrobbleCount > 1 ? "s" : ""}`)
				.setFooter(`First scrobbled on ${this.getLocalizedTime(new Date(Number(artist.firstScrobbled) * 1000), await this.getTimezone())}`);
			
			await this.reply(embed);

		} catch(err) {
			console.log(err);
			throw "User has not scrobbled that many artists";
		}

	}

}