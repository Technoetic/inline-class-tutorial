export class ScorePolicy {
	#completionPoints;
	#firstTryBonus;
	#noHintBonus;

	constructor({
		completionPoints = 100,
		firstTryBonus = 25,
		noHintBonus = 25,
	} = {}) {
		this.#completionPoints = completionPoints;
		this.#firstTryBonus = firstTryBonus;
		this.#noHintBonus = noHintBonus;
	}

	calculate({ attempts = 0, hintsUsed = 0 } = {}) {
		const score =
			this.#completionPoints +
			(attempts === 0 ? this.#firstTryBonus : 0) +
			(hintsUsed === 0 ? this.#noHintBonus : 0);
		return Number.isFinite(score) && score > 0 ? Math.floor(score) : 0;
	}
}
