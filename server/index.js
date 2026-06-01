// import
import express from "express";
import morgan from "morgan";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import LocalStrategy from "passport-local";
import bcrypt from "bcrypt";

import { getUser } from "./dao.js";

// init express
const app = new express();
const port = 3001;

app.use(express.json());        
app.use(morgan("dev")); 
const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessState: 200,
  credentials: true
};        
app.use(cors(corsOptions));     

passport.use(new LocalStrategy(async function verify(username, password, cb) {
  const user = await getUser(username, password);
  if (!user)
    return cb(null, false, "Incorrect username or password.");
  return cb(null, user);
}));

passport.serializeUser(function (user, cb) { cb(null, user); });
passport.deserializeUser(function (user, cb) { return cb(null, user); });

const isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated()) {
    return next();
  }
  console.log(req.user)
  return res.status(401).json({error: "Not authorized"});
}

app.use(session({
  secret: "shhhhh... it's a secret!",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.authenticate("session"));

/* ROUTES */

// POST /api/sessions
app.post("/api/sessions", passport.authenticate("local"), function (req, res) {
  return res.status(201).json(req.user);
});

// GET /api/sessions/current
app.get("/api/sessions/current", (req, res) => {
  if (req.isAuthenticated())
    res.json(req.user);
  else
    res.status(401).json({ error: "Not authenticated" });
});

// DELETE /api/sessions/current
app.delete("/api/sessions/current", (req, res) => {
  req.logout(() => { res.end(); });
});

// GET /api/network
app.get("/api/network", isLoggedIn, async (req, res) => {
  res.json({ message: "TODO" });
});

// POST /api/games
app.post("/api/games", isLoggedIn, async (req, res) => {
  res.json({ message: "TODO" });
});

// POST /api/games/:id/submit
app.post("/api/games/:id/submit", isLoggedIn, async (req, res) => {
  res.json({ message: "TODO" });
});

// GET /api/games/:id/steps
app.get("/api/games/:id/steps", isLoggedIn, async (req, res) => {
  res.json({ message: "TODO" });
});

// GET /api/leaderboard
app.get("/api/leaderboard", isLoggedIn, async (req, res) => {
  res.json({ message: "TODO" });
});

// start the server
app.listen(port, () => {console.log(`API server started at http://localhost:${port}`)});