export class StatusAnnouncer {
	#statusNode = null;
	#alertNode = null;

	connect({ statusNode, alertNode }) {
		this.#statusNode = statusNode;
		this.#alertNode = alertNode;
	}

	announce(feedback) {
		if (!feedback?.message) return;
		const target =
			feedback.severity === "warning" ? this.#alertNode : this.#statusNode;
		if (!target) return;
		target.textContent = "";
		queueMicrotask(() => {
			target.textContent = feedback.message;
		});
	}
}
