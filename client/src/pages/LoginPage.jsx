import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/api'
import { useUser } from '../contexts/UserContext'

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { setUser } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(username, password);
      setUser(user);
      navigate('/');
    } catch  {
      setError('Invalid username or password.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="card-dark" style={{ width: '380px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '0.25rem' }}>Welcome back</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85em', marginBottom: '1.75rem' }}>
          Sign in to play Last Race
        </p>

        {error && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.9rem', marginBottom: '1rem', color: 'var(--danger)', fontSize: '0.85em' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label-dark">Username</label>
            <input
              className="form-control form-control-dark"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label-dark">Password</label>
            <input
              className="form-control form-control-dark"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-gold w-100">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;