const phaseMeta = {
	inspect: { label: "판별", step: 1 },
	rationale: { label: "독립성 확인", step: 2 },
	baseline: { label: "안전 기준", step: 2 },
	prepare: { label: "받을 자리", step: 3 },
	reconnect: { label: "연결 전환", step: 4 },
	checkpoint: { label: "중간 확인", step: 5 },
	transfer: { label: "능력 이동", step: 6 },
	verify: { label: "최종 확인", step: 7 },
	recycle: { label: "빈 껍데기 회수", step: 8 },
	result: { label: "작전 완료", step: 8 },
};

function clone(value) {
	return structuredClone(value);
}

function globalActions(snapshot) {
	const { phase } = snapshot;
	if (phase === "inspect") {
		return [
			{
				action: "decide",
				value: "inline",
				label: "흡수 작전",
				tone: "primary",
				focusKey: "decide-inline",
			},
			{
				action: "decide",
				value: "keep",
				label: "분리 유지",
				tone: "secondary",
				focusKey: "decide-keep",
			},
		];
	}
	if (phase === "baseline")
		return [
			{ action: "capture-baseline", label: "안전 기준 기록", tone: "primary" },
		];
	if (phase === "checkpoint")
		return [
			{ action: "checkpoint", label: "중간 펄스 보내기", tone: "primary" },
		];
	if (phase === "verify")
		return [{ action: "verify", label: "최종 펄스 보내기", tone: "primary" }];
	if (phase === "recycle")
		return [{ action: "recycle", label: "빈 캡슐 회수", tone: "primary" }];
	return [];
}

export class MissionState {
	#snapshot;

	constructor(snapshot) {
		if (!snapshot?.mission || !phaseMeta[snapshot.phase])
			throw new Error("유효한 미션 상태가 필요합니다.");
		this.#snapshot = clone(snapshot);
	}

	get phase() {
		return this.#snapshot.phase;
	}

	get canUndo() {
		return Boolean(this.#snapshot.undoSnapshot);
	}

	toSnapshot() {
		return clone(this.#snapshot);
	}

	toViewModel(context = {}) {
		const snapshot = this.toSnapshot();
		const { mission, phase } = snapshot;
		const meta = phaseMeta[phase];
		const keepMission = mission.correctDecision === "keep";
		const stepTotal = keepMission ? 2 : mission.kind === "tutorial" ? 1 : 8;
		const stepIndex =
			mission.kind === "tutorial" ? 1 : Math.min(meta.step, stepTotal);
		const prepared = new Set(snapshot.preparedSlotIds);

		return {
			id: mission.id,
			kind: mission.kind,
			title: mission.title,
			objective: mission.objective,
			phase,
			phaseLabel: meta.label,
			stepIndex,
			stepTotal,
			core: {
				name: mission.core.name,
				subtitle: mission.core.subtitle,
				abilities: clone(snapshot.coreAbilities),
				slots: mission.requiredSlots.map((slot) => ({
					...clone(slot),
					prepared: prepared.has(slot.id) || mission.kind === "tutorial",
					actionable: phase === "prepare" && !prepared.has(slot.id),
				})),
				gauges: clone(snapshot.currentGauges),
			},
			donor: {
				name: mission.donor.name,
				subtitle: mission.donor.subtitle,
				abilities: snapshot.donorAbilities.map((ability) => ({
					...clone(ability),
					actionable: phase === "transfer",
				})),
				futureMission: mission.futureMission,
			},
			connections: snapshot.connections.map((connection) => ({
				...clone(connection),
				actionable: phase === "reconnect" && connection.target !== "core",
			})),
			baselineGauges: snapshot.baselineGauges
				? clone(snapshot.baselineGauges)
				: null,
			rationaleClues: mission.rationaleClues.map((clue) => ({
				id: clue.id,
				label: clue.label,
				actionable: phase === "rationale",
			})),
			actions: globalActions(snapshot),
			canUndo: this.canUndo,
			completed: snapshot.completed,
			recycled: snapshot.recycled,
			resultReason: mission.resultReason,
			why:
				mission.why?.[phase] ??
				"현재 보이는 능력, 연결, 미래 임무를 함께 살펴보세요.",
			feedback: context.feedback ?? null,
			highlightKeys: context.highlightKeys ?? [],
			focusKey: context.focusKey ?? null,
			attempts: snapshot.attempts,
			hintsUsed: snapshot.hintsUsed,
		};
	}
}
