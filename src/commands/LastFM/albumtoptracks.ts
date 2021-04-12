import LastFMCommand from "../../helpers/lastfmCommand";

export default class AlbumTopTracks extends LastFMCommand {

  category = "Last.FM";
  alias = ["ltt"];
	description = "Gets top tracks for an album. Gets current album if not specified.";
	usage = ["", "KITANO REM - RAINSICK/オレンジ"];

	async run(args:string) {

		const lastfmSessions = (await this.getRelevantLFM(false)).session;
		const user = this.lastfm.user.getInfo(lastfmSessions[0]);
    const {artist, album} = await this.getRelevantAlbum(args);
    let [tracks] = await this.pool
      .execute(`SELECT track, COUNT(*) AS \`scrobbleCount\` FROM scrobbles WHERE artist = ? AND album = ? AND lastfmsession = ? GROUP BY track ORDER BY \`scrobbleCount\` DESC`, [artist, album, lastfmSessions[0]])
      .catch((err) => { throw "Database error. Did you log in to Last.FM?"; });

    if ((tracks as any[]).length === 0) {
      this.reply("you haven't scrobbled this album!");
      return;
    }

    if ((tracks as any[]).length === 0) {
			this.reply("you haven't scrobbled this artist!");
			return;
		}

		let trackArray = [];

		for (let track of tracks as any[]) {
			trackArray.push([track.scrobbleCount, track.track]);
		}

		const total = trackArray.reduce((acc, cur) => acc + cur[0], 0);

		const embed = this.initEmbed()
			.setTitle(`${(await user).name}'s top ${album} tracks`);
		
		this.createTableMessage(embed, trackArray, ["scrobble", "scrobbles"], `**${total.toLocaleString("fr")} scrobbles from ${trackArray.length.toLocaleString("fr")} tracks**\n\n`);
	}

}