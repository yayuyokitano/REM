import LastFM from "lastfm-typed";
import Command from "../discord/command";
import config from "../config.json";
import mysql from "mysql2/promise";

export default class LastFMCommand extends Command {

	lastfm:LastFM;

	constructor(pool:mysql.Pool) {
		super(pool);
		this.lastfm = new LastFM(config.lastfm.key, { apiSecret:config.lastfm.secret });
	}

	async getLastfmSession() {
		let lastfmsession = (await this.pool.execute("SELECT lastfmsession FROM users WHERE discordid = ?", [this.message.author.id]))[0][0].lastfmsession;
		return lastfmsession;
	}

	async getRelevantLFM() {

		let mentions = this.getRelevantUser({lfm:true});
		let session:string[] = [];
		let safe:string[] = [];

		for (let mention of mentions.slice(0, 5)) {
			if (mention.startsWith("lfm:")) {
				session.push(mention.slice(4));
				safe.push(mention.slice(4));
			} else {
				session.push((await this.pool.execute("SELECT lastfmsession FROM users WHERE discordid = ?", [mention]))?.[0]?.[0]?.lastfmsession);
				safe.push((await this.pool.execute("SELECT lastfmusername FROM users WHERE discordid = ?", [mention]))?.[0]?.[0]?.lastfmusername);
			}
		}

		return {session, safe};

	}

	async fetchServerUsers() {
		const memberList = (await this.message.guild.members.fetch()).keyArray();
		const [lastfm] = await this.pool.execute(`SELECT discordid FROM users WHERE lastfmsession IS NOT NULL AND discordid IN (?${",?".repeat(memberList.length - 1)})`, memberList);
		const [callRow] = await this.pool.execute("SELECT lastfmsession FROM users WHERE discordid = ?", [this.message.author.id]);
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
			return {artist: res, recent: null};


		} else {

			try {
				const recent = await this.lastfm.helper.getNowPlaying((await this.getRelevantLFM()).session.slice(-1)[0], ["artist"]);
				return {
					artist: recent.details.artist.data,
					recent: recent.details.recent.data
				};
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
			return {album: res, recent: null};


		} else {

			try {
				const recent = await this.lastfm.helper.getNowPlaying((await this.getRelevantLFM()).session.slice(-1)[0], ["album"]);
				return {
					album: recent.details.album.data,
					recent: recent.details.recent.data
				};
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
			return {track: res, recent: null};


		} else {

			try {
				const recent = await this.lastfm.helper.getNowPlaying((await this.getRelevantLFM()).session.slice(-1)[0], ["track"]);
				return {
					track: recent.details.track.data,
					recent: recent.details.recent.data
				};
			} catch(err) {
				throw `Error fetching currently playing track. Most likely you are not signed in to the bot. Try signing in with \`${await this.getPrefix()}login\``;
			}

		}

	}

	getArtistURL(artist:string) {
		return `https://www.last.fm/music/${this.encodeURL(artist)}`;
	}

}