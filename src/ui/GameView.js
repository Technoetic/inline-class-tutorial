import {
	appRootTemplate,
	completeTemplate,
	fatalTemplate,
	finalTemplate,
	launchTemplate,
	missionTemplate,
	resultTemplate,
} from "./templates/index.js";

export class GameView {
	#root;
	#focusManager;
	#announcer;
	#animationController;
	#handler = null;
	#clickHandler;
	#keydownHandler;
	#sceneHost = null;
	#whyTrigger = null;

	constructor({ root, focusManager, announcer, animationController }) {
		if (!root) throw new Error("앱을 표시할 루트가 필요합니다.");
		this.#root = root;
		this.#focusManager = focusManager;
		this.#announcer = announcer;
		this.#animationController = animationController;
		this.#clickHandler = (event) => {
			const control = event.target.closest("[data-action]");
			if (!control || !this.#root.contains(control)) return;
			if (control.dataset.action === "toggle-why") {
				this.#openWhy(control);
				return;
			}
			if (control.dataset.action === "close-why") {
				this.#closeWhy();
				return;
			}
			if (!this.#handler) return;
			Promise.resolve(
				this.#handler({ action: control.dataset.action, ...control.dataset }),
			).catch(() => this.renderFatal());
		};
		this.#keydownHandler = (event) => {
			const drawer = this.#root.querySelector("#why-drawer:not([hidden])");
			if (!drawer) return;
			if (event.key === "Escape") {
				event.preventDefault();
				this.#closeWhy();
				return;
			}
			if (event.key !== "Tab") return;
			const controls = [
				...drawer.querySelectorAll("button, [href], [tabindex]"),
			];
			const first = controls[0];
			const last = controls.at(-1);
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last?.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first?.focus();
			}
		};
	}

	async init() {
		this.#root.innerHTML = appRootTemplate();
		this.#sceneHost = this.#root.querySelector("[data-scene-host]");
		this.#announcer.connect({
			statusNode: this.#root.querySelector("[data-status-announcer]"),
			alertNode: this.#root.querySelector("[data-alert-announcer]"),
		});
		this.#root.addEventListener("click", this.#clickHandler);
		this.#root.addEventListener("keydown", this.#keydownHandler);
	}

	bind(handler) {
		this.#handler = handler;
	}

	renderLaunch(progress) {
		this.#commit(launchTemplate(progress), { focusKey: "start" });
	}

	renderMission(viewModel, meta) {
		this.#commit(missionTemplate(viewModel, meta), {
			focusKey: viewModel.focusKey,
			feedback: viewModel.feedback,
			effect: meta.effect,
		});
	}

	renderResult(viewModel, meta) {
		this.#commit(resultTemplate(viewModel, meta), {
			focusKey: "continue",
			feedback: viewModel.feedback,
			effect: "complete",
		});
	}

	renderFinal(challenge, meta) {
		this.#commit(finalTemplate(challenge, meta), {
			focusKey: meta.focusKey ?? `choice-${challenge.choices[0].id}`,
			feedback: meta.feedback,
		});
	}

	renderComplete(meta) {
		this.#commit(completeTemplate(meta), {
			focusKey: "restart",
			feedback: {
				message: "모든 구조 작전을 완료했어요.",
				severity: "status",
			},
			effect: "complete",
		});
	}

	renderFatal() {
		this.#commit(fatalTemplate());
	}

	async destroy() {
		this.#root.removeEventListener("click", this.#clickHandler);
		this.#root.removeEventListener("keydown", this.#keydownHandler);
		this.#handler = null;
	}

	#openWhy(trigger) {
		const drawer = this.#root.querySelector("#why-drawer");
		const backdrop = this.#root.querySelector(".why-backdrop");
		if (!drawer || !backdrop) return;
		this.#whyTrigger = trigger;
		trigger.setAttribute("aria-expanded", "true");
		drawer.hidden = false;
		backdrop.hidden = false;
		drawer.querySelector("[data-action='close-why']")?.focus();
	}

	#closeWhy() {
		const drawer = this.#root.querySelector("#why-drawer");
		const backdrop = this.#root.querySelector(".why-backdrop");
		if (!drawer || !backdrop) return;
		drawer.hidden = true;
		backdrop.hidden = true;
		this.#whyTrigger?.setAttribute("aria-expanded", "false");
		this.#whyTrigger?.focus();
		this.#whyTrigger = null;
	}

	#commit(markup, { focusKey = null, feedback = null, effect = null } = {}) {
		if (!this.#sceneHost) throw new Error("GameView.init()이 필요합니다.");
		this.#sceneHost.innerHTML = markup;
		this.#announcer.announce(feedback);
		this.#focusManager.focus(this.#root, focusKey);
		this.#animationController.play(
			this.#sceneHost.querySelector("[data-effect-target]") ??
				this.#sceneHost.firstElementChild,
			effect,
		);
	}
}
