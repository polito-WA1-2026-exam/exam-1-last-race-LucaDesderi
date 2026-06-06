import { useState, useEffect } from 'react'
import { Container, Table } from 'react-bootstrap'
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
    <Container className="mt-5">
      <h2>Leaderboard</h2>
      {error && <p className="text-danger">{error}</p>}
      <Table striped bordered hover className="mt-3">
        <thead>
          <tr>
            <th>#</th>
            <th>Username</th>
            <th>Best Score</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry, index) => (
            <tr key={entry.id}>
              <td>{index + 1}</td>
              <td>{entry.username}</td>
              <td>{entry.best_score} 🪙</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}

export default LeaderboardPage;