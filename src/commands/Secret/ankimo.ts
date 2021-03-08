import Command from "../../discord/command";
import randomInt from "random-int";

const lines = ["I need you and could we know sad crew's check","'Til my knuckle worries coming","Mayor's tree sit and Nameless knight","came on a minute Rolling can use","Shook up and encode saint","I thought your paying up near more market's knives","or rail at northern star's kind what core aches are under","Took you cokes and we stand this joke","So calm need you catch by your many young yells","Come in"," get on our course Ray tight sign","Need it or sound it to be cool well paradise","Ark goes garage No darjeeling sucked god","Foot our hair Tone arms win law","Say naiad I got crusade","Named rains mean a real works weren't game night","Early year kegger tonight The queen zooms not sad","Gain this not fool"," unwise hits"," your right","Women's talking why you may got mirror end of sad","Sick covered nail wants called Wednesday"];

export default class Ankimo extends Command {

	category = "Secret Commands";
	description = "Replies a random lyric from Unlucky Morpheus' legendarily written song \"Took You Cokes And We Stand This Joke\"";
	usage = [""];

	async run(args:string) {
		this.reply(lines[randomInt(lines.length - 1)]);
	}

}