import { Message, MessageEmbed, PermissionString } from "discord.js";
import { CommandConstructor, CommandList } from "./commandInterface";
import CommandListing from "./commandListing";
import mysql from "mysql2/promise";
import { ParsedUrlQueryInput, stringify } from "querystring";
import fetch from "node-fetch";
import pinyinTone from "pinyin-tone-convert";
import hanzi from "hanzi";
import parseDuration from "parse-duration";

interface durationObj {
	year?:number;
	month?:number;
	week?:number;
	day?:number;
	hour?:number;
	minute?:number;
	second?:number;
}

export default class Command {

	SECONDS = 1000
	MINUTES = 60 * this.SECONDS;
	
	name = this.constructor.name;
	alias:string[];
	strongAlias:string[];
	category:string;
	message:Message;
	log:string;
	pool:mysql.Pool;

	constructor(pool:mysql.Pool) {
		this.pool = pool;
	}

	init(msg:Message) {
		this.message = msg;
		this.log = "---------------------------------------\nTime: " + new Date().toISOString()
		+ "\nMessage ID: " + msg.id
		+ "\nMessage Content: " + msg.content + "\n";

		this.log += "\n\n-Running command.";

		return this;
	}

	async reply(content:string|MessageEmbed) {
		return await this.message.reply(content);
	}

	list(commandConstructor:CommandConstructor) {
		let returnObj:CommandList = {};
		returnObj[this.name.toLowerCase()] = new CommandListing(commandConstructor, false, this.category);

		for (let alias of this.alias || []) {
			returnObj[alias] = new CommandListing(commandConstructor, true, this.category);
		}

		for (let alias of this.strongAlias || []) {
			returnObj[alias] = new CommandListing(commandConstructor, false, this.category);
		}
		
		return returnObj;
	}

	checkPerms(permission:PermissionString){
		if (!this.message.guild.member(this.message.author.id).hasPermission(permission)) {
			throw `You must have \`${permission.toLowerCase()}\` permission to use this command.`;
		}
	}

	async sendGetRequest(baseURL:string, params:ParsedUrlQueryInput) {
		return await (await fetch(`${baseURL}?${stringify(params)}`)).json();
	}

	async sendGetRequestRaw(baseURL:string, params:ParsedUrlQueryInput) {
		return await (await fetch(`${baseURL}?${stringify(params)}`)).text();
	}

	async sendPostRequest(url:string, params:ParsedUrlQueryInput) {
		const paramString = stringify(params);
		return await (await fetch(url, {
			method: "POST",
			headers: {
				"Content-Length":  Buffer.byteLength(paramString).toString(),
				"Content-Type": "application/x-www-form-urlencoded"
			},
			body: paramString
		})).json();
	}

	async sendPostRequestRaw(url:string, params:ParsedUrlQueryInput) {
		const paramString = stringify(params);
		return await (await fetch(url, {
			method: "POST",
			headers: {
				"Content-Length":  Buffer.byteLength(paramString).toString(),
				"Content-Type": "application/x-www-form-urlencoded"
			},
			body: paramString
		})).text();
	}

	fetchName(discordid:string = undefined) {
		const member = this.message.guild?.member(discordid ?? this.message.author);
		return member?.nickname || member?.user?.username || this.message.author.username;
	}

	initEmbed(override = "") {
		const member = this.message.guild?.member(this.message.author);
		const nickname = this.fetchName();
		const str = override.replace("{nickname}", nickname) || nickname;
		return new MessageEmbed()
			.setColor(member?.displayColor || "#AE52D4")
			.setAuthor(str, this.message.author.avatarURL());
	}

	async getPrefix() {
		let [pre] = await this.pool.execute("SELECT prefix FROM servers WHERE serverid = ?", [this.message.guild.id]);
		return pre?.[0]?.prefix as string;
	}

	pinyinify(text:string) {
		const pinyinPunctuation = {
			"。": ".",
			".": ".",
			"，": ",",
			",": ",",
			"“": "\"",
			"”": "\"",
			"\"": "\"",
			"：": ":"
		};
		return pinyinTone(
			(hanzi.segment(text) as string[])
				.map((e) => {
					if (pinyinPunctuation.hasOwnProperty(e)) {
						return pinyinPunctuation[e];
					}
					const rVal = hanzi.definitionLookup(e)?.[0].pinyin.split(/\s+/).join("");
					return rVal ? " " + rVal : e;
				})
				.join("")
				.trim()
			, {allowAnyChar: true}
		);
	}

	async DM(content:string|MessageEmbed) {
		return await this.message.author.send(content);
	}

	constructEmoji(name:string, id:string) {
		return `<:${name}:${id}>`;
	}

	getRelevantUser(params:{lfm?:boolean} = {}) {

		let mention = this.message.mentions.users.keyArray();

		if (params.hasOwnProperty("lfm")) {
			mention.push(...this.message.content.toLowerCase().split("lfm:").slice(1).map((e) => `lfm:${e.split(/\s+/g)[0]}`));
		}

		mention.push(this.message.author.id);

		return mention;

	}

	removeMentions(args:string) {
		return args.replace(/<@[0-9]+>/g, "");
	}

	pluralize(arg:[string, any]) {
		return arg[1] === 0 ? "" : `${arg[1]} ${arg[0]}${arg[1] !== 1 ? "s" : ""}`;
	}

	getUnixTime() {
		return Math.floor(Number(new Date()) / 1000);
	}

	getDuration(args:string):[number,string] {
    let duration = Math.round(parseDuration(args, "s"));
		
    if(duration === null || duration <= 0){
      return [0, ""];
    }
    
    let returnarr:[number, string] = [duration, ""];
    
    let durationObj:durationObj = {};
    
    durationObj.year = Math.floor(duration / 31557600);
    duration -= durationObj.year * 31557600;
    
    durationObj.month = Math.floor(duration / 2629800);
    duration -= durationObj.month * 2629800;
    
    durationObj.week = Math.floor(duration / 604800);
    duration -= durationObj.week * 604800;
    
    durationObj.day = Math.floor(duration / 86400);
    duration -= durationObj.day * 86400;
    
    durationObj.hour = Math.floor(duration / 3600);
    duration -= durationObj.hour * 3600;
    
    durationObj.minute = Math.floor(duration / 60);
    duration -= durationObj.minute * 60;
    
    durationObj.second = duration;

		let durationEntries = Object.entries(durationObj)
		let output = durationEntries.reduce((str, curr) => 
			curr[1] === 0 ? str : `${str}${str !== "" ? ", " : ""}${this.pluralize(curr)}`,
			this.pluralize(durationEntries.shift()));
    
    let outputArray = output.split(", ");
		if (outputArray.length > 1) {
			output = outputArray.slice(0,-1).join(", ") + " and " + outputArray.slice(-1);
		}
		returnarr[1] = output;
		
    return returnarr;
  }

	debugLog(args:string) {
		this.reply("```json\n" + args + "\n```");
		console.log(args);
	}

	getLocalizedTime(date:Date, timeZone:string) {
		return date.toLocaleDateString('en-AU', {
			timeZone,
			timeZoneName: 'short',
			minute: 'numeric',
			hour: 'numeric',
			weekday: 'short',
			day: 'numeric',
			year: 'numeric',
			month: 'short',
		});
	}

	async getTimezone() {
		return (await this.pool.execute("SELECT timezone FROM users WHERE discordid = ?", [this.message.author.id]))?.[0]?.[0]?.timezone ?? "Etc/UTC";
	}

	encodeURL(url:string) {
		return encodeURIComponent(url);
	}

}