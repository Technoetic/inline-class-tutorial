const STORAGE_KEY = "inline-class-academy:progress:v1";

const emptyProgress = () => ({
	version: 1,
	completedMissionIds: [],
	bestScore: 0,
	tutorialSeen: false,
});

function normalize(candidate) {
	const fallback = emptyProgress();
	if (candidate?.version !== 1) return fallback;
	const completedMissionIds = Array.isArray(candidate.completedMissionIds)
		? [
				...new Set(
					candidate.completedMissionIds.filter((id) => typeof id === "string"),
				),
			]
		: [];
	return {
		version: 1,
		completedMissionIds,
		bestScore: Number.isFinite(candidate.bestScore)
			? Math.max(0, Math.floor(candidate.bestScore))
			: 0,
		tutorialSeen: Boolean(candidate.tutorialSeen),
	};
}

export class ProgressStore {
	#storage;
	#progress = emptyProgress();

	constructor({ storage = null } = {}) {
		this.#storage = storage;
	}

	async init() {
		if (!this.#storage) {
			try {
				this.#storage = globalThis.localStorage;
			} catch {
				this.#storage = null;
			}
		}
		return this.load();
	}

	async load() {
		if (!this.#storage) return structuredClone(this.#progress);
		let saved = null;
		try {
			saved = this.#storage.getItem(STORAGE_KEY);
		} catch {
			this.#storage = null;
			return structuredClone(this.#progress);
		}
		try {
			this.#progress = saved ? normalize(JSON.parse(saved)) : emptyProgress();
		} catch {
			this.#progress = emptyProgress();
		}
		return structuredClone(this.#progress);
	}

	async save(progress) {
		const normalized = normalize(progress);
		this.#progress = normalized;
		try {
			this.#storage?.setItem(STORAGE_KEY, JSON.stringify(normalized));
		} catch {
			this.#storage = null;
			return structuredClone(normalized);
		}
		return structuredClone(normalized);
	}

	async apply(delta = {}) {
		const current = await this.load();
		const completedMissionIds =
			delta.missionId && !delta.tutorialSeen
				? [...new Set([...current.completedMissionIds, delta.missionId])]
				: current.completedMissionIds;
		return await this.save({
			...current,
			completedMissionIds,
			bestScore: Math.max(
				current.bestScore,
				delta.totalScore ?? delta.score ?? 0,
			),
			tutorialSeen: current.tutorialSeen || Boolean(delta.tutorialSeen),
		});
	}

	async reset() {
		try {
			this.#storage?.removeItem(STORAGE_KEY);
		} catch {
			this.#storage = null;
			this.#progress = emptyProgress();
			return structuredClone(this.#progress);
		}
		this.#progress = emptyProgress();
		return structuredClone(this.#progress);
	}
}

export { STORAGE_KEY };
