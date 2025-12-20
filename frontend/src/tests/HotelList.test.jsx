import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HotelList from '../components/HotelList';
import { getHotels } from '../services/api';

// Mock the API
jest.mock('../services/api', () => ({
  getHotels: jest.fn(),
}));

describe('HotelList Component', () => {
  const mockHotels = [
    {
      id: 1,
      name: 'Grand Plaza Hotel',
      description: 'A luxurious 5-star hotel in the city center',
      address: '123 Main Street, New York',
      image: 'https://example.com/hotel1.jpg',
      rating: 4.8,
      rooms: []
    },
    {
      id: 2,
      name: 'Seaside Resort',
      description: 'Beautiful beachfront resort with ocean views',
      address: '456 Beach Road, Miami',
      image: 'https://example.com/hotel2.jpg',
      rating: 4.5,
      rooms: []
    },
    {
      id: 3,
      name: 'Mountain Lodge',
      description: 'Cozy lodge nestled in the mountains',
      address: '789 Mountain Trail, Denver',
      image: null,
      rating: 4.2,
      rooms: []
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows loading state initially', () => {
    getHotels.mockReturnValue(new Promise(() => {})); // Never resolves
    
    render(
      <MemoryRouter>
        <HotelList />
      </MemoryRouter>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(getHotels).toHaveBeenCalledTimes(1);
  });

  test('displays hotels after loading', async () => {
    getHotels.mockResolvedValue({ data: mockHotels });
    
    render(
      <MemoryRouter>
        <HotelList />
      </MemoryRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Check hotel names are displayed
    expect(screen.getByText('Grand Plaza Hotel')).toBeInTheDocument();
    expect(screen.getByText('Seaside Resort')).toBeInTheDocument();
    expect(screen.getByText('Mountain Lodge')).toBeInTheDocument();
    
    // Check descriptions
    expect(screen.getByText('A luxurious 5-star hotel in the city center')).toBeInTheDocument();
    expect(screen.getByText('Beautiful beachfront resort with ocean views')).toBeInTheDocument();
    
    // Check addresses
    expect(screen.getByText('📍 123 Main Street, New York')).toBeInTheDocument();
    expect(screen.getByText('📍 456 Beach Road, Miami')).toBeInTheDocument();
    
    // Check ratings
    expect(screen.getAllByText('★ 4.8')).toHaveLength(1);
    expect(screen.getAllByText('★ 4.5')).toHaveLength(1);
    expect(screen.getAllByText('★ 4.2')).toHaveLength(1);
    
    // Check "View Details" buttons
    const viewDetailsButtons = screen.getAllByText('View Details');
    expect(viewDetailsButtons).toHaveLength(3);
    
    // Check images (including default for hotel without image)
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(3);
    
    // First hotel has custom image
    expect(images[0]).toHaveAttribute('src', 'https://example.com/hotel1.jpg');
    expect(images[0]).toHaveAttribute('alt', 'Grand Plaza Hotel');
    
    // Third hotel has default image
    expect(images[2]).toHaveAttribute('src', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3');
    expect(images[2]).toHaveAttribute('alt', 'Mountain Lodge');
  });

  test('displays header correctly', async () => {
    getHotels.mockResolvedValue({ data: mockHotels });
    
    render(
      <MemoryRouter>
        <HotelList />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Explore Our Hotels')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Discover exceptional stays tailored to your preferences')).toBeInTheDocument();
  });

  test('handles API error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    getHotels.mockRejectedValue(new Error('Network error'));
    
    render(
      <MemoryRouter>
        <HotelList />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Component should not crash
    expect(screen.getByText('Explore Our Hotels')).toBeInTheDocument();
    
    // Should show empty hotel grid (no hotels)
    const hotelCards = screen.queryAllByText(/Hotel|Resort|Lodge/);
    expect(hotelCards.length).toBeLessThan(3); // Only header text
    
    consoleSpy.mockRestore();
  });

  test('renders correct links to hotel details', async () => {
    getHotels.mockResolvedValue({ data: mockHotels });
    
    render(
      <MemoryRouter>
        <HotelList />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Grand Plaza Hotel')).toBeInTheDocument();
    });
    
    // Check that links have correct href
    const links = screen.getAllByRole('link');
    const detailLinks = links.filter(link => link.textContent === 'View Details');
    
    expect(detailLinks[0]).toHaveAttribute('href', '/hotels/1');
    expect(detailLinks[1]).toHaveAttribute('href', '/hotels/2');
    expect(detailLinks[2]).toHaveAttribute('href', '/hotels/3');
  });

  test('handles empty hotel list', async () => {
    getHotels.mockResolvedValue({ data: [] });
    
    render(
      <MemoryRouter>
        <HotelList />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Header should still be visible
    expect(screen.getByText('Explore Our Hotels')).toBeInTheDocument();
    
    // No hotel cards should be rendered
    const hotelCards = screen.queryAllByText(/Hotel|Resort|Lodge/);
    expect(hotelCards.length).toBe(0); // Only header
  });
});