import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Login from '../pages/Login';
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

const renderWithContext = (loginMock = vi.fn()) => {
    return render(
        <AuthContext.Provider value={{ login: loginMock }}>
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        </AuthContext.Provider>
    );
};

describe('Login Component', () => {
    it('renders login form correctly', () => {
        renderWithContext();
        expect(screen.getByPlaceholderText('Email or Username')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('handles input changes', () => {
        renderWithContext();
        const usernameInput = screen.getByPlaceholderText('Email or Username');
        const passwordInput = screen.getByPlaceholderText('Password');

        fireEvent.change(usernameInput, { target: { value: 'testuser' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        expect(usernameInput.value).toBe('testuser');
        expect(passwordInput.value).toBe('password123');
    });

    it('submits form and navigates on success', async () => {
        const loginMock = vi.fn().mockResolvedValue(true);
        renderWithContext(loginMock);

        fireEvent.change(screen.getByPlaceholderText('Email or Username'), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: /login/i }));

        await waitFor(() => {
            expect(loginMock).toHaveBeenCalledWith('testuser', 'password123');
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    it('displays error message on login failure', async () => {
        const loginMock = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
        renderWithContext(loginMock);

        fireEvent.change(screen.getByPlaceholderText('Email or Username'), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrongpass' } });

        fireEvent.click(screen.getByRole('button', { name: /login/i }));

        await waitFor(() => {
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        });
    });
});
