import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './ListingsMap.css';

// Leaflet's default marker icons reference image files that don't resolve
// correctly under Vite's bundler, so we rebuild the icon from the CDN assets.
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Roughly centers the view between Nairobi and Kiambu county.
const MAP_CENTER = [-1.28, 36.78];
const MAP_ZOOM = 11;

function ListingsMap({ listings }) {
  const mappable = listings.filter((l) => l.location?.lat && l.location?.lng);

  return (
    <div className="listings-map-wrap">
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        scrollWheelZoom={false}
        className="listings-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mappable.map((listing) => (
          <Marker
            key={listing.id}
            position={[listing.location.lat, listing.location.lng]}
            icon={markerIcon}
          >
            <Popup>
              <div className="listings-map-popup">
                <strong>{listing.title}</strong>
                <span>{listing.location.area}, {listing.location.city}</span>
                <span>KES {listing.rentAmount.toLocaleString()}/mo</span>
                <Link to={`/listings/${listing.id}`}>View details →</Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default ListingsMap;
