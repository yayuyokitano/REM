import LastFMCommand from "../../helpers/lastfmCommand";

export default class FM extends LastFMCommand {

	category = "LastFM";
	description = "Gets currently playing/last played track from Last.FM";
	usage = ["", "lfm:Mexdeep", "@mention"];
	alias = ["np", "nowplaying", "fmv"];

	async run(args:string) {

		let lastfmSession = (await this.getRelevantLFM()).session[0];

		if (typeof lastfmSession === "undefined") {
			throw `User is not logged in to last.fm. You can login using \`${await this.getPrefix()}login\``
		}

		try {
			let nowplaying = await this.lastfm.helper.getNowPlaying(lastfmSession, ["artist", "album", "track"]);

			let album = nowplaying.recent.album ? (nowplaying.details.album.successful ? ` from [${nowplaying.recent.album}](${nowplaying.details.album.data.url})` : ` from ${nowplaying.recent.album}`) : "";
			let artist = nowplaying.details.artist.successful ? `by [${nowplaying.recent.artist}](${nowplaying.details.artist.data.url})` : `by ${nowplaying.recent.artist}`;

			let playcount = "";

			playcount += "Artist: " + (isNaN(Number(nowplaying.details.artist.data?.stats?.userplaycount)) ? "--" : Number(nowplaying.details.artist.data?.stats?.userplaycount).toLocaleString("fr")) + "・";
			playcount += "Album: " + (isNaN(Number(nowplaying.details.album.data?.userplaycount)) ? "--" : Number(nowplaying.details.album.data?.userplaycount).toLocaleString("fr")) + "・";
			playcount += "Track: " + (isNaN(Number(nowplaying.details.track.data?.userplaycount)) ? "--" : Number(nowplaying.details.track.data?.userplaycount).toLocaleString("fr")) +  "・";
			playcount = playcount.slice(0, -1);

			let embed = this.initEmbed(`${nowplaying.recent.nowplaying ? "Now playing" : "Last played"} - ${nowplaying.recent.username}`);

			let tags = new Set(...[nowplaying.details.track.data?.toptags.map(e => e.name)],
			...[nowplaying.details.album.data?.tags.map(e => e.name)],
			...[nowplaying.details.artist.data?.tags.map(e => e.name)]);

			embed.setTitle(nowplaying.recent.track)
				.setURL(nowplaying.details.track.data?.url)
				.setThumbnail(nowplaying.recent.image[2]?.url)
				.setDescription(artist + album)
				.addField(playcount || `No data found for ${nowplaying.recent.artist}`, ([...tags].slice(0,5).join("・") || `No tags found for ${nowplaying.recent.artist}`));
			
			this.reply(embed);

		} catch(err) {
			throw `There was an error connecting to Last.FM. User may not have connected their Last.FM account, which can be done by doing \`${await this.getPrefix()}login\``
		}

	}

}