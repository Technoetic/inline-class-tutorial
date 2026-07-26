function clone(value) {
	return structuredClone(value);
}

function deepFreeze(value) {
	if (!value || typeof value !== "object" || Object.isFrozen(value))
		return value;
	Object.freeze(value);
	for (const child of Object.values(value)) deepFreeze(child);
	return value;
}

export class MissionCatalog {
	#content;
	#missions = [];
	#byId = new Map();
	#ready = false;

	constructor({ missions }) {
		this.#content = missions;
	}

	async init() {
		const candidates = [
			this.#content?.training,
			...(this.#content?.main ?? []),
		];
		if (candidates.length !== 5 || (this.#content?.main ?? []).length !== 4) {
			throw new Error("훈련 1개와 본 미션 4개가 필요합니다.");
		}

		const ids = new Set();
		for (const mission of candidates) {
			this.#validateMission(mission);
			if (ids.has(mission.id)) throw new Error(`중복 미션 ID: ${mission.id}`);
			ids.add(mission.id);
		}

		this.#validateFinal(this.#content.finalChallenge);
		this.#missions = deepFreeze(clone(candidates));
		this.#byId = new Map(
			this.#missions.map((mission) => [mission.id, mission]),
		);
		this.#ready = true;
	}

	getTraining() {
		this.#assertReady();
		return this.#missions[0];
	}

	getMainMissions() {
		this.#assertReady();
		return this.#missions.slice(1);
	}

	getFinalChallenge() {
		this.#assertReady();
		return deepFreeze(clone(this.#content.finalChallenge));
	}

	getById(id) {
		this.#assertReady();
		const mission = this.#byId.get(id);
		if (!mission) throw new Error(`알 수 없는 미션: ${id}`);
		return mission;
	}

	getFirstPlayable(progress) {
		this.#assertReady();
		if (!progress?.tutorialSeen) return this.getTraining();
		const completed = new Set(progress.completedMissionIds ?? []);
		return (
			this.getMainMissions().find((mission) => !completed.has(mission.id)) ??
			null
		);
	}

	getNext(id) {
		this.#assertReady();
		const index = this.#missions.findIndex((mission) => mission.id === id);
		return index >= 0 ? (this.#missions[index + 1] ?? null) : null;
	}

	getAll() {
		this.#assertReady();
		return this.#missions.slice();
	}

	#assertReady() {
		if (!this.#ready) throw new Error("MissionCatalog.init()이 필요합니다.");
	}

	#validateMission(mission) {
		if (
			!mission ||
			typeof mission.id !== "string" ||
			typeof mission.title !== "string"
		) {
			throw new Error("미션 ID와 제목이 필요합니다.");
		}
		if (!["tutorial", "inline", "keep"].includes(mission.kind)) {
			throw new Error(`잘못된 미션 종류: ${mission.id}`);
		}
		if (!["inline", "keep"].includes(mission.correctDecision)) {
			throw new Error(`잘못된 판정: ${mission.id}`);
		}
		if (
			!Array.isArray(mission.donor?.abilities) ||
			!Array.isArray(mission.core?.abilities)
		) {
			throw new Error(`능력 목록 누락: ${mission.id}`);
		}
		if (
			!Array.isArray(mission.requiredSlots) ||
			!Array.isArray(mission.connections)
		) {
			throw new Error(`슬롯 또는 연결 누락: ${mission.id}`);
		}
		if (
			!Array.isArray(mission.baselineGauges) ||
			mission.baselineGauges.length !== 3
		) {
			throw new Error(`계기 3개가 필요합니다: ${mission.id}`);
		}
		if (mission.correctDecision === "keep" && !mission.rationaleClueId) {
			throw new Error(`독립 책임 단서 누락: ${mission.id}`);
		}
	}

	#validateFinal(challenge) {
		if (
			!challenge ||
			!Array.isArray(challenge.choices) ||
			challenge.choices.length !== 3
		) {
			throw new Error("마지막 판별에는 세 쌍이 필요합니다.");
		}
		if (challenge.choices.filter((choice) => choice.correct).length !== 1) {
			throw new Error("마지막 판별 정답은 하나여야 합니다.");
		}
	}
}
