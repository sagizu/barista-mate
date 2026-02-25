
import { calculateSmartDialIn, DrinkType } from "./dial-in";

describe("calculateSmartDialIn", () => {
  // Test cases for Ristretto
  describe("Ristretto", () => {
    const drinkType: DrinkType = "ristretto";

    it('should return "perfect" for a perfect shot', () => {
      // roastLevel 3, target is 22s.
      const result = calculateSmartDialIn(drinkType, 3, 22);
      expect(result.feedback).toBe("perfect");
      expect(result.message).toBe("חילוץ מעולה! הטעמים מאוזנים.");
      expect(result.advice).toBe("");
    });

    it('should return "good" and "grind finer" for a slightly fast shot', () => {
      // roastLevel 3, target is 22s. 10% deviation is 2.2s. Time = 19.8s
      const result = calculateSmartDialIn(drinkType, 3, 20);
      expect(result.feedback).toBe("good");
      expect(result.advice).toBe("טחן דק יותר ⬆️");
    });

    it('should return "good" and "grind coarser" for a slightly slow shot', () => {
      // roastLevel 3, target is 22s. 10% deviation is 2.2s. Time = 24.2s
      const result = calculateSmartDialIn(drinkType, 3, 24);
      expect(result.feedback).toBe("good");
      expect(result.advice).toBe("טחן גס יותר ⬇️");
    });

    it('should return "bad" and "grind finer" for a very fast shot', () => {
      // roastLevel 3, target is 22s. 20% deviation is 4.4s. Time = 17.6s
      const result = calculateSmartDialIn(drinkType, 3, 17);
      expect(result.feedback).toBe("bad");
      expect(result.advice).toBe("טחן דק יותר ⬆️");
    });

    it('should return "bad" and "grind coarser" for a very slow shot', () => {
        // roastLevel 3, target is 22s. 20% deviation is 4.4s. Time = 26.4s
      const result = calculateSmartDialIn(drinkType, 3, 27);
      expect(result.feedback).toBe("bad");
      expect(result.advice).toBe("טחן גס יותר ⬇️");
    });
  });

  // Test cases for Espresso
  describe("Espresso", () => {
    const drinkType: DrinkType = "espresso";

    it("should adjust target time based on roast level", () => {
      // Roast level 1 (light) -> target 28 + (3-1)*2 = 32s
      let result = calculateSmartDialIn(drinkType, 1, 32);
      expect(result.feedback).toBe("perfect");

      // Roast level 5 (dark) -> target 28 + (3-5)*2 = 24s
      result = calculateSmartDialIn(drinkType, 5, 24);
      expect(result.feedback).toBe("perfect");
    });
  });

    // Test cases for Lungo
    describe("Lungo", () => {
        const drinkType: DrinkType = "lungo";

        it("should return 'perfect' for a perfect shot with light roast", () => {
            // roastLevel 1, target is 34 + (3-1)*2 = 38s
            const result = calculateSmartDialIn(drinkType, 1, 38);
            expect(result.feedback).toBe("perfect");
        });

        it("should return 'bad' for a very fast shot with dark roast", () => {
            // roastLevel 5, target is 34 + (3-5)*2 = 30s
            const result = calculateSmartDialIn(drinkType, 5, 20);
            expect(result.feedback).toBe("bad");
        });
    });
});
