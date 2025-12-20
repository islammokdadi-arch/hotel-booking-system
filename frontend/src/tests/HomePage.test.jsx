import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom'; // Needed for Link component
import { describe, it, expect } from 'vitest';
import HomePage from '../pages/HomePage';

describe('HomePage Component', () => {
    it('renders hero section correctly', () => {
        render(
            <BrowserRouter>
                <HomePage />
            </BrowserRouter>
        );

        expect(screen.getByText('Find Your Perfect Luxury Stay')).toBeInTheDocument();
        expect(screen.getByText(/Discover hand-picked luxury hotels/)).toBeInTheDocument();
        expect(screen.getByText('Browse Collection')).toBeInTheDocument();
    });

    it('renders feature cards', () => {
        render(
            <BrowserRouter>
                <HomePage />
            </BrowserRouter>
        );

        expect(screen.getByText('Why Choose HoteLix?')).toBeInTheDocument();
        expect(screen.getByText('Luxury Hotels')).toBeInTheDocument();
        expect(screen.getByText('Secure Booking')).toBeInTheDocument();
        expect(screen.getByText('24/7 Support')).toBeInTheDocument();
    });
});
