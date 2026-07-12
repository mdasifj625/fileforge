import { describe, it, expect } from "vitest";
import { User } from "../models/User";
import { Subscription } from "../models/Subscription";

describe("Database Models", () => {
  it("User model should be defined", () => {
    expect(User).toBeDefined();
    expect(User.modelName).toBe("User");
  });

  it("Subscription model should be defined", () => {
    expect(Subscription).toBeDefined();
    expect(Subscription.modelName).toBe("Subscription");
  });
});
