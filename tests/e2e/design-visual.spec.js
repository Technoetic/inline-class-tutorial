import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "playwright/test";
import { STORAGE_KEY } from "../../src/storage/ProgressStore.js";

const outputDirectory = path.resolve("step_archive/screenshots/design");
const completedMissionIds = [
	"echo-relay",
	"life-garden",
	"navigation-shadow",
	"orbit-relay",
];

test.beforeAll(async () => {
	await mkdir(outputDirectory, { recursive: true });
});

async function capture(page, filename, { focusSelector = null } = {}) {
	if (focusSelector) {
		await page.locator(focusSelector).scrollIntoViewIfNeeded();
	} else {
		await page.evaluate(() => window.scrollTo(0, 0));
	}
	await page.evaluate(async () => {
		await Promise.all(
			document
				.getAnimations()
				.map((animation) => animation.finished.catch(() => undefined)),
		);
	});
	const destination = path.join(outputDirectory, filename);
	await page.screenshot({
		animations: "disabled",
		caret: "hide",
		path: destination,
	});
	expect((await stat(destination)).size).toBeGreaterThan(10_000);
	const hasHorizontalOverflow = await page.evaluate(
		() => document.documentElement.scrollWidth > window.innerWidth + 1,
	);
	expect(hasHorizontalOverflow).toBe(false);
}

async function clickAction(page, action, attribute = "", value = "") {
	const suffix = attribute ? `[${attribute}="${value}"]` : "";
	await page.locator(`[data-action="${action}"]${suffix}`).click();
}

async function seedCompletedProgress(page) {
	await page.evaluate(
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

async function assertVisibleTargets(page) {
	const boxes = await page
		.locator("button:visible, a:visible")
		.evaluateAll((items) =>
			items.map((item) => {
				const box = item.getBoundingClientRect();
				return { height: box.height, width: box.width };
			}),
		);
	for (const box of boxes) {
		expect(box.height).toBeGreaterThanOrEqual(44);
		expect(box.width).toBeGreaterThanOrEqual(44);
	}
}

for (const viewport of [
	{ height: 1080, name: "desktop", width: 1920 },
	{ height: 1024, name: "tablet", width: 768 },
	{ height: 844, name: "mobile", width: 390 },
]) {
	test(`${viewport.name} 주요 8개 장면의 디자인을 촬영한다`, async ({
		page,
	}) => {
		const runtimeErrors = [];
		page.on("console", (message) => {
			if (message.type() === "error") runtimeErrors.push(message.text());
		});
		page.on("pageerror", (error) => runtimeErrors.push(error.message));
		await page.setViewportSize({
			width: viewport.width,
			height: viewport.height,
		});
		await page.emulateMedia({ reducedMotion: "reduce" });
		await page.goto("/");
		await page.evaluate(() => localStorage.clear());
		await page.reload();

		await capture(page, `${viewport.name}-01-launch.png`);
		await assertVisibleTargets(page);
		await page.getByRole("button", { name: "조작 훈련 시작" }).click();
		await capture(page, `${viewport.name}-02-training.png`);
		await assertVisibleTargets(page);

		const whyTrigger = page.getByRole("button", {
			name: "왜 이 순서일까요?",
		});
		await whyTrigger.click();
		await capture(page, `${viewport.name}-03-drawer.png`);
		await page.getByRole("button", { name: "닫기", exact: true }).click();
		await clickAction(page, "move-ability", "data-ability-id", "training-scan");
		await capture(page, `${viewport.name}-04-result.png`);
		await page.getByRole("button", { name: "다음 작전" }).click();
		await capture(page, `${viewport.name}-05-main-mission.png`);
		await assertVisibleTargets(page);

		await seedCompletedProgress(page);
		await page.reload();
		await page.getByRole("button", { name: "다음 작전 시작" }).click();
		await capture(page, `${viewport.name}-06-final.png`);
		await assertVisibleTargets(page);
		await clickAction(page, "final-choice", "data-choice-id", "seed-vault");
		await capture(page, `${viewport.name}-07-final-warning.png`, {
			focusSelector: ".feedback--warning",
		});
		await clickAction(page, "final-choice", "data-choice-id", "relay-shell");
		await capture(page, `${viewport.name}-08-complete.png`);
		await assertVisibleTargets(page);
		await expect(page.locator("pre, code")).toHaveCount(0);
		expect(runtimeErrors).toEqual([]);
	});
}
