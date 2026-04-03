"use client";

import { DEVELOPER_TAG_LABELS, DEVELOPER_TAG_ICONS } from "@/lib/developer-config";
import { setMotd as setMotdAction } from "@/lib/setting-actions";
import { getDmUserDetails } from "@/lib/dm-queries";
import type { SystemLine } from "./SystemMessages";

type DmUser = {
  id: string;
  alias: string;
  role: string;
  developerTag: string | null;
};

interface UseShoutboxCommandsParams {
  ensureUsersLoaded: () => Promise<DmUser[]>;
  setLocalSystemMsgs: React.Dispatch<React.SetStateAction<SystemLine[]>>;
  helpLines: SystemLine[];
  canChangeMotd: boolean;
  setCurrentMotd: React.Dispatch<React.SetStateAction<string>>;
  userRole: string | undefined;
}

interface UseShoutboxCommandsReturn {
  handleHelpCommand: () => void;
  handleWhoCommand: (targetAlias: string) => Promise<void>;
  handleMotdCommand: (newMotd: string) => Promise<void>;
}

export function useShoutboxCommands({
  ensureUsersLoaded,
  setLocalSystemMsgs,
  helpLines,
  canChangeMotd,
  setCurrentMotd,
  userRole,
}: UseShoutboxCommandsParams): UseShoutboxCommandsReturn {
  const handleHelpCommand = (): void => {
    setLocalSystemMsgs((prev) => [...prev, ...helpLines]);
  };

  const handleWhoCommand = async (targetAlias: string): Promise<void> => {
    const users = await ensureUsersLoaded();
    const target = users.find((u) => u.alias.toLowerCase() === targetAlias.toLowerCase());
    if (!target) {
      setLocalSystemMsgs((prev) => [
        ...prev,
        { label: "[System]", text: `No player named "${targetAlias}" found.` },
      ]);
      return;
    }

    const tagIcon = target.developerTag ? DEVELOPER_TAG_ICONS[target.developerTag] : null;
    const tagLabel = target.developerTag ? DEVELOPER_TAG_LABELS[target.developerTag] : null;
    const roleLabel = target.role === "superuser" ? "⭐ Superuser" : target.role;
    const infoParts = [roleLabel];
    if (tagLabel) infoParts.push(tagLabel);

    if (userRole === "superuser") {
      const details = await getDmUserDetails(target.id);
      if (details?.name) infoParts.push(`Name: ${details.name}`);
      if (details?.email) infoParts.push(details.email);
    }

    const lines: SystemLine[] = [
      {
        label: "[Who]",
        text: `${target.alias}${tagIcon ? ` ${tagIcon}` : ""} — ${infoParts.join(" · ")}`,
      },
    ];
    setLocalSystemMsgs((prev) => [...prev, ...lines]);
  };

  const handleMotdCommand = async (newMotd: string): Promise<void> => {
    if (!canChangeMotd) return;
    const result = await setMotdAction(newMotd);
    if (result?.error) {
      setLocalSystemMsgs((prev) => [...prev, { label: "[System]", text: result.error }]);
    } else {
      setCurrentMotd(newMotd);
      setLocalSystemMsgs((prev) => [
        ...prev,
        { label: "[System]", text: `MOTD updated: ${newMotd}` },
      ]);
    }
  };

  return { handleHelpCommand, handleWhoCommand, handleMotdCommand };
}
