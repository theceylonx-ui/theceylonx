import { describe, expect, it } from "vitest";
import {
  publicRecommendationOrganizerSelection,
  type PublicRecommendationOrganizer,
} from "../enhancedRecommendationService";

describe("recommendation organizer contract", () => {
  it("contains only public organizer fields", () => {
    const organizer: PublicRecommendationOrganizer = {
      id: "user-1",
      name: "A Traveler",
      username: "traveler",
      image: null,
      profileImageUrl: null,
    };

    const publicKeys = [
      "id",
      "image",
      "name",
      "profileImageUrl",
      "username",
    ];

    expect(Object.keys(publicRecommendationOrganizerSelection).sort()).toEqual(publicKeys);
    expect(Object.keys(organizer).sort()).toEqual(publicKeys);
    expect(organizer).not.toHaveProperty("password");
    expect(organizer).not.toHaveProperty("email");
    expect(organizer).not.toHaveProperty("phone");
    expect(organizer).not.toHaveProperty("provider");
    expect(organizer).not.toHaveProperty("roleId");
    expect(organizer).not.toHaveProperty("preferences");
  });
});