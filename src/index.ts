import * as config from "./config.json";
import { Client } from "discord.js";
import CommandHandler from "./discord/commandHandler";
//import ReactionHandler from "./discord/reactionHandler";
import mysql from "mysql2/promise"

import hanzi from "hanzi";
hanzi.start();

import CacheService from "./database/cacheService";
import { exit } from "process";

const client = new Client();
const command = new CommandHandler();

const pool = mysql.createPool({
  host: config.mysql.host,
  user: config.mysql.user,
	password: config.mysql.password,
  database: config.mysql.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

let cacheService:CacheService;

client.on("ready", async() => {
	console.log(`Logged in as ${client.user.tag}!`);
	console.log(Number(new Date()));
	await command.initPool(pool).init();
	cacheService = new CacheService(pool);
	cacheService.startPeriodicCache(100000);
	console.log(client.guilds.cache.size + " servers");
});

client.on("message", async(msg) => {

	command.handle(msg);

	if (msg.content === "shut down rem" && msg.author.id === "196249128286552064") {
		await msg.reply("Rude, but ok. Bye!");
		client.destroy();
		cacheService.stopPeriodicCache();

		setTimeout(() => {
			exit();
		}, 30000);

	}
	
});

/*client.on("messageReactionAdd", async (reaction, user) => {
	// When we receive a reaction we check if the reaction is partial or not
	if (reaction.partial) {
		// If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
		try {
			await reaction.fetch();
		} catch (error) {
			console.error("Something went wrong when fetching the message: ", error);
			// Return as `reaction.message.author` may be undefined/null
			return;
		}
	}

	new ReactionHandler(reaction, user);
});*/

client.login(config.discord.token);