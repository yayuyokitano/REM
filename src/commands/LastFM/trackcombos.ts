import LastFMCommand from "../../helpers/lastfmCommand";

export default class AlbumCombos extends LastFMCommand {

	category = "Last.FM";
	alias = ["tcombos"];
	description = "Shows your longest track combos";
	usage = [""];

	async run(args:string) {

		const {session, safe} = await this.getRelevantLFM(false);

		//https://stackoverflow.com/a/1254620 you legend
		const res = (await this.pool.execute(`WITH OrderedTable AS (
			SELECT artist, track, ROW_NUMBER() OVER (ORDER BY timestamp) AS \`rownr\` FROM scrobbles WHERE lastfmsession=?
		),
		Heads AS (
			SELECT cur.rownr, cur.artist, cur.track, ROW_NUMBER() OVER (ORDER BY cur.rownr) AS \`headnr\`
			FROM OrderedTable cur
			LEFT JOIN OrderedTable prev ON cur.rownr = prev.rownr+1
			WHERE IFNULL(prev.artist,-1) != cur.artist OR IFNULL(prev.track,-1) != cur.track
		),
		Combos AS (
			SELECT artist, track, (IFNULL(LEAD(rownr) OVER (ORDER BY headnr), (SELECT COUNT(*) FROM scrobbles WHERE lastfmsession=?)) - rownr) AS \`combo\` FROM Heads
		)
		SELECT * FROM Combos WHERE combo > 4`,[session[0], session[0]]))[0] as any[];

		const ret = res.map(e => [e.combo, `**${e.track}** by ${e.artist}`]) as [number, string][];
		let embed = this.initEmbed();
		embed.setTitle(`${safe[0]}'s top track combos`);

		this.createTableMessage(embed, ret, ["play", "plays"], "");

	}

}
