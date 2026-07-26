import { expect, test } from "playwright/test";
import { STORAGE_KEY } from "../../src/storage/ProgressStore.js";

function watchBrowserEvents(page, context) {
	const errors = [];
	const references = [];
	const counts = { requests: 0, responses: 0, websockets: 0, workers: 0 };
	const fail = (event, detail) =>
		errors.push({ detail: String(detail), event });

	page.on("console", (message) => {
		const item = { detail: message.text(), event: `console.${message.type()}` };
		references.push(item);
		if (message.type() === "error") errors.push(item);
	});
	page.on("pageerror", (error) => fail("pageerror", error.message));
	context.on("weberror", (webError) =>
		fail("weberror", webError.error().message),
	);
	page.on("crash", () => fail("crash", "renderer crashed"));
	page.on("request", () => {
		counts.requests += 1;
	});
	page.on("requestfailed", (request) =>
		fail(
			"requestfailed",
			`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ""}`,
		),
	);
	page.on("response", (response) => {
		counts.responses += 1;
		if (response.status() >= 400) {
			fail("http", `${response.status()} ${response.url()}`);
		}
	});
	page.on("websocket", (socket) => {
		counts.websockets += 1;
		socket.on("socketerror", (error) => fail("websocket", error));
	});
	page.on("dialog", async (dialog) => {
		fail("dialog", `${dialog.type()}: ${dialog.message()}`);
		await dialog.dismiss().catch(() => undefined);
	});
	page.on("download", (download) =>
		references.push({
			detail: download.suggestedFilename(),
			event: "download",
		}),
	);
	page.on("filechooser", () =>
		references.push({ detail: "file chooser opened", event: "filechooser" }),
	);
	page.on("popup", (popup) =>
		references.push({ detail: popup.url(), event: "popup" }),
	);
	page.on("worker", (worker) => {
		counts.workers += 1;
		references.push({ detail: worker.url(), event: "worker" });
	});

	return { counts, errors, references };
}

async function settle(page) {
	await page.evaluate(async () => {
		await Promise.all(
			document
				.getAnimations()
				.map((animation) => animation.finished.catch(() => undefined)),
		);
		await new Promise((resolve) =>
			requestAnimationFrame(() => requestAnimationFrame(resolve)),
		);
	});
}

async function clickAction(page, action, attribute = "", value = "") {
	const suffix = attribute ? `[${attribute}="${value}"]` : "";
	await page.locator(`[data-action="${action}"]${suffix}`).click();
	await settle(page);
}

function createCensus() {
	return {
		drawerOpens: 0,
		phases: new Set(),
		screens: new Set(),
		states: [],
	};
}

async function recordState(page, census, label) {
	await settle(page);
	const snapshot = await page.evaluate(() => {
		const screen = document.querySelector(
			".launch-screen, .mission, .result-screen, .final-screen, .complete-screen, .fatal-screen",
		);
		return {
			drawerOpen: Boolean(document.querySelector("#why-drawer:not([hidden])")),
			feedback:
				document.querySelector(".feedback")?.textContent?.trim() ?? null,
			heading: document.querySelector("h1")?.textContent?.trim() ?? null,
			phase:
				document.querySelector("#control-title")?.textContent?.trim() ?? null,
			screen: screen?.classList[0] ?? null,
		};
	});
	if (snapshot.phase) census.phases.add(snapshot.phase);
	if (snapshot.screen) census.screens.add(snapshot.screen);
	census.states.push({ label, ...snapshot });
}

async function inspectWhy(page, census, label, closeWith = "button") {
	await clickAction(page, "toggle-why");
	await expect(page.locator("#why-drawer")).toBeVisible();
	census.drawerOpens += 1;
	await recordState(page, census, `${label}:drawer-open`);
	if (closeWith === "escape") {
		await page.keyboard.press("Escape");
	} else if (closeWith === "backdrop") {
		await page.locator(".why-backdrop").click({ position: { x: 8, y: 8 } });
	} else {
		await page.locator('#why-drawer [data-action="close-why"]').click();
		await settle(page);
	}
	await expect(page.locator("#why-drawer")).toBeHidden();
	await recordState(page, census, `${label}:drawer-closed`);
}

async function chooseDecision(page, decision) {
	await clickAction(page, "decide", "data-value", decision);
}

