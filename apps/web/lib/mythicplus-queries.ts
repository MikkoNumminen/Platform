import { prisma } from "@/lib/db";
import { getDemoSessionId } from "@/lib/demo-session";

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
  const sessionId = await getDemoSessionId();

  const characters = await prisma.wowCharacter.findMany({
    where: { sessionId },
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
