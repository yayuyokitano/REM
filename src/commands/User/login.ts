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
	progress:number;

	async run(args:string) {

		this.progress = 0;

		let [user] = await this.pool.execute("SELECT * FROM users WHERE discordid = ?", [this.message.author.id]);
		
		if ((user as any[]).length === 0) {
			await this.pool.execute("INSERT INTO users (discordid, lastcachetime) VALUES (?,?)", [this.message.author.id, 0]);
		}

		let token = await this.lastfm.auth.getToken();

		let embed = this.createLoginEmbed(user, token);
		
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
					await this.pool.execute("UPDATE users SET lastfmusername = ?, lastfmsession = ? WHERE discordid = ?", [session.name, session.key, this.message.author.id]);
					
					newEmbed = this.createLoginEmbed({lastfmusername: session.name});
					DM.edit(newEmbed);
					let scrobbleCacher = await new CacheService(this.pool).cacheIndividual(this.message.author.id, true);
					
					let messageUpdater = setInterval(async () => {
						DM.edit(this.createLoginEmbed({lastfmusername: session.name}));
					}, 1500);

					let hasErrored = false;
			
					scrobbleCacher.on("data", (data) => {
						this.progress = data.progress * 100;
					});
			
					scrobbleCacher.on("close", () => {
						clearInterval(messageUpdater);
						DM.edit(this.createLoginEmbed({lastfmusername: session.name}));
					});
					
					scrobbleCacher.on("error", () => {
						if (!hasErrored) {
							this.DM("An error occurred while caching, results may be inaccurate.");
							hasErrored = true;
						}
					});

					break;
			}

		});

		collector.on("end", async (collected) => {

			let [updatedUser] = await this.pool.execute("SELECT lastfmusername FROM users WHERE discordid = ?", [this.message.author.id]);

			let newEmbed = (this.createLoginEmbed(updatedUser, token))
				.setTitle("Login Expired")
				.setFooter("Call login command again to login if there are more accounts to log in to.");

			DM.edit(newEmbed);
		});
		



	}

	generateTokenURL(token:string) {
		return `https://www.last.fm/api/auth?api_key=${config.lastfm.key}&token=${token}`;
	}

	createLoginEmbed(user, token?:string) {

		if (user[0]) {
			user = user[0];
		}

		let embed = this.initEmbed();
		embed.setTitle("Login to the bot")
			.setDescription("To log into services, click the links, and go through the corresponding verification process.")
			.setFooter("Logins will expire in 10 minutes.");
		
		if (user.lastfmusername) {
			embed.addField(`${this.constructEmoji("lastfm", "814628341100707851")} Last.FM`, `:white_check_mark: Logged in as ${user.lastfmusername}. Caching: ${Math.round(this.progress)}%`);
		} else {
			embed.addField(`${this.constructEmoji("lastfm", "814628341100707851")} Last.FM`, `[Click here](${this.generateTokenURL(token)}) then **after logging in click the lastfm reaction on this message.**`);
		}
			
		return embed;
	}

}