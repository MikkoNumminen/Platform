import { Autocomplete, Box, TextField, Typography } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import { colors } from "../../styles";

const WHISPER_COLOR = "#FF80FF";

type DmUser = {
  id: string;
  alias: string;
  role: string;
  developerTag: string | null;
};

interface UserPickerProps {
  users: DmUser[];
  loading: boolean;
  placeholder: string;
  onSelect: (user: DmUser | null) => void;
}

export default function UserPicker({ users, loading, placeholder, onSelect }: UserPickerProps) {
  return (
    <Box sx={{ py: 1 }}>
      <Typography
        variant="body2"
        sx={{ color: colors.slate400, fontFamily: "inherit", mb: 1, fontSize: "0.8rem" }}
      >
        Type <span style={{ color: WHISPER_COLOR }}>/w alias message</span> or pick a user:
      </Typography>
      <Autocomplete
        options={users}
        getOptionLabel={(o) => o.alias}
        loading={loading}
        onChange={(_, val) => onSelect(val)}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={placeholder}
            size="small"
            autoFocus
            sx={{
              "& .MuiInputBase-root": {
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: "0.85rem",
                backgroundColor: colors.slate700,
                color: colors.slate100,
              },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.slate300 },
            }}
          />
        )}
        renderOption={(props, option) => (
          <li {...props} key={option.id}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {option.role === "superuser" && (
                <StarIcon sx={{ fontSize: 14, color: colors.warning }} />
              )}
              <Typography variant="body2">{option.alias}</Typography>
              <Typography variant="caption" sx={{ color: colors.slate400 }}>
                {option.role}
              </Typography>
            </Box>
          </li>
        )}
      />
    </Box>
  );
}
