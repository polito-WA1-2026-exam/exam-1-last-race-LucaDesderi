import { Link, useNavigate } from 'react-router-dom'
import { Navbar, Nav, Container } from 'react-bootstrap'
import { useUser } from '../contexts/UserContext'
import { logout } from '../api/api'
import { IoMdTrain } from "react-icons/io";

function AppNavbar() {
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
    <Navbar className="navbar-dark-custom" expand="lg">
      <Container fluid className="px-4">
        <Navbar.Brand as={Link} to="/"><IoMdTrain /> Last Race</Navbar.Brand>
        <Nav className="me-auto">
          {user && <>
            <Nav.Link as={Link} to="/play">Play</Nav.Link>
            <Nav.Link as={Link} to="/leaderboard">Leaderboard</Nav.Link>
          </>}
        </Nav>
        <Nav className="align-items-center gap-3">
          {user ? <>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85em' }}>
              {user.username}
            </span>
            <button className="btn-ghost btn" onClick={handleLogout} style={{ padding: '0.3rem 1rem', fontSize: '0.85em' }}>
              Logout
            </button>
          </> : (
            <Nav.Link as={Link} to="/login">Login</Nav.Link>
          )}
        </Nav>
      </Container>
    </Navbar>
  );
}

export default AppNavbar;