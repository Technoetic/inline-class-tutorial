import { describe, expect, it } from "vitest";
import { MissionCatalog } from "../../src/data/MissionCatalog.js";
import { missionContent } from "../../src/data/missions.js";

describe("MissionCatalog", () => {
	it("훈련 하나와 본 미션 넷을 순서대로 제공한다", async () => {
		const catalog = new MissionCatalog({ missions: missionContent });
		await catalog.init();

		expect(catalog.getTraining().kind).toBe("tutorial");
		expect(catalog.getMainMissions()).toHaveLength(4);
		expect(
			catalog.getFirstPlayable({ tutorialSeen: false, completedMissionIds: [] })
				.id,
		).toBe("training-scanner");
		expect(
			catalog.getFirstPlayable({
				tutorialSeen: true,
				completedMissionIds: ["echo-relay"],
			}).id,
		).toBe("life-garden");
	});

	it("최종 판별에 정확히 한 정답만 둔다", async () => {
		const catalog = new MissionCatalog({ missions: missionContent });
		await catalog.init();

		expect(
			catalog.getFinalChallenge().choices.filter((choice) => choice.correct),
		).toHaveLength(1);
	});
});
