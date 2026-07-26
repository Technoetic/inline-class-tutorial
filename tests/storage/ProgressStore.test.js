import { describe, expect, it } from "vitest";
import { ProgressStore, STORAGE_KEY } from "../../src/storage/ProgressStore.js";

class MemoryStorage {
	values = new Map();

	getItem(key) {
		return this.values.get(key) ?? null;
	}

	setItem(key, value) {
		this.values.set(key, value);
	}

	removeItem(key) {
		this.values.delete(key);
	}
}

describe("ProgressStore", () => {
	it("본 미션 진행과 최고 점수를 중복 없이 저장한다", async () => {
		const storage = new MemoryStorage();
		const store = new ProgressStore({ storage });

		await store.apply({
			missionId: "echo-relay",
			score: 150,
			totalScore: 150,
		});
		const saved = await store.apply({
			missionId: "echo-relay",
			score: 100,
			totalScore: 100,
		});

		expect(saved.completedMissionIds).toEqual(["echo-relay"]);
		expect(saved.bestScore).toBe(150);
		expect(JSON.parse(storage.getItem(STORAGE_KEY))).toEqual(saved);
	});

	it("훈련 완료는 본 미션 목록과 분리한다", async () => {
		const store = new ProgressStore({ storage: new MemoryStorage() });
		const saved = await store.apply({
			missionId: "training-scanner",
			tutorialSeen: true,
			score: 150,
		});

		expect(saved.tutorialSeen).toBe(true);
		expect(saved.completedMissionIds).toEqual([]);
	});

	it("깨진 저장 데이터는 안전한 기본값으로 복구한다", async () => {
		const storage = new MemoryStorage();
		storage.setItem(STORAGE_KEY, "not-json");

		await expect(new ProgressStore({ storage }).load()).resolves.toEqual({
			version: 1,
			completedMissionIds: [],
			bestScore: 0,
			tutorialSeen: false,
		});
	});

	it("저장소 예외 뒤에도 세션 메모리 진행을 유지한다", async () => {
		const storage = {
			getItem() {
				throw new Error("blocked");
			},
			setItem() {
				throw new Error("blocked");
			},
		};
		const store = new ProgressStore({ storage });

		await store.save({
			version: 1,
			completedMissionIds: ["echo-relay"],
			bestScore: 150,
			tutorialSeen: true,
		});

		await expect(store.load()).resolves.toMatchObject({
			completedMissionIds: ["echo-relay"],
			bestScore: 150,
			tutorialSeen: true,
		});
	});
});
