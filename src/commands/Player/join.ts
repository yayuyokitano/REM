import Command from "../../discord/command";

export default class Join extends Command {
	category = "Player";
	description = "Joins the current voice channel of calling user. Will automatically leave after a while, or if starting a new track is attempted while nobody is in the channel.";
	usage = [""];

	async run(args:string) {

		if (!this.message.member.voice.channel) {
			this.reply("You must join a channel first!");
			return;
		}

		if (!this.message.member.voice.channel.joinable) {
			this.reply("I cannot join this channel!");
			return;
		}

		this.handler.voiceConnections[this.message.guild.id] = {
			connection: this.message.member.voice.channel.join(),
			urls: [],
			isPlaying: false,
			currPlaying: {artist:null, album:null, track:null}
		};

		(await this.handler.voiceConnections[this.message.guild.id].connection).on("disconnect", () => {
			delete this.handler.voiceConnections[this.message.guild.id];
		});

	}
}
