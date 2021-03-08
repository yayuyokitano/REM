import mysql from "mysql2/promise";
import config from "../config.json";

async function main() {
	const { host, user, password, database } = config.mysql;
	// create the connection
	const connection = await mysql.createConnection({
		host,
		user,
		password,
		supportBigNumbers: true,
		bigNumberStrings: true
	});
	
	await connection.execute(`CREATE DATABASE IF NOT EXISTS ${database} CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);
	await connection.query(`USE ${database}`);

	await connection.execute(`CREATE TABLE IF NOT EXISTS servers (
		serverid VARCHAR(20) PRIMARY KEY,
		prefix VARCHAR(10))`
	);

	await connection.execute(`CREATE TABLE IF NOT EXISTS users (
		id INT UNIQUE NOT NULL AUTO_INCREMENT,
		discordid VARCHAR(20) PRIMARY KEY,
		lastfmusername VARCHAR(15),
		lastfmsession CHAR(32),
		lastcachetime BIGINT)`
	);

	await connection.execute(`create TABLE IF NOT EXISTS scrobbles (
		lastfmsession CHAR(32),
		artist VARCHAR(500),
		album VARCHAR(500),
		track VARCHAR(500),
		timestamp VARCHAR(20))`
	);

	let indices = [
		"CREATE INDEX discordlfm ON users(discordid, lastfmsession)",
		"CREATE INDEX lfmdiscord ON users(lastfmusername, discordid)",
		"CREATE INDEX server ON servers(serverid)",
		"CREATE INDEX artistindex ON scrobbles(artist)",
		"CREATE INDEX albumindex ON scrobbles(album)",
		"CREATE INDEX trackindex ON scrobbles(track)",
		"CREATE INDEX userindex ON scrobbles(lastfmsession)"
	]

	for (let index of indices) {
		await connection.execute(index)
		.catch((err) => {
			if (err.errno !== 1061) {
				throw err;
			}
		}); //dont throw if its because index exists
	}

	await connection.end();

	process.exit();
}

main().catch((err) => console.error(err));