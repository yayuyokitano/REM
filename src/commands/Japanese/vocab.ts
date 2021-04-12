import Command from "../../discord/command";
import JishoApi, { JishoWordSense } from "unofficial-jisho-api";
import capitalize from "capitalize";

const jisho = new JishoApi;

export default class JpVocab extends Command {

	category = "Japanese";
	description = "Gets information about a vocabulary word from [jisho.org](https://jisho.org/)";
	usage = ["赤い", "park"];
	alias = ["jpv", "jplookup", "japaneselookup", "japanesevocab"];

	async run(word:string) {

		if (!word) {
			this.reply("please include the word to search for.");
			return;
		}

		const {meta, data} = await jisho.searchForPhrase(word);

		if (meta.status !== 200) {
			throw `Jisho.org service error. Error code: ${meta.status}`;
		}

		if (!data[0]?.japanese?.[0]?.word) {
			this.reply("couldn't find word");
			return;
		}

		let embed = this.initEmbed();

		let definitionFields = [];

		for (let entry of data) {
			definitionFields.push({
				title: entry.japanese[0].word,
				url: "https://jisho.org/word/" + encodeURIComponent(entry.japanese[0].word),
				description: `${entry.japanese[0].reading}${entry.jlpt[0] ? "・JLPT " + entry.jlpt.sort().slice(-1).join("").slice(-2).toUpperCase() : ""}`,
				fields: this.addDefinitions(entry.senses.entries())
			});
		}
		
		this.sendPaginatedMessage(embed, definitionFields, 1, definitionFields.length);
		
	}

	addDefinitions(data:IterableIterator<[number, JishoWordSense]>) {
		let fields = [];
		for (let [index, word] of data) {
			if (index > 2) {
				break;
			}
			let field = "";
			if (word.links.length) {
				field = `[${word.parts_of_speech.join("・")}](${word.links[0].url})`;
			} else {
				field = word.parts_of_speech.join("・");
			}
			fields.push({
				name: word.english_definitions.map((e) => capitalize(e)).join("・"),
				value: field
			});
		}
		return fields;
	}

}