import { describe, expect, it, vi } from "vitest";
import { GameApp } from "../../src/app/GameApp.js";

describe("GameApp", () => {
	it("독립 협력자를 초기화한 뒤 진행 상태를 controller에 전달한다", async () => {
		const progress = {
			version: 1,
			completedMissionIds: [],
			bestScore: 0,
			tutorialSeen: false,
		};
		const catalog = { init: vi.fn(async () => undefined) };
		const progressStore = { init: vi.fn(async () => progress) };
		const motionPreference = {
			init: vi.fn(async () => undefined),
			destroy: vi.fn(async () => undefined),
		};
		const view = {
			init: vi.fn(async () => undefined),
			destroy: vi.fn(async () => undefined),
		};
		const controller = { init: vi.fn(async () => undefined) };
		const app = new GameApp({
			catalog,
			progressStore,
			motionPreference,
			view,
			controller,
		});

		await app.init();

		expect(catalog.init).toHaveBeenCalledOnce();
		expect(progressStore.init).toHaveBeenCalledOnce();
		expect(motionPreference.init).toHaveBeenCalledOnce();
		expect(view.init).toHaveBeenCalledOnce();
		expect(controller.init).toHaveBeenCalledWith(progress);
	});

	it("종료 시 모션과 뷰 정리를 모두 회수한다", async () => {
		const motionPreference = {
			init: vi.fn(),
			destroy: vi.fn(async () => {
				throw new Error("motion cleanup failure");
			}),
		};
		const view = { init: vi.fn(), destroy: vi.fn(async () => undefined) };
		const app = new GameApp({
			catalog: { init: vi.fn() },
			progressStore: { init: vi.fn() },
			motionPreference,
			view,
			controller: { init: vi.fn() },
		});

		await expect(app.destroy()).resolves.toBeUndefined();
		expect(motionPreference.destroy).toHaveBeenCalledOnce();
		expect(view.destroy).toHaveBeenCalledOnce();
	});
});
