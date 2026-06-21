// import
import express from "express";
import morgan from "morgan";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import LocalStrategy from "passport-local";
import bcrypt from "bcrypt";
import { check, validationResult } from "express-validator";

import { getUser, getNetwork, getSegments, createGame, getStationById, getGameById, getEvents, saveGameResult, saveGameSteps, getLeaderboard } from "./dao.js";

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
app.post("/api/sessions", [
  check("username").notEmpty(),
  check("password").notEmpty()
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
}, passport.authenticate("local"), function (req, res) {
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

// GET /api/network  Return the network structure line per line and all the connection inside of it
app.get("/api/network", isLoggedIn, async (req, res) => {
  try {
    const network = await getNetwork();
    res.json(network);
  } catch {
    res.status(500).end();
  }
});

// POST /api/games
app.post("/api/games", isLoggedIn, async (req, res) => {
  try {
    const segments = await getSegments();

    // costruisce il grafo come lista di adiacenza (non orientato)
    const graph = {};
    for (const { from_id, to_id } of segments) {
      if (!graph[from_id]) graph[from_id] = [];
      if (!graph[to_id]) graph[to_id] = [];
      graph[from_id].push(to_id);
      graph[to_id].push(from_id);
    }

    const stationIds = Object.keys(graph).map(Number);

    // BFS per trovare distanze da una stazione di partenza
    const bfs = (start) => {
      const dist = { [start]: 0 };
      const queue = [start];
      while (queue.length > 0) {
        const curr = queue.shift();
        for (const neighbor of (graph[curr] || [])) {
          if (dist[neighbor] === undefined) {
            dist[neighbor] = dist[curr] + 1;
            queue.push(neighbor);
          }
        }
      }
      return dist;
    };

    // prova stazioni di partenza casuali finché non trova una coppia valida
    let startStation, endStation;
    let attempts = 0;
    do {
      startStation = stationIds[Math.floor(Math.random() * stationIds.length)];
      const distances = bfs(startStation);
      const reachable = Object.entries(distances)
        .filter(([id, dist]) => dist >= 3)
        .map(([id]) => Number(id));

      if (reachable.length > 0) {
        endStation = reachable[Math.floor(Math.random() * reachable.length)];
      }
      attempts++;
    } while (!endStation && attempts < 100);

    if (!endStation) {
      return res.status(500).json({ error: "Could not find a valid pair of stations." });
    }

    const gameId = await createGame(req.user.id, startStation, endStation);
    const start = await getStationById(startStation);
    const end = await getStationById(endStation);
    res.status(201).json({ gameId, startStation: start, endStation: end });

  } catch (e) {
    console.error(e);
    res.status(500).end();
  }
});

// POST /api/games/:id/submit
app.post("/api/games/:id/submit", isLoggedIn, [
  check("route").isArray({ min: 1 }),
  check("route.*").isInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  try {
    const gameId = Number(req.params.id);
    const route = req.body.route; // array di station id es. [8, 13, 14, 9]

    // validazione input base
    if (!Array.isArray(route) || route.length < 1) {
      return res.status(422).json({ error: "Invalid route format." });
    }

    // recupera la partita
    const game = await getGameById(gameId);
    if (!game) return res.status(404).json({ error: "Game not found." });
    if (game.user_id !== req.user.id) return res.status(401).json({ error: "Not authorized." });
    if (game.completed_at) return res.status(400).json({ error: "Game already completed." });

    // recupera segmenti per la validazione
    const segments = await getSegments();

    // costruisce mappa segmenti validi per linea
    // { "from_id-to_id": [line_id, ...] }
    const segmentLines = {};
    for (const { from_id, to_id, line_id } of segments) {
      const keyA = `${from_id}-${to_id}`;
      const keyB = `${to_id}-${from_id}`;
      if (!segmentLines[keyA]) segmentLines[keyA] = [];
      if (!segmentLines[keyB]) segmentLines[keyB] = [];
      segmentLines[keyA].push(line_id);
      segmentLines[keyB].push(line_id);
    }

    // recupera interscambi (stazioni con più di una linea)
    const interchangeSet = new Set();
    const lineCount = {};
    for (const { from_id, to_id, line_id } of segments) {
      if (!lineCount[from_id]) lineCount[from_id] = new Set();
      lineCount[from_id].add(line_id);
      if (!lineCount[to_id]) lineCount[to_id] = new Set();
      lineCount[to_id].add(line_id);
    }
    for (const [stationId, lines] of Object.entries(lineCount)) {
      if (lines.size > 1) interchangeSet.add(Number(stationId));
    }

    // valida il percorso
    let valid = true;

    // controlla partenza e arrivo
    if (route[0] !== game.start_station || route[route.length - 1] !== game.end_station) {
      valid = false;
    }

    // controlla ogni segmento e i cambi linea
    if (valid) {
      let currentLines = null;
      for (let i = 0; i < route.length - 1; i++) {
        const from = route[i];
        const to = route[i + 1];
        const key = `${from}-${to}`;
        const availableLines = segmentLines[key];

        // segmento non esiste nella rete
        if (!availableLines || availableLines.length === 0) {
          valid = false;
          break;
        }

        if (currentLines === null) {
          // primo segmento, prendi le linee disponibili
          currentLines = new Set(availableLines);
        } else {
          // intersezione con le linee del segmento precedente
          const commonLines = availableLines.filter(l => currentLines.has(l));
          if (commonLines.length === 0) {
            // cambio linea necessario — la stazione deve essere un interscambio
            if (!interchangeSet.has(from)) {
              valid = false;
              break;
            }
            currentLines = new Set(availableLines);
          } else {
            currentLines = new Set(commonLines);
          }
        }
      }
    }

    // se non valido → score 0
    if (!valid) {
      await saveGameResult(gameId, 0);
      return res.json({ valid: false, score: 0 });
    }

    // percorso valido → genera gli step con eventi casuali
    const events = await getEvents();
    let coins = 20;
    const steps = [];

    for (let i = 0; i < route.length - 1; i++) {
      const event = events[Math.floor(Math.random() * events.length)];
      coins += event.effect;
      steps.push({
        gameId,
        position: i + 1,
        fromStation: route[i],
        toStation: route[i + 1],
        eventId: event.id,
        eventDescription: event.description,
        eventEffect: event.effect,
        coinsAfter: coins,
      });
    }

    const finalScore = Math.max(0, coins);
    await saveGameSteps(steps);
    await saveGameResult(gameId, finalScore);

    res.json({ valid: true, score: finalScore, steps });

  } catch (e) {
    console.error(e);
    res.status(500).end();
  }
});

// GET /api/leaderboard
app.get("/api/leaderboard", isLoggedIn, async (req, res) => {
  try {
    const leaderboard = await getLeaderboard();
    res.json(leaderboard);
  } catch {
    res.status(500).end();
  }
});

// start the server
app.listen(port, () => {console.log(`API server started at http://localhost:${port}`)});