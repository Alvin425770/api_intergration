import { useState, useEffect } from 'react';

export default function GymPassCard({ passData }) {
  const [facilityHours, setFacilityHours] = useState(null);
  const [classSchedules, setClassSchedules] = useState([]);

  useEffect(() => {
    fetch('/api/gym/hours')
      .then((r) => r.json())
      .then((data) => setFacilityHours(data))
      .catch(() => {});

    fetch('/api/gym/schedules')
      .then((r) => r.json())
      .then((data) => setClassSchedules(data.data || []))
      .catch(() => {});
  }, []);

  if (!passData) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', marginBottom: '2rem' }}>
      
      {/* DIGITAL PASS CARD */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        padding: '1.75rem',
        borderRadius: '14px',
        boxShadow: '0 6px 18px rgba(15, 23, 42, 0.18)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{
              fontSize: '0.725rem',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#94a3b8',
              fontWeight: 600
            }}>
              Official Resident Amenity Pass
            </span>
            <h4 style={{ margin: '0.25rem 0', fontSize: '1.35rem', color: '#f8fafc', fontWeight: 700 }}>
              GymBuddy Fitness Club
            </h4>
          </div>
          <span style={{
            backgroundColor: '#10b981',
            color: '#ffffff',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.05em'
          }}>
            ● ACTIVE RESIDENT
          </span>
        </div>

        <div style={{
          margin: '1.5rem 0 1.25rem 0',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '1.25rem'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Member Name</span>
            <p style={{ margin: '0.2rem 0 0 0', fontWeight: 600, fontSize: '1rem' }}>{passData.name}</p>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Pass ID</span>
            <p style={{ margin: '0.2rem 0 0 0', fontWeight: 600, fontSize: '1rem', fontFamily: 'monospace', color: '#38bdf8' }}>
              #{passData.id}
            </p>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Plan Tier</span>
            <p style={{ margin: '0.2rem 0 0 0', fontWeight: 600, fontSize: '1rem' }}>{passData.tier}</p>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Date Issued</span>
            <p style={{ margin: '0.2rem 0 0 0', fontWeight: 600, fontSize: '1rem' }}>{passData.issuedAt}</p>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.12)',
          paddingTop: '0.85rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.8rem',
          color: '#94a3b8'
        }}>
          <span>Verified by NyumbaHub Escrow</span>
          <span style={{ fontFamily: 'monospace', letterSpacing: '2px' }}>||| | || ||||| || |||</span>
        </div>
      </div>

      {/* LIVE FACILITY STATUS */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '1.25rem',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h4 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>
            📍 GymBuddy Facility Operating Schedule
          </h4>
          {facilityHours && (
            <span style={{
              backgroundColor: facilityHours.currently_open ? '#dcfce7' : '#fee2e2',
              color: facilityHours.currently_open ? '#15803d' : '#b91c1c',
              padding: '0.25rem 0.65rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              {facilityHours.currently_open ? '🟢 Open Now' : '🔴 Currently Closed'}
            </span>
          )}
        </div>

        {facilityHours?.schedule ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#475569', backgroundColor: '#f8fafc', padding: '0.65rem', borderRadius: '8px' }}>
              <strong style={{ color: '#0f172a' }}>Weekdays:</strong> {facilityHours.schedule.weekdays}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#475569', backgroundColor: '#f8fafc', padding: '0.65rem', borderRadius: '8px' }}>
              <strong style={{ color: '#0f172a' }}>Saturday:</strong> {facilityHours.schedule.saturday}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#475569', backgroundColor: '#f8fafc', padding: '0.65rem', borderRadius: '8px' }}>
              <strong style={{ color: '#0f172a' }}>Sunday:</strong> {facilityHours.schedule.sunday}
            </div>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Loading operating schedule…</p>
        )}
      </div>

      {/* GROUP FITNESS TIMETABLE */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '1.25rem',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h4 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>
            🗓️ Upcoming Group Fitness Timetable
          </h4>
          <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
            Included with Resident Pass
          </span>
        </div>

        {classSchedules.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
            {classSchedules.map((c, i) => (
              <div key={i} style={{
                padding: '0.85rem',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
                  {c.day} at {c.time}
                </span>
                <h5 style={{ margin: '0.3rem 0', fontSize: '0.95rem', color: '#0f172a' }}>{c.class}</h5>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Coach: {c.coach}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Fetching weekly group sessions…</p>
        )}
      </div>

    </div>
  );
}
