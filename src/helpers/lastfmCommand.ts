import LastFM from "lastfm-typed";
import Command from "../discord/command";
import config from "../config.json";
import { getInfo } from "lastfm-typed/dist/interfaces/artistInterface";

export default class LastFMCommand extends Command {

	lastfm:LastFM;

	constructor() {
		super();
		this.lastfm = new LastFM(config.lastfm.key, { apiSecret:config.lastfm.secret });
	}

	async getLastfmSession() {
		let connection = await this.initDB();
		let lastfmsession = (await connection.execute("SELECT lastfmsession FROM users WHERE discordid = ?", [this.message.author.id]))[0][0].lastfmsession;
		connection.end();
		return lastfmsession;
	}

	async getRelevantLFM() {

		let mentions = this.getRelevantUser({lfm:true});
		let session:string[] = [];
		let safe:string[] = []
		let connection = await this.initDB();

		for (let mention of mentions.slice(0, 5)) {
			if (mention.startsWith("lfm:")) {
				session.push(mention.slice(4));
				safe.push(mention.slice(4));
			} else {
				session.push((await connection.execute("SELECT lastfmsession FROM users WHERE discordid = ?", [mention]))?.[0]?.[0]?.lastfmsession);
				safe.push((await connection.execute("SELECT lastfmusername FROM users WHERE discordid = ?", [mention]))?.[0]?.[0]?.lastfmusername);
			}
		}

		connection.end();
		return {session, safe};

	}

	async fetchServerUsers() {
		const memberList = (await this.message.guild.members.fetch()).keyArray();
		const connection = await this.initDB();
		const [lastfm] = await connection.execute(`SELECT discordid FROM users WHERE lastfmsession IS NOT NULL AND discordid IN (?${",?".repeat(memberList.length - 1)})`, memberList);
		const [callRow] = await connection.execute("SELECT lastfmsession FROM users WHERE discordid = ?", [this.message.author.id]);
		await connection.end();
		const userList = (lastfm as any[]).map((e) => e.discordid as string);
		const sk = (callRow as any[]).map((e) => e.lastfmsession).join();
		return {userList, sk};
	}

	async fetchLFM(sk:string) {
		return (await this.lastfm.user.getInfo(sk)).name;
	}

	async getRelevantTrack(args:string) {

		args = this.removeMentions(args).trim();
		let artist:string, track:string, cover:string, album:string, url:string;

		if (args.length) {
			
			const search = (await this.lastfm.track.search(args)).trackMatches[0];
			artist = search.artist;
			track = search.name;
			url = search.url;

		} else {

			try{
				const recent = await this.lastfm.helper.getNowPlaying((await this.getRelevantLFM()).session.slice(-1)[0]);
				artist = recent.recent.artist;
				track = recent.recent.track;
				cover = recent.recent.image?.slice(-2, -1)?.[0]?.["#text"];
				album = recent.recent.album;
				url = recent.recent.url;
			} catch(err) {
				throw `Error fetching currently playing track. Most likely you are not signed in to the bot. Try signing in with \`${await this.getPrefix()}login\``;
			}

		}

		return {artist, track, cover, album, url};

	}

	async getRelevantAlbum(args:string) {

		args = this.removeMentions(args).trim();
		let artist:string, cover:string, album:string;

		if (args.length) {
			
			const search = (await this.lastfm.album.search(args)).albumMatches[0];
			artist = search.artist;
			album = search.name;

		} else {
			try{
				const recent = await this.lastfm.helper.getNowPlaying((await this.getRelevantLFM()).session.slice(-1)[0]);
				artist = recent.recent.artist;
				cover = recent.recent.image?.slice(-2, -1)?.[0]?.["#text"];
				album = recent.recent.album;
			} catch(err) {
				throw `Error fetching currently playing album. Most likely you are not signed in to the bot. Try signing in with \`${await this.getPrefix()}login\``;
			}

		}

		return {artist, cover, album};

	}

	async getRelevantArtist(args:string) {

		args = this.removeMentions(args).trim();
		let artist:string;

		if (args.length) {
			
			const search = (await this.lastfm.artist.search(args)).artistMatches[0];
			artist = search.name;

		} else {

			try {
				const recent = await this.lastfm.helper.getNowPlaying((await this.getRelevantLFM()).session.slice(-1)[0]);
				artist = recent.recent.artist;
			} catch(err) {
				throw `Error fetching currently playing artist. Most likely you are not signed in to the bot. Try signing in with \`${await this.getPrefix()}login\``;
			}

		}

		return artist;

	}

	async getRelevantArtistDetailed(args:string, sk:string) {

		args = this.removeMentions(args).trim();

		if (args.length) {
			
			const search = (await this.lastfm.artist.search(args)).artistMatches[0];
			let artist = search.name;
			const res = await this.lastfm.artist.getInfo({artist}, {sk});
			return res;


		} else {

			try {
				const recent = await this.lastfm.helper.getNowPlaying((await this.getRelevantLFM()).session.slice(-1)[0], ["artist"]);
				return recent.details.artist.data;
			} catch(err) {
				throw `Error fetching currently playing artist. Most likely you are not signed in to the bot. Try signing in with \`${await this.getPrefix()}login\``;
			}

		}

	}

	async getRelevantAlbumDetailed(args:string, sk:string) {

		args = this.removeMentions(args).trim();

		if (args.length) {
			
			const search = (await this.lastfm.album.search(args)).albumMatches[0];
			let {artist, name} = search;
			const res = await this.lastfm.album.getInfo({artist, album:name}, {sk});
			return res;


		} else {

			try {
				const recent = await this.lastfm.helper.getNowPlaying((await this.getRelevantLFM()).session.slice(-1)[0], ["album"]);
				return recent.details.album.data;
			} catch(err) {
				throw `Error fetching currently playing album. Most likely you are not signed in to the bot. Try signing in with \`${await this.getPrefix()}login\``;
			}

		}

	}

	async getRelevantTrackDetailed(args:string, sk:string) {

		args = this.removeMentions(args).trim();

		if (args.length) {
			
			const search = (await this.lastfm.track.search(args)).trackMatches[0];
			let {artist, name} = search;
			const res = await this.lastfm.track.getInfo({artist, track:name}, {sk});
			return res;


		} else {

			try {
				const recent = await this.lastfm.helper.getNowPlaying((await this.getRelevantLFM()).session.slice(-1)[0], ["track"]);
				return recent.details.track.data;
			} catch(err) {
				throw `Error fetching currently playing track. Most likely you are not signed in to the bot. Try signing in with \`${await this.getPrefix()}login\``;
			}

		}

	}

}