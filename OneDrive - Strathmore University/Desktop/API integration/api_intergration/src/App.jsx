import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './ProtectedRoute';
import Home from './pages/Home';
import Listings from './pages/Listings';
import ListingDetail from './pages/ListingDetail';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BookingDetail from './pages/BookingDetail';
import './styles/auth.css';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/listings"
          element={
            <ProtectedRoute>
              <Listings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/listings/:id"
          element={
            <ProtectedRoute>
              <ListingDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking/:id"
          element={
            <ProtectedRoute>
              <BookingDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Footer />
    </AuthProvider>
  );
}

export default App;