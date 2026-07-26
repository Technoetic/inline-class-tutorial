import { MissionState } from "./MissionState.js";

function clone(value) {
	return structuredClone(value);
}

function sameGauges(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
}

export class MissionEngine {
	#scorePolicy;

	constructor({ scorePolicy }) {
		this.#scorePolicy = scorePolicy;
	}

	createSession(mission) {
		return new MissionState({
			mission: clone(mission),
			phase: mission.kind === "tutorial" ? "transfer" : "inspect",
			coreAbilities: clone(mission.core.abilities),
			donorAbilities: clone(mission.donor.abilities),
			preparedSlotIds: [],
			connections: clone(mission.connections),
			baselineGauges: null,
			currentGauges: clone(mission.baselineGauges),
			checkpointPassed: false,
			verified: false,
			recycled: false,
			attempts: 0,
			hintsUsed: 0,
			undoSnapshot: null,
			completed: false,
		});
	}

	apply(state, command) {
		if (!(state instanceof MissionState) || !command?.type)
			return this.#reject(state, "알 수 없는 행동이에요.");
		const handlers = {
			decide: () => this.#decide(state, command),
			"select-rationale": () => this.#selectRationale(state, command),
			"capture-baseline": () => this.#captureBaseline(state),
			"prepare-slot": () => this.#prepareSlot(state, command),
			redirect: () => this.#redirect(state, command),
			checkpoint: () => this.#checkpoint(state),
			"move-ability": () => this.#moveAbility(state, command),
			verify: () => this.#verify(state),
			recycle: () => this.#recycle(state),
			undo: () => this.undo(state),
		};
		return (
			handlers[command.type]?.() ??
			this.#reject(state, "지금은 사용할 수 없는 행동이에요.")
		);
	}

