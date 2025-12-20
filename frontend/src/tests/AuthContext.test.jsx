import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, AuthContext } from '../context/AuthContext';
import { login as apiLogin, register as apiRegister, getCurrentUser } from '../services/api';

// Mock the API module
jest.mock('../services/api', () => ({
  login: jest.fn(),
  register: jest.fn(),
  getCurrentUser: jest.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test credentials - NOSONAR
const TEST_CREDENTIALS = {
  username: 'testuser',
  password: 'test_password_123',
  email: 'test@example.com',
};

// Test component to access context
const TestComponent = () => {
  const { user, login, register, logout, loading } = React.useContext(AuthContext);
  
  const handleLogin = () => {
    login(TEST_CREDENTIALS.username, TEST_CREDENTIALS.password);
  };
  
  const handleRegister = () => {
    register(
      'John',
      'Doe',
      'newuser',
      TEST_CREDENTIALS.email,
      TEST_CREDENTIALS.password,
      '1990-01-01'
    );
  };
  
  return (
    <div>
      <div data-testid="user">{user ? user.username : 'No user'}</div>
      <div data-testid="loading">{loading ? 'Loading...' : 'Loaded'}</div>
      <button onClick={handleLogin} data-testid="login-btn">
        Login
      </button>
      <button onClick={handleRegister} data-testid="register-btn">
        Register
      </button>
      <button onClick={logout} data-testid="logout-btn">
        Logout
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  test('should show loading initially when no token exists', async () => {
    localStorageMock.getItem.mockReturnValue(null);
    getCurrentUser.mockRejectedValue(new Error('No token'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading...');
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    });
  });

  test('should load user from token on mount', async () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'access_token') return 'valid-token-123';
      return null;
    });

    const mockUser = { id: 1, username: 'existinguser', email: 'user@example.com' };
    getCurrentUser.mockResolvedValue({ data: mockUser });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getCurrentUser).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('user')).toHaveTextContent('existinguser');
    });
  });

  test('should handle login successfully', async () => {
    const user = userEvent.setup();
    const mockLoginResponse = {
      data: { access: 'new-access-token', refresh: 'new-refresh-token' }
    };
    const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };

    apiLogin.mockResolvedValue(mockLoginResponse);
    getCurrentUser.mockResolvedValue({ data: mockUser });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await user.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      expect(apiLogin).toHaveBeenCalledWith({ 
        username: TEST_CREDENTIALS.username, 
        password: TEST_CREDENTIALS.password 
      });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'new-access-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refresh_token', 'new-refresh-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('username', 'testuser');
      expect(getCurrentUser).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('user')).toHaveTextContent('testuser');
    });
  });

  test('should handle registration and auto-login', async () => {
    const user = userEvent.setup();
    const mockRegisterResponse = { data: {} };
    const mockLoginResponse = {
      data: { access: 'reg-access-token', refresh: 'reg-refresh-token' }
    };
    const mockUser = { id: 2, username: 'newuser', email: 'test@example.com' };

    apiRegister.mockResolvedValue(mockRegisterResponse);
    apiLogin.mockResolvedValue(mockLoginResponse);
    getCurrentUser.mockResolvedValue({ data: mockUser });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await user.click(screen.getByTestId('register-btn'));

    await waitFor(() => {
      expect(apiRegister).toHaveBeenCalledWith({
        first_name: 'John',
        last_name: 'Doe',
        username: 'newuser',
        email: TEST_CREDENTIALS.email,
        password: TEST_CREDENTIALS.password,
        date_of_birth: '1990-01-01'
      });
      expect(apiLogin).toHaveBeenCalledWith({ username: 'newuser', password: TEST_CREDENTIALS.password });
      expect(screen.getByTestId('user')).toHaveTextContent('newuser');
    });
  });

  test('should handle logout correctly', async () => {
    const user = userEvent.setup();
    
    // First login
    localStorageMock.setItem('access_token', 'some-token');
    localStorageMock.setItem('refresh_token', 'some-refresh');
    localStorageMock.setItem('username', 'loggedinuser');
    
    const mockUser = { id: 1, username: 'loggedinuser' };
    getCurrentUser.mockResolvedValue({ data: mockUser });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('loggedinuser');
    });

    // Then logout
    await user.click(screen.getByTestId('logout-btn'));

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('username');
    expect(screen.getByTestId('user')).toHaveTextContent('No user');
  });

  test('should handle token expiration on mount', async () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'access_token') return 'expired-token';
      return null;
    });

    getCurrentUser.mockRejectedValue(new Error('Token expired'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getCurrentUser).toHaveBeenCalledTimes(1);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('username');
      expect(screen.getByTestId('user')).toHaveTextContent('No user');
    });
  });
});