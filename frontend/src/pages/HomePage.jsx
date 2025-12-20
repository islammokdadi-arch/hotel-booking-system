import React from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
    return (
        <div>
            <div className="home-hero">
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h1>Find Your Perfect Luxury Stay</h1>
                    <p>Discover hand-picked luxury hotels and comfortable rooms at the best prices. Experience comfort like never before.</p>
                    <Link to="/hotels" className="btn-primary" style={{
                        padding: '1rem 2rem',
                        fontSize: '1.1rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
                    }}>
                        Browse Collection
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </Link>
                </div>
            </div>

            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2rem' }}>Why Choose HoteLix?</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>We provide the best experience for our customers.</p>
                </div>

                <div className="hotel-grid">
                    <div className="hotel-card" style={{ padding: '2rem', textAlign: 'center' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto' }}>
                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="url(#grad1)" stroke="url(#grad1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <defs>
                                    <linearGradient id="grad1" x1="2" y1="2" x2="22" y2="22">
                                        <stop offset="0%" stopColor="#2563eb" />
                                        <stop offset="100%" stopColor="#4f46e5" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <h3>Luxury Hotels</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Curated selection of top-rated hotels around the world.</p>
                    </div>
                    <div className="hotel-card" style={{ padding: '2rem', textAlign: 'center' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto' }}>
                                <rect x="5" y="11" width="14" height="10" rx="2" stroke="url(#grad2)" strokeWidth="2" fill="none" />
                                <path d="M12 11V7C12 5.89543 12.8954 5 14 5C15.1046 5 16 5.89543 16 7V11" stroke="url(#grad2)" strokeWidth="2" strokeLinecap="round" />
                                <circle cx="12" cy="16" r="1" fill="url(#grad2)" />
                                <defs>
                                    <linearGradient id="grad2" x1="5" y1="5" x2="19" y2="21">
                                        <stop offset="0%" stopColor="#2563eb" />
                                        <stop offset="100%" stopColor="#4f46e5" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <h3>Secure Booking</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Your personal information and payments are always safe.</p>
                    </div>
                    <div className="hotel-card" style={{ padding: '2rem', textAlign: 'center' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto' }}>
                                <circle cx="12" cy="12" r="10" stroke="url(#grad3)" strokeWidth="2" fill="none" />
                                <path d="M12 6V12L16 14" stroke="url(#grad3)" strokeWidth="2" strokeLinecap="round" />
                                <defs>
                                    <linearGradient id="grad3" x1="2" y1="2" x2="22" y2="22">
                                        <stop offset="0%" stopColor="#2563eb" />
                                        <stop offset="100%" stopColor="#4f46e5" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <h3>24/7 Support</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Our dedicated team is here to help you anytime.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