async function finishInlineMission(page, census, prefix, exerciseUndo = false) {
	await chooseDecision(page, "inline");
	await recordState(page, census, `${prefix}:baseline`);
	await inspectWhy(page, census, `${prefix}:baseline`);

	await clickAction(page, "capture-baseline");
	await recordState(page, census, `${prefix}:prepare`);
	await inspectWhy(page, census, `${prefix}:prepare`, "backdrop");
	let prepared = 0;
	while ((await page.locator('[data-action="prepare-slot"]').count()) > 0) {
		await page.locator('[data-action="prepare-slot"]').first().click();
		await settle(page);
		prepared += 1;
		await recordState(page, census, `${prefix}:slot-${prepared}`);
	}

	await recordState(page, census, `${prefix}:reconnect`);
	await inspectWhy(page, census, `${prefix}:reconnect`);
	if (exerciseUndo) {
		await page.locator('[data-action="redirect"]').first().click();
		await settle(page);
		await recordState(page, census, `${prefix}:redirect-before-undo`);
		await clickAction(page, "undo");
		await recordState(page, census, `${prefix}:redirect-undone`);
	}
	let redirected = 0;
	while ((await page.locator('[data-action="redirect"]').count()) > 0) {
		await page.locator('[data-action="redirect"]').first().click();
		await settle(page);
		redirected += 1;
		await recordState(page, census, `${prefix}:connection-${redirected}`);
	}

	await recordState(page, census, `${prefix}:checkpoint`);
	await inspectWhy(page, census, `${prefix}:checkpoint`);
	await clickAction(page, "checkpoint");
	await recordState(page, census, `${prefix}:transfer`);
	await inspectWhy(page, census, `${prefix}:transfer`);
	if (exerciseUndo) {
		await page.locator('[data-action="move-ability"]').first().click();
		await settle(page);
		await recordState(page, census, `${prefix}:transfer-before-undo`);
		await clickAction(page, "undo");
		await recordState(page, census, `${prefix}:transfer-undone`);
	}
	let transferred = 0;
	while ((await page.locator('[data-action="move-ability"]').count()) > 0) {
		await page.locator('[data-action="move-ability"]').first().click();
		await settle(page);
		transferred += 1;
		await recordState(page, census, `${prefix}:ability-${transferred}`);
	}

	await expect(page.locator(".empty-state")).toBeVisible();
	await recordState(page, census, `${prefix}:verify`);
	await inspectWhy(page, census, `${prefix}:verify`);
	await clickAction(page, "verify");
	await recordState(page, census, `${prefix}:recycle`);
	await inspectWhy(page, census, `${prefix}:recycle`);
	await clickAction(page, "recycle");
	await recordState(page, census, `${prefix}:result`);
}

async function finishKeepMission(page, census, prefix, correctClueId) {
	await chooseDecision(page, "keep");
	await recordState(page, census, `${prefix}:rationale`);
	await inspectWhy(page, census, `${prefix}:rationale`);
	const clueIds = await page
		.locator('[data-action="select-rationale"]')
		.evaluateAll((items) => items.map((item) => item.dataset.clueId));
	for (const clueId of clueIds.filter((id) => id !== correctClueId)) {
		await clickAction(page, "select-rationale", "data-clue-id", clueId);
		await recordState(page, census, `${prefix}:wrong-${clueId}`);
	}
	await clickAction(page, "select-rationale", "data-clue-id", correctClueId);
	await recordState(page, census, `${prefix}:result`);
}

function expectNoBrowserErrors(audit) {
	expect(
		audit.errors,
		`브라우저 오류 이벤트:\n${JSON.stringify(audit.errors, null, 2)}`,
	).toEqual([]);
	expect(audit.counts.requests).toBeGreaterThan(0);
	expect(audit.counts.responses).toBeGreaterThan(0);
}

