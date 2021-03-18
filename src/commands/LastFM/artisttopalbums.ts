import LastFMCommand from "../../helpers/lastfmCommand";

export default class ArtistTopAlbums extends LastFMCommand {

  category = "Last.FM";
  alias = ["atl"];
	description = "Gets top albums for an artist. Gets current artist if not specified.";
	usage = ["", "KITANO REM"];

	async run(args:string) {
		const lastfmSessions = (await this.getRelevantLFM()).session;
		const user = this.lastfm.user.getInfo(lastfmSessions[0]);
    const artist = await this.getRelevantArtist(args);
    let [albums] = await this.pool
      .execute(`SELECT album, COUNT(*) AS \`scrobbleCount\` FROM scrobbles WHERE artist = ? AND lastfmsession = ? AND album <> "" GROUP BY album ORDER BY \`scrobbleCount\` DESC`, [artist, lastfmSessions[0]])
      .catch((err) => { throw "Database error. Did you log in to Last.FM?"; });

    if ((albums as any[]).length === 0) {
      this.reply("you haven't scrobbled any albums from this artist!");
      return;
    }

    const total = (albums as any[]).reduce((acc, cur) => acc + cur.scrobbleCount, 0);

    const width = albums[0].scrobbleCount.toString().length;

    const albumstr = (albums as any[]).map((e) => `\`${e.scrobbleCount.toLocaleString("fr").padStart(width, " ")}\` scrobbles - **${Buffer.from(e.album, "utf-8")}**`).slice(0, 15).join("\n");

    const embed = this.initEmbed()
      .setTitle(`${(await user).name}'s top ${artist} albums`)
      .setDescription(`**${total.toLocaleString("fr")} scrobbles from ${(albums as any[]).length.toLocaleString("fr")} albums**\n\n${albumstr}`);
    
    this.reply(embed);

	}

}