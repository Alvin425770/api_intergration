import { useState } from 'react';
import { listings } from '../mock-data';
import ListingCard from '../components/ListingCard';
import SearchBar from '../components/SearchBar';
import './Listings.css';

function Listings() {
  const [filters, setFilters] = useState({ query: '', maxPrice: null });

  const filtered = listings.filter((listing) => {
    const haystack = `${listing.title} ${listing.location.area} ${listing.location.city}`.toLowerCase();
    const matchesQuery = filters.query === '' || haystack.includes(filters.query.toLowerCase());
    const matchesPrice = !filters.maxPrice || listing.rentAmount <= filters.maxPrice;
    return matchesQuery && matchesPrice;
  });

  return (
    <div className="listings-page">
      <h1>Available Homes</h1>
      <SearchBar onSearch={setFilters} />
      <div className="listings-grid">
        {filtered.length > 0 ? (
          filtered.map((listing) => <ListingCard key={listing.id} listing={listing} />)
        ) : (
          <p>No listings match your search.</p>
        )}
      </div>
    </div>
  );
}

export default Listings;