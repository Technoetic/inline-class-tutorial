const iconGlyphs = {
	air: "◌",
	display: "▣",
	power: "◆",
	pulse: "◎",
	route: "⌁",
	scan: "◇",
	seed: "✦",
	signal: "◉",
};

export function escapeHtml(value) {
	return String(value ?? "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

export function glyph(icon) {
	return iconGlyphs[icon] ?? "◇";
}

export function actionButton(action) {
	const valueAttribute = action.value
		? ` data-value="${escapeHtml(action.value)}"`
		: "";
	const focusKey = action.focusKey ?? action.action;
	return `<button class="button button--${escapeHtml(action.tone ?? "secondary")}" type="button" data-action="${escapeHtml(action.action)}"${valueAttribute} data-focus-key="${escapeHtml(focusKey)}">${escapeHtml(action.label)}</button>`;
}

export function abilityChip(ability, owner) {
	const element = ability.actionable ? "button" : "span";
	const attributes = ability.actionable
		? ` type="button" data-action="move-ability" data-ability-id="${escapeHtml(ability.id)}" data-focus-key="ability-${escapeHtml(ability.id)}"`
		: "";
	return `<${element} class="ability-chip${ability.actionable ? " ability-chip--action" : ""}"${attributes}>
    <span class="ability-chip__icon" aria-hidden="true">${glyph(ability.icon)}</span>
    <span>${escapeHtml(ability.label)}</span>
    <span class="ability-chip__owner">${escapeHtml(owner)}</span>
  </${element}>`;
}

export function feedbackTemplate(feedback) {
	if (!feedback) return "";
	return `<p class="feedback feedback--${escapeHtml(feedback.severity)}">${escapeHtml(feedback.message)}</p>`;
}

export function scoreCardTemplate(metrics) {
	return `<dl class="score-card">${metrics
		.map(
			(metric) =>
				`<div><dt>${escapeHtml(metric.label)}</dt><dd>${escapeHtml(metric.value)}</dd></div>`,
		)
		.join("")}</dl>`;
}
