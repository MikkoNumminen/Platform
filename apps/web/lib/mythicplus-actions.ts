"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { ActionError } from "@/lib/actionErrors";
import { safe, validateUUID, type ActionResult } from "@/lib/actionUtils";
import { rateLimit } from "@/lib/rateLimit";
import { revalidatePath } from "next/cache";
import { getTenantFilter } from "@/lib/tenant";
import { fetchRaiderIoCharacter } from "@/lib/raiderio";

const VALID_REGIONS = ["us", "eu", "kr", "tw"] as const;
const MAX_NAME_LENGTH = 30;

export async function addCharacter(
  name: string,
  realm: string,
  region: string,
): Promise<ActionResult> {
  return safe(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new ActionError("permissionDenied", "Not authenticated");
    }

    const trimmedName = name.trim();
    const trimmedRealm = realm.trim().toLowerCase().replace(/\s+/g, "-");

    if (!trimmedName || trimmedName.length > MAX_NAME_LENGTH) {
      throw new ActionError("invalidInput", "Character name is required (max 30 characters)");
    }
    if (!trimmedRealm) {
      throw new ActionError("invalidInput", "Realm is required");
    }
    if (trimmedRealm.length > 100) throw new ActionError("invalidInput", "Realm name is too long");
    if (!VALID_REGIONS.includes(region as (typeof VALID_REGIONS)[number])) {
      throw new ActionError("invalidInput", `Invalid region: ${region}. Use us, eu, kr, or tw.`);
    }

    await rateLimit("mythicplus:add");

    const { tenant, sessionId } = await getTenantFilter();

    const existing = await prisma.wowCharacter.findFirst({
      where: {
        characterName: { equals: trimmedName, mode: "insensitive" },
        realm: trimmedRealm,
        region,
        tenant,
        sessionId,
      },
    });
    if (existing) {
      throw new ActionError("characterAlreadyAdded", "This character has already been added.");
    }

    const data = await fetchRaiderIoCharacter(trimmedName, trimmedRealm, region);

    await prisma.wowCharacter.create({
      data: {
        characterName: data.name,
        realm: data.realm,
        region: data.region,
        className: data.className,
        spec: data.spec,
        specRole: data.specRole,
        race: data.race,
        itemLevel: data.itemLevel,
        mythicPlusRating: data.mythicPlusRating,
        thumbnailUrl: data.thumbnailUrl,
        profileUrl: data.profileUrl,
        lastFetchedAt: new Date(),
        addedById: session.user.id,
        tenant,
        sessionId,
      },
    });

    revalidatePath("/mythic-plus");
  });
}

export async function removeCharacter(characterId: string): Promise<ActionResult> {
  return safe(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new ActionError("permissionDenied", "Not authenticated");
    }

    validateUUID(characterId, "character ID");
    const { tenant, sessionId } = await getTenantFilter();

    const character = await prisma.wowCharacter.findFirst({
      where: { id: characterId, tenant, sessionId },
    });
    if (!character) {
      throw new ActionError("notFound", "Character not found");
    }

    await prisma.wowCharacter.delete({ where: { id: characterId } });

    revalidatePath("/mythic-plus");
  });
}

export async function refreshCharacter(characterId: string): Promise<ActionResult> {
  return safe(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new ActionError("permissionDenied", "Not authenticated");
    }

    validateUUID(characterId, "character ID");
    const { tenant, sessionId } = await getTenantFilter();

    const character = await prisma.wowCharacter.findFirst({
      where: { id: characterId, tenant, sessionId },
    });
    if (!character) {
      throw new ActionError("notFound", "Character not found");
    }

    const data = await fetchRaiderIoCharacter(
      character.characterName,
      character.realm,
      character.region,
    );

    await prisma.wowCharacter.update({
      where: { id: characterId },
      data: {
        className: data.className,
        spec: data.spec,
        specRole: data.specRole,
        race: data.race,
        itemLevel: data.itemLevel,
        mythicPlusRating: data.mythicPlusRating,
        thumbnailUrl: data.thumbnailUrl,
        profileUrl: data.profileUrl,
        lastFetchedAt: new Date(),
      },
    });

    revalidatePath("/mythic-plus");
  });
}

export async function refreshAllCharacters(): Promise<ActionResult> {
  return safe(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new ActionError("permissionDenied", "Not authenticated");
    }

    const { tenant, sessionId } = await getTenantFilter();

    const characters = await prisma.wowCharacter.findMany({
      where: { tenant, sessionId, addedById: session.user.id },
    });

    for (const character of characters) {
      try {
        const data = await fetchRaiderIoCharacter(
          character.characterName,
          character.realm,
          character.region,
        );

        await prisma.wowCharacter.update({
          where: { id: character.id },
          data: {
            className: data.className,
            spec: data.spec,
            specRole: data.specRole,
            race: data.race,
            itemLevel: data.itemLevel,
            mythicPlusRating: data.mythicPlusRating,
            thumbnailUrl: data.thumbnailUrl,
            profileUrl: data.profileUrl,
            lastFetchedAt: new Date(),
          },
        });
      } catch {
        // Skip failures — don't break the whole refresh
      }
    }

    revalidatePath("/mythic-plus");
  });
}

// ── Team actions ──────────────────────────────────────────────────────────

const VALID_SLOTS = ["tankId", "healerId", "dps1Id", "dps2Id", "dps3Id"] as const;
type TeamSlot = (typeof VALID_SLOTS)[number];

export async function createTeam(name: string): Promise<ActionResult> {
  return safe(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new ActionError("permissionDenied", "Not authenticated");
    }

    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 50) {
      throw new ActionError("invalidInput", "Team name is required (max 50 characters)");
    }

    const { tenant, sessionId } = await getTenantFilter();

    await prisma.mythicPlusTeam.create({
      data: {
        name: trimmed,
        creatorId: session.user.id,
        tenant,
        sessionId,
      },
    });

    revalidatePath("/mythic-plus");
  });
}

export async function updateTeamSlot(
  teamId: string,
  slot: string,
  characterId: string | null,
): Promise<ActionResult> {
  return safe(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new ActionError("permissionDenied", "Not authenticated");
    }

    validateUUID(teamId, "team ID");
    if (characterId) validateUUID(characterId, "character ID");

    if (!VALID_SLOTS.includes(slot as TeamSlot)) {
      throw new ActionError("invalidInput", `Invalid slot: ${slot}`);
    }

    const { tenant, sessionId } = await getTenantFilter();

    const team = await prisma.mythicPlusTeam.findFirst({
      where: { id: teamId, tenant, sessionId },
    });
    if (!team) {
      throw new ActionError("notFound", "Team not found");
    }

    await prisma.mythicPlusTeam.update({
      where: { id: teamId },
      data: { [slot]: characterId },
    });

    revalidatePath("/mythic-plus");
  });
}

export async function deleteTeam(teamId: string): Promise<ActionResult> {
  return safe(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new ActionError("permissionDenied", "Not authenticated");
    }

    validateUUID(teamId, "team ID");
    const { tenant, sessionId } = await getTenantFilter();

    const team = await prisma.mythicPlusTeam.findFirst({
      where: { id: teamId, tenant, sessionId },
    });
    if (!team) {
      throw new ActionError("notFound", "Team not found");
    }

    await prisma.mythicPlusTeam.delete({ where: { id: teamId } });

    revalidatePath("/mythic-plus");
  });
}
