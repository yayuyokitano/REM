import * as config from "./config.json";
import { Client } from "discord.js";
import CommandHandler from "./discord/commandHandler";
//import ReactionHandler from "./discord/reactionHandler";

//initialize hanzi package for chinese commands
import hanzi from "hanzi";
hanzi.start();

const client = new Client();
const command = new CommandHandler();

client.on("ready", async() => {
	console.log(`Logged in as ${client.user.tag}!`);
	await command.init();
});

client.on("message", (msg) => {
	command.handle(msg);
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