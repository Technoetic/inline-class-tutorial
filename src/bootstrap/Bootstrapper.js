import { CompositionRoot } from "../app/CompositionRoot.js";
import { fatalTemplate } from "../ui/templates/index.js";

export class Bootstrapper {
	#document;

	constructor({ document = globalThis.document } = {}) {
		this.#document = document;
	}

	async start() {
		const root = this.#document?.querySelector("#app");
		if (!root) throw new Error("앱 루트를 찾을 수 없습니다.");
		let app = null;
		try {
			app = new CompositionRoot().create({ root });
			await app.init();
		} catch {
			if (app) await app.destroy();
			root.innerHTML = fatalTemplate();
		}
		return app;
	}
}
