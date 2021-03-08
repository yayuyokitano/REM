import LastFMCommand from "../../helpers/lastfmCommand";

export default class AlbumTopTracks extends LastFMCommand {

  category = "Last.FM";
  alias = ["ltt"];
	description = "Gets top tracks for an album. Gets current album if not specified.";
	usage = ["", "KITANO REM - RAINSICK/オレンジ"];

	async run(args:string) {

		const lastfmSessions = (await this.getRelevantLFM()).session;
		const user = this.lastfm.user.getInfo(lastfmSessions[0]);
    const {artist, album} = await this.getRelevantAlbum(args);
    const connection = await this.initDB();
    let [tracks] = await connection
      .execute(`SELECT track, COUNT(*) AS \`scrobbleCount\` FROM scrobbles WHERE artist = ? AND album = ? AND lastfmsession = ? GROUP BY track ORDER BY \`scrobbleCount\` DESC`, [artist, album, lastfmSessions[0]])
      .catch((err) => { throw "Database error. Did you log in to Last.FM?"; });
    await connection.end();

    if ((tracks as any[]).length === 0) {
      this.reply("you haven't scrobbled this album!");
      return;
    }

    const total = (tracks as any[]).reduce((acc, cur) => acc + cur.scrobbleCount, 0);

    const width = tracks[0].scrobbleCount.toLocaleString("fr").length;

    const trackstr = (tracks as any[]).map((e) => `\`${e.scrobbleCount.toLocaleString("fr").padStart(width, " ")}\` scrobbles - **${Buffer.from(e.track, "utf-8")}**`).slice(0, 15).join("\n");

    const embed = this.initEmbed()
      .setTitle(`${(await user).name}'s top ${album} tracks`)
      .setDescription(`**${total.toLocaleString("fr")} scrobbles from ${(tracks as any[]).length.toLocaleString("fr")} tracks**\n\n${trackstr}`);
    
    this.reply(embed);

	}

}