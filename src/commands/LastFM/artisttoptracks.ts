import LastFMCommand from "../../helpers/lastfmCommand";

export default class ArtistTopTracks extends LastFMCommand {

  category = "Last.FM";
  alias = ["att"];
	description = "Gets top tracks for an artist. Gets current artist if not specified.";
	usage = ["", "KITANO REM"];

	async run(args:string) {
    const lastfmSessions = (await this.getRelevantLFM()).session;
		const user = this.lastfm.user.getInfo(lastfmSessions[0]);
    const artist = await this.getRelevantArtist(args);
    const connection = await this.initDB();
    let [tracks] = await connection
      .execute(`SELECT track, COUNT(*) AS \`scrobbleCount\` FROM scrobbles WHERE artist = ? AND lastfmsession = ? GROUP BY track ORDER BY \`scrobbleCount\` DESC`, [artist, lastfmSessions[0]])
      .catch((err) => { throw "Database error. Did you log in to Last.FM?"; });
    await connection.end();

    if ((tracks as any[]).length === 0) {
      this.reply("you haven't scrobbled this artist!");
      return;
    }

    const total = (tracks as any[]).reduce((acc, cur) => acc + cur.scrobbleCount, 0);

    const width = tracks[0].scrobbleCount.toString().length;

    const trackstr = (tracks as any[]).map((e) => `\`${e.scrobbleCount.toLocaleString("fr").padStart(width, " ")}\` scrobbles - **${Buffer.from(e.track, "utf-8")}**`).slice(0, 15).join("\n");

    const embed = this.initEmbed()
      .setTitle(`${(await user).name}'s top ${artist} tracks`)
      .setDescription(`**${total.toLocaleString("fr")} scrobbles from ${(tracks as any[]).length.toLocaleString("fr")} tracks**\n\n${trackstr}`);
    
    this.reply(embed);
	}

}