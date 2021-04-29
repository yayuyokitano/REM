import { Message, ReactionCollector } from "discord.js";
import LastFMCommand from "../../helpers/lastfmCommand";

export default class Skip extends LastFMCommand {
	category = "Queue";
	description = "Requests skipping song in current voice channel. Requires over 50% of people in channel to vote yes.";
	usage = [""];
	alias = [""];

	constructPollMessage(votes:number, neededVotes:number) {
		return `${this.fetchName(this.message.author.id)} wants to skip this song. Please react ${this.constructEmoji("ayuniok", "777653280577945601")} to agree to skipping. ${votes}/${neededVotes} votes needed to skip.`
	}

	processVotes(votes:number, neededVotes:number, collector:ReactionCollector, msg:Message) {
		if (votes >= neededVotes) {
			collector.stop();
		} else {
			msg.edit(`${this.fetchName(this.message.author.id)} wants to skip this song. Please react ${this.constructEmoji("ayuniok", "777653280577945601")} to agree to skipping. ${votes}/${neededVotes} votes needed to skip.`);
		}
	}

	async run(args:string) {
		
		const members = (await this.handler.voiceConnections[this.message.guild.id].connection).voice.channel.members.filter(e => !e.user.bot);
		if (members.size <= 1) {
			await this.skipSong();
		} else {
			let votes = 1;
			const neededVotes = Math.floor((members.size / 2) + 1);
			const msg = await this.message.channel.send(this.constructPollMessage(votes, neededVotes));
			const collector = msg.createReactionCollector((reaction, user) => reaction.emoji.id === "777653280577945601" && members.has(user.id) && user.id !== this.message.author.id, {time: 1 * this.MINUTES, dispose: true});
			msg.react("777653280577945601");
			
			collector.on("collect", () => {
				votes++;
				this.processVotes(votes, neededVotes, collector, msg);
			});

			collector.on("remove", () => {
				votes--;
				this.processVotes(votes, neededVotes, collector, msg);
			});
			
			collector.on("end", async() => {
				msg.reactions.removeAll();
				if (votes >= neededVotes) {
					msg.edit("Vote passed! Skipping song...");
					await this.skipSong();
				} else {
					msg.edit("Vote failed!")
				}
			})
		}

	}

	async skipSong() {
		await this.playSong();
		this.reply("Skipped song!");
	}
}
