import LastFMCommand from "../../helpers/lastfmCommand";

export default class FMunlove extends LastFMCommand {

	category = "LastFM";
	description = "Unloves currently playing track on Last.FM";
	usage = [""];
	alias = ["fmu", "unlove"];

	async run(args:string) {

		let connection = await this.initDB();
		let lastfmSession = (await connection.execute("SELECT lastfmsession FROM users WHERE discordid = ?", [this.message.author.id]))?.[0]?.[0]?.lastfmsession;

		if (typeof lastfmSession === "undefined") {
			throw `User is not logged in to last.fm. You can login using \`${await this.getPrefix()}login\``
		}

		try {
			let nowplaying = await this.lastfm.helper.getNowPlaying(lastfmSession);

			let album = nowplaying.recent.album ? (nowplaying.details.album.successful ? ` from [${nowplaying.recent.album}](${nowplaying.details.album.data.url})` : ` from ${nowplaying.recent.album}`) : "";
			let artist = nowplaying.details.artist.successful ? `by [${nowplaying.recent.artist}](${nowplaying.details.artist.data.url})` : `by ${nowplaying.recent.artist}`;

			await this.lastfm.track.unlove(nowplaying.recent.artist, nowplaying.recent.track, lastfmSession);

			let embed = this.initEmbed(`💔 ${nowplaying.recent.username} just unloved:`);

			embed.setTitle(nowplaying.recent.track)
				.setURL(nowplaying.details.track.data?.url)
				.setThumbnail(nowplaying.recent.image[1]?.url)
				.setDescription(artist + album);
			
			this.reply(embed);

		} catch(err) {
			throw `There was an error connecting to Last.FM. User may not have connected their Last.FM account, which can be done by doing \`${await this.getPrefix()}login\``
		}

	}

}