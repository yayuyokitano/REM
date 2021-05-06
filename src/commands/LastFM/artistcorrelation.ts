`SELECT artist, timestamp, ROUND((UNIX_TIMESTAMP(CURRENT_TIMESTAMP) - timestamp) / (3600 * 24 * 7), 0) AS "week", COUNT(*) AS "scrobbleCount" from scrobbles where lastfmsession = "r90NvtB1bLCom0wixLucA5ZdJbuEqIt3" and artist = "counterparts" group by week order by week;`

import LastFMCommand from "../../helpers/lastfmCommand";
import calculatePearson from "../../helpers/math/pearson";

interface BasicObj {
	[key:string]:number;
}

export default class ArtistCorrelation extends LastFMCommand {

	category = "Last.FM";
	description = "Sees what artists you have listened to at same time as an artist. Uses Pearson correlation coefficient.\nBoth artists must have been listened to at least fifty times since the other was first scrobbled.\nNote that results may be quite inaccurate if you have listened to an artist over a low number of weeks. The more separate weeks you have listened to them, the more accurate this will be, generally speaking.";
	usage = ["", "KITANO REM"];
	alias = ["acorr"];

	async run(args:string) {

		const lastfmSession = (await this.getRelevantLFM());
		const safe = lastfmSession.safe[0];
		const session = lastfmSession.session[0];

		if (typeof lastfmSession === "undefined") {
			throw `User is not logged in to last.fm. You can login using \`${await this.getPrefix()}login\``
		}

		const artist = await this.getRelevantArtist(args);

		const [res] = await this.pool.execute(`WITH BigArtistTable AS (
			SELECT artist FROM scrobbles WHERE lastfmsession = ? AND artist != ? AND timestamp > (SELECT MIN(timestamp) FROM SCROBBLES WHERE lastfmsession = ? AND artist = ?) GROUP BY artist HAVING COUNT(artist) >= 50
			)
			SELECT artist, ROUND((UNIX_TIMESTAMP(CURRENT_TIMESTAMP) - timestamp) / (3600 * 24 * 7), 0) AS "week", COUNT(artist) AS "scrobbleCount" FROM scrobbles WHERE lastfmsession = ? AND artist IN(SELECT artist FROM BigArtistTable) GROUP BY artist, week ORDER BY week`
		, [session, artist, session, artist, session]) as [{artist:string, week:number, scrobbleCount:number}[], any];
		const [currArtistData] = await this.pool.execute(`SELECT ROUND((UNIX_TIMESTAMP(CURRENT_TIMESTAMP) - timestamp) / (3600 * 24 * 7), 0) AS "week", COUNT(artist) AS "scrobbleCount" FROM scrobbles WHERE lastfmsession = ? AND artist = ? GROUP BY artist, week ORDER BY week`, [session, artist]) as [{week:number, scrobbleCount:number}[], any];
		const currOldestWeek = currArtistData.slice(-1)[0].week;
		const artistSet = new Set(res.map(e => e.artist));
		const result:BasicObj = {};
		for (let artist of artistSet) {
			const artistData = res.filter(e => e.artist === artist);
			const artistOldestWeek = artistData.slice(-1)[0].week;
			const len = Math.min(artistOldestWeek, currOldestWeek) + 1;
			let resArray:[number,number][] = Array(len).fill("[0,0]").map(e => JSON.parse(e));

			for (let week of currArtistData.filter(e => e.week < len)) {
				resArray[week.week][0] = week.scrobbleCount;
			}
			for (let week of artistData.filter(e => e.week < len)) {
				resArray[week.week][1] = week.scrobbleCount;
			}

			if (resArray.reduce((acc, curr) => acc + curr[0], 0) >= 50) {
				result[artist] = calculatePearson(resArray.map(e => e[0]), resArray.map(e => e[1]));
			}

		}

		if (result.length === 0) {
			throw "You have not listened to artists with this artist enough to count! (To count, both artists must have been scrobbled at least 50 times since the other was first scrobbled)";
		}

		let embed = this.initEmbed();
		embed.setTitle(`Artists ${safe} likes to listen to with ${artist}`);

		const sortedArray = [...Object.entries(result).sort((a, b) => b[1] - a[1]).map(e => e[0]).entries()].map(e => [++e[0], `**${this.getArtistURLMarkdown(e[1])}**`]) as [number, string][];

		this.createTableMessage(embed, sortedArray, ["", ""], "", {ascending: true});
	}
}