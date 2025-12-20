import React, { useEffect, useState } from 'react';
import { getReservations } from '../services/api';

export default function Profile() {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getReservations()
            .then(res => {
                setReservations(res.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>Loading...</div>;

    return (
        <div className="container">
            <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="4" width="18" height="18" rx="2" stroke="url(#calGrad)" strokeWidth="2" />
                        <path d="M16 2V6M8 2V6M3 10H21" stroke="url(#calGrad)" strokeWidth="2" strokeLinecap="round" />
                        <defs>
                            <linearGradient id="calGrad" x1="3" y1="2" x2="21" y2="22">
                                <stop offset="0%" stopColor="#2563eb" />
                                <stop offset="100%" stopColor="#4f46e5" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <h2 style={{
                        margin: 0,
                        fontSize: '2.5rem',
                        background: 'linear-gradient(135deg, var(--primary-color), #4f46e5)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: '800'
                    }}>My Reservations</h2>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: 0 }}>
                    Manage and track all your upcoming stays
                </p>
            </div>
            {reservations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '1rem', boxShadow: 'var(--shadow-sm)' }}>
                    <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>You haven't made any reservations yet.</p>
                </div>
            ) : (
                <div className="hotel-grid">
                    {reservations.map(res => (
                        <div key={res.id} className="reservation-card" style={{ borderLeft: '4px solid var(--primary-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span style={{ fontWeight: '700', color: 'var(--primary-color)' }}>#{res.id}</span>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(res.created_at).toLocaleDateString()}</span>
                            </div>
                            <h4 style={{ margin: '0 0 1rem 0' }}>Room Booking</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.95rem' }}>
                                <div>
                                    <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>CHECK-IN</span>
                                    {res.check_in}
                                </div>
                                <div>
                                    <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>CHECK-OUT</span>
                                    {res.check_out}
                                </div>
                            </div>
                            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                                <span style={{ fontSize: '0.9rem' }}>Room ID: {res.room}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
