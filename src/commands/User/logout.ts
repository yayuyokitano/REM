import { MessageEmbed } from "discord.js";
import CacheService from "../../database/cacheService";
import LastFMCommand from "../../helpers/lastfmCommand";

export default class Logout extends LastFMCommand {

	category = "User";
	description = "Logs user out of accounts.";
	usage = [""];

	async run(args:string) {

		let connection = await this.initDB();
		let [user] = await connection.execute("SELECT * FROM users WHERE discordid = ?", [this.message.author.id]);
		connection.end();

		let embed = await this.createLogoutEmbed(user);
		
		let publicEmbed = this.initEmbed();
		publicEmbed.setDescription("A DM has been sent to you regarding logging out of accounts.")
		this.reply(publicEmbed);
		let DM = await this.DM(embed);

		DM.react("814628341100707851");
		DM.react("✔️");

		const collector = DM.createReactionCollector((reaction, user) => user.id === this.message.author.id, {time: 10 * this.MINUTES});
		
		collector.on("collect", async (reaction) => {
			
			const {name} = reaction["_emoji"];
			let connection = await this.initDB();
			switch(name){
				case "lastfm":
					await new CacheService().clearIndividual(this.message.author.id);

					await connection.execute("UPDATE users SET lastfmsession = NULL, lastfmusername = NULL, lastcachetime = NULL WHERE discordid = ?", [this.message.author.id]);
					await connection.end();
					break;
				case "✔️":
					await new CacheService().clearIndividual(this.message.author.id);

					await connection.execute("DELETE FROM users WHERE discordid = ?", [this.message.author.id]);

			}

			let [updatedUser] = await connection.execute("SELECT lastfmusername FROM users WHERE discordid = ?", [this.message.author.id]);
			connection.end();

			let newEmbed = (await this.createLogoutEmbed(updatedUser))
				.setTitle("Logout Expired")
				.setFooter("Call logout command again to login if there are more accounts to log out of.");

			DM.edit(newEmbed);

		});

		collector.on("end", async (collected) => {

			let connection = await this.initDB();
			let [updatedUser] = await connection.execute("SELECT lastfmusername FROM users WHERE discordid = ?", [this.message.author.id]);
			connection.end();

			let newEmbed = (await this.createLogoutEmbed(updatedUser))
				.setTitle("Logout Expired")
				.setFooter("Call logout command again to login if there are more accounts to log out of.");

			DM.edit(newEmbed);
		});
		



	}

	async createLogoutEmbed (user) {

		if (user[0]) {
			user = user[0];
		}

		let embed = this.initEmbed();
		embed.setTitle("Log out of the bot")
			.setDescription("To log out of services, click the corresponding reaction. Click ✔️ to log out of the bot entirely.")
			.setFooter("Logouts will expire in 10 minutes.");

		if (user.length === 0) {
			embed.addField("Accounts", "You are already completely logged out of the bot!");
			return embed;
		}
		
		if (user.lastfmusername) {
			embed.addField(`${this.constructEmoji("lastfm", "814628341100707851")} Last.FM`, `:white_check_mark: Logged in as ${user.lastfmusername}.`);
		} else {
			embed.addField(`${this.constructEmoji("lastfm", "814628341100707851")} Last.FM`, `Not logged in!`);
		}
			
		return embed;
	}

}