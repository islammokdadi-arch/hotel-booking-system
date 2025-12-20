import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Register() {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        username: '',
        email: '',
        password: '',
        date_of_birth: ''
    });
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Client-side age validation
        const birthDate = new Date(formData.date_of_birth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        if (age < 18) {
            setError('You must be at least 18 years old to register.');
            return;
        }
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }




        try {
            await register(formData.first_name, formData.last_name, formData.username, formData.email, formData.password, formData.date_of_birth);
            navigate('/');
        } catch (err) {
            // Handle specific error messages from backend
            const errorData = err.response?.data;

            if (errorData?.username) {
                setError(`Username already exists: ${errorData.username[0]}`);
            } else if (errorData?.email) {
                setError(`Email already exists: ${errorData.email[0]}`);
            } else if (errorData?.date_of_birth) {
                setError(errorData.date_of_birth[0]);
            } else {
                setError('Registration failed. Please try again.');
            }
        }
    };

    return (
        <div className="auth-container">
            <h2>Register</h2>
            {error && <p className="error" style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="First Name"
                    value={formData.first_name}
                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                    required
                />
                <input
                    type="text"
                    placeholder="Last Name"
                    value={formData.last_name}
                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                    required
                />
                <input
                    type="text"
                    placeholder="Username"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    required
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                />
                <input
                    type="date"
                    placeholder="Date of Birth"
                    value={formData.date_of_birth}
                    onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                    required
                    style={{ padding: '0.75rem', fontSize: '1rem' }}
                />
                <small style={{ display: 'block', color: 'var(--text-secondary)', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                    You must be at least 18 years old
                </small>
                <input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    required
                />
                <button type="submit" className="btn-primary">Register</button>
            </form>
        </div>
    );
}
