import { render, screen, waitFor, waitForElementToBeRemoved, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AdminDashboard from '../pages/AdminDashboard';
import { AuthContext } from '../context/AuthContext';
import * as api from '../services/api';

// Mock API module
vi.mock('../services/api', () => ({
    getHotels: vi.fn(),
    createHotel: vi.fn(),
    updateHotel: vi.fn(),
    deleteHotel: vi.fn(),
    createRoom: vi.fn(),
    updateRoom: vi.fn(),
    deleteRoom: vi.fn(),
    getReservations: vi.fn(),
    deleteReservation: vi.fn(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock window.alert and window.confirm
const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => { });
const confirmMock = vi.spyOn(window, 'confirm').mockImplementation(() => true);

const mockHotels = [
    {
        id: 1,
        name: 'Hotel One',
        description: 'First Hotel',
        address: '1st St',
        rating: 4.5,
        rooms: []
    }
];

const mockReservations = [
    {
        id: 1,
        user: 1,
        room: 101,
        check_in: '2025-01-01',
        check_out: '2025-01-05'
    }
];

const renderWithAuth = (user = null) => {
    return render(
        <AuthContext.Provider value={{ user }}>
            <BrowserRouter>
                <AdminDashboard />
            </BrowserRouter>
        </AuthContext.Provider>
    );
};

describe('AdminDashboard Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        api.getHotels.mockResolvedValue({ data: [] }); // Default empty
        api.getReservations.mockResolvedValue({ data: [] }); // Default empty
    });

    afterEach(() => {
        alertMock.mockClear();
        confirmMock.mockClear();
    });

    it('redirects to login if unauthenticated', () => {
        renderWithAuth(null);
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('redirects to home if user is not staff', () => {
        renderWithAuth({ is_staff: false });
        expect(alertMock).toHaveBeenCalledWith('Access denied. Admin privileges required.');
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('renders dashboard for staff user', async () => {
        api.getHotels.mockResolvedValue({ data: mockHotels });
        api.getReservations.mockResolvedValue({ data: mockReservations });
        renderWithAuth({ is_staff: true });

        await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Hotel One')).toBeInTheDocument();
        expect(screen.getByText('+ Add New Hotel')).toBeInTheDocument();
        expect(screen.getByText('Hotels & Rooms')).toBeInTheDocument();
    });

    it('switches tabs to reservations', async () => {
        api.getHotels.mockResolvedValue({ data: mockHotels });
        api.getReservations.mockResolvedValue({ data: mockReservations });
        renderWithAuth({ is_staff: true });

        await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));

        const reservationsTab = screen.getByText('Reservations');
        fireEvent.click(reservationsTab);

        expect(screen.getByText('Room 101')).toBeInTheDocument();
        expect(screen.getByText('In: 2025-01-01')).toBeInTheDocument();
    });

    it('opens add hotel modal and submits', async () => {
        renderWithAuth({ is_staff: true });
        await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));

        fireEvent.click(screen.getByText('+ Add New Hotel'));

        expect(screen.getByText('Add New Hotel')).toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText('Hotel Name'), { target: { value: 'New Hotel' } });
        fireEvent.change(screen.getByPlaceholderText('Description'), { target: { value: 'Desc' } });
        fireEvent.change(screen.getByPlaceholderText('Address'), { target: { value: 'Address' } });
        fireEvent.change(screen.getByPlaceholderText('Rating (0-5)'), { target: { value: '5' } });

        const createButton = screen.getByRole('button', { name: 'Create' });

        api.createHotel.mockResolvedValue({});
        api.getHotels.mockResolvedValue({ data: [{ id: 2, name: 'New Hotel', description: 'Desc', address: 'Address', rating: 5, rooms: [] }] });

        fireEvent.click(createButton);

        await waitFor(() => {
            expect(api.createHotel).toHaveBeenCalledWith({
                name: 'New Hotel',
                description: 'Desc',
                address: 'Address',
                rating: 5,
                image: ''
            });
            // Should verify that loadHotels is called again, meaning new hotel appears
            expect(screen.getByText('New Hotel')).toBeInTheDocument();
        });
    });

    it('deletes a hotel', async () => {
        api.getHotels.mockResolvedValue({ data: mockHotels });
        renderWithAuth({ is_staff: true });
        await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));

        const deleteButtons = screen.getAllByText('Delete');
        // First delete button is for the hotel
        api.deleteHotel.mockResolvedValue({});
        api.getHotels.mockResolvedValue({ data: [] }); // Empty after delete

        fireEvent.click(deleteButtons[0]);

        expect(confirmMock).toHaveBeenCalled();
        await waitFor(() => {
            expect(api.deleteHotel).toHaveBeenCalledWith(1);
            expect(screen.queryByText('Hotel One')).not.toBeInTheDocument();
        });
    });
});
