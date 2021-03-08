const lines = ["N-No, it's not like I did it for you! I did it because I had free time, that's all!",
"BAKAAAAAAAAAAAAAAA!!!!! YOU'RE A BAKAAAAAAA!!!!",
"I'm just here because I had nothing else to do!",
"Are you stupid?",
"You're such a slob!",
"You should be grateful!",
"Don't misunderstand, it's not like I like you or anything...",
"H-Hey....",
"....T-Thanks.....",
"T-Tch! S-Shut up!",
"Everything for you",
"B-baka, I didn't want to help you anyway",
"I have a boyfriend"];

import Command from "../../discord/command";
import randomInt from "random-int";

export default class ThankYou extends Command {

	category = "Secret Commands";
  description = "B-baka";
  alias = ["thx", "thanks", "thank", "tank"];
	usage = [""];

	async run(args:string) {
		this.reply(lines[randomInt(lines.length - 1)]);
	}

}