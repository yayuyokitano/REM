import { Message, MessageEmbed } from "discord.js";
import mysql from "mysql2/promise";
import config from "../config.json";
import {promisify} from "util";
import _glob from "glob";
import * as path from "path";
import {CommandList, CommandConstructor} from "./commandInterface";

const glob = promisify(_glob);

interface CommandNameList {
	[key:string]:string[];
}

export default class CommandHandler {

	connection:mysql.Connection;
	files:string[];
	CommandList:CommandList;

	async init() {
		const { host, user, password, database } = config.mysql;
		// create the connection
		this.connection = await mysql.createConnection({host, user, password});
		this.connection.query(`USE ${database}`);

		this.CommandList = {};

		this.files = await glob(
			path.dirname(require.main?.filename) + "/commands/**/*.js"
		);

		for (let file of this.files) {
			let CurCommand = require(file).default as CommandConstructor;
			this.CommandList = {...(this.CommandList), ...((new CurCommand()).list(CurCommand))} as any;
		}

		return this;

	}

	getCommandList() {
		return this.CommandList;
	}

	async handle(message:Message) {

		let [command, args] = await this.parseCommand(message);

		if (command !== undefined) {
			this.execute(command, args, message);
		}

	}

	async parseCommand(message:Message) {

		let prefix = await this.getPrefix(message);
		let prefixLen = prefix.length;

		if (message.content.startsWith(prefix)) {
			let x = message.content.slice(prefixLen).split(" ");
			return [x.shift(), x.join(" ")];
		}

		return [undefined, undefined];
		
	}

	async getPrefix(message:Message) {
		let prefix:string;
		
		if (message.channel.type === "dm") {
			prefix = "!rem";
		} else {
			let [pre] = await this.connection.execute("SELECT prefix FROM servers WHERE serverid = ?", [message.guild.id]);
			prefix = pre?.[0]?.prefix;
	
			if (prefix === undefined) {
				await this.connection.execute("INSERT INTO servers (serverid, prefix) VALUES (?,?)", [message.guild.id, "!rem"]);
				prefix = "!rem";
			}
		}

		return prefix;
		
	}

	fetchName(msg:Message) {
		const member = msg.guild?.member(msg.author);
		return member?.nickname || member?.user?.username || msg.author.username;
	}

	initEmbed(msg:Message) {
		const member = msg.guild?.member(msg.author);
		const nickname = this.fetchName(msg);
		return new MessageEmbed()
			.setColor(member?.displayColor || "#AE52D4")
			.setAuthor(nickname, msg.author.avatarURL())
			.setDescription("There was an error executing your command.");
	}

	async execute(command:string, args:string, msg:Message) {
		if (this.CommandList.hasOwnProperty(command)) {
			let cmd = new this.CommandList[command].command()
			cmd.init(msg).run(args).catch(async (err) => {
				console.log(err);
				let embed = this.initEmbed(msg)
					.addField("Error details", err);
				msg.reply(embed);
				cmd.log += "\nERROR: \n" + JSON.stringify(err) + "\n";
				console.error(cmd.log);
			});
		}
	}

	listGroup() {
		let rVal:CommandNameList = {};

		for (let key of Object.keys(this.CommandList)) {

			if (!this.CommandList[key].isAlias) {
				
				let category = this.CommandList[key].category;

				if (!rVal[category]) {
					rVal[category] = [];
				}

				rVal[category].push(key);

			}

		}

		return rVal;
	}

}