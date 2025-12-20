import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api/',
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
export const register = (data) => api.post('register/', data);
export const login = (data) => api.post('token/', data);
export const refreshToken = (refresh) => api.post('token/refresh/', { refresh });
export const getCurrentUser = () => api.get('me/');

// Hotels
export const getHotels = () => api.get('hotels/');
export const getHotel = (id) => api.get(`hotels/${id}/`);
export const createHotel = (data) => api.post('hotels/', data);
export const updateHotel = (id, data) => api.put(`hotels/${id}/`, data);
export const deleteHotel = (id) => api.delete(`hotels/${id}/`);

// Rooms
export const getRooms = () => api.get('rooms/');
export const createRoom = (data) => api.post('rooms/', data);
export const updateRoom = (id, data) => api.put(`rooms/${id}/`, data);
export const deleteRoom = (id) => api.delete(`rooms/${id}/`);

// Reservations
export const createReservation = (data) => api.post('reservations/', data);
export const getReservations = () => api.get('reservations/');