	undo(state) {
		const snapshot = state?.toSnapshot?.();
		if (!snapshot?.undoSnapshot)
			return this.#reject(state, "되돌릴 마지막 이동이 없어요.");
		const restored = clone(snapshot.undoSnapshot);
		restored.undoSnapshot = null;
		return this.#result(
			new MissionState(restored),
			"마지막 이동을 되돌렸어요.",
			"highlight",
			this.#undoFocusKey(snapshot, restored),
		);
	}

	#undoFocusKey(current, restored) {
		const connection = restored.connections.find(
			(candidate) =>
				candidate.target !==
				current.connections.find((item) => item.id === candidate.id)?.target,
		);
		if (connection) return `connection-${connection.id}`;

		const currentAbilityIds = new Set(
			current.donorAbilities.map((ability) => ability.id),
		);
		const ability = restored.donorAbilities.find(
			(candidate) => !currentAbilityIds.has(candidate.id),
		);
		return ability ? `ability-${ability.id}` : restored.phase;
	}

	#decide(state, command) {
		const snapshot = state.toSnapshot();
		if (snapshot.phase !== "inspect")
			return this.#reject(state, "먼저 현재 판별 단계를 마쳐야 해요.");
		if (!["inline", "keep"].includes(command.decision))
			return this.#reject(state, "두 작전 중 하나를 골라 주세요.");

		if (command.decision !== snapshot.mission.correctDecision) {
			snapshot.attempts += 1;
			return this.#result(
				new MissionState(snapshot),
				snapshot.mission.recovery.inspect,
				"highlight",
				"inspect",
				[
					snapshot.mission.futureMission
						? "future-mission"
						: "responsibility-count",
				],
			);
		}

		snapshot.phase = command.decision === "keep" ? "rationale" : "baseline";
		return this.#result(
			new MissionState(snapshot),
			command.decision === "keep"
				? "분리할 근거를 하나 선택하세요."
				: "좋아요. 작업 전 계기부터 기록하세요.",
			"highlight",
			snapshot.phase,
		);
	}

	#selectRationale(state, command) {
		const snapshot = state.toSnapshot();
		if (snapshot.phase !== "rationale")
			return this.#reject(state, "지금은 독립 책임을 고르는 단계가 아니에요.");
		if (command.clueId !== snapshot.mission.rationaleClueId) {
			snapshot.attempts += 1;
			return this.#result(
				new MissionState(snapshot),
				snapshot.mission.recovery.rationale,
				"highlight",
				"rationale",
			);
		}
		return this.#complete(
			snapshot,
			"독립 책임을 찾아 분리 상태를 지켰어요.",
			"highlight",
		);
	}

	#captureBaseline(state) {
		const snapshot = state.toSnapshot();
		if (snapshot.phase !== "baseline")
			return this.#reject(state, "아직 안전 기준을 기록할 단계가 아니에요.");
		snapshot.baselineGauges = clone(snapshot.currentGauges);
		snapshot.phase = "prepare";
		return this.#result(
			new MissionState(snapshot),
			"세 계기를 안전 기준으로 기록했어요.",
			"verify",
			"prepare",
		);
	}

	#prepareSlot(state, command) {
		const snapshot = state.toSnapshot();
		if (snapshot.phase !== "prepare")
			return this.#reject(state, "지금은 받을 슬롯을 준비할 단계가 아니에요.");
		const valid = snapshot.mission.requiredSlots.some(
			(slot) => slot.id === command.slotId,
		);
		if (!valid || snapshot.preparedSlotIds.includes(command.slotId))
			return this.#reject(state, "다른 빈 슬롯을 선택하세요.");
		snapshot.preparedSlotIds.push(command.slotId);
		if (
			snapshot.preparedSlotIds.length === snapshot.mission.requiredSlots.length
		)
			snapshot.phase = "reconnect";
		return this.#result(
			new MissionState(snapshot),
			"주 선체에 받을 슬롯을 준비했어요.",
			"highlight",
			snapshot.phase,
		);
	}

	#redirect(state, command) {
		const snapshot = state.toSnapshot();
		if (snapshot.phase !== "reconnect")
			return this.#reject(
				state,
				"받을 슬롯을 모두 준비한 뒤 연결을 바꿀 수 있어요.",
			);
		const index = snapshot.connections.findIndex(
			(connection) => connection.id === command.connectionId,
		);
		if (index < 0 || snapshot.connections[index].target === "core")
			return this.#reject(state, "아직 캡슐을 향한 연결을 선택하세요.");
		snapshot.undoSnapshot = this.#undoBase(snapshot);
		snapshot.connections[index].target = "core";
		if (
			snapshot.connections.every((connection) => connection.target === "core")
		)
			snapshot.phase = "checkpoint";
		return this.#result(
			new MissionState(snapshot),
			"외부 연결이 주 선체로 전환됐어요.",
			"redirect",
			snapshot.phase,
		);
	}

	#checkpoint(state) {
		const snapshot = state.toSnapshot();
		if (snapshot.phase !== "checkpoint")
			return this.#reject(state, "모든 외부 연결을 먼저 전환하세요.");
		if (!sameGauges(snapshot.baselineGauges, snapshot.currentGauges))
			return this.#reject(state, "계기가 달라졌어요. 연결을 다시 확인하세요.");
		snapshot.checkpointPassed = true;
		snapshot.undoSnapshot = null;
		snapshot.phase = "transfer";
		return this.#result(
			new MissionState(snapshot),
			"중간 계기가 안전 기준과 같아요.",
			"verify",
			"transfer",
		);
	}

	#moveAbility(state, command) {
		const snapshot = state.toSnapshot();
		if (snapshot.phase !== "transfer")
			return this.#reject(
				state,
				"연결의 중간 확인을 마친 뒤 능력을 옮길 수 있어요.",
			);
		const index = snapshot.donorAbilities.findIndex(
			(ability) => ability.id === command.abilityId,
		);
		if (index < 0)
			return this.#reject(state, "옮길 수 있는 캡슐 능력을 선택하세요.");
		const ability = snapshot.donorAbilities[index];
		const slotReady =
			snapshot.mission.kind === "tutorial" ||
			snapshot.preparedSlotIds.includes(ability.slotId);
		if (!slotReady)
			return this.#reject(state, "이 능력을 받을 슬롯부터 준비하세요.");

		snapshot.undoSnapshot = this.#undoBase(snapshot);
		snapshot.donorAbilities.splice(index, 1);
		snapshot.coreAbilities.push(ability);

		if (
			snapshot.mission.kind === "tutorial" &&
			snapshot.donorAbilities.length === 0
		) {
			return this.#complete(
				snapshot,
				"탐지 능력을 주 선체로 옮겼어요.",
				"transfer",
			);
		}
		if (snapshot.donorAbilities.length === 0) snapshot.phase = "verify";
		return this.#result(
			new MissionState(snapshot),
			`${ability.label} 능력을 주 선체로 옮겼어요.`,
			"transfer",
			snapshot.phase,
		);
	}

	#verify(state) {
		const snapshot = state.toSnapshot();
		if (snapshot.phase !== "verify" || snapshot.donorAbilities.length > 0) {
			return this.#reject(state, "캡슐의 남은 능력을 모두 옮긴 뒤 확인하세요.");
		}
		if (!sameGauges(snapshot.baselineGauges, snapshot.currentGauges))
			return this.#reject(state, "최종 계기가 안전 기준과 달라요.");
		snapshot.verified = true;
		snapshot.undoSnapshot = null;
		snapshot.phase = "recycle";
		return this.#result(
			new MissionState(snapshot),
			"최종 계기가 처음과 모두 같아요.",
			"verify",
			"recycle",
		);
	}

	#recycle(state) {
		const snapshot = state.toSnapshot();
		const connectionsClear = snapshot.connections.every(
			(connection) => connection.target === "core",
		);
		if (
			snapshot.phase !== "recycle" ||
			!snapshot.verified ||
			snapshot.donorAbilities.length > 0 ||
			!connectionsClear
		) {
			return this.#reject(
				state,
				"능력과 연결을 모두 비우고 최종 확인을 마쳐야 해요.",
			);
		}
		snapshot.recycled = true;
		return this.#complete(
			snapshot,
			"빈 캡슐을 안전하게 회수했어요.",
			"complete",
		);
	}

	#complete(snapshot, message, effect) {
		snapshot.phase = "result";
		snapshot.completed = true;
		snapshot.undoSnapshot = null;
		const score = this.#scorePolicy.calculate(snapshot);
		return this.#result(
			new MissionState(snapshot),
			message,
			effect,
			"result",
			[],
			{
				missionId: snapshot.mission.id,
				score,
				tutorialSeen: snapshot.mission.kind === "tutorial",
			},
		);
	}

	#undoBase(snapshot) {
		const previous = clone(snapshot);
		previous.undoSnapshot = null;
		return previous;
	}

	#reject(state, message) {
		if (!(state instanceof MissionState)) {
			return {
				state: null,
				feedback: { message, severity: "warning" },
				effect: "none",
				focusKey: null,
				highlightKeys: [],
				progressDelta: null,
			};
		}
		return this.#result(state, message, "highlight", null);
	}

	#result(
		state,
		message,
		effect,
		focusKey,
		highlightKeys = [],
		progressDelta = null,
	) {
		return {
			state,
			feedback: {
				message,
				severity: effect === "complete" ? "success" : "status",
			},
			effect,
			focusKey,
			highlightKeys,
			progressDelta,
		};
	}
}
