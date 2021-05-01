import LastFMCommand from "../../helpers/lastfmCommand";

export default class ArtistCombos extends LastFMCommand {

	category = "Last.FM";
	alias = ["acombos"];
	description = "Shows your longest artist combos";
	usage = [""];

	async run(args:string) {

		const {session, safe} = await this.getRelevantLFM(false);

		//https://stackoverflow.com/a/1254620 you legend
		const res = (await this.pool.execute(`WITH OrderedTable AS (
			SELECT artist, timestamp FROM scrobbles WHERE lastfmsession=?
		),
		RowNum AS (
			SELECT *, ROW_NUMBER() OVER (ORDER BY timestamp) AS rownr FROM OrderedTable
		),
		Heads AS (
			SELECT cur.rownr, cur.artist, cur.timestamp - IFNULL(LAG(cur.timestamp) OVER (ORDER BY cur.timestamp), 0) AS timeDiff, ROW_NUMBER() OVER (ORDER BY cur.rownr) AS headnr
			FROM RowNum cur
			LEFT JOIN RowNum prev ON cur.rownr = prev.rownr+1
			WHERE IFNULL(prev.artist,-1) != cur.artist
		),
		Combos AS (
			SELECT artist, headnr, MIN(timeDiff) AS minDiff, (IFNULL(LEAD(rownr) OVER (ORDER BY headnr), (SELECT COUNT(*) FROM scrobbles WHERE lastfmsession=?)) - rownr) AS combo FROM Heads GROUP BY headnr
		)
		SELECT artist, combo FROM Combos WHERE combo > 4 AND minDiff > 5`,[session[0], session[0]]))[0] as any[];

		const ret = res.map(e => [e.combo, this.getArtistURLMarkdown(e.artist)]) as [number, string][];
		let embed = this.initEmbed();
		embed.setTitle(`safe[0]}'s top artist combos`);

		this.createTableMessage(embed, ret, ["play", "plays"], "");

	}

}
