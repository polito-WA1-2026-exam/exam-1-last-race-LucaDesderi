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