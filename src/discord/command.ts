import { Message, MessageEmbed, MessageEmbedOptions, PermissionString } from "discord.js";
import { CommandConstructor, CommandList } from "./commandInterface";
import CommandListing from "./commandListing";
import mysql from "mysql2/promise";
import { ParsedUrlQueryInput, stringify } from "querystring";
import fetch from "node-fetch";
import pinyinTone from "pinyin-tone-convert";
import hanzi from "hanzi";
import parseDuration from "parse-duration";
import CommandHandler from "./commandHandler";
import config from "../config.json";
import youtubeSearch from "youtube-search";
import { number } from "mathjs";

let opts = {
	maxResults: 1,
	key: config.other.youtube
}

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
	handler:CommandHandler;

	constructor(pool:mysql.Pool) {
		this.pool = pool;
	}

	init(msg:Message, handler:CommandHandler) {
		this.message = msg;
		this.log = "---------------------------------------\nTime: " + new Date().toISOString()
		+ "\nMessage ID: " + msg.id
		+ "\nMessage Content: " + msg.content + "\n";

		this.log += "\n\n-Running command.";

		this.handler = handler;

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
		return args.replace(/<@[!0-9]+>/g, "");
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

	setDescriptionOrFields(embed:MessageEmbed, message:MessageEmbedOptions|string) {
		if (typeof message === "string") {
			embed.setDescription(message);
		} else {
			for (let [key, value] of Object.entries(message)) {
				embed[key] = value;
			}
		}
		return embed;
	}

	async sendLegacyPaginatedMessage(embed:MessageEmbed, messageArray:(MessageEmbedOptions|string)[], entriesPerPage:number, totalEntries:number) {

		embed = this.setDescriptionOrFields(embed, messageArray[0]);

		embed.setFooter(`Showing ${1}-${Math.min(totalEntries, entriesPerPage)} of ${totalEntries} entries`);
		let page = 0;

		let reply = await this.reply(embed);

		if (messageArray.length === 1 || (messageArray.length === 2 && messageArray[1].toString().trim() === "")) {
			return;
		}

		let reactionArray = ["825611085541408788", "825611085700530216", "825611085772095498", "825611085913784350"];

		for (let emoji of reactionArray) {
			await reply.react(emoji);
		}
		
		const collector = reply.createReactionCollector((reaction) => reactionArray.includes(reaction.emoji.id), {time: 2 * this.MINUTES});

		collector.on("collect", async (reaction, user) => {
			switch (reaction.emoji.id) {
				case "825611085541408788":
					page = 0;
					break;
				case "825611085700530216":
					page = Math.max(0, page - 1);
					break;
				case "825611085772095498":
					page = Math.min(messageArray.length - 1, page + 1);
					break;
				case "825611085913784350":
					page = messageArray.length - 1;
					break;
			}

			await reaction.users.remove(user);

			embed = this.setDescriptionOrFields(embed, messageArray[page])
				.setFooter(`Showing ${entriesPerPage * page + 1}-${Math.min(totalEntries, entriesPerPage * (page + 1))} of ${totalEntries} entries`);
			reply.edit(embed);
		});

		collector.on("end", () => {
			reply.reactions.removeAll();
		});
	}

	formatTableNumber(num:number, len:number) {
		return num.toLocaleString("fr").padStart(len, " ");
	}

	clamp(min:number, num:number, max:number) {
		return Math.max(min, Math.min(num, max));
	}

	setPaginatedEmbedPage(embed:MessageEmbed, pageData:{description:string, page:{start:number, end:number}}[], page:number) {
		page = this.clamp(0, page, pageData.length - 1);
		embed.setDescription(pageData[page].description)
			.setFooter(`Showing ${pageData[page].page.start}-${pageData[page].page.end} of ${pageData.slice(-1)[0].page.end} entries`);
		return embed;
	}

	async sendPaginatedMessage(embed:MessageEmbed, tableProcessed:string[], maxPerPage:number, prefix:string) {

		let currPageCount = 0;
		const maxLength = 2000;

		let pageData:{description:string, page:{start:number, end:number}}[] = [];
		let prevPage:{description:string, page:{start:number, end:number}} = {
			description: "",
			page: {
				start: 0,
				end: 0
			}
		};
		let currDesc = prefix;

		for (let entry of tableProcessed) {
			if ((currDesc.length + entry.length) < maxLength && currPageCount < maxPerPage) {
				currPageCount++;
				currDesc += `${entry}\n`;
			} else {
				if (currPageCount <= 1) {
					currPageCount = 0;
					continue;
				}
				prevPage = {
					description: currDesc,
					page: {
						start: prevPage.page.end + 1,
						end: prevPage.page.end + currPageCount
					}
				}
				pageData.push(prevPage);
				currPageCount = 0;
				currDesc = prefix;
				if ((currDesc.length + entry.length) < maxLength) {
					currPageCount++;
					currDesc += `${entry}\n`;
				}
			}
		}
		pageData.push({
			description: currDesc,
			page: {
				start: prevPage.page.end + 1,
				end: prevPage.page.end + currPageCount
			}
		});
		

		let page = 0;
		embed = this.setPaginatedEmbedPage(embed, pageData, page);
		let reply = await this.reply(embed);

		if (pageData.length === 1 || (pageData.length === 2 && (pageData[1].description === "" || pageData[1].description === prefix))) {
			embed.setFooter("");
			return;
		}

		let reactionArray = ["825611085541408788", "825611085700530216", "825611085772095498", "825611085913784350"];

		for (let emoji of reactionArray) {
			await reply.react(emoji);
		}
		
		const collector = reply.createReactionCollector((reaction) => reactionArray.includes(reaction.emoji.id), {time: 5 * this.MINUTES});

		collector.on("collect", async (reaction, user) => {
			switch (reaction.emoji.id) {
				case "825611085541408788":
					page = 0;
					break;
				case "825611085700530216":
					page = Math.max(0, page - 1);
					break;
				case "825611085772095498":
					page = Math.min(pageData.length - 1, page + 1);
					break;
				case "825611085913784350":
					page = pageData.length - 1;
					break;
			}

			await reaction.users.remove(user);

			embed = this.setPaginatedEmbedPage(embed, pageData, page);
			reply.edit(embed);
		});

		collector.on("end", () => {
			reply.reactions.removeAll();
		});


	}

	createTableMessage(embed:MessageEmbed, tableArray:[number, string][], classifier:[string, string], prefix:string) {
		tableArray = tableArray.sort((a, b) => b[0] - a[0]);
		const len = tableArray[0][0].toLocaleString("fr").length;
		const tableProcessed = tableArray.map(e => `\`${this.formatTableNumber(e[0], len)}\` ${classifier[Number(e[0] !== 1)]} - ${e[1]}`);
		this.sendPaginatedMessage(embed, tableProcessed, 15, prefix);
	}

	getOrdinalNumber(num:number) {
		let numString = num.toString();
		if (numString.slice(-2, -1)[0] === "1") {
			return `${numString}th`;
		} else {
			switch (numString.slice(-1)[0]) {
				case "1":
					return `${numString}st`;
				case "2":
					return `${numString}nd`;
				case "3":
					return `${numString}rd`;
				default:
					return `${numString}th`;
			}
		}
	}

	getYTPlaylist(str:string) {
		return str.match(/(?:https|http):\/\/(?:www\.)?youtube\.com\/playlist\?list=(.*?)(?:$|\&)/)?.[1];
	}

	async getYTLink(str:string) {
		let link = "";
		if (str.match(/(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w\-_]+)\&?/)) {
			link = str;
		} else {
			const res = await youtubeSearch(str, opts);
			link = res.results[0].id;
		}
		this.handler.voiceConnections[this.message.guild.id].urls.push(link);
		return link;
	}

	URLToMarkdown(label:string, url:string) {
		return `[${label}](${url})`;
	}

	getArtistURL(artist:string) {
		return `https://www.last.fm/music/${this.encodeURL(artist)}`;
	}

	getArtistURLMarkdown(artist:string) {
		return this.URLToMarkdown(artist, this.getArtistURL(artist));
	}

	getAlbumURL(artist:string, album:string) {
		return `https://www.last.fm/music/${this.encodeURL(artist)}/${this.encodeURL(album)}`;
	}

	getAlbumURLMarkdown(artist:string, album:string) {
		return this.URLToMarkdown(album, this.getAlbumURL(artist, album));
	}

	getTrackURL(artist:string, track:string) {
		return `https://www.last.fm/music/${this.encodeURL(artist)}/_/${this.encodeURL(track)}`;
	}

	getTrackURLMarkdown(artist:string, track:string) {
		return this.URLToMarkdown(track, this.getTrackURL(artist, track));
	}

	getArtistAlbumMarkdown(artist:string, album:string) {
		return `by ${this.getArtistURLMarkdown(artist)}${album ? ` from ${this.getAlbumURLMarkdown(artist, album)}` : ""}`;
	}

	getArtistAlbumMarkdownSetURL(artist:string, album:string, artistURL:string, albumURL:string) {
		if (artistURL === void 0 || albumURL == void 0) {
			return this.getArtistAlbumMarkdown(artist, album);
		}
		return `by ${this.URLToMarkdown(artist, artistURL) || this.getArtistURL(artist)}${album ? ` from ${this.URLToMarkdown(album, albumURL) || this.getAlbumURL(artist, album)}` : ""}`;
	}

	getCombinedAlbumMarkdown(artist:string, album:string) {
		return `[${artist} - ${album}](${this.getAlbumURL(artist, album)})`;
	}

	getCombinedTrackMarkdown(artist:string, track:string) {
		return `[${artist} - ${track}](${this.getTrackURL(artist, track)})`;
	}

	fakeAddField(embed:MessageEmbed, name:string, field:string) {
		embed.description += `**${name}**\n${field}\n\n`;
		return embed;
	}

}