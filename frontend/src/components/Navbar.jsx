import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useContext(AuthContext);

    return (
        <nav className="navbar">
            <div className="container navbar-content">
                <Link to="/" className="logo">HoteLix</Link>
                <div className="links">
                    <Link to="/hotels">Hotels</Link>
                    {user ? (
                        <>
                            <Link to="/profile">My Reservations</Link>
                            {user.is_staff && <Link to="/admin">Admin</Link>}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginLeft: '1rem',
                                paddingLeft: '1rem',
                                borderLeft: '1px solid var(--border-color)'
                            }}>
                                <span style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.9rem',
                                    fontWeight: '500'
                                }}>
                                    <span style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, var(--primary-color), #4f46e5)',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.85rem',
                                        fontWeight: '600'
                                    }}>
                                        {user.username.charAt(0).toUpperCase()}
                                    </span>
                                    {user.username}
                                </span>
                                <button onClick={logout} className="btn-link">Logout</button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/login">Login</Link>
                            <Link to="/register">Register</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
