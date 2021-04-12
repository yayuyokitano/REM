const imageList = [
    "https://pbs.twimg.com/media/Eibg22QVgAAoeXk.jpg",
    "https://pbs.twimg.com/media/EiSbHKOUwAAjOyf.jpg",
    "https://pbs.twimg.com/media/Ehx3uJfUMAE9RuL.jpg",
    "https://pbs.twimg.com/media/EZ1Hp82UYAIl5LB.jpg",
    "https://pbs.twimg.com/media/EWDVnNHUcAUjetY.jpg",
    "https://pbs.twimg.com/media/EV5j8LAU8AAQVZx.jpg",
    "https://pbs.twimg.com/media/EV5j8LBU8AA2r4f.jpg",
    "https://pbs.twimg.com/media/EV5j8LEVAAAT1J1.jpg",
    "https://pbs.twimg.com/media/ESbKu63UYAAVK3E.jpg",
    "https://pbs.twimg.com/media/ESbKu63VAAA2wyI.jpg",
    "https://pbs.twimg.com/media/EQp5Ir7UcAA8kgQ.jpg",
    "https://pbs.twimg.com/media/ENrLsGcVUAACUJb.jpg",
    "https://pbs.twimg.com/media/EM9XI8LUEAAev7Y.jpg",
    "https://pbs.twimg.com/media/EM9XI8KUwAEeibL.jpg",
    "https://pbs.twimg.com/media/EbSWS-iUYAA86d4.jpg",
    "https://pbs.twimg.com/media/Eg51zbWUcAMeFk4.jpg",
    "https://pbs.twimg.com/media/Eg1SQjmUwAA0tHm.jpg",
    "https://pbs.twimg.com/media/Eg51zbVUcAALsjQ.jpg",
    "https://pbs.twimg.com/media/Ego6QHwU8AEXRJq.jpg",
    "https://pbs.twimg.com/media/Egg2V24VkAQ3ryr.jpg",
    "https://pbs.twimg.com/media/Egg2V2rUYAAwliO.jpg",
    "https://pbs.twimg.com/media/Ee5Oy1sVoAAQYZC.jpg",
    "https://pbs.twimg.com/media/EefVR1GU4AEI639.jpg",
    "https://pbs.twimg.com/media/EeVW5VfU0AERlUc.jpg",
    "https://pbs.twimg.com/media/EeRP_wjU8AETprF.jpg",
    "https://pbs.twimg.com/media/Ec4TTb7U4AMms9m.jpg",
    "https://pbs.twimg.com/media/Ehx3uJfUMAE9RuL.jpg",
    "https://pbs.twimg.com/media/EvsFu5pUUAED3pZ.jpg",
    "https://pbs.twimg.com/media/EvpaP56XUAEonZV.jpg",
    "https://pbs.twimg.com/media/EvpaP56WQAg09it.jpg",
    "https://pbs.twimg.com/media/EvZEOSnVIAIDP8P.jpg",
    "https://pbs.twimg.com/media/EvZCsiiVcAU9S3E.jpg",
    "https://pbs.twimg.com/media/Eu0dHQFUcAQ8nXK.jpg",
    "https://pbs.twimg.com/media/EujlpFXU4AAa_Hw.jpg",
    "https://pbs.twimg.com/media/EtsHhclVkAEzRuR.jpg",
    "https://pbs.twimg.com/media/Es0wEAzVEAoFpGA.jpg",
    "https://pbs.twimg.com/media/EsAZWgUW8AMDUGU.jpg",
    "https://pbs.twimg.com/media/EsAZWgXXUAIrCKE.jpg",
    "https://pbs.twimg.com/media/ErgwGOtVkAEQOUA.jpg",
    "https://pbs.twimg.com/media/ErgwGOgVEAEepz4.jpg",
    "https://pbs.twimg.com/media/EqzC-LsVkAAG7iL.jpg",
    "https://pbs.twimg.com/media/EqkzgRlVgAIHs19.jpg",
    "https://pbs.twimg.com/media/EpPpZxZVgAEtNlJ.jpg",
    "https://pbs.twimg.com/media/EpJ0SDvU0AIi8R7.jpg",
    "https://pbs.twimg.com/media/EpHsru0UwAU1Rjw.jpg",
    "https://pbs.twimg.com/media/EouTGv0VQAI2txk.jpg",
    "https://pbs.twimg.com/media/EoHscRoUYAArf0y.jpg",
    "https://pbs.twimg.com/media/Elk_pMuU4AAV36c.jpg",
    "https://pbs.twimg.com/media/EjK4jkwUMAAgRDc.jpg"
];

import Command from "../../discord/command";
import randomInt from "random-int";

export default class Hello extends Command {

	category = "Secret Commands";
  description = "Hi";
  alias = ["hi", "morning", "gm", "morn"];
	usage = [""];

	async run(args:string) {
		this.message.channel.send({files: [imageList[randomInt(imageList.length - 1)]]})
	}

}