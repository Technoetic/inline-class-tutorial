import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "playwright/test";
import { STORAGE_KEY } from "../../src/storage/ProgressStore.js";

const outputDirectory = path.resolve("step_archive/screenshots/e2e");

test.beforeAll(async () => {
	await mkdir(outputDirectory, { recursive: true });
});

async function capture(page, filename, { fullPage = true } = {}) {
	const destination = path.join(outputDirectory, filename);
	if (fullPage) await page.evaluate(() => window.scrollTo(0, 0));
	await page.screenshot({
		animations: "disabled",
		caret: "hide",
		fullPage,
		path: destination,
	});
	expect((await stat(destination)).size).toBeGreaterThan(10_000);
}

async function clickAction(page, action, attribute = "", value = "") {
	const suffix = attribute ? `[${attribute}="${value}"]` : "";
	await page.locator(`[data-action="${action}"]${suffix}`).click();
}

async function seedProgress(page, completedMissionIds) {
	await page.addInitScript(
		({ completed, key }) => {
			localStorage.setItem(
				key,
				JSON.stringify({
					bestScore: 650,
					completedMissionIds: completed,
					tutorialSeen: true,
					version: 1,
				}),
			);
		},
		{ completed: completedMissionIds, key: STORAGE_KEY },
	);
}

async function expectNoHorizontalOverflow(page) {
	const hasOverflow = await page.evaluate(
		() => document.documentElement.scrollWidth > window.innerWidth + 1,
	);
	expect(hasOverflow).toBe(false);
}

test("desktop 흡수 작전의 판별·연결·undo·빈 껍데기 상태를 촬영한다", async ({
	page,
}) => {
	test.setTimeout(45_000);
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto("/");
	await page.evaluate(() => localStorage.clear());
	await page.reload();

	await capture(page, "01-desktop-launch.png", { fullPage: false });
	await page.getByRole("button", { name: "조작 훈련 시작" }).click();
	await capture(page, "02-desktop-training.png");
	await clickAction(page, "move-ability", "data-ability-id", "training-scan");
	await capture(page, "03-desktop-training-result.png", { fullPage: false });
	await clickAction(page, "continue");

	await page.getByRole("button", { name: "분리 유지" }).click();
	await expect(page.locator(".feedback")).toBeVisible();
	await capture(page, "04-desktop-wrong-decision.png");
	await page.getByRole("button", { name: "흡수 작전" }).click();
	await clickAction(page, "capture-baseline");
	await clickAction(page, "prepare-slot", "data-slot-id", "response-slot");
	await capture(page, "05-desktop-slot-ready.png");

	await clickAction(page, "redirect", "data-connection-id", "tower-call");
	await expect(page.locator(".connection--safe")).toBeVisible();
	await expect(page.locator('[data-action="undo"]')).toBeVisible();
	await capture(page, "06-desktop-redirected-with-undo.png");
	await clickAction(page, "undo");
	await expect(page.locator(".connection--action")).toBeVisible();
	await expect(page.locator(".connection--action")).toBeFocused();
	await capture(page, "07-desktop-undo-restored.png");

	await clickAction(page, "redirect", "data-connection-id", "tower-call");
	await clickAction(page, "checkpoint");
	await clickAction(page, "move-ability", "data-ability-id", "echo-response");
	await clickAction(page, "verify");
	await expect(page.locator(".empty-state")).toContainText("남은 능력 0");
	await capture(page, "08-desktop-empty-before-recycle.png");
	await clickAction(page, "recycle");
	await capture(page, "09-desktop-mission-result.png", { fullPage: false });
	await expectNoHorizontalOverflow(page);
});

test("mobile 독립 임무 오답과 설명 drawer의 초점·폭을 촬영한다", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.emulateMedia({ reducedMotion: "reduce" });
	await seedProgress(page, ["echo-relay"]);
	await page.goto("/");
	await page.getByRole("button", { name: "다음 작전 시작" }).click();

	await capture(page, "10-mobile-keep-mission.png");
	await expectNoHorizontalOverflow(page);
	await page.getByRole("button", { name: "분리 유지" }).click();
	await clickAction(page, "select-rationale", "data-clue-id", "small-size");
	await expect(page.locator(".feedback")).toBeVisible();
	await capture(page, "11-mobile-wrong-rationale.png");

	const trigger = page.getByRole("button", { name: "왜 이 순서일까요?" });
	await trigger.click();
	await expect(page.locator("#why-drawer")).toBeVisible();
	await expect(
		page.getByRole("button", { name: "닫기", exact: true }),
	).toBeFocused();
	await capture(page, "12-mobile-why-drawer.png", { fullPage: false });
	await expectNoHorizontalOverflow(page);
	await page.keyboard.press("Escape");
	await expect(trigger).toBeFocused();

	await clickAction(
		page,
		"select-rationale",
		"data-clue-id",
		"future-ecosystem",
	);
	await capture(page, "13-mobile-keep-result.png", { fullPage: false });
});

test("tablet 최종 오답·완료·복원 장면을 촬영한다", async ({ page }) => {
	await page.setViewportSize({ width: 768, height: 1024 });
	await page.emulateMedia({ reducedMotion: "reduce" });
	await seedProgress(page, [
		"echo-relay",
		"life-garden",
		"navigation-shadow",
		"orbit-relay",
	]);
	await page.goto("/");
	await page.getByRole("button", { name: "다음 작전 시작" }).click();

	await capture(page, "14-tablet-final-choice.png", { fullPage: false });
	await clickAction(page, "final-choice", "data-choice-id", "rescue-drone");
	await expect(page.locator(".feedback")).toBeVisible();
	await capture(page, "15-tablet-final-wrong.png", { fullPage: false });
	await clickAction(page, "final-choice", "data-choice-id", "relay-shell");
	await capture(page, "16-tablet-complete.png", { fullPage: false });
	await expectNoHorizontalOverflow(page);

	await page.reload();
	await expect(page.getByText("4 / 4 본 미션")).toBeVisible();
	await capture(page, "17-tablet-progress-restored.png", { fullPage: false });
});
