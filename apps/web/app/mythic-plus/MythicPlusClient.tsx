"use client";

import { useState, useTransition } from "react";
import { Box, Button, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import { colors } from "../styles";
import { refreshAllCharacters } from "@/lib/mythicplus-actions";
import type { WowCharacterData, MythicPlusTeamData } from "@/lib/mythicplus-queries";
import CharacterCard from "./CharacterCard";
import AddCharacterDialog from "./AddCharacterDialog";
import TeamComposition from "./TeamComposition";

interface MythicPlusClientProps {
  characters: WowCharacterData[];
  teams: MythicPlusTeamData[];
}

export default function MythicPlusClient({ characters, teams }: MythicPlusClientProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleRefreshAll = () => {
    startTransition(async () => {
      await refreshAllCharacters();
    });
  };

  return (
    <Box sx={{ py: 2 }}>
      {/* Actions bar */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mb: 2 }}>
        {characters.length > 0 && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={handleRefreshAll}
            disabled={isPending}
          >
            {isPending ? "Refreshing..." : "Refresh All"}
          </Button>
        )}
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setShowAdd(true)}
        >
          Add Character
        </Button>
      </Box>

      {/* Character list */}
      {characters.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            color: colors.slate400,
          }}
        >
          <SportsEsportsIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
          <Typography variant="body1" sx={{ mb: 1 }}>
            No characters added yet
          </Typography>
          <Typography variant="body2">
            Add your team&apos;s WoW characters to track Mythic+ progress and item levels.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {characters.map((character) => (
            <CharacterCard key={character.id} character={character} />
          ))}
        </Box>
      )}

      {/* Teams section */}
      {characters.length > 0 && <TeamComposition teams={teams} characters={characters} />}

      <AddCharacterDialog open={showAdd} onClose={() => setShowAdd(false)} />
    </Box>
  );
}
