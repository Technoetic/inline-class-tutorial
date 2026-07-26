import { escapeHtml } from "./primitives.js";

export function appRootTemplate() {
	return `<div data-scene-host></div><div class="sr-only" aria-live="polite" aria-atomic="true" data-status-announcer></div>
    <div class="sr-only" role="alert" aria-atomic="true" data-alert-announcer></div>`;
}

export function headerTemplate(meta, progressValue) {
	const completed = Math.min(meta.completedMain, meta.totalMain);
	const progress = Math.min(progressValue, meta.totalMain);
	return `<header class="topbar"><a class="skip-link" href="#mission-main">작전 구역으로 건너뛰기</a><div class="brand"><span aria-hidden="true">◆</span><strong>코어 구조대</strong></div><div class="mission-progress"><span>본 미션 ${completed} / ${meta.totalMain}</span><progress max="${meta.totalMain}" value="${progress}">${progress} / ${meta.totalMain}</progress></div><div class="score-readout"><span>구조 점수</span><strong>${meta.sessionScore}</strong></div></header>`;
}

export function footerTemplate() {
	return `<footer class="app-footer"><span>작은 단계 · 같은 결과 · 빈 껍데기 회수</span><span>CORE RESCUE / 01</span></footer>`;
}

export function whyDrawerTemplate(why) {
	return `<button class="why-backdrop" type="button" data-action="close-why" aria-label="설명 닫기" hidden></button>
		<aside class="why-drawer" id="why-drawer" aria-labelledby="why-title" hidden>
		  <header><div><p class="eyebrow">현재 단계 설명</p><h2 id="why-title">왜 이 순서일까요?</h2></div><button class="button button--quiet" type="button" data-action="close-why" data-focus-key="close-why">닫기</button></header>
		  <div class="why-drawer__clue" aria-hidden="true">◇ → ◆</div>
		  <p>${escapeHtml(why)}</p>
		</aside>`;
}
