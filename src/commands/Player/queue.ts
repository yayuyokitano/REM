import LastFMCommand from "../../helpers/lastfmCommand";
import PlaylistSummary from "youtube-playlist-summary";
import config from "../../config.json";

export default class Queue extends LastFMCommand {
	category = "Queue";
	description = "Queues song in current voice channel.";
	usage = ["https://youtu.be/JvpYnqFwT8s", "TETORA - 覚悟のありか", "https://youtube.com/playlist?list=PLAYHfNzArD0-XuXKa2_3rClp5HSWrIFtg"];
	alias = ["play"];

	async run(args:string) {

		let response = "";
		const ps = new PlaylistSummary({
			GOOGLE_API_KEY: config.other.youtube,
			PLAYLIST_ITEM_KEY: ["videoUrl"]
		});

		const playlistID = this.getYTPlaylist(args);
		if (playlistID) {
			const playlist = await ps.getPlaylistItems(playlistID);
			this.handler.voiceConnections[this.message.guild.id].urls.push(...playlist.items.map(e => e.videoUrl));
			response = `Successfully queued ${playlist.items.length} videos from **${playlist.playlistTitle}**`;
		} else {
			const link = await this.getYTLink(args);
			response = `Successfully queued${link !== args ? ` ${link}`:""}!`;
		}

		if (!this.handler.voiceConnections[this.message.guild.id].isPlaying) {
			this.playSong();
		}
		this.reply(response);

	}
}
