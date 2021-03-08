import { MessageEmbed } from "discord.js";
import { getSession } from "lastfm-typed/dist/interfaces/authInterface";
import config from "../../config.json";
import CacheService from "../../database/cacheService";
import LastFMCommand from "../../helpers/lastfmCommand";

interface StringObject {
	[key:string]:string;
}

export default class Login extends LastFMCommand {

	category = "User";
	description = "Logs user in to accounts.";
	usage = [""];
	token:string;

	async run(args:string) {

		let connection = await this.initDB();
		let [user] = await connection.execute("SELECT * FROM users WHERE discordid = ?", [this.message.author.id]);
		
		if ((user as any[]).length === 0) {
			await connection.execute("INSERT INTO users (discordid, lastcachetime) VALUES (?,?)", [this.message.author.id, 0]);
		}
		connection.end();

		let token = await this.lastfm.auth.getToken();

		let embed = await this.createLoginEmbed(user, token);
		
		let DM = await this.DM(embed);

		let publicEmbed = this.initEmbed();
		publicEmbed.setDescription("A DM has been sent to you regarding logging into accounts.")
		this.reply(publicEmbed);

		DM.react("814628341100707851");

		const collector = DM.createReactionCollector((reaction, user) => user.id === this.message.author.id, {time: 10 * this.MINUTES});
		
		collector.on("collect", async (reaction) => {
			
			const {name} = reaction["_emoji"];
			let newEmbed:MessageEmbed;
			switch(name){
				case "lastfm":
					let session:getSession;
					try {
						session = await this.lastfm.auth.getSession(token);
					} catch(err) {
						console.log(err);
						session = {key:undefined, name:undefined, subscriber:undefined};
					}
					
					if (typeof session.key === "undefined") {
						this.DM("Last.FM verification unsuccessful. Please try again.");
						break;
					}
					let connection = await this.initDB();
					await connection.execute("UPDATE users SET lastfmusername = ?, lastfmsession = ? WHERE discordid = ?", [session.name, session.key, this.message.author.id]);
					connection.end();
					
					newEmbed = await this.createLoginEmbed({lastfmusername: session.name});
					DM.edit(newEmbed);
					await new CacheService().cacheIndividual(this.message.author.id);
					break;
			}

		});

		collector.on("end", async (collected) => {

			let connection = await this.initDB();
			let [updatedUser] = await connection.execute("SELECT lastfmusername FROM users WHERE discordid = ?", [this.message.author.id]);
			connection.end();

			let newEmbed = (await this.createLoginEmbed(updatedUser, token))
				.setTitle("Login Expired")
				.setFooter("Call login command again to login if there are more accounts to log in to.");

			DM.edit(newEmbed);
		});
		



	}

	generateTokenURL(token:string) {
		return `https://www.last.fm/api/auth?api_key=${config.lastfm.key}&token=${token}`;
	}

	async createLoginEmbed(user, token?:string) {

		if (user[0]) {
			user = user[0];
		}

		let embed = this.initEmbed();
		embed.setTitle("Login to the bot")
			.setDescription("To log into services, click the links, go through the verification process, and react with the corresponsing reaction.")
			.setFooter("Logins will expire in 10 minutes.");
		
		if (user.lastfmusername) {
			embed.addField(`${this.constructEmoji("lastfm", "814628341100707851")} Last.FM`, `:white_check_mark: Logged in as ${user.lastfmusername}. First caching may take some time, and results may be off until then.`);
		} else {
			embed.addField(`${this.constructEmoji("lastfm", "814628341100707851")} Last.FM`, `[Click here](${this.generateTokenURL(token)})`);
		}
			
		return embed;
	}

}