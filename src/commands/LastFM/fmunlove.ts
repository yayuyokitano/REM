import LastFMCommand from "../../helpers/lastfmCommand";

export default class FMunlove extends LastFMCommand {

	category = "Last.FM";
	description = "Unloves currently playing track on Last.FM";
	usage = [""];
	alias = ["fmu", "unlove"];

	async run(args:string) {

		let lastfmSession = (await this.pool.execute("SELECT lastfmsession FROM users WHERE discordid = ?", [this.message.author.id]))?.[0]?.[0]?.lastfmsession;

		if (typeof lastfmSession === "undefined") {
			throw `User is not logged in to last.fm. You can login using \`${await this.getPrefix()}login\``
		}

		try {
			let nowplaying = await this.lastfm.helper.getNowPlaying(lastfmSession);

			await this.lastfm.track.unlove(nowplaying.recent.artist, nowplaying.recent.track, lastfmSession);

			let embed = this.initEmbed(`💔 ${nowplaying.recent.username} just unloved:`);

			embed.setTitle(nowplaying.recent.track)
				.setURL(nowplaying.details.track.data?.url || this.getTrackURL(nowplaying.recent.artist, nowplaying.recent.track))
				.setThumbnail(nowplaying.recent.image[1]?.url)
				.setDescription(this.getArtistAlbumMarkdownSetURL(nowplaying.recent.artist, nowplaying.recent.album, nowplaying.details.artist.data?.url, nowplaying.details.album.data?.url));
			
			this.reply(embed);

		} catch(err) {
			throw `There was an error connecting to Last.FM. User may not have connected their Last.FM account, which can be done by doing \`${await this.getPrefix()}login\``
		}

	}

}