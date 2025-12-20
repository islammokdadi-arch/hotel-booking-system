import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import HotelDetail from '../pages/HotelDetail';
import * as api from '../services/api';
import { AuthContext } from '../context/AuthContext';

// Mock dependencies
vi.mock('../services/api', () => ({
    getHotel: vi.fn(),
    createReservation: vi.fn(),
    getRoomAvailability: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: () => ({ id: '1' }),
        useNavigate: () => mockNavigate,
    };
});

// Mock window.alert
const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => { });

const mockHotel = {
    id: 1,
    name: 'Luxury Stay',
    description: 'Best hotel ever',
    address: '123 Beach Rd',
    rating: 4.8,
    image: 'http://test.com/img.jpg',
    rooms: [
        { id: 101, room_type: 'SINGLE', price_per_night: 150, capacity: 1 },
        { id: 102, room_type: 'DOUBLE', price_per_night: 250, capacity: 2 },
    ]
};

const renderWithAuth = (user = null) => {
    return render(
        <AuthContext.Provider value={{ user }}>
            <BrowserRouter>
                <HotelDetail />
            </BrowserRouter>
        </AuthContext.Provider>
    );
};

describe('HotelDetail Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        api.getHotel.mockResolvedValue({ data: mockHotel });
        api.getRoomAvailability.mockResolvedValue({ data: [] });
    });

    afterEach(() => {
        alertMock.mockClear();
    });

    it('renders hotel details correctly', async () => {
        renderWithAuth();

        await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));

        expect(screen.getByText('Luxury Stay')).toBeInTheDocument();
        expect(screen.getByText(/123 Beach Rd/)).toBeInTheDocument(); // Using regex to handle emojis
        expect(screen.getByText('Best hotel ever')).toBeInTheDocument();
    });

    it('renders available rooms', async () => {
        renderWithAuth();

        await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));

        expect(screen.getByText('SINGLE Room')).toBeInTheDocument();
        expect(screen.getByText('$150')).toBeInTheDocument();
        expect(screen.getByText('DOUBLE Room')).toBeInTheDocument();
        expect(screen.getByText('$250')).toBeInTheDocument();
    });

    it('redirects to login if unauthenticated user tries to book', async () => {
        renderWithAuth(null); // No user

        await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));

        const bookButtons = screen.getAllByRole('button', { name: /Book This Room/i });
        fireEvent.submit(bookButtons[0].closest('form'));

        expect(alertMock).toHaveBeenCalledWith('Please login to book a room');
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('allows booking flow for authenticated user', async () => {
        const mockUser = { username: 'testuser' };
        api.createReservation.mockResolvedValue({ data: { id: 1 } });

        const { container } = renderWithAuth(mockUser);

        await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));

        // Select inputs directly since labels are not associated
        const dateInputs = container.querySelectorAll('input[type="date"]');

        // First room inputs (Check-in, Check-out) -> index 0 and 1
        const checkInInput = dateInputs[0];
        const checkOutInput = dateInputs[1];

        fireEvent.change(checkInInput, { target: { value: '2025-01-01' } });
        fireEvent.change(checkOutInput, { target: { value: '2025-01-05' } });

        const bookButtons = screen.getAllByRole('button', { name: /Book This Room/i });
        fireEvent.submit(bookButtons[0].closest('form'));

        await waitFor(() => {
            expect(api.createReservation).toHaveBeenCalledWith({
                room: 101, // First room ID
                check_in: '2025-01-01',
                check_out: '2025-01-05'
            });
            expect(alertMock).toHaveBeenCalledWith('Reservation successful!');
            expect(mockNavigate).toHaveBeenCalledWith('/profile');
        });
    });
});
