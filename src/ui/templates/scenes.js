import { footerTemplate, headerTemplate } from "./chrome.js";
import {
	escapeHtml,
	feedbackTemplate,
	scoreCardTemplate,
} from "./primitives.js";

export function launchTemplate(progress) {
	const completed = progress.completedMissionIds.length;
	return `<section class="launch-screen" aria-labelledby="launch-title">
        <div class="launch-screen__signal" aria-hidden="true"><span>◇</span><span>◇</span><span>◆</span></div>
        <p class="eyebrow">구조 통신 수신</p>
        <h1 id="launch-title">코어 구조대</h1>
        <p class="launch-screen__lead">흩어진 책임을 읽고, 안전한 순서로 빈 캡슐을 회수하세요.</p>
        <div class="launch-card">
          <p class="launch-card__label">복귀 기록</p>
          <strong>${completed} / 4 본 미션</strong>
          <p>최고 구조 점수 ${progress.bestScore}</p>
        </div>
        <button class="button button--primary button--large" type="button" data-action="start" data-focus-key="start">${progress.tutorialSeen ? "다음 작전 시작" : "조작 훈련 시작"}</button>
        <p class="launch-screen__note">약 8분 · 키보드와 터치 모두 지원</p>
      </section>`;
}

export function resultTemplate(viewModel, meta) {
	const heading =
		viewModel.kind === "keep" ? "독립 임무를 지켰어요" : "빈 캡슐을 회수했어요";
	const emblem = viewModel.kind === "keep" ? "◇ ◆" : "◆";
	return `<div class="game-shell">
        ${headerTemplate(meta, meta.completedMain)}
        <main class="result-screen" id="mission-main">
          <div class="result-screen__emblem" aria-hidden="true">${emblem}</div>
          <p class="eyebrow">작전 기록 완료</p>
          <h1>${heading}</h1>
          <p>${escapeHtml(viewModel.resultReason)}</p>
          ${scoreCardTemplate([
						{ label: "이번 점수", value: `+${meta.lastScore}` },
						{ label: "구조 점수", value: meta.sessionScore },
					])}
          <button class="button button--primary button--large" type="button" data-action="continue" data-focus-key="continue">${meta.hasNext ? "다음 작전" : "마지막 판별"}</button>
        </main>
        ${footerTemplate()}
      </div>`;
}

function finalChoiceTemplate(choice) {
	return `<button class="final-choice" type="button" data-action="final-choice" data-choice-id="${escapeHtml(choice.id)}" data-focus-key="choice-${escapeHtml(choice.id)}"><span aria-hidden="true">◇ + ◆</span><strong>${escapeHtml(choice.title)}</strong><small>${escapeHtml(choice.summary)}</small></button>`;
}

export function finalTemplate(challenge, meta) {
	const choices = challenge.choices.map(finalChoiceTemplate).join("");
	return `<div class="game-shell">
        ${headerTemplate(meta, meta.completedMain)}
        <main class="final-screen" id="mission-main">
          <p class="eyebrow">최종 구조 판별</p><h1>${escapeHtml(challenge.title)}</h1><p>${escapeHtml(challenge.objective)}</p>
          <div class="final-grid">${choices}</div>
          ${feedbackTemplate(meta.feedback)}
        </main>
        ${footerTemplate()}
      </div>`;
}

export function completeTemplate(meta) {
	return `<main class="complete-screen">
        <div class="complete-screen__orbit" aria-hidden="true"><span>◇</span><strong>◆</strong><span>◇</span></div>
        <p class="eyebrow">구조 기록 동기화</p><h1>코어 구조대 인증 완료</h1>
        <p>작은 선체라는 이유가 아니라, 독립 책임이 사라졌을 때만 안전하게 흡수했습니다.</p>
        ${scoreCardTemplate([
					{
						label: "완료한 본 미션",
						value: `${meta.completedMain} / ${meta.totalMain}`,
					},
					{ label: "최고 구조 점수", value: meta.bestScore },
				])}
				<button class="button button--secondary" type="button" data-action="restart" data-focus-key="restart">처음부터 다시 훈련</button>
      </main>`;
}

export function fatalTemplate() {
	return '<main class="fatal-screen"><p class="eyebrow">통신 오류</p><h1>구조 기지를 열지 못했어요</h1><p>페이지를 새로 고치면 작전 기록을 다시 불러옵니다.</p></main>';
}
