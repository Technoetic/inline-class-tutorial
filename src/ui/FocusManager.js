export class FocusManager {
	focus(root, key) {
		if (!root || !key) return;
		queueMicrotask(() => {
			const escaped = globalThis.CSS?.escape
				? CSS.escape(key)
				: key.replaceAll('"', "");
			const target = root.querySelector(`[data-focus-key="${escaped}"]`);
			if (!target) return;
			if (
				!target.matches(
					"button, a, input, select, textarea, summary, [tabindex]",
				)
			)
				target.tabIndex = -1;
			target.focus({ preventScroll: true });
		});
	}
}
