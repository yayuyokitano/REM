import LastFM from "lastfm-typed";
import config from "../config.json";
const lastfm = new LastFM(config.lastfm.key, {apiSecret: config.lastfm.secret});
import mysql from "mysql2/promise";
import { getRecentTracks } from "lastfm-typed/dist/interfaces/userInterface";

export default class CacheService {

	user:any;

	async initDB() {
		const { host, user, password, database } = config.mysql;
		const connection = await mysql.createConnection({host, user, password});
		await connection.query(`USE ${database}`);
		return connection;
	}

	async addScrobbles(connection:mysql.Connection, data:getRecentTracks) {

		let tracks = data.tracks.map(e => {
			return [this.user.lastfmsession ,e.artist.name, e.album.name, e.name, e.date.uts];
		})

		connection.execute(`INSERT INTO scrobbles (lastfmsession, artist, album, track, timestamp) VALUES (?,?,?,?,?)${",(?,?,?,?,?)".repeat(tracks.length - 1)}`, tracks.flat());

	}

	sleep(ms:number) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}

	async clearIndividual(discordid:string) {
		let connection = await this.initDB();
		let lastfmSession = (await connection.execute("SELECT lastfmsession FROM users WHERE discordid = ?", [discordid]))?.[0]?.[0]?.lastfmsession;
		await connection.execute("DELETE FROM scrobbles WHERE lastfmsession = ?", [lastfmSession]);
		return true;
	}

	async cacheIndividual(discordid:string) {
		let connection = await this.initDB();
		this.user = (await connection.execute("SELECT * FROM users WHERE discordid = ?", [discordid]))[0][0];

		if (this.user.lastcachetime < 0) {
			throw "Already updating cache for this user. Please hang on.";
		}

		await connection.execute("UPDATE users SET lastcachetime = ? WHERE discordid = ?", [-Number(new Date()), discordid.toString()]);

		const scrobbleCount = (await connection.execute("SELECT COUNT(*) FROM scrobbles WHERE lastfmsession = ?", [this.user.lastfmsession]))[0][0]["COUNT(*)"];

		let scrobbleCacher = await lastfm.helper.cacheScrobbles(this.user.lastfmsession, {previouslyCached:scrobbleCount, parallelCaches: 10});

		scrobbleCacher.on("data", (data) => {
			this.addScrobbles(connection, data.data);
		});

		scrobbleCacher.on("close", async () => {
			await this.sleep(1000);
			console.log(discordid);
			console.log(Number(new Date()));
			console.log((await connection.execute("SELECT * FROM users WHERE discordid = ?", [discordid]))[0][0]);
			console.log(await connection.execute("UPDATE users SET lastcachetime = ? WHERE discordid = ?", [Number(new Date()), discordid]));
			await connection.end();
			return true;
		});

	}

}