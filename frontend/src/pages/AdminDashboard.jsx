import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getHotels, createHotel, updateHotel, deleteHotel, createRoom, updateRoom, deleteRoom } from '../services/api';

export default function AdminDashboard() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showHotelForm, setShowHotelForm] = useState(false);
    const [editingHotel, setEditingHotel] = useState(null);
    const [showRoomForm, setShowRoomForm] = useState(null);
    const [editingRoom, setEditingRoom] = useState(null);

    const [hotelForm, setHotelForm] = useState({
        name: '',
        description: '',
        address: '',
        image: '',
        rating: 0
    });

    const [roomForm, setRoomForm] = useState({
        hotel: null,
        room_number: '',
        room_type: 'SINGLE',
        price_per_night: '',
        capacity: 1
    });

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        // Check if user is staff
        if (!user.is_staff) {
            alert('Access denied. Admin privileges required.');
            navigate('/');
            return;
        }

        loadHotels();
    }, [user, navigate]);

    const loadHotels = async () => {
        try {
            const res = await getHotels();
            setHotels(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleHotelSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingHotel) {
                await updateHotel(editingHotel.id, hotelForm);
            } else {
                await createHotel(hotelForm);
            }
            setHotelForm({ name: '', description: '', address: '', image: '', rating: 0 });
            setShowHotelForm(false);
            setEditingHotel(null);
            loadHotels();
        } catch (err) {
            alert('Error: ' + (err.response?.data?.detail || 'Operation failed. Make sure you have admin permissions.'));
        }
    };

    const handleEditHotel = (hotel) => {
        setEditingHotel(hotel);
        setHotelForm({
            name: hotel.name,
            description: hotel.description,
            address: hotel.address,
            image: hotel.image || '',
            rating: hotel.rating
        });
        setShowHotelForm(true);
    };

    const handleDeleteHotel = async (id) => {
        if (window.confirm('Are you sure you want to delete this hotel?')) {
            try {
                await deleteHotel(id);
                loadHotels();
            } catch (err) {
                alert('Error: ' + (err.response?.data?.detail || 'Delete failed. Make sure you have admin permissions.'));
            }
        }
    };

    const handleRoomSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingRoom) {
                await updateRoom(editingRoom.id, roomForm);
            } else {
                await createRoom(roomForm);
            }
            setRoomForm({ hotel: null, room_number: '', room_type: 'SINGLE', price_per_night: '', capacity: 1 });
            setShowRoomForm(null);
            setEditingRoom(null);
            loadHotels();
        } catch (err) {
            alert('Error: ' + (err.response?.data?.detail || 'Operation failed. Make sure you have admin permissions.'));
        }
    };

    const handleEditRoom = (room, hotelId) => {
        setEditingRoom(room);
        setRoomForm({
            hotel: hotelId,
            room_number: room.room_number,
            room_type: room.room_type,
            price_per_night: room.price_per_night,
            capacity: room.capacity
        });
        setShowRoomForm(hotelId);
    };

    const handleDeleteRoom = async (roomId) => {
        if (window.confirm('Are you sure you want to delete this room?')) {
            try {
                await deleteRoom(roomId);
                loadHotels();
            } catch (err) {
                alert('Error: ' + (err.response?.data?.detail || 'Delete failed. Make sure you have admin permissions.'));
            }
        }
    };

    if (loading) return <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>Loading...</div>;

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2.5rem' }}>Hotel Management</h2>
                <button
                    className="btn-primary"
                    onClick={() => {
                        setShowHotelForm(true);
                        setEditingHotel(null);
                        setHotelForm({ name: '', description: '', address: '', image: '', rating: 0 });
                    }}
                >
                    + Add New Hotel
                </button>
            </div>

            {/* Hotel Form Modal */}
            {showHotelForm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="auth-container" style={{ margin: 0, maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
                        <h3>{editingHotel ? 'Edit Hotel' : 'Add New Hotel'}</h3>
                        <form onSubmit={handleHotelSubmit}>
                            <input
                                type="text"
                                placeholder="Hotel Name"
                                value={hotelForm.name}
                                onChange={e => setHotelForm({ ...hotelForm, name: e.target.value })}
                                required
                            />
                            <textarea
                                placeholder="Description"
                                value={hotelForm.description}
                                onChange={e => setHotelForm({ ...hotelForm, description: e.target.value })}
                                required
                                rows="4"
                            />
                            <input
                                type="text"
                                placeholder="Address"
                                value={hotelForm.address}
                                onChange={e => setHotelForm({ ...hotelForm, address: e.target.value })}
                                required
                            />
                            <input
                                type="url"
                                placeholder="Image URL"
                                value={hotelForm.image}
                                onChange={e => setHotelForm({ ...hotelForm, image: e.target.value })}
                            />
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="5"
                                placeholder="Rating (0-5)"
                                value={hotelForm.rating}
                                onChange={e => setHotelForm({ ...hotelForm, rating: parseFloat(e.target.value) })}
                                required
                            />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                                    {editingHotel ? 'Update' : 'Create'}
                                </button>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    style={{ flex: 1 }}
                                    onClick={() => {
                                        setShowHotelForm(false);
                                        setEditingHotel(null);
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Hotels List */}
            <div className="hotel-grid">
                {hotels.map(hotel => (
                    <div key={hotel.id} className="hotel-card">
                        <div className="rating-badge">
                            <span>★</span> {hotel.rating}
                        </div>
                        <img src={hotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3'} alt={hotel.name} className="hotel-img" />
                        <div className="hotel-info">
                            <h3>{hotel.name}</h3>
                            <p className="hotel-description">{hotel.description}</p>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>📍 {hotel.address}</p>

                            <div style={{ marginTop: '1rem', display: 'flex', gap: '10px' }}>
                                <button className="btn-primary" style={{ flex: 1, fontSize: '0.9rem', padding: '0.5rem' }} onClick={() => handleEditHotel(hotel)}>
                                    Edit
                                </button>
                                <button className="btn-secondary" style={{ flex: 1, fontSize: '0.9rem', padding: '0.5rem', background: 'var(--error-color)', color: 'white' }} onClick={() => handleDeleteHotel(hotel.id)}>
                                    Delete
                                </button>
                            </div>

                            {/* Rooms Section */}
                            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h4 style={{ margin: 0, fontSize: '1rem' }}>Rooms ({hotel.rooms?.length || 0})</h4>
                                    <button
                                        className="btn-primary"
                                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                                        onClick={() => {
                                            setShowRoomForm(hotel.id);
                                            setEditingRoom(null);
                                            setRoomForm({ hotel: hotel.id, room_number: '', room_type: 'SINGLE', price_per_night: '', capacity: 1 });
                                        }}
                                    >
                                        + Add Room
                                    </button>
                                </div>

                                {hotel.rooms && hotel.rooms.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {hotel.rooms.map(room => (
                                            <div key={room.id} style={{
                                                background: 'var(--bg-color)',
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                fontSize: '0.85rem'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <strong>{room.room_type}</strong> - Room {room.room_number}
                                                        <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                                                            ${room.price_per_night}/night • {room.capacity} guests
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '5px' }}>
                                                        <button
                                                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                            onClick={() => handleEditRoom(room, hotel.id)}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', background: 'var(--error-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                            onClick={() => handleDeleteRoom(room.id)}
                                                        >
                                                            Del
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', margin: '1rem 0' }}>No rooms yet</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Room Form Modal */}
            {showRoomForm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="auth-container" style={{ margin: 0, maxWidth: '500px' }}>
                        <h3>{editingRoom ? 'Edit Room' : 'Add New Room'}</h3>
                        <form onSubmit={handleRoomSubmit}>
                            <input
                                type="text"
                                placeholder="Room Number"
                                value={roomForm.room_number}
                                onChange={e => setRoomForm({ ...roomForm, room_number: e.target.value })}
                                required
                            />
                            <select
                                value={roomForm.room_type}
                                onChange={e => setRoomForm({ ...roomForm, room_type: e.target.value })}
                                required
                            >
                                <option value="SINGLE">Single</option>
                                <option value="DOUBLE">Double</option>
                                <option value="SUITE">Suite</option>
                            </select>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Price per Night"
                                value={roomForm.price_per_night}
                                onChange={e => setRoomForm({ ...roomForm, price_per_night: e.target.value })}
                                required
                            />
                            <input
                                type="number"
                                min="1"
                                placeholder="Capacity"
                                value={roomForm.capacity}
                                onChange={e => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value) })}
                                required
                            />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                                    {editingRoom ? 'Update' : 'Create'}
                                </button>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    style={{ flex: 1 }}
                                    onClick={() => {
                                        setShowRoomForm(null);
                                        setEditingRoom(null);
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
