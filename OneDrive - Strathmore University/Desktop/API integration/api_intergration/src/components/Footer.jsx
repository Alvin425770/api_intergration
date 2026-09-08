import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <span className="footer-logo">Nyumbahub</span>
          <p className="footer-tagline">
            Verified architectural living, without the run-around.
          </p>
        </div>

        <div className="footer-col">
          <h4>Explore</h4>
          <Link to="/listings">Listings</Link>
          <Link to="/login">Sign In</Link>
          <Link to="/dashboard">Dashboard</Link>
        </div>

        <div className="footer-col">
          <h4>Trust</h4>
          <span>Verified Listings</span>
          <span>M-Pesa Escrow</span>
          <span>No Agent Run-Around</span>
        </div>

        
      </div>

      <div className="footer-bottom">
        <span>&copy; {new Date().getFullYear()} Nyumbahub. Built in Nairobi.</span>
      </div>
    </footer>
  );
}

export default Footer;