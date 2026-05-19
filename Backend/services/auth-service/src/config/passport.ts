import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';

// ── Google Strategy ───────────────────────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.API_BASE_URL || 'http://localhost:4001'}/api/auth/oauth/google/callback`,
      },
      (_accessToken, _refreshToken, profile, done) => {
        done(null, profile);
      }
    )
  );
}

// ── GitHub Strategy ───────────────────────────────────────────────────────
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${process.env.API_BASE_URL || 'http://localhost:4001'}/api/auth/oauth/github/callback`,
        scope: ['user:email'],
      },
      (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
        done(null, profile);
      }
    )
  );
}

// ── Microsoft Strategy (Azure AD) ─────────────────────────────────────────
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  passport.use('microsoft', new OAuth2Strategy(
    {
      authorizationURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      clientID: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      callbackURL: `${process.env.API_BASE_URL || 'http://localhost:4001'}/api/auth/oauth/microsoft/callback`,
      scope: ['openid', 'profile', 'email'],
    },
    async (accessToken: string, _refreshToken: string, _profile: any, done: any) => {
      try {
        // Fetch user profile from Microsoft Graph API
        const response = await fetch('https://graph.microsoft.com/v1.0/me', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const profile = await response.json() as any;
        
        // Transform to standard format
        const standardProfile = {
          id: profile.id,
          displayName: profile.displayName,
          name: {
            givenName: profile.givenName,
            familyName: profile.surname,
          },
          emails: [{ value: profile.mail || profile.userPrincipalName }],
          photos: profile.photo ? [{ value: profile.photo }] : [],
        };

        done(null, standardProfile);
      } catch (error) {
        done(error);
      }
    }
  ));
}

export default passport;
