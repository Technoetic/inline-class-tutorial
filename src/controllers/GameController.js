const commandActions = new Set([
	"capture-baseline",
	"checkpoint",
	"recycle",
	"undo",
	"verify",
]);

export class GameController {
	#catalog;
	#engine;
	#view;
	#progressStore;
	#progress;
	#state = null;
	#sessionScore = 0;
	#lastScore = 0;

	constructor({ catalog, engine, view, progressStore }) {
		this.#catalog = catalog;
		this.#engine = engine;
		this.#view = view;
		this.#progressStore = progressStore;
	}

	async init(progress) {
		this.#progress = progress;
		this.#view.bind((interaction) => this.#handle(interaction));
		this.#view.renderLaunch(this.#progress);
	}

	async #handle(interaction) {
		const actions = {
			start: async () => this.#startNextOrFinal(),
			continue: async () => this.#startNextOrFinal(),
			restart: async () => this.#restart(),
			"final-choice": async () => this.#chooseFinal(interaction.choiceId),
		};
		if (actions[interaction.action]) {
			await actions[interaction.action]();
			return;
		}

		const command = this.#toCommand(interaction);
		if (!command || !this.#state) return;
		await this.#applyCommand(command);
	}

	async #restart() {
		this.#progress = await this.#progressStore.reset();
		this.#sessionScore = 0;
		this.#lastScore = 0;
		this.#state = null;
		this.#view.renderLaunch(this.#progress);
	}

	async #startNextOrFinal() {
		const mission = this.#catalog.getFirstPlayable(this.#progress);
		if (!mission) {
			this.#renderFinal();
			return;
		}
		this.#state = this.#engine.createSession(mission);
		this.#renderMission();
	}

	async #applyCommand(command) {
		const transition = this.#engine.apply(this.#state, command);
		if (!transition.state) return;
		this.#state = transition.state;
		if (transition.progressDelta) {
			this.#lastScore = transition.progressDelta.score;
			this.#sessionScore += this.#lastScore;
			this.#progress = await this.#progressStore.apply({
				...transition.progressDelta,
				totalScore: this.#sessionScore,
			});
			const nextMission = this.#catalog.getFirstPlayable(this.#progress);
			this.#view.renderResult(
				this.#state.toViewModel({ feedback: transition.feedback }),
				{
					...this.#meta(),
					effect: transition.effect,
					hasNext: Boolean(nextMission),
					lastScore: this.#lastScore,
				},
			);
			return;
		}
		this.#renderMission(transition);
	}

	#renderMission(transition = {}) {
		this.#view.renderMission(
			this.#state.toViewModel({
				feedback: transition.feedback,
				focusKey: transition.focusKey,
				highlightKeys: transition.highlightKeys,
			}),
			{ ...this.#meta(), effect: transition.effect },
		);
	}

	#renderFinal(feedback = null, focusKey = null) {
		this.#view.renderFinal(this.#catalog.getFinalChallenge(), {
			...this.#meta(),
			feedback,
			focusKey,
		});
	}

	async #chooseFinal(choiceId) {
		const challenge = this.#catalog.getFinalChallenge();
		const choice = challenge.choices.find(
			(candidate) => candidate.id === choiceId,
		);
		if (!choice) return;
		if (!choice.correct) {
			this.#renderFinal(
				{ message: choice.feedback, severity: "warning" },
				`choice-${choice.id}`,
			);
			return;
		}
		const finalScore = 100;
		this.#sessionScore += finalScore;
		this.#progress = await this.#progressStore.apply({
			totalScore: this.#sessionScore,
		});
		this.#view.renderComplete({
			completedMain: this.#completedMain(),
			totalMain: this.#catalog.getMainMissions().length,
			bestScore: this.#progress.bestScore,
		});
	}

	#toCommand(interaction) {
		if (commandActions.has(interaction.action))
			return { type: interaction.action };
		const mappings = {
			decide: { type: "decide", decision: interaction.value },
			"select-rationale": {
				type: "select-rationale",
				clueId: interaction.clueId,
			},
			"prepare-slot": { type: "prepare-slot", slotId: interaction.slotId },
			redirect: { type: "redirect", connectionId: interaction.connectionId },
			"move-ability": {
				type: "move-ability",
				abilityId: interaction.abilityId,
			},
		};
		return mappings[interaction.action] ?? null;
	}

	#completedMain() {
		const mainIds = new Set(
			this.#catalog.getMainMissions().map((mission) => mission.id),
		);
		return this.#progress.completedMissionIds.filter((id) => mainIds.has(id))
			.length;
	}

	#meta() {
		const missionId = this.#state?.toViewModel().id;
		const missionIndex = this.#catalog
			.getMainMissions()
			.findIndex((mission) => mission.id === missionId);
		return {
			completedMain: this.#completedMain(),
			totalMain: this.#catalog.getMainMissions().length,
			missionNumber: missionIndex >= 0 ? missionIndex + 1 : 0,
			sessionScore: this.#sessionScore,
		};
	}
}
