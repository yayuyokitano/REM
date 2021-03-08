import LastFMCommand from "../../helpers/lastfmCommand";

export default class FMWhoKnows extends LastFMCommand {

	category = "Last.FM";
  description = "Checks who knows an artist in the server. Takes currently/last played artist if none specified.";
  alias = ["fmw", "fmwk"];
	usage = ["", "KITANO REM"];
	sk:string;

	async run(args:string) {

		const {userList, sk} = await this.fetchServerUsers();

		const artist = await this.getRelevantArtistDetailed(args, sk);


		let userPlays = await this.getArtistPlays(artist.name, userList);
		userPlays[this.fetchName()] = artist.stats.userplaycount;

		const resStr = (Object.entries(userPlays) as [string, number][]).sort((a, b) => b[1] - a[1]).map((e) => `${e[0]}: **${(e[1] as number).toLocaleString("fr")}** scrobbles`).slice(0, 15).join("\n");

		const embed = this.initEmbed()
			.setTitle(`Who knows ${artist.name}?`)
			.setDescription(resStr);
		
		this.reply(embed);
		
	}

	sleep(ms:number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	async getArtistPlays(artist:string, userList:string[]) {
		const connection = await this.initDB();
		const userSessions = ((await connection.execute(`SELECT lastfmsession, discordid FROM users WHERE discordid IN (?${",?".repeat(userList.length - 1)})`, userList))[0] as any[]);
		const [res] = await connection.execute(`SELECT lastfmsession, COUNT(*) AS \`scrobbleCount\` FROM scrobbles WHERE artist = ? AND lastfmsession IN (?${",?".repeat(userList.length - 1)}) GROUP BY lastfmsession ORDER BY \`scrobbleCount\` DESC`, [artist, ...(userSessions.map(e => e.lastfmsession))]);

		await connection.end();
		const sessionRelation = userSessions.reduce((acc, curr) => {
			acc[curr.lastfmsession] = this.fetchName(curr.discordid);
			return acc;
		}, {});
		return (res as any[]).reduce((acc, curr) => {
			acc[sessionRelation[curr.lastfmsession]] = curr.scrobbleCount;
			return acc;
		}, {});
	}

}