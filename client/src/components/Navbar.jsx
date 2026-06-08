import { Link, useNavigate } from 'react-router-dom'
import { Navbar as BsNavbar, Nav, Container, Button } from 'react-bootstrap'
import { useUser } from '../contexts/UserContext'
import { logout } from '../api/api'

function Navbar() {
  const { user, setUser } = useUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      navigate('/');
    } catch (ex) {
      console.error(ex);
    }
  };

  return (
    <BsNavbar bg="dark" variant="dark" expand="lg">
      <Container fluid className="px-4">
        <BsNavbar.Brand as={Link} to="/">🚇 Last Race</BsNavbar.Brand>
        <Nav className="me-auto">
          {user && <>
            <Nav.Link as={Link} to="/play">Play</Nav.Link>
            <Nav.Link as={Link} to="/leaderboard">Leaderboard</Nav.Link>
          </>}
        </Nav>
        <Nav>
          {user
            ? <>
                <BsNavbar.Text className="me-3">Hello, {user.username}</BsNavbar.Text>
                <Button variant="outline-light" size="sm" onClick={handleLogout}>Logout</Button>
              </>
            : <Nav.Link as={Link} to="/login">Login</Nav.Link>
          }
        </Nav>
      </Container>
    </BsNavbar>
  );
}

export default Navbar;