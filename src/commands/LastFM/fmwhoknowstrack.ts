import LastFMCommand from "../../helpers/lastfmCommand";

export default class FMWhoKnowsTrack extends LastFMCommand {

	category = "Last.FM";
  description = "Checks who knows a track in the server. Takes currently/last played track if none specified.";
  alias = ["fmwt", "fmwkt"];
	usage = ["", "KITANO REM - RAINSICK"];
	sk:string;

	async run(args:string) {

		const {userList, sk} = await this.fetchServerUsers();

		const {track} = await this.getRelevantTrackDetailed(args, sk);


		let userPlays = await this.getTrackPlays(track.artist.name, track.name, userList);
		userPlays[this.fetchName()] = track.userplaycount;

		const resStr = (Object.entries(userPlays) as [string, number][]).sort((a, b) => b[1] - a[1]).map((e) => `${e[0]}: **${(e[1] as number).toLocaleString("fr")}** scrobbles`).slice(0, 15).join("\n");

		const embed = this.initEmbed()
			.setTitle(`Who knows **${track.artist.name}** - **${track.name}**?`)
			.setDescription(resStr);
		
		this.reply(embed);
		
	}

	sleep(ms:number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	async getTrackPlays(artist:string, track:string, userList:string[]) {
		const userSessions = ((await this.pool.execute(`SELECT lastfmsession, discordid FROM users WHERE discordid IN (?${",?".repeat(userList.length - 1)})`, userList))[0] as any[]);
		const [res] = await this.pool.execute(`SELECT lastfmsession, COUNT(*) AS \`scrobbleCount\` FROM scrobbles WHERE artist = ? AND track = ? AND lastfmsession IN (?${",?".repeat(userList.length - 1)}) GROUP BY lastfmsession ORDER BY \`scrobbleCount\` DESC`, [artist, track, ...(userSessions.map(e => e.lastfmsession))]);

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