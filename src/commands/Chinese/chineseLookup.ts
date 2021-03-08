import Command from "../../discord/command";
import hanzi from "hanzi";

export default class CnVocab extends Command {

	category = "Chinese";
	description = "Gets information about a Chinese word.";
	usage = ["腾冲"];
	alias = ["cnlookup", "cnv", "chinesevocab", "chineselookup"];

	async run(args:string) {

		let [word] = args.split(/\s+/);

		if (!word) {
			this.reply("please include the word to search for.");
			return;
		}

		const [definition] = hanzi.definitionLookup(word);

		if (!definition) {
			this.reply("couldn't find the word.");
			return;
		}

		let embed = this.initEmbed()
			.setTitle(word)
			.setDescription(definition.definition.split("/").join("・"))
			.addField("Simplified", definition.simplified, true)
			.addField("Traditional", definition.traditional, true)
			.addField("Pinyin", this.pinyinify(definition.pinyin).split(/\s+/).join(""));

		this.reply(embed);

	}

}