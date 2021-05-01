import LastFMCommand from "../../helpers/lastfmCommand";
import spacetime from "spacetime";

export default class AlbumAnniversary extends LastFMCommand {

	category = "Last.FM";
	description = "Gets your biggest album anniversaries.";
	usage = [""];
	alias = ["ln"];

	async run(args:string) {

		let lastfmSession = await this.getRelevantLFM();

		if (typeof lastfmSession === "undefined") {
			throw `User is not logged in to last.fm. You can login using \`${await this.getPrefix()}login\``
		}

		try {

			let [scrobbleAlbums] = await this.pool.execute("SELECT artist, album, MIN(timestamp) AS `firstScrobble` FROM scrobbles WHERE lastfmsession = ? GROUP BY artist, album", [lastfmSession.session[0]]);
			
			let timeZone = await this.getTimezone();
			let uts = Number(new Date());
			let currDate = spacetime(uts, timeZone);
			let currParts = [currDate.month(), currDate.date()];
			let currTS = uts / 1000;
			let compareTS = currTS - 180000;

			let sameDay = (scrobbleAlbums as any[]).filter((album) => {
				const scrobbleTime = spacetime(Number(album.firstScrobble) * 1000, timeZone);
				return scrobbleTime.month() === currParts[0] && scrobbleTime.date() === currParts[1] && (Number(album.firstScrobble) < compareTS);
			});

			if (sameDay.length === 0) {
				this.reply(`${lastfmSession.safe[0]} has no album anniversaries today`);
				return;
			}

			const [res] = await this.pool.execute(`SELECT artist, album, COUNT(*) AS \`scrobbleCount\`, MIN(timestamp) AS \`firstScrobble\` FROM scrobbles WHERE lastfmsession = ? AND album IN (?${",?".repeat(sameDay.length - 1)}) GROUP BY artist, album ORDER BY \`scrobbleCount\` DESC`, [lastfmSession.session[0], ...(sameDay.map(e => e.album))]);

			let embed = this.initEmbed();
			embed.setTitle(`${lastfmSession.safe[0]}'s album anniversaries`);

			let albumCompare = {};
			for (let entry of (sameDay as any[])) {
				if (!albumCompare.hasOwnProperty(entry.album)) {
					albumCompare[entry.album] = [];
				}

				albumCompare[entry.album].push(entry.artist);
			}

			let success = 0;
			embed.description = "";

			for (let album of (res as any[])) {
				if (!albumCompare[album.album]?.includes(album.artist)) {
					continue;
				}
				let numYears = Math.round((currTS - Number(album.firstScrobble)) / 31556952);
				embed = this.fakeAddField(embed, this.getCombinedAlbumMarkdown(album.artist, album.album), `${lastfmSession.safe[0]} first scrobbled ${album.album} on this date ${numYears} year${numYears === 1 ? "" : "s"} ago\nand has now scrobbled it ${album.scrobbleCount} time${album.scrobbleCount === 1 ? "" : "s"}`);
				success++;
				if (success >= 5) {
					break;
				}
			}

			this.reply(embed);


		} catch(err) {
			console.log(err);
			throw err;
		}

	}

}