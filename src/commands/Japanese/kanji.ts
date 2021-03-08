import Command from "../../discord/command";
import JishoApi from "unofficial-jisho-api";
import capitalize from "capitalize";

const jisho = new JishoApi;

export default class Kanji extends Command {

	category = "Japanese";
	description = "Gets information about a kanji from [jisho.org](https://jisho.org/)";
	usage = ["赤"];
	alias = ["jpk"];

	async run(args:string) {

		let [kanji] = args[0];

		if (!kanji) {
			this.reply("please include the kanji to search for.");
			return;
		}

		let kanjiEntry = await jisho.searchForKanji(kanji);
		
		if (!kanjiEntry.found) {
			this.reply("couldn't find kanji.");
			return;
		}

		let footerString = "";
		footerString += kanjiEntry.jlptLevel ? `${kanjiEntry.jlptLevel}・` : "";
		footerString += kanjiEntry.newspaperFrequencyRank ? `Freq. rank: ${kanjiEntry.newspaperFrequencyRank}・` : "";
		footerString += `Parts: ${kanjiEntry.parts.join("・")}`;


		let embed = this.initEmbed()
			.setTitle(kanjiEntry.query)
			.setURL(kanjiEntry.uri)
			.setThumbnail(kanjiEntry.strokeOrderGifUri)
			.setDescription(`**${capitalize.words(kanjiEntry.meaning)}**`)
			.addField("Onyomi", kanjiEntry.onyomi.slice(0, 5).join("・"))
			.addField("Kunyomi", kanjiEntry.kunyomi.slice(0, 5).join("・"))
			.setFooter(footerString);
		this.reply(embed);

	}

}