import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { listings as initialListings } from "../mock-data";
import "../styles/auth.css";

const emptyForm = {
  title: "",
  area: "",
  city: "",
  rentAmount: "",
  bedrooms: "",
  bathrooms: "",
};

export default function Dashboard() {
  const { user } = useAuth();
  const [listings, setListings] = useState(initialListings);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  if (!user) return null;

  if (user.role === "landlord") {
    const myListings = listings.filter((l) => l.landlordId === user.id);

    const handleChange = (e) => {
      setForm({ ...form, [e.target.name]: e.target.value });
    };

    const resetForm = () => {
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
    };

    const handleSubmit = (e) => {
      e.preventDefault();

      const listingData = {
        title: form.title,
        location: { area: form.area, city: form.city },
        rentAmount: Number(form.rentAmount),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        landlordId: user.id,
      };

      if (editingId) {
        setListings(
          listings.map((l) => (l.id === editingId ? { ...l, ...listingData } : l))
        );
      } else {
        setListings([
          ...listings,
          { id: `lst_${Date.now()}`, ...listingData },
        ]);
      }

      resetForm();
    };

    const handleEdit = (listing) => {
      setForm({
        title: listing.title,
        area: listing.location.area,
        city: listing.location.city,
        rentAmount: listing.rentAmount,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
      });
      setEditingId(listing.id);
      setShowForm(true);
    };

    const handleDelete = (id) => {
      setListings(listings.filter((l) => l.id !== id));
    };

    return (
      <div className="dashboard">
        <h2>Landlord Dashboard</h2>

        {!showForm && (
          <button className="add-btn" onClick={() => setShowForm(true)}>
            + Add Listing
          </button>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="listing-form">
            <input
              name="title"
              placeholder="Title"
              value={form.title}
              onChange={handleChange}
              required
            />
            <input
              name="area"
              placeholder="Area"
              value={form.area}
              onChange={handleChange}
              required
            />
            <input
              name="city"
              placeholder="City"
              value={form.city}
              onChange={handleChange}
              required
            />
            <input
              name="rentAmount"
              type="number"
              placeholder="Rent (KES)"
              value={form.rentAmount}
              onChange={handleChange}
              required
            />
            <input
              name="bedrooms"
              type="number"
              placeholder="Bedrooms"
              value={form.bedrooms}
              onChange={handleChange}
              required
            />
            <input
              name="bathrooms"
              type="number"
              placeholder="Bathrooms"
              value={form.bathrooms}
              onChange={handleChange}
              required
            />
            <div>
              <button type="submit">{editingId ? "Save" : "Add"}</button>
              <button type="button" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        )}

        <h3>My Listings</h3>
        {myListings.length === 0 ? (
          <p>No listings yet</p>
        ) : (
          myListings.map((l) => (
            <div key={l.id} className="listing-row">
              <span>
                {l.title} — {l.location.area}, {l.location.city} — KES{" "}
                {l.rentAmount.toLocaleString()}
              </span>
              <button onClick={() => handleEdit(l)}>Edit</button>
              <button onClick={() => handleDelete(l.id)}>Delete</button>
            </div>
          ))
        )}
      </div>
    );
  }

  const bookings = []; // TODO: connect once Mike's bookings array exists in mock-data.js

  return (
    <div className="dashboard">
      <h2>My Dashboard</h2>
      <h3>Saved Listings</h3>
      <p>No saved listings yet</p>
      <h3>My Bookings</h3>
      {bookings.length === 0 ? (
        <p>No bookings yet</p>
      ) : (
        bookings.map((b) => <div key={b.id}>{b.status}</div>)
      )}
    </div>
  );
}