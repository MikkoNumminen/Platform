import { Box, Typography, Card, CardContent } from "@mui/material";
import TopBar from "../components/TopBar";
import { colors } from "../styles";

export default function PrivacyPolicyPage() {
  return (
    <>
      <TopBar title="Privacy Policy" backHref="/" />
      <Box sx={{ maxWidth: 800, mx: "auto", px: { xs: 2, sm: 3 }, py: 2 }}>
        <Card>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Section title="1. What data we collect">
              <P>When you sign in via Google or GitHub OAuth, we receive and store:</P>
              <Ul>
                <Li>Email address (used as your unique identifier)</Li>
                <Li>Display name (from your OAuth provider)</Li>
                <Li>Profile picture URL (from your OAuth provider)</Li>
              </Ul>
              <P>You may also provide:</P>
              <Ul>
                <Li>A public alias (callsign) displayed instead of your real name</Li>
                <Li>A bio (short description)</Li>
              </Ul>
              <P>
                We store content you create: posts, forum topics, comments, shoutbox messages,
                calendar events, issue reports, and survey responses.
              </P>
            </Section>

            <Section title="2. How we use your data">
              <Ul>
                <Li>Authentication and session management</Li>
                <Li>Displaying your content with your alias</Li>
                <Li>Role-based access control and permission enforcement</Li>
                <Li>Rate limiting (using your user ID or IP address, retained for 60 seconds)</Li>
              </Ul>
            </Section>

            <Section title="3. Cookies and local storage">
              <P>
                We use a single authentication cookie (<code>authjs.session-token</code>) which is
                strictly necessary for the site to function. No consent is required for this cookie
                under GDPR.
              </P>
              <P>We also use browser localStorage for:</P>
              <Ul>
                <Li>Theme preference (persists your chosen UI theme)</Li>
                <Li>Survey submission flag (prevents duplicate survey submissions)</Li>
              </Ul>
              <P>
                localStorage data is stored only on your device and is never sent to our servers.
              </P>
            </Section>

            <Section title="4. Third-party sharing">
              <P>
                We do not share your data with any third parties. We do not use analytics services,
                advertising networks, or tracking pixels. Your data stays within this platform.
              </P>
            </Section>

            <Section title="5. Data retention">
              <Ul>
                <Li>Account data is retained until you delete your account</Li>
                <Li>Content you create is retained until you or an admin deletes it</Li>
                <Li>Rate limiting data expires automatically after 60 seconds</Li>
                <Li>Soft-deleted records are periodically purged from the database</Li>
              </Ul>
            </Section>

            <Section title="6. Your rights (GDPR)">
              <P>As an EU resident, you have the right to:</P>
              <Ul>
                <Li>
                  <strong>Access</strong> — Download a copy of all your data from your{" "}
                  <a href="/account" style={{ color: "inherit" }}>
                    Account Settings
                  </a>
                </Li>
                <Li>
                  <strong>Erasure</strong> — Delete your account and all personal data from your{" "}
                  <a href="/account" style={{ color: "inherit" }}>
                    Account Settings
                  </a>
                  . Your authored content will be anonymized (not deleted) to preserve discussion
                  threads.
                </Li>
                <Li>
                  <strong>Rectification</strong> — Update your alias and profile information at any
                  time
                </Li>
                <Li>
                  <strong>Portability</strong> — Export your data in machine-readable JSON format
                </Li>
              </Ul>
            </Section>

            <Section title="7. Security">
              <P>
                We protect your data with HTTPS encryption, secure session tokens, role-based access
                control, rate limiting, and security headers (CSP, HSTS, X-Frame-Options). OAuth
                tokens from Google/GitHub are not stored — only the profile information listed
                above.
              </P>
            </Section>

            <Section title="8. Contact">
              <P>
                For questions about your data or to exercise your rights, contact the platform
                administrator.
              </P>
            </Section>
          </CardContent>
        </Card>
      </Box>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ color: colors.green400, mb: 1.5, fontSize: "1.05rem" }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="body2" sx={{ color: colors.slate100, mb: 1.5, lineHeight: 1.7 }}>
      {children}
    </Typography>
  );
}

function Ul({ children }: { children: React.ReactNode }) {
  return (
    <Box component="ul" sx={{ pl: 3, mb: 1.5, "& li": { mb: 0.5 } }}>
      {children}
    </Box>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <Typography component="li" variant="body2" sx={{ color: colors.slate100, lineHeight: 1.7 }}>
      {children}
    </Typography>
  );
}
