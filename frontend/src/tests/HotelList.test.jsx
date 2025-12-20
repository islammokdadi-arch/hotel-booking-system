import { render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import HotelList from '../pages/HotelList';
import { getHotels } from '../services/api';

// Mock API module
vi.mock('../services/api', () => ({
    getHotels: vi.fn(),
}));

const renderWithRouter = () => {
    return render(
        <BrowserRouter>
            <HotelList />
        </BrowserRouter>
    );
};

describe('HotelList Component', () => {
    it('renders list of hotels fetched from API', async () => {
        const mockHotels = [
            { id: 1, name: 'Hotel One', address: 'City A', rating: 4.5, description: 'Desc 1', image: 'http://img1.com', rooms: [{ price_per_night: 100 }] },
            { id: 2, name: 'Hotel Two', address: 'City B', rating: 3.0, description: 'Desc 2', image: 'http://img2.com', rooms: [{ price_per_night: 200 }] }
        ];

        getHotels.mockResolvedValue({ data: mockHotels });

        renderWithRouter();

        await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));

        expect(getHotels).toHaveBeenCalled();

        await waitFor(() => {
            expect(screen.getByText('Hotel One')).toBeInTheDocument();
            expect(screen.getByText('Hotel Two')).toBeInTheDocument();
            expect(screen.getByText(/City A/)).toBeInTheDocument();
        });
    });

    it('displays message when no hotels found', async () => {
        getHotels.mockResolvedValue({ data: [] });

        renderWithRouter();

        await waitFor(() => {
            // Adjust the text matcher based on actual implementation. 
            // Assuming it renders "No hotels found" or similar.
            // If implementation differs, this test might fail and need adjustment.
            expect(screen.getByText(/No hotels found/i)).toBeInTheDocument();
        });
    });
});
