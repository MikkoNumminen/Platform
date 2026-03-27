import { Button, Card, CardContent, Typography } from "@mui/material";
import { colors } from "../styles";

export default function SurveyCTA() {
  return (
    <Card
      sx={{
        maxWidth: 600,
        mx: "auto",
        mt: 4,
        border: `1px solid ${colors.green400}`,
      }}
    >
      <CardContent sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h5" gutterBottom>
          Help us build this
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          We&apos;re building a new community platform and want your input. Take a quick survey to
          tell us what features matter most to you.
        </Typography>
        <Button
          variant="contained"
          size="large"
          href="/survey"
          sx={{
            backgroundColor: colors.green400,
            "&:hover": { backgroundColor: colors.green900 },
          }}
        >
          Take the survey
        </Button>
      </CardContent>
    </Card>
  );
}
