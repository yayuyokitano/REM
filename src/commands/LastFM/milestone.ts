import LastFMCommand from "../../helpers/lastfmCommand";

export default class Milestone extends LastFMCommand {

	category = "Last.FM";
	description = "Gets milestone on last.fm";
	usage = ["", "lfm:Mexdeep", "@mention"];
	alias = ["mls"];

	async run(args:string) {

		let lastfmSession = (await this.getRelevantLFM()).session[0];

		if (typeof lastfmSession === "undefined") {
			throw `User is not logged in to last.fm. You can login using \`${await this.getPrefix()}login\``
		}

		let num = parseInt(this.removeMentions(args));

		if (isNaN(num)) {
			throw "Please enter a valid number";
		}

		try {
			const scrobbleCount = parseInt((await this.lastfm.user.getRecentTracks(lastfmSession, {limit: 1})).meta.total);
			const info = await this.lastfm.user.getRecentTracks(lastfmSession, {limit: 1, page: scrobbleCount - num + 1, extended: "1"});
			const track = info.tracks[0];

			const album = track.album?.name ? ` from [${track.album.name}](${this.getAlbumURL(track.artist.name, track.album.name)})` : "";
			const artist = `by [${track.artist.name}](${this.getArtistURL(track.artist.name)})`;

			const heart = track.loved === "1" ? "❤️ " : "";

			let embed = this.initEmbed(`${heart}${info.meta.user}'s ${this.getOrdinalNumber(num)} Scrobble`);

			embed.setTitle(track.name)
				.setURL(track.url)
				.setThumbnail(track.image[2].url)
				.setDescription(artist + album)
				.setFooter(`Scrobbled on ${this.getLocalizedTime(new Date(Number(track.date.uts) * 1000), await this.getTimezone())}`);
			
			await this.reply(embed);

		} catch(err) {
			console.log(err);
			throw `There was an error connecting to Last.FM. User may not have connected their Last.FM account, which can be done by doing \`${await this.getPrefix()}login\``
		}

	}

}