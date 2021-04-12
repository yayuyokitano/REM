import LastFMCommand from "../../helpers/lastfmCommand";

export default class FMWhoKnows extends LastFMCommand {

	category = "Last.FM";
  description = "Checks who knows an artist in the server. Takes currently/last played artist if none specified.";
  alias = ["fmw", "fmwk", "w", "whoknows"];
	usage = ["", "KITANO REM"];
	sk:string;

	async run(args:string) {

		const {userList, sk} = await this.fetchServerUsers();

		const {artist} = await this.getRelevantArtistDetailed(args, sk);


		let userPlays = await this.getArtistPlays(artist.name, userList);
		userPlays[this.fetchName()] = Number(artist.stats.userplaycount);

		let artistArray = [];

		for (let [user, plays] of Object.entries(userPlays) as any[]) {
			artistArray.push([plays, user]);
		}

		const total = artistArray.reduce((acc, cur) => acc + cur[0], 0);

		const embed = this.initEmbed()
			.setTitle(`Who knows **${artist.name}**?`);
		
		this.createTableMessage(embed, artistArray, ["scrobble", "scrobbles"], `**${total.toLocaleString("fr")} scrobbles from ${artistArray.length.toLocaleString("fr")} listeners**\n\n`);
		
	}

	sleep(ms:number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	async getArtistPlays(artist:string, userList:string[]) {
		const userSessions = ((await this.pool.execute(`SELECT lastfmsession, discordid FROM users WHERE discordid IN (?${",?".repeat(userList.length - 1)})`, userList))[0] as any[]);
		const [res] = await this.pool.execute(`SELECT lastfmsession, COUNT(*) AS \`scrobbleCount\` FROM scrobbles WHERE artist = ? AND lastfmsession IN (?${",?".repeat(userList.length - 1)}) GROUP BY lastfmsession ORDER BY \`scrobbleCount\` DESC`, [artist, ...(userSessions.map(e => e.lastfmsession))]);

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