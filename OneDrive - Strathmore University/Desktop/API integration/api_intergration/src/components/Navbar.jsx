import { Link, NavLink } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">Nyumbahub</Link>

      <div className="navbar-links">
        <NavLink to="/listings">Listings</NavLink>
        <NavLink to="/login">Sign In</NavLink>
        <NavLink to="/dashboard">Dashboard</NavLink>
      </div>

      <Link to="/booking/1" className="navbar-cta">Book Viewing</Link>
    </nav>
  );
}

export default Navbar;