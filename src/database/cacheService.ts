import LastFM from "lastfm-typed";
import config from "../config.json";
const lastfm = new LastFM(config.lastfm.key, {apiSecret: config.lastfm.secret});
import mysql from "mysql2/promise";
import { getRecentTracks } from "lastfm-typed/dist/interfaces/userInterface";

export default class CacheService {

	user:any;
	interval:NodeJS.Timeout;
	pool:mysql.Pool;

	constructor(pool:mysql.Pool) {
		this.pool = pool;
	}

	async startPeriodicCache(intervalTime:number) {

		this.interval = setInterval(async () => {

			const relevantUser = (await this.pool.query("SELECT discordid, lastcachetime FROM users WHERE lastcachetime > 0 ORDER BY lastcachetime LIMIT 1").catch((err) => {
				console.error("No cacheable users for routine caching. You broke it.");
			}))[0][0];

			console.log("Starting caching for " + relevantUser);

			this.cacheIndividual(relevantUser.discordid).catch(err => {
				console.error(`Routine caching failed for discord id ${relevantUser.discordid}. Reason:\n` + JSON.stringify(err));
			});

		}, intervalTime);

	}

	async stopPeriodicCache() {
		clearInterval(this.interval);
	}

	async addScrobbles(data:getRecentTracks) {

		let tracks = data.tracks.map(e => {
			return [this.user.lastfmsession ,e.artist.name, e.album.name, e.name, e.date.uts];
		});

		if (tracks.length === 0) {
			throw "No new scrobbles";
		}

		this.pool.execute(`INSERT INTO scrobbles (lastfmsession, artist, album, track, timestamp) VALUES (?,?,?,?,?)${",(?,?,?,?,?)".repeat(tracks.length - 1)}`, tracks.flat());

	}

	sleep(ms:number) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}

	async clearIndividual(discordid:string) {
		let lastfmSession = (await this.pool.execute("SELECT lastfmsession FROM users WHERE discordid = ?", [discordid]))?.[0]?.[0]?.lastfmsession;
		await this.pool.execute("DELETE FROM scrobbles WHERE lastfmsession = ?", [lastfmSession]);
		return true;
	}

	async cacheIndividual(discordid:string, willForce = false) {

		if (discordid === undefined) {
			throw "Discord id undefined in caching.";
		}

		this.user = (await this.pool.execute("SELECT * FROM users WHERE discordid = ?", [discordid]))[0][0];

		if (this.user.lastfmsession === null) {
			throw "User not logged in to last.fm.";
		}

		if (this.user.lastcachetime < 0) {
			throw "Already updating cache for this user. Please hang on.";
		}

		let scrobbleCount:number;

		if (willForce === true) {

			if (this.user.lastfullcachetime > (Number(new Date()) - (1000 * 60 * 30))) {
				throw "Cannot force update, please wait. There is a cooldown of 30 minutes. If you just want to update to show new scrobbles, you can do the command without the `force` parameter, which has no cooldown.";
			}

			await this.pool.execute("UPDATE users SET lastcachetime = ?, lastfullcachetime = ? WHERE discordid = ?", [-Number(new Date()), Number(new Date()), discordid.toString()]);
			scrobbleCount = 0;
			await this.pool.execute("DELETE FROM scrobbles WHERE lastfmsession = ?", [this.user.lastfmsession]);
		} else {
			await this.pool.execute("UPDATE users SET lastcachetime = ? WHERE discordid = ?", [-Number(new Date()), discordid.toString()]);
			scrobbleCount = (await this.pool.execute("SELECT COUNT(*) FROM scrobbles WHERE lastfmsession = ?", [this.user.lastfmsession]))[0][0]["COUNT(*)"];
		}

		let scrobbleCacher = await lastfm.helper.cacheScrobbles(this.user.lastfmsession, {previouslyCached:scrobbleCount, parallelCaches: 10});

		scrobbleCacher.on("data", (data) => {
			if (data.data.tracks.length > 0) {
				this.addScrobbles(data.data);
			}
		});

		scrobbleCacher.on("close", async () => {
			await this.sleep(1000);
			await this.pool.execute("UPDATE users SET lastcachetime = ? WHERE discordid = ?", [Number(new Date()), discordid]);
			console.log("Finished caching for " + discordid);
			return true;
		});

		return scrobbleCacher;

	}

}