import LastFM from "lastfm-typed";
import Command from "../discord/command";
import config from "../config.json";
import mysql from "mysql2/promise";
import { Readable } from "node:stream";
import YoutubeParser from "./youtubeParser";
import ytdl from "ytdl-core-discord";

export default class LastFMCommand extends Command {

	lastfm:LastFM;

	constructor(pool:mysql.Pool) {
		super(pool);
		this.lastfm = new LastFM(config.lastfm.key, { apiSecret:config.lastfm.secret });

		/*("requestStart", (args, method) => {
			console.log("REQUEST START: ", method, args);
		});
		this.lastfm.on("requestComplete", (args, time, res) => {
			console.log("REQUEST COMPLETE: ", args, `Executed in ${time}ms`, res);
		});
		this.lastfm.on("requestPrepare", (args) => {
			console.log("REQUEST PREPARE: ", args);
		})*/
	}

	async getLastfmSession() {
		let lastfmsession = (await this.pool.execute("SELECT lastfmsession FROM users WHERE discordid = ?", [this.message.author.id]))[0][0].lastfmsession;
		return lastfmsession;
	}

	async getRelevantLFM(allowLFM = true) {

		let mentions = this.getRelevantUser({lfm:true});
		let session:string[] = [];
		let safe:string[] = [];

		for (let mention of mentions.slice(0, 5)) {
			if (mention.startsWith("lfm:")) {
				if (allowLFM === true) {
					session.push(mention.slice(4));
					safe.push(mention.slice(4));
				}
			} else {
				session.push((await this.pool.execute("SELECT lastfmsession FROM users WHERE discordid = ?", [mention]))?.[0]?.[0]?.lastfmsession);
				safe.push((await this.pool.execute("SELECT lastfmusername FROM users WHERE discordid = ?", [mention]))?.[0]?.[0]?.lastfmusername);
			}
		}

		return {session: session.filter(e => e !== undefined), safe: safe.filter(e => e !== undefined)};

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
				console.log(err);
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

	convertToLFMTime(args:string) {
		switch (args) {
			case "w":
				return "7day";
			case "m":
				return "1month";
			case "q":
				return "3month";
			case "h":
				return "6month";
			case "y":
				return "12month";
			default:
				return "overall";
		}
	}

	async playSong() {
		const voiceConnection = this.handler.voiceConnections[this.message.guild.id];
		const connection = await voiceConnection.connection;
		voiceConnection.urls = voiceConnection.urls.filter(e => e !== void 0);
		if (voiceConnection.urls.length === 0) {
			this.message.channel.send("No more songs in queue, leaving.");
			connection.disconnect();
			return;
		}
		if ((await voiceConnection.connection).voice.channel.members.filter(e => !e.user.bot).size < 1) {
			this.message.channel.send("No more users in channel, leaving.");
			connection.disconnect();
			return;
		}
		const url = voiceConnection.urls.shift();

		if (connection?.channel.id !== this.message.member.voice.channelID) {
			this.reply("You must join the same channel as me first!");
			return;
		}

		if (!this.message.member.voice?.channel.speakable) {
			this.reply("I cannot speak in this channel!");
			return;
		}
		let stream:Readable;
		try {
			stream = await ytdl(url);
		} catch(err) {
			this.message.channel.send(`There was an error playing song from url ${url}, skipping...`);
		}
		
		const dispatcher = connection.play(stream, {type: "opus"});
		voiceConnection.isPlaying = true;
		dispatcher.on("finish", async() => {
			const lastfmsessions = (await this.pool.execute(`SELECT lastfmsession FROM users WHERE discordid IN (?${",?".repeat(connection.channel.members.size - 1)})`, connection.channel.members.keyArray()))[0] as {lastfmsession:string}[];
			for (let session of lastfmsessions) {
				if (session.lastfmsession) {
					this.lastfm.track.scrobble(session.lastfmsession, [{artist, track, album, timestamp:Math.floor(Date.now() / 1000)}]);
				}
			}
			this.playSong();
		});
		let info = (await ytdl.getBasicInfo(url)).videoDetails;
		let {artist, album, track} = await new YoutubeParser(info, this.pool).getTags();
		let embed = this.initEmbed(`Now Playing - 🔊${connection.channel.name}`)
			.setTitle(track)
			.setURL(this.getTrackURL(artist, track))
			.setDescription(this.getArtistAlbumMarkdown(artist, album));

		this.handler.voiceConnections[this.message.guild.id].currPlaying = {artist, album, track};
		const lastfmsessions = (await this.pool.execute(`SELECT lastfmsession FROM users WHERE discordid IN (?${",?".repeat(connection.channel.members.size - 1)})`, connection.channel.members.keyArray()))[0] as {lastfmsession:string}[];
		for (let session of lastfmsessions) {
			if (session.lastfmsession) {
				this.lastfm.track.updateNowPlaying(artist, track, session.lastfmsession, {duration: Number(info.lengthSeconds), ...(album ? {album} : {})});
			}
		}

		if (album) {
			try {
				const img = (await this.lastfm.album.getInfo({artist, album}))?.image?.[2]?.url;
				embed.setThumbnail(img);
			} catch (err) {
				embed.setThumbnail("https://lastfm.freetls.fastly.net/i/u/174s/2a96cbd8b46e442fc41c2b86b821562f.png");
			}
		}

		embed.author.iconURL = info.author.thumbnails?.[0]?.url;
		this.message.channel.send(embed);
	}

}