import GymPassCard from './GymPassCard';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function GymPerkClaim({ tenantName = '', tenantEmail = '', tenantPhone = '' }) {
  const [name, setName] = useState(tenantName);
  const [email, setEmail] = useState(tenantEmail);
  const [phone, setPhone] = useState(tenantPhone);
  const [tiers, setTiers] = useState([]);
  const [selectedTier, setSelectedTier] = useState('Monthly Standard');
  const [password, setPassword] = useState('');
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [statusMessage, setStatusMessage] = useState('');
  const [passData, setPassData] = useState(null);

  // Live amenity data fetched upon pass activation
  const [facilityHours, setFacilityHours] = useState(null);
  const [classSchedules, setClassSchedules] = useState([]);

  // Check if a pass was already activated in this session
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nyumbahub_active_gym_pass');
      if (saved) {
        const parsed = JSON.parse(saved);
        setPassData(parsed);
        setStatus('success');
      }
    } catch (_) {}
  }, []);

  // Update fields if props change
  useEffect(() => {
    if (tenantName) setName(tenantName);
  }, [tenantName]);

  useEffect(() => {
    if (tenantEmail) setEmail(tenantEmail);
  }, [tenantEmail]);

  useEffect(() => {
    if (tenantPhone) setPhone(tenantPhone);
  }, [tenantPhone]);

  // Fetch live membership tiers from partner via backend proxy
  useEffect(() => {
    async function loadTiers() {
      try {
        const res = await fetch('/api/gym/memberships');
        if (res.ok) {
          const result = await res.json();
          if (Array.isArray(result.data) && result.data.length > 0) {
            setTiers(result.data);
            setSelectedTier(result.data[0].tier);
          }
        }
      } catch (err) {
        console.warn('Could not fetch tiers, defaulting:', err);
      } finally {
        setLoadingTiers(false);
      }
    }
    loadTiers();
  }, []);

  // When pass is active, load live GymBuddy operating hours & class schedules
  useEffect(() => {
    if (status === 'success') {
      fetch('/api/gym/hours')
        .then((r) => r.json())
        .then((data) => setFacilityHours(data))
        .catch(() => {});

      fetch('/api/gym/schedules')
        .then((r) => r.json())
        .then((data) => setClassSchedules(data.data || []))
        .catch(() => {});
    }
  }, [status]);

  async function handleClaim(e) {
    e.preventDefault();

    if (!name.trim()) {
      setStatus('error');
      setStatusMessage('Full name is required.');
      return;
    }
    if (!email.trim()) {
      setStatus('error');
      setStatusMessage('A valid email address is required.');
      return;
    }
    if (!password || password.length < 6) {
      setStatus('error');
      setStatusMessage('Please enter a password with at least 6 characters.');
      return;
    }

    setSubmitting(true);
    setStatus(null);
    setStatusMessage('');

    try {
      const res = await fetch('/api/gym/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: name.trim(),
          email: email.trim(),
          phone: phone ? phone.trim() : undefined,
          tier: selectedTier,
          password: password
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 201) {
        const passInfo = {
          id: data.id,
          name: name.trim(),
          email: email.trim(),
          tier: selectedTier,
          mode: data.mode || 'live',
          issuedAt: new Date().toLocaleDateString('en-KE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        };
        setPassData(passInfo);
        try {
          localStorage.setItem('nyumbahub_active_gym_pass', JSON.stringify(passInfo));
        } catch (_) {}
        setStatus('success');
        setStatusMessage(data.message || 'Resident Gym Pass successfully activated!');
      } else {
        setStatus('error');
        setStatusMessage(data.error || 'Failed to activate membership. Please verify your details.');
      }
    } catch (err) {
      setStatus('error');
      setStatusMessage('Network error connecting to GymBuddy partner service.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{
      marginTop: '1.5rem',
      padding: '1.5rem',
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      textAlign: 'left'
    }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '1.75rem' }}>🎁</span>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b' }}>
            NyumbaHub Move-in Amenity: GymBuddy Resident Pass
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            Exclusive partner fitness amenity included with your confirmed tenancy.
          </p>
        </div>
      </div>

      {/* ACTIVATED PASS VIEW */}
      {status === 'success' && passData ? (
        <div style={{ marginTop: '1rem' }}>
          <GymPassCard passData={passData} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Link
              to="/dashboard"
              style={{
                display: 'inline-block',
                padding: '0.65rem 1.25rem',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 600
              }}
            >
              Go to Dashboard →
            </Link>
          </div>
        </div>
      ) : (
        /* ACTIVATION FORM */
        <form onSubmit={handleClaim} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {status === 'error' && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              color: '#991b1b',
              fontSize: '0.875rem'
            }}>
              {statusMessage}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tenant@example.com"
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                Phone (Optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0712345678"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                Membership Tier
              </label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                disabled={loadingTiers || submitting}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff'
                }}
              >
                {tiers.length > 0 ? (
                  tiers.map((t) => (
                    <option key={t.tier} value={t.tier}>
                      {t.tier} ({t.price})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Monthly Standard">Monthly Standard (5,000 KES)</option>
                    <option value="Student">Student (4,500 KES)</option>
                    <option value="Daily Drop-In">Daily Drop-In (500 KES)</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
              GymBuddy Account Password
            </label>
            <input
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={submitting}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: '0.5rem',
              padding: '0.65rem 1.25rem',
              backgroundColor: submitting ? '#94a3b8' : '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: submitting ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? 'Registering with GymBuddy…' : 'Activate Resident Gym Pass'}
          </button>
        </form>
      )}
    </div>
  );
}
