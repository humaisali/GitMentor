import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'gitmentor-dev-secret-key';

const configurePassport = () => {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: 'http://localhost:5000/api/auth/github/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ githubId: profile.id });

          if (user) {
            user.accessToken = accessToken;
            user.avatarUrl = profile.photos?.[0]?.value || '';
            await user.save();
            return done(null, user);
          }

          user = await User.create({
            githubId: profile.id,
            username: profile.username,
            avatarUrl: profile.photos?.[0]?.value || '',
            accessToken: accessToken,
          });

          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: 'http://localhost:5000/api/auth/google/callback',
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const token = req.query.state;
          if (!token) {
            return done(null, false, { message: 'No auth token provided' });
          }

          const decoded = jwt.verify(token, JWT_SECRET);
          const user = await User.findById(decoded.id);

          if (!user) {
            return done(null, false, { message: 'User not found' });
          }

          user.googleId = profile.id;
          if (refreshToken) {
            user.googleRefreshToken = refreshToken;
          }
          await user.save();
          return done(null, user);
        } catch (error) {
          console.error('Google Auth Error:', error);
          return done(error, null);
        }
      }
    )
  );
};

export default configurePassport;
