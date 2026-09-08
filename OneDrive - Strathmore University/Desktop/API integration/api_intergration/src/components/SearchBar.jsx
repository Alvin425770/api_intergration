import { useState } from 'react';
import './SearchBar.css';

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    onSearch({ query, maxPrice: maxPrice ? Number(maxPrice) : null });
  }

  return (
    <form onSubmit={handleSubmit} className="search-bar">
      <input
        type="text"
        placeholder="Search by area, city, or title..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <input
        type="number"
        placeholder="Max price (KES)"
        value={maxPrice}
        onChange={(e) => setMaxPrice(e.target.value)}
      />
      <button type="submit">Search</button>
    </form>
  );
}

export default SearchBar;