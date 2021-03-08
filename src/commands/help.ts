import Command from "../discord/command";
import CommandHandler from "../discord/commandHandler";
import { MessageEmbed } from "discord.js";
import CommandListing from "../discord/commandListing";
import { capitalCase } from "capital-case";

export default class Help extends Command {

	category = "Other";
	description = "Shows a list of commands, or, if followed by a command, detailed help for that command.";
	usage = ["", "<command name>"];

	async run(args:string) {
		let embed = this.initEmbed();
		
		const [command] = args.split(/\s+/);

		if (command === "") {

			const commandList = (await new CommandHandler().init()).listGroup();
			embed.setTitle("Command List");
			for (let [key, value] of Object.entries(commandList)) {
				if (key !== "Secret Commands"){
					embed.addField(key, value.join(", "));
				}
			}

		} else {

			const commandList = (await new CommandHandler().init()).getCommandList();
			if (commandList.hasOwnProperty(command)) {
				embed = await this.createHelpEmbed(embed, commandList[command]);
			} else {
				embed = embed.setTitle(`Could not find command ${command}!`)
					.setDescription(`Do "${await this.getPrefix()}help" to get a list of commands.`);
			}

		}
		
		this.reply(embed);
	}

	async createHelpEmbed(embed:MessageEmbed, CommandClass:CommandListing) {
		const command = new CommandClass.command();
		embed.setTitle(capitalCase(command.name))
			.setDescription(command.description);

		if (command.alias) {
			embed.addField("Alias", command.alias.join(", "));
		}

		let prefix = await this.getPrefix();

		embed.addField("Examples", "`" + 
			command.usage.map((args:string) => `${prefix}${command.name.toLowerCase()}${args ? ` ${args}` : ""}`)
				.join("`\n`")
			+ "`");

		return embed;
	}

}