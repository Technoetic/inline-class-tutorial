export class GameApp {
	#catalog;
	#progressStore;
	#motionPreference;
	#view;
	#controller;

	constructor({ catalog, progressStore, motionPreference, view, controller }) {
		this.#catalog = catalog;
		this.#progressStore = progressStore;
		this.#motionPreference = motionPreference;
		this.#view = view;
		this.#controller = controller;
	}

	async init() {
		const [, progress] = await Promise.all([
			this.#catalog.init(),
			this.#progressStore.init(),
			this.#motionPreference.init(),
			this.#view.init(),
		]);
		await this.#controller.init(progress);
	}

	async destroy() {
		await Promise.allSettled([
			this.#motionPreference.destroy(),
			this.#view.destroy(),
		]);
	}
}
