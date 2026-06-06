import sqlite from "sqlite3";
import bcrypt from "bcrypt";

const db = new sqlite.Database("./database.db", (err) => {
  if (err) throw err;
});

/* USERS */
export const getUser = (username, password) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM users WHERE username = ?";
    db.get(sql, [username], async (err, row) => {
      if (err) {
        reject(err);
      } else if (row === undefined) {
        resolve(false);
      } else {
        const user = { id: row.id, username: row.username };
        const match = await bcrypt.compare(password, row.password);
        if (!match)
          resolve(false);
        else
          resolve(user);
      }
    });
  });
};

/* NETWORK */
export const getNetwork = () => {
  return new Promise((resolve, reject) => {
    const sqlLines = "SELECT * FROM lines";
    db.all(sqlLines, [], (err, lines) => {
      if (err) { reject(err); return; }

      const sqlStations = "SELECT * FROM stations";
      db.all(sqlStations, [], (err, stations) => {
        if (err) { reject(err); return; }

        const sqlSegments = `
          SELECT ls1.line_id, l.name as line_name,
                 s1.id as from_id, s1.name as from_name,
                 s2.id as to_id, s2.name as to_name
          FROM line_stations ls1
          JOIN line_stations ls2 ON ls1.line_id = ls2.line_id AND ls2.position = ls1.position + 1
          JOIN lines l ON ls1.line_id = l.id
          JOIN stations s1 ON ls1.station_id = s1.id
          JOIN stations s2 ON ls2.station_id = s2.id
          ORDER BY ls1.line_id, ls1.position
        `;
        db.all(sqlSegments, [], (err, segments) => {
          if (err) { reject(err); return; }
          resolve({ lines, stations, segments });
        });
      });
    });
  });
};

export const getStationById = (id) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM stations WHERE id = ?", [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

/* GAMES */
export const getSegments = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT ls1.line_id, ls1.station_id as from_id, ls2.station_id as to_id
      FROM line_stations ls1
      JOIN line_stations ls2 ON ls1.line_id = ls2.line_id AND ls2.position = ls1.position + 1
    `;
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const createGame = (userId, startStation, endStation) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO games (user_id, start_station, end_station, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `;
    db.run(sql, [userId, startStation, endStation], function (err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};

export const getGameById = (id) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM games WHERE id = ?", [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const getEvents = () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM events", [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const saveGameResult = (gameId, score) => {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE games SET score = ?, completed_at = datetime('now') WHERE id = ?",
      [score, gameId],
      function (err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
};

export const saveGameSteps = (steps) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO game_steps (game_id, position, from_station, to_station, event_id, coins_after)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const stmt = db.prepare(sql);
    for (const step of steps) {
      stmt.run([step.gameId, step.position, step.fromStation, step.toStation, step.eventId, step.coinsAfter]);
    }
    stmt.finalize((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

export const getLeaderboard = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT u.id, u.username, MAX(g.score) as best_score
      FROM games g
      JOIN users u ON g.user_id = u.id
      WHERE g.score IS NOT NULL
      GROUP BY g.user_id
      ORDER BY best_score DESC
    `;
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};