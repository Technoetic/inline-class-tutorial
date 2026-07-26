export class MotionPreference {
	#query;
	#matchMedia;
	#listeners = new Set();
	#handleChange;
	#documentElement;

	constructor({
		matchMedia = globalThis.matchMedia?.bind(globalThis),
		documentElement = globalThis.document?.documentElement,
	} = {}) {
		this.#query = null;
		this.#matchMedia = matchMedia;
		this.#documentElement = documentElement;
		this.#handleChange = () => {
			this.#syncDataset();
			for (const listener of this.#listeners) listener(this.reduced);
		};
	}

	get reduced() {
		return Boolean(this.#query?.matches);
	}

	async init() {
		try {
			this.#query =
				this.#matchMedia?.("(prefers-reduced-motion: reduce)") ?? null;
		} catch {
			this.#query = null;
		}
		this.#syncDataset();
		this.#query?.addEventListener?.("change", this.#handleChange);
		return this;
	}

	subscribe(listener) {
		this.#listeners.add(listener);
		return () => this.#listeners.delete(listener);
	}

	async destroy() {
		this.#query?.removeEventListener?.("change", this.#handleChange);
		this.#listeners.clear();
	}

	#syncDataset() {
		if (this.#documentElement) {
			this.#documentElement.dataset.motion = this.reduced ? "reduced" : "full";
		}
	}
}
