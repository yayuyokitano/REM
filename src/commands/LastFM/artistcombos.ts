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
			SELECT artist, ROW_NUMBER() OVER (ORDER BY timestamp) AS \`rownr\` FROM scrobbles WHERE lastfmsession=?
		),
		Heads AS (
			SELECT cur.rownr, cur.artist, ROW_NUMBER() OVER (ORDER BY cur.rownr) AS \`headnr\`
			FROM OrderedTable cur
			LEFT JOIN OrderedTable prev ON cur.rownr = prev.rownr+1
			WHERE IFNULL(prev.artist,-1) != cur.artist
		),
		Combos AS (
			SELECT artist, (IFNULL(LEAD(rownr) OVER (ORDER BY headnr), (SELECT COUNT(*) FROM scrobbles WHERE lastfmsession=?)) - rownr) AS \`combo\` FROM Heads
		)
		SELECT * FROM Combos WHERE combo > 4`,[session[0], session[0]]))[0] as any[];

		const ret = res.map(e => [e.combo, e.artist]) as [number, string][];
		let embed = this.initEmbed();
		embed.setTitle(`${safe[0]}'s top artist combos`);

		this.createTableMessage(embed, ret, ["play", "plays"], "");

	}

}
