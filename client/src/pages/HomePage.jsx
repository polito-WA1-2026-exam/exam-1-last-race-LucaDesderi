import { Link } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'

function HomePage() {
  const { user } = useUser();

  return (
    <div style={{ maxWidth: '680px', margin: '5rem auto', padding: '0 2rem' }}>
      <h1 style={{ fontSize: '2.8em', marginBottom: '0.3rem' }}>🚇 Last Race</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '1.05em', marginBottom: '2.5rem' }}>
        Plan your route through the metro network before time runs out.
      </p>

      <div className="card-dark" style={{ marginBottom: '2rem' }}>
        <h5 style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.75em', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          How to play
        </h5>
        <p style={{ marginBottom: '0.75rem' }}>
          You will be assigned a starting station and a destination. You have <strong>90 seconds</strong> to build your route by selecting segments in sequence.
        </p>
        <p style={{ marginBottom: 0, color: 'var(--text-muted)', fontSize: '0.9em' }}>
          Each segment triggers a random event that adds or removes coins. Change lines only at interchange stations.
        </p>
      </div>

      {user
        ? <Link to="/play" className="btn btn-gold">Start Playing →</Link>
        : <Link to="/login" className="btn btn-ghost">Login to Play</Link>
      }
    </div>
  );
}

export default HomePage;