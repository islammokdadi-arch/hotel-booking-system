import { render, screen, waitForElementToBeRemoved, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Profile from './Profile';
import * as api from '../services/api';

// Mock getReservations API
vi.mock('../services/api', () => ({
    getReservations: vi.fn(),
}));

const mockReservations = [
    {
        id: 1,
        room: 101,
        created_at: '2025-01-01T10:00:00Z',
        check_in: '2025-02-01',
        check_out: '2025-02-05'
    },
    {
        id: 2,
        room: 102,
        created_at: '2025-01-05T12:00:00Z',
        check_in: '2025-03-10',
        check_out: '2025-03-15'
    }
];

describe('Profile Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state initially', async () => {
        // Mock a promise that doesn't resolve immediately to check loading state
        api.getReservations.mockImplementation(() => new Promise(() => { }));

        render(<Profile />);
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders empty state when no reservations found', async () => {
        api.getReservations.mockResolvedValue({ data: [] });

        render(<Profile />);

        await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));

        expect(screen.getByText("You haven't made any reservations yet.")).toBeInTheDocument();
        expect(screen.getByText('My Reservations')).toBeInTheDocument();
    });

    it('renders list of reservations', async () => {
        api.getReservations.mockResolvedValue({ data: mockReservations });

        render(<Profile />);

        await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));

        expect(screen.getByText('My Reservations')).toBeInTheDocument();

        // Check for first reservation details
        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.getByText('Room ID: 101')).toBeInTheDocument();
        expect(screen.getByText('2025-02-01')).toBeInTheDocument(); // Check-in
        expect(screen.getByText('2025-02-05')).toBeInTheDocument(); // Check-out

        // Check for second reservation details
        expect(screen.getByText('#2')).toBeInTheDocument();
        expect(screen.getByText('Room ID: 102')).toBeInTheDocument();
    });

    it('handles API error gracefully', async () => {
        api.getReservations.mockRejectedValue(new Error('API Error'));

        render(<Profile />);

        // Should eventually stop loading. 
        // Based on Profile.jsx logic: .catch(() => setLoading(false));
        await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));

        // Since the component just sets loading=false on error (doesn't show error message),
        // we expect to see "My Reservations" header but empty state (reservations=[] by default)
        expect(screen.getByText('My Reservations')).toBeInTheDocument();
        expect(screen.getByText("You haven't made any reservations yet.")).toBeInTheDocument();
    });
});
