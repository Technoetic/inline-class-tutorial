import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "playwright/test";

const outputDirectory = path.resolve("step_archive/screenshots/keyboard");

test.beforeAll(async () => {
	await mkdir(outputDirectory, { recursive: true });
});

async function capture(page, filename) {
	const destination = path.join(outputDirectory, filename);
	await page.screenshot({
		animations: "disabled",
		caret: "hide",
		path: destination,
	});
	expect((await stat(destination)).size).toBeGreaterThan(5_000);
}

test("키보드 포커스·활성화·drawer 복귀를 전후 이미지로 검증한다", async ({
	page,
}) => {
	test.setTimeout(45_000);
	const runtimeErrors = [];
	page.on("console", (message) => {
		if (message.type() === "error") runtimeErrors.push(message.text());
	});
	page.on("pageerror", (error) => runtimeErrors.push(error.message));
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto("/");
	await page.evaluate(() => localStorage.clear());
	await page.reload();
	await page.keyboard.press("Shift+Tab");

	await capture(page, "01-tab-before.png");
	await page.keyboard.press("Tab");
	const start = page.getByRole("button", { name: "조작 훈련 시작" });
	await expect(start).toBeFocused();
	await capture(page, "02-tab-start-focused.png");
	await page.keyboard.press("Enter");
	await expect(
		page.getByRole("heading", { name: "조작 훈련 · 끊어진 스캐너" }),
	).toBeVisible();

	await page.keyboard.press("Tab");
	const skipLink = page.getByRole("link", { name: "작전 구역으로 건너뛰기" });
	await expect(skipLink).toBeFocused();
	await capture(page, "03-tab-skip-link-focused.png");
	await page.keyboard.press("Tab");
	const ability = page.locator('[data-action="move-ability"]');
	await expect(ability).toBeFocused();
	await capture(page, "04-tab-ability-focused.png");
	await page.keyboard.press("Tab");
	const whyTrigger = page.getByRole("button", { name: "왜 이 순서일까요?" });
	await expect(whyTrigger).toBeFocused();
	await capture(page, "05-tab-why-focused.png");

	await page.keyboard.press("Enter");
	const close = page.getByRole("button", { name: "닫기", exact: true });
	await expect(close).toBeFocused();
	await capture(page, "06-focus-trap-before.png");
	await page.keyboard.press("Tab");
	await expect(close).toBeFocused();
	await capture(page, "07-focus-trap-after-tab.png");
	await page.keyboard.press("Escape");
	await expect(whyTrigger).toBeFocused();

	await capture(page, "08-shift-tab-before.png");
	await page.keyboard.press("Shift+Tab");
	await expect(ability).toBeFocused();
	await capture(page, "09-shift-tab-after.png");

	await capture(page, "10-space-before.png");
	await page.keyboard.press("Space");
	await expect(
		page.getByRole("heading", { name: "빈 캡슐을 회수했어요" }),
	).toBeVisible();
	await capture(page, "11-space-after.png");
	const continueButton = page.getByRole("button", { name: "다음 작전" });
	await expect(continueButton).toBeFocused();
	await capture(page, "12-enter-before.png");
	await page.keyboard.press("Enter");
	await expect(
		page.getByRole("heading", { name: "미션 1 · 메아리 중계 캡슐" }),
	).toBeVisible();
	await capture(page, "13-enter-after.png");

	await page.keyboard.press("Tab");
	await page.keyboard.press("Tab");
	const inlineButton = page.getByRole("button", { name: "흡수 작전" });
	await expect(inlineButton).toBeFocused();
	await capture(page, "14-arrow-na-before.png");
	await page.keyboard.press("ArrowRight");
	await expect(inlineButton).toBeFocused();
	await expect(page.locator("#control-title")).toHaveText("판별");
	await capture(page, "15-arrow-na-after.png");

	await page.keyboard.press("Tab");
	await page.keyboard.press("Tab");
	const missionWhyTrigger = page.getByRole("button", {
		name: "왜 이 순서일까요?",
	});
	await expect(missionWhyTrigger).toBeFocused();
	await page.keyboard.press("Enter");
	await expect(page.locator("#why-drawer")).toBeVisible();
	await capture(page, "16-escape-before.png");
	await page.keyboard.press("Escape");
	await expect(page.locator("#why-drawer")).toBeHidden();
	await expect(missionWhyTrigger).toBeFocused();
	await capture(page, "17-escape-after.png");

	const phaseBeforeShortcut = await page
		.locator("#control-title")
		.textContent();
	await capture(page, "18-shortcut-na-before.png");
	await page.keyboard.press("Control+z");
	await expect(missionWhyTrigger).toBeFocused();
	await expect(page.locator("#control-title")).toHaveText(phaseBeforeShortcut);
	await capture(page, "19-shortcut-na-after.png");

	await expect(page.locator("input, textarea, select")).toHaveCount(0);
	await capture(page, "20-input-na-before.png");
	await page.keyboard.type("42");
	await expect(missionWhyTrigger).toBeFocused();
	await expect(page.locator("input, textarea, select")).toHaveCount(0);
	await capture(page, "21-input-na-after.png");
	expect(runtimeErrors).toEqual([]);
});
