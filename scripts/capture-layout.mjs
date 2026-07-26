import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const captures = [
	{ name: "desktop", width: 1920, height: 1080 },
	{ name: "tablet", width: 768, height: 1024 },
	{ name: "mobile", width: 390, height: 844 },
];
const round = process.argv[2] ?? "1";

await mkdir("step_archive/screenshots", { recursive: true });
const browser = await chromium.launch();

try {
	for (const capture of captures) {
		const context = await browser.newContext({
			viewport: { width: capture.width, height: capture.height },
			colorScheme: "dark",
		});
		const page = await context.newPage();
		await page.addInitScript(() => localStorage.clear());
		await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
		await page.getByRole("button", { name: "조작 훈련 시작" }).click();
		await page.locator(".mission").waitFor();
		const mainPath =
			round === "compare"
				? `step_archive/screenshots/compare-impl-${capture.name}.png`
				: `step_archive/screenshots/layout-verify-${capture.name}-r${round}.png`;
		await page.screenshot({
			path: mainPath,
			animations: "disabled",
		});
		await page.getByRole("button", { name: "왜 이 순서일까요?" }).click();
		await page.screenshot({
			path: `step_archive/screenshots/layout-verify-${capture.name}-drawer-r${round}.png`,
			animations: "disabled",
		});
		await page.getByRole("button", { name: "닫기", exact: true }).click();
		if (
			!(await page
				.getByRole("button", { name: "왜 이 순서일까요?" })
				.evaluate((button) => button === document.activeElement))
		) {
			throw new Error(
				`${capture.name}: drawer 초점이 trigger로 돌아오지 않았습니다.`,
			);
		}
		await context.close();
	}
} finally {
	await browser.close();
}
