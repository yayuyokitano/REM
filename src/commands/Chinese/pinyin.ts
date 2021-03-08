import Command from "../../discord/command";

export default class Pinyin extends Command {

	category = "Chinese";
	description = "Converts text to pinyin.";
	usage = ["pin1yin1", "拼音"];

	async run(args:string) {

		if (!args) {
			this.reply("please enter text to convert.");
			return;
		}

		this.reply(this.pinyinify(args));
	}

}