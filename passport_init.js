// Require used packages
const express = require('express');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

// Require necessary database models
const users = [
  {
    id: 0,
    username: process.env.USER_NAME,
    role: 'admin',
    password: process.env.PASSWORD
  }
];

// Export variable
const pp = {};

// Various initialize
passport.use(
  new LocalStrategy(async (username, password, done) => {
    if (users[0].username != username) {
      return done(null, false);
    }

    try {
      if (await bcrypt.compare(password, users[0].password)) {
        return done(null, users[0]);
      } else {
        // const hashed_password = await bcrypt.hash(password, 10);
        // console.log(hashed_password);
        return done(null, false);
      }
    } catch (e) {
      return done(e);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  if (users[0].id == id) {
    done(null, users[0]);
  }
});

router.get('/', (req, res) => res.render('login', { role: 'guest' }));
router.post('/', passport.authenticate('local', { successRedirect: '/mypage', failureRedirect: '/login' }));

// Export modules that are required elsewhere
pp.passport = passport;
pp.router = router;
module.exports = pp;
