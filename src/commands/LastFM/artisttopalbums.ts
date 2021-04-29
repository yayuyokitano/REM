import LastFMCommand from "../../helpers/lastfmCommand";

export default class ArtistTopAlbums extends LastFMCommand {

  category = "Last.FM";
  alias = ["atl"];
	description = "Gets top albums for an artist. Gets current artist if not specified.";
	usage = ["", "KITANO REM"];

	async run(args:string) {
		const lastfmSessions = (await this.getRelevantLFM(false)).session;
		const user = this.lastfm.user.getInfo(lastfmSessions[0]);
    const artist = await this.getRelevantArtist(args);
    let [albums] = await this.pool
      .execute(`SELECT album, COUNT(*) AS \`scrobbleCount\` FROM scrobbles WHERE artist = ? AND lastfmsession = ? AND album <> "" GROUP BY album ORDER BY \`scrobbleCount\` DESC`, [artist, lastfmSessions[0]])
      .catch((err) => { throw "Database error. Did you log in to Last.FM?"; });

    if ((albums as any[]).length === 0) {
      this.reply("you haven't scrobbled any albums from this artist!");
      return;
    }

		let albumArray = [];

		for (let album of albums as any[]) {
			albumArray.push([album.scrobbleCount, `**${this.getAlbumURLMarkdown(artist, album.album)}**`]);
		}

    const total = albumArray.reduce((acc, cur) => acc + cur[0], 0);

		const embed = this.initEmbed()
			.setTitle(`${(await user).name}'s top ${artist} albums`);
		
		this.createTableMessage(embed, albumArray, ["scrobble", "scrobbles"], `**${total.toLocaleString("fr")} scrobbles from ${albumArray.length.toLocaleString("fr")} albums**\n\n`);

	}

}