import { Link } from 'react-router-dom'
import { Container, Button } from 'react-bootstrap'
import { useUser } from '../contexts/UserContext'

function HomePage() {
  const { user } = useUser();

  return (
    <Container className="mt-5">
      <h1>🚇 Last Race</h1>
      <p className="lead">
        Welcome to Last Race! Plan your route through the metro network before time runs out.
      </p>
      <hr />
      <h4>How to play</h4>
      <p>You will be assigned a starting station and a destination. You have 90 seconds to build your route by selecting segments in sequence. Reach the destination with as many coins as possible!</p>
      <p>Each segment may trigger a random event that adds or removes coins. A valid route must follow metro lines and change lines only at interchange stations.</p>

      {user
        ? <Button as={Link} to="/play" variant="dark" size="lg" className="mt-3">Start Playing</Button>
        : <Button as={Link} to="/login" variant="dark" size="lg" className="mt-3">Login to Play</Button>
      }
    </Container>
  );
}

export default HomePage;