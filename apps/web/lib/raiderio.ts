import { ActionError } from "@/lib/actionErrors";

export interface RaiderIoCharacter {
  name: string;
  realm: string;
  region: string;
  className: string;
  spec: string;
  specRole: string;
  race: string;
  itemLevel: number;
  mythicPlusRating: number;
  thumbnailUrl: string;
  profileUrl: string;
}

interface RaiderIoResponse {
  name: string;
  race: string;
  class: string;
  active_spec_name: string;
  active_spec_role: string;
  region: string;
  realm: string;
  thumbnail_url: string;
  profile_url: string;
  gear?: {
    item_level_equipped: number;
  };
  mythic_plus_scores_by_season?: Array<{
    scores: {
      all: number;
    };
  }>;
}

export async function fetchRaiderIoCharacter(
  name: string,
  realm: string,
  region: string,
): Promise<RaiderIoCharacter> {
  const url = new URL("https://raider.io/api/v1/characters/profile");
  url.searchParams.set("region", region);
  url.searchParams.set("realm", realm);
  url.searchParams.set("name", name);
  url.searchParams.set("fields", "mythic_plus_scores_by_season:current,gear");

  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(10000),
  });

  if (response.status === 400 || response.status === 404) {
    throw new ActionError(
      "characterNotFound",
      `Character "${name}" not found on ${realm}-${region}. Check the name and realm.`,
    );
  }

  if (!response.ok) {
    throw new ActionError("raiderIoError", `Raider.IO returned status ${response.status}`);
  }

  const data = (await response.json()) as RaiderIoResponse;

  return {
    name: data.name,
    realm: data.realm,
    region: data.region,
    className: data.class,
    spec: data.active_spec_name,
    specRole: data.active_spec_role,
    race: data.race,
    itemLevel: data.gear?.item_level_equipped ?? 0,
    mythicPlusRating: data.mythic_plus_scores_by_season?.[0]?.scores?.all ?? 0,
    thumbnailUrl: data.thumbnail_url,
    profileUrl: data.profile_url,
  };
}
