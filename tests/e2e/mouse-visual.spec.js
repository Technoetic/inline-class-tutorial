import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "playwright/test";

const outputDirectory = path.resolve("step_archive/screenshots/mouse");

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

test("hover·click·drawer·scroll과 미지원 마우스 제스처를 전후 이미지로 검증한다", async ({
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

	const start = page.getByRole("button", { name: "조작 훈련 시작" });
	await page.evaluate(() => document.activeElement?.blur());
	await page.mouse.move(0, 0);
	const beforeHover = await start.boundingBox();
	await capture(page, "01-hover-before.png");
	await start.hover();
	const afterHover = await start.boundingBox();
	expect(
		await start.evaluate((element) => getComputedStyle(element).cursor),
	).toBe("pointer");
	expect(
		await start.evaluate((element) => getComputedStyle(element).transform),
	).not.toBe("none");
	expect(afterHover.y).toBeLessThan(beforeHover.y);
	await capture(page, "02-hover-after.png");

	await page.mouse.move(0, 0);
	await capture(page, "03-click-before.png");
	await start.click();
	await expect(
		page.getByRole("heading", { name: "조작 훈련 · 끊어진 스캐너" }),
	).toBeVisible();
	await capture(page, "04-click-after.png");

	const whyTrigger = page.getByRole("button", { name: "왜 이 순서일까요?" });
	await capture(page, "05-popup-before.png");
	await whyTrigger.click();
	await expect(page.locator("#why-drawer")).toBeVisible();
	await capture(page, "06-popup-after.png");
	await capture(page, "07-backdrop-before.png");
	await page.locator(".why-backdrop").click({ position: { x: 24, y: 24 } });
	await expect(page.locator("#why-drawer")).toBeHidden();
	await capture(page, "08-backdrop-after.png");

	const ability = page.locator('[data-action="move-ability"]');
	await page.mouse.move(0, 0);
	await capture(page, "09-right-click-na-before.png");
	await ability.click({ button: "right" });
	await expect(ability).toBeVisible();
	await expect(page.locator("#control-title")).toHaveText("능력 이동");
	await capture(page, "10-right-click-na-after.png");

	const coreVessel = page.locator(".vessel--core");
	await page.mouse.move(0, 0);
	await capture(page, "11-double-click-na-before.png");
	await coreVessel.dblclick();
	await expect(ability).toBeVisible();
	await expect(page.locator("#control-title")).toHaveText("능력 이동");
	await capture(page, "12-double-click-na-after.png");

	const sourceBox = await ability.boundingBox();
	const targetBox = await coreVessel.boundingBox();
	await capture(page, "13-drag-na-before.png");
	await page.mouse.move(
		sourceBox.x + sourceBox.width / 2,
		sourceBox.y + sourceBox.height / 2,
	);
	await page.mouse.down();
	await page.mouse.move(
		targetBox.x + targetBox.width / 2,
		targetBox.y + targetBox.height / 2,
		{ steps: 5 },
	);
	await capture(page, "14-drag-na-middle.png");
	await page.mouse.up();
	await expect(ability).toBeVisible();
	await expect(page.locator("#control-title")).toHaveText("능력 이동");
	await capture(page, "15-drag-na-after.png");

	await ability.click();
	await page.getByRole("button", { name: "다음 작전" }).click();
	await expect(
		page.getByRole("heading", { name: "미션 1 · 메아리 중계 캡슐" }),
	).toBeVisible();
	await page.evaluate(() => window.scrollTo(0, 0));
	await capture(page, "16-scroll-before.png");
	await page.mouse.wheel(0, 120);
	await expect
		.poll(() => page.evaluate(() => window.scrollY))
		.toBeGreaterThan(0);
	const middleScroll = await page.evaluate(() => window.scrollY);
	await capture(page, "17-scroll-middle.png");
	await page.mouse.wheel(0, 10_000);
	await expect
		.poll(() => page.evaluate(() => window.scrollY))
		.toBeGreaterThan(middleScroll);
	const endMetrics = await page.evaluate(() => ({
		maximum: document.documentElement.scrollHeight - window.innerHeight,
		y: window.scrollY,
	}));
	expect(endMetrics.maximum - endMetrics.y).toBeLessThanOrEqual(1);
	await capture(page, "18-scroll-end.png");
	expect(runtimeErrors).toEqual([]);
});
