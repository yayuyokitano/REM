import Command from "../../discord/command";
import randomInt from "random-int";

export default class Roll extends Command {

	category = "Math";
	description = "Rolls a random whole number from 1 to the number given";
	usage = ["6"];

	async run(args:string) {

		//easter egg
		if (args.trim() === "out") {
			let botList = ["720135602669879386"];

			let str = "You heard him, 'bots! Let's show these creatures who we **really** are--";
			for (let bot of botList) {
				try {
					await this.message.guild.members.fetch(bot);
					str += ` <@${bot}>`;
				} catch(err) {

				}
			}

			this.reply(str);
			return;
		}


		const max = parseInt(args, 10);
		if (isNaN(max)){
			throw "Expected a number";
		}
		if (max < 1){
			throw "Number must be at least 1";
		}
		this.reply(`rolled a ${randomInt(1, max)}`);
	}

}