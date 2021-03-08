import Command from "../../discord/command";
import { evaluate } from "mathjs";
import * as currency from "../../helpers/currencies";

export default class Evaluate extends Command {

	category = "Math";
	description = "Evaluates a math expression or converts currency and units.\n**Technical note:** This does not use javascript's `eval()` function.";
	alias = ["eval", "calculate", "calc", "solve"];
	strongAlias = ["convert"];
	usage = ["2+2", "sqrt(3^2 + 4^2)", "2 inches to cm", "2 USD to MYR"];

	async run(args:string) {

		if (!args) {
			this.reply("please enter an expression to evaluate");
			return;
		}

		let reply:string;
		try {
			reply = evaluate(args);
		} catch(err) {
			const amount = parseFloat(args.slice(args.search(/[0-9]/))) || 1;
			const input = args.replace(/[0-9]/g, "").toLowerCase();

			if (input.includes(" to ")) {
				const [base, symbols] = input.split(" to ").map((e) => currency.input[e.toLowerCase().replace(/\s+/g, " ").trim()]);

				reply = await this.getCurrency(amount, base, symbols);

				const inputCurrency = amount === 1 ? currency.output[base].singular : currency.output[base].plural;
				args = `${amount.toString()} ${inputCurrency}`;

			} else {
				throw err;
			}

		}

		this.reply(`${args} -> ${reply}`);
	}

	async getCurrency(amount:number, base:string, symbols:string) {

		const conversionData = await this.sendGetRequest("https://api.exchangeratesapi.io/latest", {base, symbols});

		if (conversionData.error) {
			return `Error: ${conversionData.error}`;
		}

		const outputAmount = (conversionData.rates[symbols] * amount).toFixed(2);
		const outputCurrency = outputAmount === "1.00" ? currency.output[symbols].singular : currency.output[symbols].plural;

		return `${outputAmount} ${outputCurrency}`;
	}

}