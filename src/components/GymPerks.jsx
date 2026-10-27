import { useState, useEffect} from 'react';

export default function GymPerks() {
    const [memberships, setMemberships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(()=> {
        async function fetchGymData() {
            try {
                setLoading(true);
                setError(null);

                //call backend route not gymbuddy directly
                const res = await fetch('http://localhost:5000/api/gym/memberships');

                if (!res.ok) {
                    //message when backend/partner returns an error status like 502
                    setError('Partner gym data is currently unavailable. Please check back later');
                    return;
                }

                const data = await res.json();
                setMemberships(data);
            }catch (err) {
                //failure if the network drops or backend is down
                console.error('Failed to load gym perks:', err);
                setError('Partner gym data is currently unavailable. Please check back later.');
            } finally{
                setLoading(false);
            }
        }

        fetchGymData();
    }, []);

    return (
        <section style={{ padding: '2rem 1rem', maxWidth: '1000px', margin: '0 auto'}}>
            <div style={{ textAlign: 'centre', marginBottom: '1.5rem'}}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold'}}>Partner Amenity: GymBuddy Fitness</h2>
                <p style={{ color: '#666' }}>Exclusive membership option for NyumbaHub residents</p>
            </div>

            {/*1. loading state */}
            {loading && <p style={{ textAlign: 'centre'}}>Loading partner gym offers...</p>}

            {/*2. error fallback*/}
            {!loading && error && (
                <div style={{
                    padding: '1rem',
                    backgroundColor: '#fff3cd',
                    color: '#856404',
                    border: '1px solid #ffeeba',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <strong>Notice: </strong>{error}
                </div>
            )}

            {/* 3. live partner data cards*/}
            {!loading && !error && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {memberships.map((item, index) => (
                        <div
                        key = {index}
                        style={{
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            padding: '1.25rem',
                            backgroundColor: '#ffffff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}
                        >
                            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1a1a1a' }}>{item.tier}</h3>
                            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0086060', margin: '0.25rem 0'}}>
                                {item.price}
                            </p>
                            <p style={{ color: '#555', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                {item.details}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}