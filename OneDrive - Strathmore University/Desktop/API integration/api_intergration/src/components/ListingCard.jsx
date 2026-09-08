import { Link } from 'react-router-dom';
import './ListingCard.css';

function ListingCard({ listing }) {
  return (
    <div className="listing-card">
      <img
        src={listing.images[0]}
        alt={listing.title}
        className="listing-card-image"
      />
      <h3>{listing.title}</h3>
      <p className="listing-card__location">
        {listing.location.area}, {listing.location.city}
      </p>
      <p className="listing-card__price">
        KES {listing.rentAmount.toLocaleString()} / month
      </p>
      <p className="listing-card__meta">
        {listing.bedrooms} bed · {listing.bathrooms} bath
      </p>
      <Link to={`/listings/${listing.id}`} className="listing-card__link">
        View details
      </Link>
    </div>
  );
}

export default ListingCard;