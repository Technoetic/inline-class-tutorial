import { beforeAll, describe, expect, it } from "vitest";
import { MissionCatalog } from "../../src/data/MissionCatalog.js";
import { missionContent } from "../../src/data/missions.js";
import { MissionEngine } from "../../src/domain/MissionEngine.js";
import { ScorePolicy } from "../../src/domain/ScorePolicy.js";
import {
	appRootTemplate,
	fatalTemplate,
	launchTemplate,
	missionTemplate,
} from "../../src/ui/templates/index.js";
import { actionButton } from "../../src/ui/templates/primitives.js";

describe("UI templates", () => {
	let catalog;
	let engine;

	beforeAll(async () => {
		catalog = new MissionCatalog({ missions: missionContent });
		await catalog.init();
		engine = new MissionEngine({ scorePolicy: new ScorePolicy() });
	});

	it("상태 호스트와 두 live region을 한 번씩 만든다", () => {
		const markup = appRootTemplate();

		expect(markup.match(/data-scene-host/g)).toHaveLength(1);
		expect(markup.match(/data-status-announcer/g)).toHaveLength(1);
		expect(markup.match(/data-alert-announcer/g)).toHaveLength(1);
	});

	it("미션 컴포넌트를 실제 domain view model로 조립한다", () => {
		const state = engine.createSession(catalog.getTraining());
		const markup = missionTemplate(state.toViewModel(), {
			completedMain: 0,
			missionNumber: 0,
			sessionScore: 0,
			totalMain: 4,
		});

		expect(markup).toContain('id="mission-main"');
		expect(markup).toContain('aria-labelledby="core-title"');
		expect(markup).toContain('data-action="move-ability"');
		expect(markup).toContain('id="why-drawer"');
		expect(markup).not.toContain("undefined");
	});

	it("동적 action 속성과 문구를 HTML escape한다", () => {
		const markup = actionButton({
			action: 'go" onclick="alert(1)',
			label: "<script>bad()</script>",
			tone: "primary",
		});

		expect(markup).not.toContain("<script>");
		expect(markup).not.toContain(' onclick="');
		expect(markup).toContain("&lt;script&gt;bad()&lt;/script&gt;");
	});

	it("각 독립 장면도 완결된 landmark를 제공한다", () => {
		const launch = launchTemplate({
			bestScore: 0,
			completedMissionIds: [],
			tutorialSeen: false,
		});

		expect(launch).toContain('aria-labelledby="launch-title"');
		expect(launch).toContain('data-focus-key="start"');
		expect(fatalTemplate()).toContain('class="fatal-screen"');
	});
});
