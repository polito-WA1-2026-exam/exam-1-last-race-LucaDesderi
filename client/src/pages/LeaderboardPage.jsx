import { useState, useEffect } from 'react'
import { getLeaderboard } from '../api/api'

function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getLeaderboard()
      .then(data => setLeaderboard(data))
      .catch(() => setError('Could not load leaderboard.'));
  }, []);

  return (
    <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 2rem' }}>
      <h2 style={{ marginBottom: '0.25rem' }}>🏆 Leaderboard</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9em', marginBottom: '2rem' }}>
        Best score per player
      </p>

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      <div className="card-dark" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table table-dark-custom mb-0">
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>Best Score</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, index) => (
              <tr key={entry.id}>
                <td style={{ color: 'var(--text-muted)', width: '48px' }}>{index + 1}</td>
                <td style={{ fontWeight: 500 }}>{entry.username}</td>
                <td>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                    {entry.best_score}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85em', marginLeft: '0.3rem' }}>🪙</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LeaderboardPage;