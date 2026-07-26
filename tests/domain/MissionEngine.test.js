import { beforeEach, describe, expect, it } from "vitest";
import { MissionCatalog } from "../../src/data/MissionCatalog.js";
import { missionContent } from "../../src/data/missions.js";
import { MissionEngine } from "../../src/domain/MissionEngine.js";
import { ScorePolicy } from "../../src/domain/ScorePolicy.js";

describe("MissionEngine", () => {
	let catalog;
	let engine;

	beforeEach(async () => {
		catalog = new MissionCatalog({ missions: missionContent });
		await catalog.init();
		engine = new MissionEngine({ scorePolicy: new ScorePolicy() });
	});

	it("훈련에서 능력 이동 한 번으로 조작을 익힌다", () => {
		const state = engine.createSession(catalog.getTraining());
		const result = engine.apply(state, {
			type: "move-ability",
			abilityId: "training-scan",
		});

		expect(result.state.phase).toBe("result");
		expect(result.progressDelta).toMatchObject({
			tutorialSeen: true,
			score: 150,
		});
	});

	it("흡수 미션을 안전한 여덟 단계 순서로 완료한다", () => {
		let state = engine.createSession(catalog.getById("echo-relay"));
		const commands = [
			{ type: "decide", decision: "inline" },
			{ type: "capture-baseline" },
			{ type: "prepare-slot", slotId: "response-slot" },
			{ type: "redirect", connectionId: "tower-call" },
			{ type: "checkpoint" },
			{ type: "move-ability", abilityId: "echo-response" },
			{ type: "verify" },
			{ type: "recycle" },
		];

		for (const command of commands) state = engine.apply(state, command).state;

		const snapshot = state.toSnapshot();
		expect(snapshot.completed).toBe(true);
		expect(snapshot.donorAbilities).toHaveLength(0);
		expect(
			snapshot.connections.every((connection) => connection.target === "core"),
		).toBe(true);
	});

	it("외부 연결 이동을 한 단계 되돌린다", () => {
		let state = engine.createSession(catalog.getById("echo-relay"));
		state = engine.apply(state, { type: "decide", decision: "inline" }).state;
		state = engine.apply(state, { type: "capture-baseline" }).state;
		state = engine.apply(state, {
			type: "prepare-slot",
			slotId: "response-slot",
		}).state;
		state = engine.apply(state, {
			type: "redirect",
			connectionId: "tower-call",
		}).state;
		const result = engine.apply(state, { type: "undo" });

		expect(result.state.phase).toBe("reconnect");
		expect(result.state.toSnapshot().connections[0].target).toBe("donor");
		expect(result.focusKey).toBe("connection-tower-call");
	});

	it("독립 미래 임무가 있는 캡슐을 분리해 둔다", () => {
		let state = engine.createSession(catalog.getById("life-garden"));
		state = engine.apply(state, { type: "decide", decision: "keep" }).state;
		const result = engine.apply(state, {
			type: "select-rationale",
			clueId: "future-ecosystem",
		});

		expect(result.state.phase).toBe("result");
		expect(result.progressDelta.missionId).toBe("life-garden");
	});
});
