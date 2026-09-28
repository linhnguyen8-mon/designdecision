import { describe, expect, it } from "vitest";
import { randomScenario, scenarioLibrary } from "../src/scenarios";

describe("scenarioLibrary", () => {
  it("contains every requested category with keywords and scenarios", () => {
    expect(scenarioLibrary).toHaveLength(25);

    for (const category of scenarioLibrary) {
      expect(category.id).toMatch(/^[a-z0-9-]+$/);
      expect(category.label.length).toBeGreaterThan(0);
      expect(category.keywords.length).toBeGreaterThan(0);

      for (const keyword of category.keywords) {
        expect(keyword.scenarios.length).toBeGreaterThan(0);
      }
    }
  });

  it("can pick a random scenario globally and inside a category", () => {
    expect(randomScenario().scenario.title.length).toBeGreaterThan(0);
    expect(randomScenario("education").category.id).toBe("education");
  });
});
