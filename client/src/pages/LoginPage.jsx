import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Button, Container, Card, Alert } from 'react-bootstrap'
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
    } catch (ex) {
      setError('Invalid username or password.');
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card style={{ width: '400px' }} className="p-4">
        <Card.Title className="mb-4 text-center">🚇 Last Race — Login</Card.Title>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </Form.Group>
          <Button variant="dark" type="submit" className="w-100">Login</Button>
        </Form>
      </Card>
    </Container>
  );
}

export default LoginPage;