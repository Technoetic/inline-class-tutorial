import { footerTemplate, headerTemplate, whyDrawerTemplate } from "./chrome.js";
import {
	abilityChip,
	actionButton,
	escapeHtml,
	feedbackTemplate,
	glyph,
} from "./primitives.js";

function slotTemplate(slot) {
	if (slot.actionable) {
		return `<button class="slot slot--action" type="button" data-action="prepare-slot" data-slot-id="${escapeHtml(slot.id)}" data-focus-key="slot-${escapeHtml(slot.id)}"><span aria-hidden="true">${glyph(slot.icon)}</span><span>${escapeHtml(slot.label)}</span><small>자리 열기</small></button>`;
	}
	return `<div class="slot${slot.prepared ? " slot--ready" : ""}"><span aria-hidden="true">${glyph(slot.icon)}</span><span>${escapeHtml(slot.label)}</span><small>${slot.prepared ? "준비됨" : "대기"}</small></div>`;
}

function connectionTemplate(connection, viewModel) {
	const target =
		connection.target === "core" ? viewModel.core.name : viewModel.donor.name;
	if (connection.actionable) {
		return `<button class="connection connection--action" type="button" data-action="redirect" data-connection-id="${escapeHtml(connection.id)}" data-focus-key="connection-${escapeHtml(connection.id)}"><span>${escapeHtml(connection.source)}</span><span aria-hidden="true">→</span><span>${escapeHtml(target)}</span><small>연결 돌리기</small></button>`;
	}
	return `<div class="connection${connection.target === "core" ? " connection--safe" : ""}"><span>${escapeHtml(connection.source)}</span><span aria-hidden="true">→</span><span>${escapeHtml(target)}</span></div>`;
}

function clueTemplate(clue) {
	return `<button class="clue" type="button" data-action="select-rationale" data-clue-id="${escapeHtml(clue.id)}" data-focus-key="clue-${escapeHtml(clue.id)}">${escapeHtml(clue.label)}</button>`;
}

function gaugeTemplate(gauge) {
	return `<li><span>${escapeHtml(gauge.label)}</span><strong><i aria-hidden="true"></i>${escapeHtml(gauge.value)}</strong></li>`;
}

function vesselTemplate({ vessel, kind, slots = "" }) {
	const isCore = kind === "core";
	const titleId = isCore ? "core-title" : "donor-title";
	const label = isCore ? "주 선체" : "보조 캡슐";
	const mark = isCore ? "◆" : "◇";
	const owner = isCore ? "주 선체" : "캡슐";
	const abilities = vessel.abilities.length
		? vessel.abilities.map((ability) => abilityChip(ability, owner)).join("")
		: '<p class="empty-state">남은 능력 0 · 빈 껍데기</p>';
	const futureMission = vessel.futureMission
		? `<div class="future-mission" data-focus-key="future-mission"><span aria-hidden="true">✦</span><div><small>미래 임무</small><strong>${escapeHtml(vessel.futureMission)}</strong></div></div>`
		: "";
	return `<article class="vessel vessel--${kind}" aria-labelledby="${titleId}">
              <div class="vessel__heading"><span class="vessel__mark" aria-hidden="true">${mark}</span><div><p>${label}</p><h2 id="${titleId}">${escapeHtml(vessel.name)}</h2><small>${escapeHtml(vessel.subtitle)}</small></div></div>
              <div class="ability-list" aria-label="${label} 능력">${abilities}</div>
              ${slots}${futureMission}
            </article>`;
}

function workspaceTemplate(viewModel) {
	const slots = viewModel.core.slots.map(slotTemplate).join("");
	const slotGrid = slots
		? `<div class="slot-grid" aria-label="받을 슬롯">${slots}</div>`
		: "";
	return `<section class="workspace" data-effect-target>
            ${vesselTemplate({ vessel: viewModel.core, kind: "core", slots: slotGrid })}
            <div class="transfer-lane" aria-hidden="true"><span>·</span><span>·</span><b>→</b><span>·</span><span>·</span></div>
            ${vesselTemplate({ vessel: viewModel.donor, kind: "donor" })}
          </section>`;
}

function connectionPanelTemplate(viewModel) {
	const connections = viewModel.connections
		.map((connection) => connectionTemplate(connection, viewModel))
		.join("");
	if (!connections) return "";
	return `<section class="connection-panel" aria-labelledby="connection-title"><div class="section-title"><p class="eyebrow">외부 연결</p><h2 id="connection-title">누가 캡슐을 찾고 있나요?</h2></div><div class="connection-list">${connections}</div></section>`;
}

function controlDeckTemplate(viewModel) {
	const clues = viewModel.rationaleClues
		.filter((clue) => clue.actionable)
		.map(clueTemplate)
		.join("");
	const gauges = viewModel.core.gauges.map(gaugeTemplate).join("");
	const baseline = viewModel.baselineGauges
		? '<span class="baseline-badge">안전 기준 저장됨</span>'
		: '<span class="baseline-badge baseline-badge--empty">기준 미기록</span>';
	const undo = viewModel.canUndo
		? '<button class="button button--quiet" type="button" data-action="undo" data-focus-key="undo">한 단계 되돌리기</button>'
		: "";
	return `<section class="control-deck" aria-labelledby="control-title">
            <div class="section-title"><p class="eyebrow">현재 단계</p><h2 id="control-title">${escapeHtml(viewModel.phaseLabel)}</h2></div>
            <div class="gauge-panel"><div class="gauge-panel__heading"><strong>구조 계기</strong>${baseline}</div><ul>${gauges}</ul></div>
            ${clues ? `<div class="clue-grid" data-focus-key="rationale">${clues}</div>` : ""}
            <div class="action-row" data-focus-key="${escapeHtml(viewModel.phase)}">${viewModel.actions.map(actionButton).join("")}${undo}</div>
			<button class="button button--quiet why-trigger" type="button" data-action="toggle-why" aria-expanded="false" aria-controls="why-drawer">왜 이 순서일까요?</button>
			${feedbackTemplate(viewModel.feedback)}
		  </section>`;
}

export function missionTemplate(viewModel, meta) {
	const progressValue =
		meta.completedMain + (viewModel.kind === "tutorial" ? 0 : 1);
	const missionLabel =
		viewModel.kind === "tutorial"
			? "조작 훈련"
			: `본 미션 ${meta.missionNumber} / ${meta.totalMain}`;
	return `<div class="game-shell">
        ${headerTemplate(meta, progressValue)}
        <main class="mission" id="mission-main">
          <section class="mission-heading" aria-labelledby="mission-title">
            <div><p class="eyebrow">${escapeHtml(missionLabel)}</p><h1 id="mission-title">${escapeHtml(viewModel.title)}</h1></div>
            <div class="step-badge"><span>${viewModel.stepIndex}</span><small>/ ${viewModel.stepTotal}</small></div>
            <p>${escapeHtml(viewModel.objective)}</p>
          </section>
          ${workspaceTemplate(viewModel)}
          ${connectionPanelTemplate(viewModel)}
          ${controlDeckTemplate(viewModel)}
		</main>
		${footerTemplate()}
		${whyDrawerTemplate(viewModel.why)}
	  </div>`;
}
