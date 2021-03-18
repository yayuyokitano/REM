import Command from "../../discord/command";
import fetch from "node-fetch";

export default class Inspire extends Command {

	category = "Fun";
	description = "Gets an image from inspirobot.me";
	usage = ["", "@mention"];

	async run(args:string) {

		const user = this.getRelevantUser()[0];
		const img = await(await fetch("https://inspirobot.me/api?generate=true")).text();

		if (user === "541298511430287395") {
			this.reply("hello yes thank you thanks to your inspiration and your inspiration alone I have made this masterpiece https://youtu.be/LP1o2q3eXzw");
		} else if (user !== this.message.author.id) {
			this.message.channel.send('<@' + user + ">", {
				files: [img]
			});
		} else {
			this.message.channel.send({
				files: [img]
			});
		}

	}

}