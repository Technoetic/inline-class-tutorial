export class AnimationController {
	#motionPreference;

	constructor({ motionPreference }) {
		this.#motionPreference = motionPreference;
	}

	play(element, effect) {
		if (
			!element ||
			this.#motionPreference.reduced ||
			!effect ||
			effect === "none"
		)
			return;
		element.dataset.effect = effect;
		element.addEventListener(
			"animationend",
			() => {
				delete element.dataset.effect;
			},
			{ once: true },
		);
	}
}
