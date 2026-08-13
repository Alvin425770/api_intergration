import { listings } from '../mock-data';
import ListingsMap from '../components/ListingsMap';
import './Home.css';

function Home() {
  const featured = listings.slice(0, 3);

  return (
    <div>
      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-content">
          <span className="hero-eyebrow">Verified Architectural Living</span>
          <h1>Find home, without the run-around.</h1>
          <p>
            No more paying deposits to landlords who ghost you. Every listing
            is verified, and your rent stays held in escrow until you've
            actually moved in.
          </p>
          <div className="hero-search">
            <input type="text" placeholder="Search neighborhoods..." />
            <button>Browse Houses</button>
          </div>
        </div>

        <div className="hero-image-wrap">
          <img
            className="hero-image"
            src="https://images.pexels.com/photos/36466231/pexels-photo-36466231.jpeg?auto=compress&cs=tinysrgb&w=1200"
            alt="Modern villas surrounded by greenery"
          />
          <div className="hero-stat">
            <span className="hero-stat-number">100%</span>
            <span className="hero-stat-label">Verified Units</span>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works">
        <h2>How it works</h2>
        <div className="how-it-works-grid">
          <div>
            <h3>1. Browse verified listings</h3>
            <p>Every property is checked before it goes live.</p>
          </div>
          <div>
            <h3>2. Pay into escrow via M-Pesa</h3>
            <p>Your rent is held safely, not handed straight to the landlord.</p>
          </div>
          <div>
            <h3>3. Move in, funds release</h3>
            <p>Only once you confirm move-in does payment reach the landlord.</p>
          </div>
        </div>
      </section>

      {/* MAP */}
      <section className="map-section">
        <h2>Explore Nairobi &amp; Kiambu</h2>
        <p className="map-section-sub">
          Browse verified listings by location. Click a pin to see details.
        </p>
        <ListingsMap listings={listings} />
      </section>

      {/* FEATURED LISTINGS */}
      <section className="featured">
        <h2>Recently listed</h2>
        <div className="featured-grid">
          {featured.map((listing) => (
            <div className="featured-card" key={listing.id}>
              <img
                src={listing.images[0]}
                alt={listing.title}
                className="featured-card-image"
              />
              <h4>{listing.title}</h4>
              <p>{listing.location.area}, {listing.location.city}</p>
              <p>KES {listing.rentAmount.toLocaleString()}/mo</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;