import LastFMCommand from "../../helpers/lastfmCommand";

export default class ForceSkip extends LastFMCommand {
	category = "Queue";
	description = "Forces skipping of song in current voice channel. Requires mute perms in channel.";
	usage = [""];
	alias = [""];

	async run(args:string) {
		
		if ((await this.message.guild.members.fetch(this.message.author)).permissionsIn((await this.handler.voiceConnections[this.message.guild.id].connection).voice.channel).has("MUTE_MEMBERS")) {
			await this.playSong();
			this.reply("Skipped song!");
		} else {
			this.reply("Insufficient perms, must have mute perms in channel.");
		}

	}
}
