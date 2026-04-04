import { prisma } from "@/lib/db";
import { getTenantFilter } from "@/lib/tenant";

export interface WowCharacterData {
  id: string;
  characterName: string;
  realm: string;
  region: string;
  className: string | null;
  spec: string | null;
  specRole: string | null;
  race: string | null;
  itemLevel: number | null;
  mythicPlusRating: number | null;
  thumbnailUrl: string | null;
  profileUrl: string | null;
  lastFetchedAt: string | null;
  addedBy: string;
  createdAt: string;
}

export async function getTeamCharacters(): Promise<WowCharacterData[]> {
  const { tenant, sessionId } = await getTenantFilter();

  const characters = await prisma.wowCharacter.findMany({
    where: { tenant, sessionId },
    include: { addedBy: { select: { alias: true, name: true } } },
    orderBy: { mythicPlusRating: "desc" },
  });

  return characters.map((c) => ({
    id: c.id,
    characterName: c.characterName,
    realm: c.realm,
    region: c.region,
    className: c.className,
    spec: c.spec,
    specRole: c.specRole,
    race: c.race,
    itemLevel: c.itemLevel,
    mythicPlusRating: c.mythicPlusRating,
    thumbnailUrl: c.thumbnailUrl,
    profileUrl: c.profileUrl,
    lastFetchedAt: c.lastFetchedAt?.toISOString() ?? null,
    addedBy: c.addedBy.alias ?? c.addedBy.name ?? "Unknown",
    createdAt: c.createdAt.toISOString(),
  }));
}

export interface TeamSlotData {
  id: string | null;
  characterName: string | null;
  className: string | null;
  spec: string | null;
  specRole: string | null;
  itemLevel: number | null;
  mythicPlusRating: number | null;
  thumbnailUrl: string | null;
}

export interface MythicPlusTeamData {
  id: string;
  name: string;
  tank: TeamSlotData | null;
  healer: TeamSlotData | null;
  dps1: TeamSlotData | null;
  dps2: TeamSlotData | null;
  dps3: TeamSlotData | null;
  createdAt: string;
}

const SLOT_SELECT = {
  select: {
    id: true,
    characterName: true,
    className: true,
    spec: true,
    specRole: true,
    itemLevel: true,
    mythicPlusRating: true,
    thumbnailUrl: true,
  },
};

export async function getTeams(): Promise<MythicPlusTeamData[]> {
  const { tenant, sessionId } = await getTenantFilter();

  const teams = await prisma.mythicPlusTeam.findMany({
    where: { tenant, sessionId },
    include: {
      tank: SLOT_SELECT,
      healer: SLOT_SELECT,
      dps1: SLOT_SELECT,
      dps2: SLOT_SELECT,
      dps3: SLOT_SELECT,
    },
    orderBy: { createdAt: "desc" },
  });

  return teams.map((t) => ({
    id: t.id,
    name: t.name,
    tank: t.tank,
    healer: t.healer,
    dps1: t.dps1,
    dps2: t.dps2,
    dps3: t.dps3,
    createdAt: t.createdAt.toISOString(),
  }));
}
