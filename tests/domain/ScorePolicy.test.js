import { describe, expect, it } from "vitest";
import { ScorePolicy } from "../../src/domain/ScorePolicy.js";

describe("ScorePolicy", () => {
	it("첫 시도와 무힌트 보너스를 더한다", () => {
		const policy = new ScorePolicy();

		expect(policy.calculate()).toBe(150);
		expect(policy.calculate({ attempts: 1, hintsUsed: 0 })).toBe(125);
		expect(policy.calculate({ attempts: 1, hintsUsed: 1 })).toBe(100);
	});
});
