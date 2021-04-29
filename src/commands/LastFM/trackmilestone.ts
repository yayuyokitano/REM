import LastFMCommand from "../../helpers/lastfmCommand";

export default class TrackMilestone extends LastFMCommand {

	category = "Last.FM";
	description = "Gets track milestone on last.fm";
	usage = ["", "@mention"];
	alias = ["tmls"];

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
			const track = (await this.pool.execute("SELECT artist, track, MIN(timestamp) AS `firstScrobbled`, COUNT(*) AS `scrobbleCount` FROM scrobbles WHERE lastfmsession = ? GROUP BY artist, track ORDER BY firstScrobbled LIMIT 1 OFFSET " + (num - 1), [lastfmSession]))[0][0];

			let embed = this.initEmbed(`${lastfmSafe}'s ${this.getOrdinalNumber(num)} Track`);

			embed.setTitle(`${track.artist} - ${track.track}`)
				.setURL(this.getTrackURL(track.artist, track.track))
				.setDescription(`${lastfmSafe} has now scrobbled **${track.track}** ${track.scrobbleCount} time${track.scrobbleCount > 1 ? "s" : ""}`)
				.setFooter(`First scrobbled on ${this.getLocalizedTime(new Date(Number(track.firstScrobbled) * 1000), await this.getTimezone())}`);
			
			await this.reply(embed);

		} catch(err) {
			console.log(err);
			throw "User has not scrobbled that many tracks";
		}

	}

}