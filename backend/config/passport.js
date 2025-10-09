const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const mongoose = require('mongoose');
const { createUserFolder } = require('./storage');
const { ensureOrganizationForUser } = require('../services/organizationService');
const { ensureAgentProfile } = require('../services/agentProfileService');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_REDIRECT_URI || "http://localhost:4004/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('Google OAuth callback received for:', profile.emails[0].value);

      // Check if user already exists with this Google ID
      let existingUser = await User.findOne({ googleId: profile.id });
      
      if (existingUser) {
        console.log('Existing Google user found:', existingUser.email);
        // Update last login time
        existingUser.lastLogin = new Date();
        if (refreshToken) {
          existingUser.googleRefreshToken = refreshToken;
        }
        await existingUser.save();
        return done(null, existingUser);
      }

      // Check if user exists with same email (email registration)
      let emailUser = await User.findOne({ 
        email: profile.emails[0].value,
        authProvider: 'email' 
      });

      if (emailUser) {
        console.log('Email user exists, linking Google account:', emailUser.email);
        // Link Google account to existing email user
        emailUser.googleId = profile.id;
        emailUser.authProvider = 'google';
        emailUser.profilePicture = profile.photos[0]?.value || null;
        emailUser.displayName = profile.displayName;
        emailUser.lastLogin = new Date();
        if (refreshToken) {
          emailUser.googleRefreshToken = refreshToken;
        }
        emailUser.role = emailUser.role || 'solo_agent';
        if (!emailUser.storageFolder) {
          emailUser.storageFolder = emailUser._id.toString();
        }
        await emailUser.save();

        await ensureOrganizationForUser(emailUser);
        await createUserFolder(emailUser._id.toString(), emailUser.organization);
        await ensureAgentProfile(emailUser);
        return done(null, emailUser);
      }

      // Create new user with Google OAuth
      console.log('Creating new Google user:', profile.emails[0].value);
      const tempStorageId = new mongoose.Types.ObjectId().toString();
      const newUser = new User({
        googleId: profile.id,
        email: profile.emails[0].value,
        company: profile.emails[0].value.split('@')[1] || 'Google User', // Use domain as company
        displayName: profile.displayName,
        profilePicture: profile.photos[0]?.value || null,
        authProvider: 'google',
        googleRefreshToken: refreshToken || null,
        storageFolder: tempStorageId,
        photoCredits: 10,  // Default free credits
        isUnlimited: false,
        createdAt: new Date(),
        lastLogin: new Date(),
        role: 'solo_agent'
      });

      await newUser.save();
      console.log(`Google user created: ${newUser.email}`);

      const organization = await ensureOrganizationForUser(newUser);
      newUser.organization = organization._id;
      newUser.storageFolder = newUser._id.toString();
      await newUser.save();
      console.log(`Storage folder assigned: ${newUser.storageFolder}`);

      await createUserFolder(newUser.storageFolder, organization._id);
      await ensureAgentProfile(newUser);
      console.log(`Object storage folders prepared for Google user: ${newUser.storageFolder}`);

      return done(null, newUser);

    } catch (error) {
      console.error('Google OAuth error:', error);
      return done(error, null);
    }
  }
));

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
