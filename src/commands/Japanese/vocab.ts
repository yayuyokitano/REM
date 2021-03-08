import Command from "../../discord/command";
import JishoApi, { JishoWordSense } from "unofficial-jisho-api";
import capitalize from "capitalize";
import { MessageEmbed } from "discord.js";

const jisho = new JishoApi;

export default class JpVocab extends Command {

	category = "Japanese";
	description = "Gets information about a vocabulary word from [jisho.org](https://jisho.org/)";
	usage = ["赤"];
	alias = ["jpv", "jplookup", "japaneselookup", "japanesevocab"];

	async run(args:string) {

		let [word] = args.split(/\s+/);

		if (!word) {
			this.reply("please include the word to search for.");
			return;
		}

		const wordEntry = await jisho.searchForPhrase(word);

		if (wordEntry.meta.status !== 200) {
			throw `Jisho.org service error. Error code: ${wordEntry.meta.status}`;
		}

		const data = wordEntry.data[0];

		if (!data?.japanese?.[0]?.word) {
			this.reply("couldn't find word");
			return;
		}

		let embed = this.initEmbed()
			.setTitle(data.japanese[0].word)
			.setURL("https://jisho.org/word/" + encodeURIComponent(data.japanese[0].word))
			.setDescription(data.japanese[0].reading);
		
		embed = this.addDefinitions(embed, data.senses.entries());

		if (data.jlpt[0]){
			embed.setFooter("JLPT " + data.jlpt.sort().slice(-1).join("").slice(-2).toUpperCase());
		}

		this.reply(embed);
		
	}

	addDefinitions(embed:MessageEmbed, data:IterableIterator<[number, JishoWordSense]>) {
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
			embed.addField(word.english_definitions.map((e) => capitalize(e)).join("・"), field);
		}
		return embed;
	}

}