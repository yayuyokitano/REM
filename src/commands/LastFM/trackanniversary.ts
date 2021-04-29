import LastFMCommand from "../../helpers/lastfmCommand";
import spacetime from "spacetime";

export default class TrackAnniversary extends LastFMCommand {

	category = "Last.FM";
	description = "Gets your biggest track anniversaries.";
	usage = [""];
	alias = ["tn"];

	async run(args:string) {

		let lastfmSession = await this.getRelevantLFM();

		if (typeof lastfmSession === "undefined") {
			throw `User is not logged in to last.fm. You can login using \`${await this.getPrefix()}login\``
		}

		try {

			let [scrobbleTracks] = await this.pool.execute("SELECT artist, track, MIN(timestamp) AS `firstScrobble` FROM scrobbles WHERE lastfmsession = ? GROUP BY artist, track", [lastfmSession.session[0]]);

			let timeZone = await this.getTimezone();
			let uts = Number(new Date());
			let currDate = spacetime(uts, timeZone);
			let currParts = [currDate.month(), currDate.date()];
			let currTS = uts / 1000;
			let compareTS = currTS - 180000;

			let sameDay = (scrobbleTracks as any[]).filter((track) => {
				const scrobbleTime = spacetime(Number(track.firstScrobble) * 1000, timeZone);
				return scrobbleTime.month() === currParts[0] && scrobbleTime.date() === currParts[1] && (Number(track.firstScrobble) < compareTS);
			});

			if (sameDay.length === 0) {
				this.reply(`${lastfmSession.safe[0]} has no track anniversaries today`);
				return;
			}

			const [res] = await this.pool.execute(`SELECT artist, track, COUNT(*) AS \`scrobbleCount\`, MIN(timestamp) AS \`firstScrobble\` FROM scrobbles WHERE lastfmsession = ? AND track IN (?${",?".repeat(sameDay.length - 1)}) GROUP BY artist, track ORDER BY \`scrobbleCount\` DESC`, [lastfmSession.session[0], ...(sameDay.map(e => e.track))]);

			let embed = this.initEmbed();
			embed.setTitle(`${lastfmSession.safe[0]}'s track anniversaries`);

			let trackCompare = {};
			for (let entry of (sameDay as any[])) {
				if (!trackCompare.hasOwnProperty(entry.track)) {
					trackCompare[entry.track] = [];
				}

				trackCompare[entry.track].push(entry.artist);
			}

			let success = 0;

			for (let track of (res as any[])) {
				if (!trackCompare[track.track]?.includes(track.artist)) {
					continue;
				}
				let numYears = Math.round((currTS - Number(track.firstScrobble)) / 31556952);
				embed.addField(this.getCombinedTrackMarkdown(track.artist, track.track), `${lastfmSession.safe[0]} first scrobbled ${track.track} on this date ${numYears} year${numYears === 1 ? "" : "s"} ago\nand has now scrobbled it ${track.scrobbleCount} time${track.scrobbleCount === 1 ? "" : "s"}`);
				success++;
				if (success >= 5) {
					break;
				}
			}

			await this.reply(embed);

		} catch(err) {
			console.log(err);
			throw err;
		}

	}

}