import { GameController } from "../controllers/GameController.js";
import { MissionCatalog } from "../data/MissionCatalog.js";
import { missionContent } from "../data/missions.js";
import { MissionEngine } from "../domain/MissionEngine.js";
import { ScorePolicy } from "../domain/ScorePolicy.js";
import { AnimationController } from "../platform/AnimationController.js";
import { MotionPreference } from "../platform/MotionPreference.js";
import { ProgressStore } from "../storage/ProgressStore.js";
import { FocusManager } from "../ui/FocusManager.js";
import { GameView } from "../ui/GameView.js";
import { StatusAnnouncer } from "../ui/StatusAnnouncer.js";
import { GameApp } from "./GameApp.js";

export class CompositionRoot {
	create({ root }) {
		const catalog = new MissionCatalog({ missions: missionContent });
		const motionPreference = new MotionPreference();
		const animationController = new AnimationController({ motionPreference });
		const view = new GameView({
			root,
			focusManager: new FocusManager(),
			announcer: new StatusAnnouncer(),
			animationController,
		});
		const engine = new MissionEngine({ scorePolicy: new ScorePolicy() });
		const progressStore = new ProgressStore();
		const controller = new GameController({
			catalog,
			engine,
			view,
			progressStore,
		});
		return new GameApp({
			catalog,
			progressStore,
			motionPreference,
			view,
			controller,
		});
	}
}
