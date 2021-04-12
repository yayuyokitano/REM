import LastFMCommand from "../../helpers/lastfmCommand";

interface BasicObj {
	[key:string]:string[];
}

export default class TrackInfo extends LastFMCommand {

	category = "Last.FM";
	description = "Gets track info from Last.FM and database.";
	usage = ["", "KITANO REM - RAINSICK"];
	alias = ["ti", "tri", "track"];

	async run(args:string) {

		let lastfmSession = await this.getRelevantLFM();
		let {track, recent} = await this.getRelevantTrackDetailed(args, lastfmSession.session[0]);

		if (typeof lastfmSession === "undefined") {
			throw `User is not logged in to last.fm. You can login using \`${await this.getPrefix()}login\``
		}

		try {

			let album = track.album?.title ? ` from [${track.album.title}](${track.album.url})` : "";
			let artist = `by [${track.artist.name}](${track.artist.url})`;
			let firstScrobbleTime = (await this.pool.execute("SELECT timestamp FROM scrobbles WHERE artist = ? AND track = ? AND lastfmsession = ? ORDER BY CAST(timestamp AS DECIMAL) LIMIT 1", [track.artist.name, track.name, lastfmSession.session[0]]))[0][0]?.timestamp;

			let [scrobbles] = await this.pool.execute(`SELECT lastfmsession, COUNT(*) AS \`scrobbleCount\` FROM scrobbles WHERE artist = ? AND track = ? GROUP BY lastfmsession ORDER BY \`scrobbleCount\` DESC`, [track.artist.name, track.name]);

			let userList = [];
			if ((scrobbles as any[]).length > 0) {
				userList = (await this.pool.execute(`SELECT lastfmsession, discordid FROM users WHERE lastfmsession IN (?${",?".repeat((scrobbles as any[]).length - 1)})`, (scrobbles as any[]).map(e => e.lastfmsession)))[0] as any[];
			}

			let members = await this.message.guild.members.fetch();
			
			let userFiltered = (userList as any[]).filter(user => members.has(user.discordid));
			let userObj:BasicObj = {}
			for (let user of userFiltered) {
				userObj[user.lastfmsession] = user.discordid;
			}
			let scrobbleFiltered = (scrobbles as any[]).filter(e => userObj.hasOwnProperty(e.lastfmsession));

			if (recent === null) {
				recent = await this.lastfm.user.getRecentTracks(lastfmSession.session[0], {limit: 1});
			}

			let embed = this.initEmbed()
				.setTitle(track.name)
				.setURL(track.url)
				.setDescription(artist + album)
				.addField("Last.FM Stats", `Listeners: ${track.listeners}\nScrobbles: ${track.playcount}`, true)
				.addField("REM Stats", `Listeners: ${(scrobbles as any[]).length}\nScrobbles: ${(scrobbles as any[]).reduce((acc, cur) => acc + cur.scrobbleCount, 0)}`, true)
				.addField(`${this.message.guild.name} Stats`, `Listeners: ${scrobbleFiltered.length}\nScrobbles: ${scrobbleFiltered.reduce((acc, cur) => acc + cur.scrobbleCount, 0)}`, true)
				.addField("Your stats",
									(firstScrobbleTime !== undefined ? `${lastfmSession.safe[0]} first scrobbled this track on ${this.getLocalizedTime(new Date(Number(firstScrobbleTime) * 1000), await this.getTimezone())}` : `${lastfmSession.safe[0]} has not scrobbled this track yet`)
									+ "\n" +
									`${Number(track.userplaycount).toLocaleString("fr")} scrobbles by you (${(Number(track.userplaycount) * 100 / Number(recent.meta.total)).toFixed(2)}% of your total scrobbles)`
									+ "\n" +
									`You make up ${(Number(track.userplaycount) * 100 / Number(track.playcount)).toFixed(2)}% of the global scrobbles of **${track.name}**`);

			if (track.album?.image?.[2]?.url) {
				embed.setThumbnail(track.album.image[2].url);
			}

			this.reply(embed);
			

		} catch(err) {
			console.log(err);
			throw err;
		}

	}

}