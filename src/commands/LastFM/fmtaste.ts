import LastFMCommand from "../../helpers/lastfmCommand";

export default class FMTaste extends LastFMCommand {

	category = "Last.FM";
	alias = ["fmt", "taste", "t"];
	description = "Checks for mutual artists on Last.FM";
	usage = ["lfm:Mexdeep", "lfm:Mexdeep lfm:gowon_", "lfm:Mexdeep w"];

	async run(args:string) {
		
		const lfmUsers = await this.getRelevantLFM();

		const res = await this.lastfm.helper.getMatchingArtists(lfmUsers.session[0], lfmUsers.session[1], 1000, this.convertToLFMTime(this.removeMentions(args))).catch ((err) => {
			throw `Error getting data from lastfm. Most likely you or a mentioned person is not signed into the bot. Try signing in with \`${this.getPrefix()}login\``;
		});
		
		let user = lfmUsers.safe.slice(0,2);

		let scrobbleSort = res.sort((a, b) => b.playcount[0] * b.playcount[1] - a.playcount[0] * a.playcount[1]);

		let scrobbleSplit: {
			name: string;
			url: string;
			playcount: number[];
		}[][] = [];

		while (scrobbleSplit.length < Math.ceil(scrobbleSort.length / 15)) {
			scrobbleSplit.push(scrobbleSort.slice(scrobbleSplit.length * 15, scrobbleSplit.length * 15 + 15));
		}

		let messageArray = [];
		let maxLength = 30;
		for (let scrobbles of scrobbleSplit) {
			let current = "";
			let len = [Math.max(user[0].length, 5), Math.max(user[1].length, 5)]
			current += `${scrobbleSort.length} mutual artists\n\`\`\`\n${user[0].padStart(5, " ")} │ ${user[1].padEnd(5, " ")} │ Artist\n${"─".repeat(len[0])}─┼─${"─".repeat(len[1])}─┼─${"─".repeat(maxLength)}\n`;
			current += scrobbles.reduce((acc, cur) => acc + `${cur.playcount[0].toString().padStart(len[0], " ")} │ ${cur.playcount[1].toString().padEnd(len[1], " ")} │ ${cur.name.slice(0,maxLength)}\n`, "");
			messageArray.push(current.trim() + "\n```");
		}

		let embed = this.initEmbed()
			.setTitle(`Mutual artists between ${user[0]} and ${user[1]} ${this.convertToLFMTime(this.removeMentions(args))}`);

		this.sendPaginatedMessage(embed, messageArray, 15, scrobbleSort.length);

	}

}