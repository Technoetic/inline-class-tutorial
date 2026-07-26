import { expect, test } from "playwright/test";
import { STORAGE_KEY } from "../../src/storage/ProgressStore.js";

function watchRuntimeErrors(page) {
	const errors = [];
	page.on("console", (message) => {
		if (message.type() === "error") errors.push(message.text());
	});
	page.on("pageerror", (error) => errors.push(error.message));
	return errors;
}

async function clickAction(page, action, attribute = "", value = "") {
	const suffix = attribute ? `[${attribute}="${value}"]` : "";
	await page.locator(`[data-action="${action}"]${suffix}`).click();
}

async function completeInlineMission(page, { slots, connections, abilities }) {
	await page.getByRole("button", { name: "흡수 작전" }).click();
	await clickAction(page, "capture-baseline");
	for (const id of slots) {
		await clickAction(page, "prepare-slot", "data-slot-id", id);
	}
	for (const id of connections) {
		await clickAction(page, "redirect", "data-connection-id", id);
	}
	await clickAction(page, "checkpoint");
	for (const id of abilities) {
		await clickAction(page, "move-ability", "data-ability-id", id);
	}
	await clickAction(page, "verify");
	await clickAction(page, "recycle");
}

async function completeKeepMission(page, clueId) {
	await page.getByRole("button", { name: "분리 유지" }).click();
	await clickAction(page, "select-rationale", "data-clue-id", clueId);
}

test("훈련부터 최종 판별까지 회복·복원·재시작을 포함해 완주한다", async ({
	page,
}) => {
	test.setTimeout(60_000);
	const errors = watchRuntimeErrors(page);
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto("/");
	await page.evaluate(() => localStorage.clear());
	await page.reload();

	await expect(
		page.getByRole("heading", { name: "코어 구조대" }),
	).toBeVisible();
	await page.getByRole("button", { name: "조작 훈련 시작" }).click();
	await expect(
		page.getByRole("heading", { name: "조작 훈련 · 끊어진 스캐너" }),
	).toBeVisible();
	await clickAction(page, "move-ability", "data-ability-id", "training-scan");
	await expect(
		page.getByRole("heading", { name: "빈 캡슐을 회수했어요" }),
	).toBeVisible();

	await page.reload();
	await expect(page.getByText("0 / 4 본 미션")).toBeVisible();
	await page.getByRole("button", { name: "다음 작전 시작" }).click();
	await expect(
		page.getByRole("heading", { name: "미션 1 · 메아리 중계 캡슐" }),
	).toBeVisible();

	await page.getByRole("button", { name: "분리 유지" }).click();
	await expect(page.locator(".feedback")).toHaveText(
		"현재 능력과 미래 임무를 함께 살펴보세요.",
	);
	await completeInlineMission(page, {
		abilities: ["echo-response"],
		connections: ["tower-call"],
		slots: ["response-slot"],
	});
	await expect(
		page.getByRole("heading", { name: "빈 캡슐을 회수했어요" }),
	).toBeVisible();

	await clickAction(page, "continue");
	await expect(
		page.getByRole("heading", { name: "미션 2 · 생명 유지 정원" }),
	).toBeVisible();
	await page.getByRole("button", { name: "흡수 작전" }).click();
	await expect(page.locator(".feedback")).toHaveText(
		"크기보다 스스로 맡은 일과 미래 임무를 보세요.",
	);
	await page.getByRole("button", { name: "분리 유지" }).click();
	await clickAction(page, "select-rationale", "data-clue-id", "small-size");
	await expect(page.locator(".feedback")).toHaveText(
		"합치지 않아야 하는 가장 중요한 단서를 고르세요.",
	);
	await clickAction(
		page,
		"select-rationale",
		"data-clue-id",
		"future-ecosystem",
	);
	await expect(
		page.getByRole("heading", { name: "독립 임무를 지켰어요" }),
	).toBeVisible();

	await clickAction(page, "continue");
	await expect(
		page.getByRole("heading", { name: "미션 3 · 항법 그림자" }),
	).toBeVisible();
	await completeKeepMission(page, "future-expedition");
	await expect(
		page.getByRole("heading", { name: "독립 임무를 지켰어요" }),
	).toBeVisible();

	await clickAction(page, "continue");
	await expect(
		page.getByRole("heading", { name: "미션 4 · 궤도 관제 릴레이" }),
	).toBeVisible();
	await completeInlineMission(page, {
		abilities: ["relay-coordinate", "relay-signal", "relay-confirm"],
		connections: ["station-link", "crew-link"],
		slots: ["coordinate-slot", "signal-slot", "confirm-slot"],
	});
	await page.getByRole("button", { name: "마지막 판별" }).click();

	await expect(
		page.getByRole("heading", { name: "마지막 판별 · 하나가 된 두 선체" }),
	).toBeVisible();
	await clickAction(page, "final-choice", "data-choice-id", "seed-vault");
	await expect(page.locator(".feedback")).toHaveText(
		"종자 보존고에는 독립 책임과 미래 임무가 남아 있어요.",
	);
	await clickAction(page, "final-choice", "data-choice-id", "relay-shell");
	await expect(
		page.getByRole("heading", { name: "코어 구조대 인증 완료" }),
	).toBeVisible();
	await expect(page.locator(".score-card")).toContainText("4 / 4");

	const saved = await page.evaluate(
		(key) => JSON.parse(localStorage.getItem(key)),
		STORAGE_KEY,
	);
	expect(saved.tutorialSeen).toBe(true);
	expect(saved.completedMissionIds).toHaveLength(4);
	expect(saved.bestScore).toBeGreaterThan(0);

	await page.reload();
	await expect(page.getByText("4 / 4 본 미션")).toBeVisible();
	await page.getByRole("button", { name: "다음 작전 시작" }).click();
	await clickAction(page, "final-choice", "data-choice-id", "relay-shell");
	await page.getByRole("button", { name: "처음부터 다시 훈련" }).click();
	await expect(page.getByText("0 / 4 본 미션")).toBeVisible();
	expect(
		await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY),
	).toBeNull();
	expect(errors).toEqual([]);
});

test("손상된 저장값과 reduced motion에서도 모바일 설명 drawer를 키보드로 닫는다", async ({
	page,
}) => {
	const errors = watchRuntimeErrors(page);
	await page.setViewportSize({ width: 390, height: 844 });
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.addInitScript(
		({ key }) => localStorage.setItem(key, "{broken-json"),
		{ key: STORAGE_KEY },
	);
	await page.goto("/");

	await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
	await expect(page.getByText("0 / 4 본 미션")).toBeVisible();
	await page.getByRole("button", { name: "조작 훈련 시작" }).click();
	const trigger = page.getByRole("button", { name: "왜 이 순서일까요?" });
	await trigger.click();
	await expect(page.locator("#why-drawer")).toBeVisible();
	await expect(
		page.getByRole("button", { name: "닫기", exact: true }),
	).toBeFocused();
	await page.keyboard.press("Escape");
	await expect(page.locator("#why-drawer")).toBeHidden();
	await expect(trigger).toBeFocused();
	expect(errors).toEqual([]);
});
