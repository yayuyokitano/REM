import Command from "../../discord/command";

export default class SetTimezone extends Command {
	category = "User";
	description = "Sets the timezone of the user. Use a [tz database name](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)";
	usage = ["Asia/Kuala_Lumpur", "Asia/Tokyo"];
	alias = ["timezone"];

	async run(args:string) {

		try {
			new Date().toLocaleDateString("en", {timeZone: args});
		} catch(err) {
			throw "Invalid timezone. Please find your timezone [here](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) (Example: `Asia/Kuala_Lumpur`)";
		}

		await this.pool.execute("UPDATE users SET timezone = ? WHERE discordid = ?", [args, this.message.author.id]);

		this.reply(`set your timezone to \`${args}\`. Current time: ${this.getLocalizedTime(new Date(), args)}`);

	}
}
