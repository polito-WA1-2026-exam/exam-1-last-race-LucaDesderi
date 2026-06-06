const SERVER = 'http://localhost:3001';

/* AUTH */
async function login(username, password) {
  try {
    const response = await fetch(`${SERVER}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    if (response.ok)
      return await response.json();
    else
      throw new Error('Login failed, code=' + response.status);
  } catch (ex) {
    throw new Error('Network error in login', { cause: ex });
  }
}

async function logout() {
  try {
    const response = await fetch(`${SERVER}/api/sessions/current`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok)
      throw new Error('Logout failed, code=' + response.status);
  } catch (ex) {
    throw new Error('Network error in logout', { cause: ex });
  }
}

async function getCurrentUser() {
  try {
    const response = await fetch(`${SERVER}/api/sessions/current`, {
      credentials: 'include',
    });
    if (response.ok)
      return await response.json();
    else
      throw new Error('Not authenticated, code=' + response.status);
  } catch (ex) {
    throw new Error('Network error in getCurrentUser', { cause: ex });
  }
}

/* NETWORK */
async function getNetwork() {
  try {
    const response = await fetch(`${SERVER}/api/network`, {
      credentials: 'include',
    });
    if (response.ok)
      return await response.json();
    else
      throw new Error('Error in getNetwork, code=' + response.status);
  } catch (ex) {
    throw new Error('Network error in getNetwork', { cause: ex });
  }
}

/* GAMES */
async function startGame() {
  try {
    const response = await fetch(`${SERVER}/api/games`, {
      method: 'POST',
      credentials: 'include',
    });
    if (response.ok)
      return await response.json();
    else
      throw new Error('Error in startGame, code=' + response.status);
  } catch (ex) {
    throw new Error('Network error in startGame', { cause: ex });
  }
}

async function submitRoute(gameId, route) {
  try {
    const response = await fetch(`${SERVER}/api/games/${gameId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ route }),
    });
    if (response.ok)
      return await response.json();
    else
      throw new Error('Error in submitRoute, code=' + response.status);
  } catch (ex) {
    throw new Error('Network error in submitRoute', { cause: ex });
  }
}

/* LEADERBOARD */
async function getLeaderboard() {
  try {
    const response = await fetch(`${SERVER}/api/leaderboard`, {
      credentials: 'include',
    });
    if (response.ok)
      return await response.json();
    else
      throw new Error('Error in getLeaderboard, code=' + response.status);
  } catch (ex) {
    throw new Error('Network error in getLeaderboard', { cause: ex });
  }
}

export { login, logout, getCurrentUser, getNetwork, startGame, submitRoute, getLeaderboard };