import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Register from '../pages/Register';
import { AuthContext } from '../context/AuthContext';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const renderWithContext = (registerMock = vi.fn()) => {
    return render(
        <AuthContext.Provider value={{ register: registerMock }}>
            <BrowserRouter>
                <Register />
            </BrowserRouter>
        </AuthContext.Provider>
    );
};

describe('Register Component', () => {
    it('renders registration form correctly', () => {
        renderWithContext();
        expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Last Name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Date of Birth')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    });

    it('validates age (must be at least 18)', async () => {
        renderWithContext();
        // Set date of birth to a recent year (under 18)
        const currentYear = new Date().getFullYear();
        const underAgeDate = `${currentYear - 10}-01-01`;

        fireEvent.change(screen.getByPlaceholderText('Date of Birth'), { target: { value: underAgeDate } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } }); // valid password

        fireEvent.click(screen.getByRole('button', { name: /register/i }));

        await waitFor(() => {
            expect(screen.getByText(/You must be at least 18 years old/i)).toBeInTheDocument();
        });
    });

    it('validates password length', async () => {
        renderWithContext();

        fireEvent.change(screen.getByPlaceholderText('First Name'), { target: { value: 'John' } });
        fireEvent.change(screen.getByPlaceholderText('Last Name'), { target: { value: 'Doe' } });
        fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'johndoe' } });
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'john@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('Date of Birth'), { target: { value: '2000-01-01' } });
        // Invalid password
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'short' } });

        fireEvent.click(screen.getByRole('button', { name: /register/i }));

        await waitFor(() => {
            expect(screen.getByText(/Password must be at least 8 characters long/i)).toBeInTheDocument();
        });
    });

    it('submits form and navigates on success', async () => {
        const registerMock = vi.fn().mockResolvedValue(true);
        renderWithContext(registerMock);

        fireEvent.change(screen.getByPlaceholderText('First Name'), { target: { value: 'John' } });
        fireEvent.change(screen.getByPlaceholderText('Last Name'), { target: { value: 'Doe' } });
        fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'johndoe' } });
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'john@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('Date of Birth'), { target: { value: '2000-01-01' } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: /register/i }));

        await waitFor(() => {
            expect(registerMock).toHaveBeenCalledWith('John', 'Doe', 'johndoe', 'john@example.com', 'password123', '2000-01-01');
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    it('handles backend registration errors', async () => {
        const errorResponse = {
            response: {
                data: {
                    username: ['Username already exists']
                }
            }
        };
        const registerMock = vi.fn().mockRejectedValue(errorResponse);
        renderWithContext(registerMock);

        // Fill all valid data
        fireEvent.change(screen.getByPlaceholderText('First Name'), { target: { value: 'John' } });
        fireEvent.change(screen.getByPlaceholderText('Last Name'), { target: { value: 'Doe' } });
        fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'existing_user' } });
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'john@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('Date of Birth'), { target: { value: '2000-01-01' } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: /register/i }));

        await waitFor(() => {
            expect(screen.getByText(/Username already exists/i)).toBeInTheDocument();
        });
    });
});