test("모든 미션 단계·복구·undo·drawer·최종 경고를 탐색해 오류 0건을 확인한다", async ({
	context,
	page,
}) => {
	test.setTimeout(90_000);
	const audit = watchBrowserEvents(page, context);
	const census = createCensus();
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.addInitScript(() => localStorage.clear());
	await page.goto("/");
	await recordState(page, census, "launch");

	await clickAction(page, "start");
	await recordState(page, census, "training:transfer");
	await inspectWhy(page, census, "training:transfer", "escape");
	await page.locator('[data-action="move-ability"]').click();
	await settle(page);
	await recordState(page, census, "training:result");
	await clickAction(page, "continue");

	await recordState(page, census, "mission-1:inspect");
	await inspectWhy(page, census, "mission-1:inspect");
	await chooseDecision(page, "keep");
	await recordState(page, census, "mission-1:wrong-decision");
	await finishInlineMission(page, census, "mission-1", true);
	await clickAction(page, "continue");

	await recordState(page, census, "mission-2:inspect");
	await inspectWhy(page, census, "mission-2:inspect");
	await chooseDecision(page, "inline");
	await recordState(page, census, "mission-2:wrong-decision");
	await finishKeepMission(page, census, "mission-2", "future-ecosystem");
	await clickAction(page, "continue");

	await recordState(page, census, "mission-3:inspect");
	await inspectWhy(page, census, "mission-3:inspect");
	await finishKeepMission(page, census, "mission-3", "future-expedition");
	await clickAction(page, "continue");

	await recordState(page, census, "mission-4:inspect");
	await inspectWhy(page, census, "mission-4:inspect");
	await finishInlineMission(page, census, "mission-4", true);
	await clickAction(page, "continue");
	await recordState(page, census, "final:initial");

	for (const wrongChoice of ["seed-vault", "rescue-drone"]) {
		await clickAction(page, "final-choice", "data-choice-id", wrongChoice);
		await recordState(page, census, `final:wrong-${wrongChoice}`);
	}
	await clickAction(page, "final-choice", "data-choice-id", "relay-shell");
	await recordState(page, census, "complete");
	await clickAction(page, "restart");
	await recordState(page, census, "launch:after-restart");

	for (const phase of [
		"판별",
		"독립성 확인",
		"안전 기준",
		"받을 자리",
		"연결 전환",
		"중간 확인",
		"능력 이동",
		"최종 확인",
		"빈 껍데기 회수",
	]) {
		expect(census.phases).toContain(phase);
	}
	expect(census.phases.size).toBe(9);
	for (const screen of [
		"launch-screen",
		"mission",
		"result-screen",
		"final-screen",
		"complete-screen",
	]) {
		expect(census.screens).toContain(screen);
	}
	expect(census.screens).not.toContain("fatal-screen");
	expect(census.drawerOpens).toBeGreaterThanOrEqual(15);
	expect(census.states.length).toBeGreaterThanOrEqual(70);
	expect(
		await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY),
	).toBeNull();
	expectNoBrowserErrors(audit);
});

test("손상된 저장값·reduced motion·모바일 focus trap을 오류 없이 복구한다", async ({
	context,
	page,
}) => {
	const audit = watchBrowserEvents(page, context);
	await page.setViewportSize({ width: 390, height: 844 });
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.addInitScript(
		({ key }) => localStorage.setItem(key, "{broken-json"),
		{ key: STORAGE_KEY },
	);
	await page.goto("/");
	await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
	await expect(page.getByText("0 / 4 본 미션")).toBeVisible();
	await clickAction(page, "start");
	await clickAction(page, "toggle-why");
	await expect(page.locator("#why-drawer")).toBeVisible();
	const drawerClose = page.locator('#why-drawer [data-action="close-why"]');
	await expect(drawerClose).toBeFocused();
	await page.keyboard.press("Shift+Tab");
	await expect(drawerClose).toBeFocused();
	await page.keyboard.press("Escape");
	await expect(page.locator("#why-drawer")).toBeHidden();
	expectNoBrowserErrors(audit);
});

test("Storage API 거부 시 메모리 fallback으로 훈련을 완료하고 오류 0건을 유지한다", async ({
	context,
	page,
}) => {
	const audit = watchBrowserEvents(page, context);
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.addInitScript(() => {
		for (const method of ["getItem", "setItem", "removeItem"]) {
			Object.defineProperty(Storage.prototype, method, {
				configurable: true,
				value() {
					throw new DOMException("Storage denied", "SecurityError");
				},
			});
		}
	});
	await page.goto("/");
	await clickAction(page, "start");
	await page.locator('[data-action="move-ability"]').click();
	await settle(page);
	await expect(
		page.getByRole("heading", { name: "빈 캡슐을 회수했어요" }),
	).toBeVisible();
	await clickAction(page, "continue");
	await expect(
		page.getByRole("heading", { name: "미션 1 · 메아리 중계 캡슐" }),
	).toBeVisible();
	await expect(page.locator("html")).not.toHaveAttribute("data-boot-error");
	expectNoBrowserErrors(audit);
});
