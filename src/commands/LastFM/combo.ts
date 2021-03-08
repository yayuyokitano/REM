import LastFMCommand from "../../helpers/lastfmCommand";

export default class FMCombo extends LastFMCommand {

	category = "Last.FM";
	alias = ["combo"];
	description = "Shows your current combo";
	usage = [""];

	async run(args:string) {
		
		const lfmUsers = await this.getRelevantLFM();
		console.log(lfmUsers);
		const res = await this.lastfm.helper.getCombo(lfmUsers.session[0], 1000).catch ((err) => {
			throw `Error getting your combo. Most likely you are not signed in to the bot. Try signing in with \`${this.getPrefix()}login\``;
		});
		
		let comboList = this.getComboList(res);

		let embed = this.initEmbed()
			.setTitle(`${lfmUsers.safe[0]}'s current combo`)
			.setDescription(comboList.join("\n") || "No combo at the moment.")
			.setThumbnail(res.image[2].url);
		
		if (res.image) {
			embed = embed.setThumbnail(res.image[2].url);
		}

		this.reply(embed);

	}

	getComboList(res:any) {
		return [
			res.artist.combo > 1 ? `Artist: ${res.artist.combo}${res.nowplaying ? "➚" : ""} plays in a row (${res.artist.name})` : "",
			res.album.combo > 1 ? `Album: ${res.album.combo}${res.nowplaying ? "➚" : ""} plays in a row (${res.album.name})` : "",
			res.track.combo > 1 ? `Track: ${res.track.combo}${res.nowplaying ? "➚" : ""} plays in a row (${res.track.name})` : "",
		].filter((e) => e !== "");
	}

}