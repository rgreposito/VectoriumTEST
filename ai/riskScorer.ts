/*
 Basic heuristic risk scorer. Not a real ML model; demonstrates AI integration surface.
 Inputs:
 - valueEth: number
 - txCountLast24h: number
 - hourOfDay: 0-23
 - toIsNew: boolean (first time interacting with destination)
 - isContractCall: boolean
*/

export type RiskInput = {
	valueEth: number;
	txCountLast24h: number;
	hourOfDay: number;
	toIsNew: boolean;
	isContractCall: boolean;
};

export type RiskOutput = {
	scoreLabel: "low" | "medium" | "high";
	scoreNumeric: 0 | 1 | 2;
	reasons: string[];
};

export function scoreRisk(input: RiskInput): RiskOutput {
	let risk = 0;
	const reasons: string[] = [];

	if (input.valueEth >= 5) {
		risk += 2; reasons.push("large value");
	} else if (input.valueEth >= 1) {
		risk += 1; reasons.push("moderate value");
	}

	if (input.txCountLast24h >= 20) { risk += 1; reasons.push("burst activity"); }
	if (input.hourOfDay < 6) { risk += 1; reasons.push("odd hour"); }
	if (input.toIsNew) { risk += 1; reasons.push("new destination"); }
	if (input.isContractCall) { risk += 1; reasons.push("contract call"); }

	let label: RiskOutput["scoreLabel"] = "low";
	let numeric: RiskOutput["scoreNumeric"] = 0;
	if (risk >= 3) { label = "high"; numeric = 2; }
	else if (risk >= 1) { label = "medium"; numeric = 1; }

	return { scoreLabel: label, scoreNumeric: numeric, reasons };
}

// simple CLI
if (require.main === module) {
	const args = process.argv.slice(2);
	const get = (flag: string, def?: string) => {
		const idx = args.indexOf(flag);
		return idx >= 0 ? args[idx + 1] : def;
	};
	const input: RiskInput = {
		valueEth: Number(get("--value", "0")),
		txCountLast24h: Number(get("--txCount", "0")),
		hourOfDay: Number(get("--hour", "12")),
		toIsNew: (get("--toNew", "false") === "true"),
		isContractCall: (get("--contract", "false") === "true"),
	};
	const out = scoreRisk(input);
	console.log(JSON.stringify(out, null, 2));
}

