import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { listings } from '../mock-data';
import './ListingDetail.css';

function ListingDetail() {
  const { id } = useParams();
  const listing = listings.find((l) => l.id === id);
  const [currentImage, setCurrentImage] = useState(0);

  if (!listing) {
    return (
      <div>
        <p>Listing not found.</p>
        <Link to="/listings">Back to listings</Link>
      </div>
    );
  }

  const totalImages = listing.images.length;

  function goToPrev() {
    setCurrentImage((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
  }

  function goToNext() {
    setCurrentImage((prev) => (prev === totalImages - 1 ? 0 : prev + 1));
  }

  return (
    <div className="listing-detail">
      <Link to="/listings">← Back to listings</Link>
      <h1>{listing.title}</h1>

      <div className="listing-detail__slider">
        <img
          src={listing.images[currentImage]}
          alt={`${listing.title} ${currentImage + 1}`}
          className="listing-detail__slider-image"
        />

        {totalImages > 1 && (
          <>
            <button
              className="listing-detail__slider-arrow listing-detail__slider-arrow--prev"
              onClick={goToPrev}
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              className="listing-detail__slider-arrow listing-detail__slider-arrow--next"
              onClick={goToNext}
              aria-label="Next image"
            >
              ›
            </button>

            <div className="listing-detail__slider-dots">
              {listing.images.map((_, i) => (
                <button
                  key={i}
                  className={`listing-detail__slider-dot ${
                    i === currentImage ? 'listing-detail__slider-dot--active' : ''
                  }`}
                  onClick={() => setCurrentImage(i)}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <p className="listing-detail__price">
        KES {listing.rentAmount.toLocaleString()} / month
      </p>
      <p>{listing.location.area}, {listing.location.city}</p>
      <p>{listing.bedrooms} bed · {listing.bathrooms} bath</p>
      <p>{listing.description}</p>
      <button>Request to Book</button>
    </div>
  );
}

export default ListingDetail;