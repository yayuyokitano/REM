import LastFMCommand from "../../helpers/lastfmCommand";
import {getInfo} from "lastfm-typed/dist/interfaces/trackInterface";
import { parse } from 'node-html-parser';
import he from "he";

export default class lyrics extends LastFMCommand {

	category = "Last.FM";
	description = "Gets track lyrics";
	usage = ["", "KITANO REM - Rolling Sky"];

	async run(args:string) {

		let lastfmSession = await this.getRelevantLFM();
		let {track} = await this.getRelevantTrackDetailed(args, lastfmSession.session[0]);
		let embed = this.initEmbed();
		embed.setTitle(`Lyrics for ${track.artist.name} - ${track.name}`)

		if (typeof lastfmSession === "undefined") {
			throw `User is not logged in to last.fm. You can login using \`${await this.getPrefix()}login\``
		}

		try {
			
			let lyricPromise:[string,Promise<string>|string][] = Object.entries({
				["Eggs.mu"]: this.getEggsLyrics(track),
				["utaten.com"]: this.getUtatenLyrics(track),
				["petitlyrics.com"]: this.getPetitLyrics(track)
			});

			let lyrics = await Promise.all(lyricPromise.map(e => e[1]));

			lyricPromise = lyricPromise.map((e, i) => [e[0], lyrics[i]]);


			for (let [site, lyric] of lyricPromise) {
				if (lyric) {
					embed.setDescription(he.decode(lyric as string))
					.setFooter(`Source: ${site}`);
					this.reply(embed);
					return;
				}
			}

			this.reply(`Couldn't find lyrics for ${track.artist.name} - ${track.name}`);
			

		} catch(err) {
			console.log(err);
			throw `Loading lyrics failed for ${track.artist.name} - ${track.name}, but it might exist on one of the sites. Try again.`;
		}

	}

	async getEggsLyrics(track:getInfo) {
		
		let artist = track.artist.name;
		let searchPage = parse(await this.sendGetRequestRaw("https://eggs.mu/search", {
			searchKeyword: artist
		})).querySelector(".m-search ul");

		if (searchPage === null) {
			return null;
		}

		for (let element of searchPage.querySelectorAll(".artist_name")) {
			if (element.innerText.toLowerCase() === artist.toLowerCase()) {
				let artistPage = parse(await this.sendGetRequestRaw(`https://eggs.mu${element.parentNode.getAttribute("href")}`, {}));
				
				if (artistPage === null) {
					return null;
				}

				for (let trackElement of artistPage.querySelectorAll(".btnPaly")) {

					if (trackElement.getAttribute("data-srcname")?.toLowerCase() === track.name.toLowerCase()) {
						let trackPage = parse(await this.sendGetRequestRaw(`https://eggs.mu/song/${trackElement.getAttribute("data-srcid")}`, {})).querySelector(".lyrics");

						return trackPage.querySelector(".lyricist").innerText + "\n" + trackPage.querySelector(".composer").innerText + "\n\n" + trackPage.querySelector("p:last-child").innerText.replace(/\r\n\r\n((?!.*\n).*)\r\n\r\n/g,"\n$1\n");

					}

				}
			}
		}

		return null;

	}

	async getUtatenLyrics(track:getInfo) {

		let searchPage = parse(await this.sendGetRequestRaw("https://utaten.com/lyric/search", {
			sort: "popular_sort%3Aasc",
			artist_name: track.artist.name,
			title: track.name
		})).querySelector(".searchResult__title");

		if (searchPage === null) {
			return null;
		}

		let trackPage = parse(await this.sendGetRequestRaw(`https://utaten.com${searchPage.querySelector("a").getAttribute("href")}`, {}));
		if (trackPage !== null) {

			trackPage = trackPage.querySelector(".lyricBody .hiragana");

			for (let furigana of trackPage?.querySelectorAll(".rt")) {
				furigana.remove();
			}

			return trackPage.innerText;

		}
		
		return null;

	}

	async getPetitLyrics(track:getInfo) {

		let searchPage = parse(await this.sendGetRequestRaw("https://petitlyrics.com/search_lyrics", {
			artist: track.artist.name,
			title: track.name
		})).querySelector("#lyrics_list td:nth-child(2) a");
		
		if (searchPage === null) {
			return null;
		}

		let trackPage = parse(await this.sendGetRequestRaw(`https://petitlyrics.com${searchPage.getAttribute("href")}`,{}));
		return trackPage?.querySelector("#lyrics").innerText;

	}

}