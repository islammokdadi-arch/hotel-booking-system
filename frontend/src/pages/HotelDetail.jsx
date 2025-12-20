import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getHotel, createReservation } from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function HotelDetail() {
    const { id } = useParams();
    const [hotel, setHotel] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [bookingData, setBookingData] = useState({
        room: null,
        check_in: '',
        check_out: ''
    });

    useEffect(() => {
        getHotel(id).then(res => {
            setHotel(res.data);
            setLoading(false);
        });
    }, [id]);

    const handleBook = async (e) => {
        e.preventDefault();
        if (!user) {
            alert('Please login to book a room');
            navigate('/login');
            return;
        }
        try {
            await createReservation({
                room: bookingData.room,
                check_in: bookingData.check_in,
                check_out: bookingData.check_out
            });
            alert('Reservation successful!');
            navigate('/profile');
        } catch (err) {
            alert(err.response?.data?.non_field_errors || 'Booking failed');
        }
    };

    if (loading) return <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>Loading...</div>;

    return (
        <div className="container">
            <div className="detail-header">
                <img src={hotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3'} alt={hotel.name} className="detail-img" />
                <div className="detail-content">
                    <h1>{hotel.name}</h1>
                    <div className="rating">★ {hotel.rating} Excellent</div>
                    <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>📍 {hotel.address}</p>
                    <p style={{ lineHeight: '1.8' }}>{hotel.description}</p>
                </div>
            </div>

            <h3 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>Available Rooms</h3>
            <div className="hotel-grid">
                {hotel.rooms.map(room => (
                    <div key={room.id} className="room-card">
                        <div style={{ padding: '1.5rem', background: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)' }}>
                            <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{room.room_type} Room</h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: '700', color: 'var(--primary-color)', fontSize: '1.2rem' }}>${room.price_per_night} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>/ night</span></span>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>👥 {room.capacity} Guests</span>
                            </div>
                        </div>

                        <div style={{ padding: '1.5rem' }}>
                            <form onSubmit={handleBook} className="booking-form">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '5px' }}>Check-in</label>
                                        <input
                                            type="date"
                                            required
                                            style={{ width: '100%', margin: 0 }}
                                            onChange={e => setBookingData({ ...bookingData, check_in: e.target.value, room: room.id })}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '5px' }}>Check-out</label>
                                        <input
                                            type="date"
                                            required
                                            style={{ width: '100%', margin: 0 }}
                                            onChange={e => setBookingData({ ...bookingData, check_out: e.target.value, room: room.id })}
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={() => setBookingData(prev => ({ ...prev, room: room.id }))}>
                                    Book This Room
                                </button>
                            </form>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
