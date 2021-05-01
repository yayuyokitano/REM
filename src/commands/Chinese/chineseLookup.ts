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

		let definitions = hanzi.definitionLookup(word) ?? [];

		definitions.push(...hanzi.dictionarySearch(word).flat());

		if (definitions.length === 0) {
			this.reply("couldn't find the word.");
			return;
		}

		let definitionFields = [];

		console.log(definitions);

		for (let definition of definitions) {
			definitionFields.push({
				title: definition.word,
				description: definition.definition.split("/").join("・"),
				fields: [
					{
						name: "Simplified",
						value: definition.simplified,
						inline: true
					},
					{
						name: "Traditional",
						value: definition.traditional,
						inline: true
					},
					{
						name: "Pinyin",
						value: this.pinyinify(definition.pinyin).split(/\s+/).join(""),
						inline: false
					}
				]
			});
		}

		let embed = this.initEmbed();
		this.sendLegacyPaginatedMessage(embed, definitionFields, 1, definitionFields.length);

	}

}