import { describe, expect, it } from "vitest";
import { PIN_COLOURS, pickPinSvg, pinInner, pinSvg } from "@/lib/pin";
import { STATUS_IDS } from "@/lib/reports";

describe("map pins", () => {
  it("each status has its own colour", () => {
    expect(new Set(STATUS_IDS.map((s) => PIN_COLOURS[s])).size).toBe(3);
  });
  it("each status has its own shape inside too, so colour is never the only clue", () => {
    expect(new Set(STATUS_IDS.map((s) => pinInner(s))).size).toBe(3);
  });
  it("is a 34 × 42 picture, scaled to the width asked for", () => {
    expect(pinSvg("fixed")).toContain('width="34" height="42"');
    expect(pinSvg("fixed", 68)).toContain('width="68" height="84"');
  });
  it("is hidden from screen readers, because the marker has its own title", () => {
    expect(pinSvg("reported")).toContain('aria-hidden="true"');
  });
  it("has a yellow pin for choosing a place", () => {
    expect(pickPinSvg()).toContain("#ffc20e");
  });
});
