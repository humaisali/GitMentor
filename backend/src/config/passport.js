import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/User.js';

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
        callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback',
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

};

export default configurePassport;
