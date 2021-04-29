import LastFM from "lastfm-typed";
import { Pool } from "mysql2/promise";
import config from "../config.json";

const lastfm = new LastFM(config.lastfm.key, {apiSecret: config.lastfm.secret});

export default async function fetchAlbum(artist:string, track:string, pool:Pool) {
	let album = (await pool.execute("SELECT album FROM (SELECT album, COUNT(*) as scrobbleCount FROM scrobbles WHERE album!=\"\" AND artist=? AND track=? GROUP BY album ORDER BY scrobbleCount DESC LIMIT 1) AS tab", [artist, track]))[0][0]?.album;
	if (!album) {
		console.log(artist, "|", track);
		album = (await lastfm.track.getInfo({artist: artist, track: track})).album?.title;
	}
	return album || null;
}