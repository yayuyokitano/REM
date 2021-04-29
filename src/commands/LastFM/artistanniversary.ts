import LastFMCommand from "../../helpers/lastfmCommand";
import spacetime from "spacetime";

export default class ArtistAnniversary extends LastFMCommand {

	category = "Last.FM";
	description = "Gets your biggest artist anniversaries.";
	usage = [""];
	alias = ["an", "ann", "anniversary"];

	async run(args:string) {

		let lastfmSession = await this.getRelevantLFM();

		if (typeof lastfmSession === "undefined") {
			throw `User is not logged in to last.fm. You can login using \`${await this.getPrefix()}login\``
		}

		try {

			let [scrobbleArtists] = await this.pool.execute("SELECT artist, MIN(timestamp) AS `firstScrobble` FROM scrobbles WHERE lastfmsession = ? GROUP BY artist", [lastfmSession.session[0]]);
			
			let timeZone = await this.getTimezone();
			let uts = Number(new Date());
			let currDate = spacetime(uts, timeZone);
			let currParts = [currDate.month(), currDate.date()];
			let currTS = uts / 1000;
			let compareTS = currTS - 180000;

			let sameDay = (scrobbleArtists as any[]).filter((artist) => {
				const scrobbleTime = spacetime(Number(artist.firstScrobble) * 1000, timeZone);
				return scrobbleTime.month() === currParts[0] && scrobbleTime.date() === currParts[1] && (Number(artist.firstScrobble) < compareTS);
			});

			if (sameDay.length === 0) {
				this.reply(`${lastfmSession.safe[0]} has no artist anniversaries today`);
				return;
			}

			const [res] = await this.pool.execute(`SELECT artist, COUNT(*) AS \`scrobbleCount\`, MIN(timestamp) AS \`firstScrobble\` FROM scrobbles WHERE lastfmsession = ? AND artist IN (?${",?".repeat(sameDay.length - 1)}) GROUP BY artist ORDER BY \`scrobbleCount\` DESC`, [lastfmSession.session[0], ...(sameDay.map(e => e.artist))]);

			let embed = this.initEmbed();
			embed.setTitle(`${lastfmSession.safe[0]}'s artist anniversaries`);

			for (let artist of (res as any[]).slice(0, 5)) {
				let numYears = Math.round((currTS - Number(artist.firstScrobble)) / 31556952);
				embed.addField(this.getArtistURLMarkdown(artist.artist), `${lastfmSession.safe[0]} first scrobbled ${artist.artist} on this date ${numYears} year${numYears === 1 ? "" : "s"} ago\nand has now scrobbled them ${artist.scrobbleCount} time${artist.scrobbleCount === 1 ? "" : "s"}`);
			}

			this.reply(embed);


		} catch(err) {
			console.log(err);
			throw err;
		}

	}

}