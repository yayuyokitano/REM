import LastFMCommand from "../../helpers/lastfmCommand";

export default class AlbumCombos extends LastFMCommand {

	category = "Last.FM";
	alias = ["lcombos"];
	description = "Shows your longest album combos";
	usage = [""];

	async run(args:string) {

		const {session, safe} = await this.getRelevantLFM(false);

		//https://stackoverflow.com/a/1254620 you legend
		const res = (await this.pool.execute(`WITH OrderedTable AS (
			SELECT artist, album, timestamp FROM scrobbles WHERE lastfmsession=?
		),
		RowNum AS (
			SELECT *, ROW_NUMBER() OVER (ORDER BY timestamp) AS rownr FROM OrderedTable
		),
		Heads AS (
			SELECT cur.rownr, cur.artist, cur.album, cur.timestamp - IFNULL(LAG(cur.timestamp) OVER (ORDER BY cur.timestamp), 0) AS timeDiff, ROW_NUMBER() OVER (ORDER BY cur.rownr) AS headnr
			FROM RowNum cur
			LEFT JOIN RowNum prev ON cur.rownr = prev.rownr+1
			WHERE ((IFNULL(prev.artist,-1) != cur.artist) OR (IFNULL(prev.album,-1) != cur.album))
		),
		Combos AS (
			SELECT artist, album, headnr, MIN(timeDiff) AS minDiff, (IFNULL(LEAD(rownr) OVER (ORDER BY headnr), (SELECT COUNT(*) FROM scrobbles WHERE lastfmsession=?)) - rownr) AS combo FROM Heads GROUP BY headnr
		)
		SELECT artist, album, combo FROM Combos WHERE combo > 4 AND minDiff > 5 AND album != ""`, [session[0], session[0]]))[0] as any[];

		const ret = res.map(e => [e.combo, `**${this.getAlbumURLMarkdown(e.artist, e.album)}** by ${this.getArtistURLMarkdown(e.artist)}`]) as [number, string][];
		let embed = this.initEmbed();
		embed.setTitle(`${this.sanitizeMarkdown(safe[0])}'s top album combos`);

		this.createTableMessage(embed, ret, ["play", "plays"], "");

	}

}
