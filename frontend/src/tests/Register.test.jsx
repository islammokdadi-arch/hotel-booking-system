import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthContext } from '../context/AuthContext';
import Register from '../components/Register';
import { useNavigate } from 'react-router-dom';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

// Mock the AuthContext
const mockRegister = jest.fn();
const mockNavigate = jest.fn();

const mockAuthContext = {
  register: mockRegister,
};

const renderWithAuthContext = (ui) => {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      {ui}
    </AuthContext.Provider>
  );
};

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
  });

  test('renders registration form with all fields', () => {
    renderWithAuthContext(<Register />);
    
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Last Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Date of Birth')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByText('You must be at least 18 years old')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
  });

  test('validates age requirement - under 18', async () => {
    const user = userEvent.setup();
    renderWithAuthContext(<Register />);
    
    // Fill form with underage user
    await user.type(screen.getByPlaceholderText('First Name'), 'John');
    await user.type(screen.getByPlaceholderText('Last Name'), 'Doe');
    await user.type(screen.getByPlaceholderText('Username'), 'johndoe');
    await user.type(screen.getByPlaceholderText('Email'), 'john@example.com');
    
    // Set date of birth to make user 17 years old
    const seventeenYearsAgo = new Date();
    seventeenYearsAgo.setFullYear(seventeenYearsAgo.getFullYear() - 17);
    const dobValue = seventeenYearsAgo.toISOString().split('T')[0];
    
    const dobInput = screen.getByPlaceholderText('Date of Birth');
    await user.clear(dobInput);
    await user.type(dobInput, dobValue);
    
    await user.type(screen.getByPlaceholderText('Password'), 'short');
    
    await user.click(screen.getByRole('button', { name: 'Register' }));
    
    // Should show age validation error
    expect(await screen.findByText('You must be at least 18 years old to register.')).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test('validates password length - too short', async () => {
    const user = userEvent.setup();
    renderWithAuthContext(<Register />);
    
    // Fill form with valid age but short password
    await user.type(screen.getByPlaceholderText('First Name'), 'Jane');
    await user.type(screen.getByPlaceholderText('Last Name'), 'Smith');
    await user.type(screen.getByPlaceholderText('Username'), 'janesmith');
    await user.type(screen.getByPlaceholderText('Email'), 'jane@example.com');
    
    // Set date of birth to make user 25 years old
    const twentyFiveYearsAgo = new Date();
    twentyFiveYearsAgo.setFullYear(twentyFiveYearsAgo.getFullYear() - 25);
    const dobValue = twentyFiveYearsAgo.toISOString().split('T')[0];
    
    const dobInput = screen.getByPlaceholderText('Date of Birth');
    await user.clear(dobInput);
    await user.type(dobInput, dobValue);
    
    // Enter short password
    await user.type(screen.getByPlaceholderText('Password'), '123');
    
    await user.click(screen.getByRole('button', { name: 'Register' }));
    
    // Should show password validation error
    expect(await screen.findByText('Password must be at least 8 characters long.')).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test('submits form successfully with valid data', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue();
    
    renderWithAuthContext(<Register />);
    
    // Fill form with valid data
    await user.type(screen.getByPlaceholderText('First Name'), 'Alice');
    await user.type(screen.getByPlaceholderText('Last Name'), 'Johnson');
    await user.type(screen.getByPlaceholderText('Username'), 'alicej');
    await user.type(screen.getByPlaceholderText('Email'), 'alice@example.com');
    
    // Set valid date of birth (25 years old)
    const validDob = new Date();
    validDob.setFullYear(validDob.getFullYear() - 25);
    const dobValue = validDob.toISOString().split('T')[0];
    
    const dobInput = screen.getByPlaceholderText('Date of Birth');
    await user.clear(dobInput);
    await user.type(dobInput, dobValue);
    
    await user.type(screen.getByPlaceholderText('Password'), 'securepassword123');
    
    await user.click(screen.getByRole('button', { name: 'Register' }));
    
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        'Alice',
        'Johnson',
        'alicej',
        'alice@example.com',
        'securepassword123',
        dobValue
      );
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('handles username already exists error', async () => {
    const user = userEvent.setup();
    const errorResponse = {
      response: {
        data: {
          username: ['A user with that username already exists.']
        }
      }
    };
    mockRegister.mockRejectedValue(errorResponse);
    
    renderWithAuthContext(<Register />);
    
    // Fill form
    await user.type(screen.getByPlaceholderText('First Name'), 'Bob');
    await user.type(screen.getByPlaceholderText('Last Name'), 'Brown');
    await user.type(screen.getByPlaceholderText('Username'), 'existinguser');
    await user.type(screen.getByPlaceholderText('Email'), 'bob@example.com');
    
    const validDob = new Date();
    validDob.setFullYear(validDob.getFullYear() - 30);
    const dobValue = validDob.toISOString().split('T')[0];
    
    const dobInput = screen.getByPlaceholderText('Date of Birth');
    await user.clear(dobInput);
    await user.type(dobInput, dobValue);
    
    await user.type(screen.getByPlaceholderText('Password'), 'password123');
    
    await user.click(screen.getByRole('button', { name: 'Register' }));
    
    expect(await screen.findByText('Username already exists: A user with that username already exists.')).toBeInTheDocument();
  });

  test('handles email already exists error', async () => {
    const user = userEvent.setup();
    const errorResponse = {
      response: {
        data: {
          email: ['This field must be unique.']
        }
      }
    };
    mockRegister.mockRejectedValue(errorResponse);
    
    renderWithAuthContext(<Register />);
    
    // Fill form
    await user.type(screen.getByPlaceholderText('First Name'), 'Charlie');
    await user.type(screen.getByPlaceholderText('Last Name'), 'Davis');
    await user.type(screen.getByPlaceholderText('Username'), 'charlied');
    await user.type(screen.getByPlaceholderText('Email'), 'existing@example.com');
    
    const validDob = new Date();
    validDob.setFullYear(validDob.getFullYear() - 28);
    const dobValue = validDob.toISOString().split('T')[0];
    
    const dobInput = screen.getByPlaceholderText('Date of Birth');
    await user.clear(dobInput);
    await user.type(dobInput, dobValue);
    
    await user.type(screen.getByPlaceholderText('Password'), 'password123');
    
    await user.click(screen.getByRole('button', { name: 'Register' }));
    
    expect(await screen.findByText('Email already exists: This field must be unique.')).toBeInTheDocument();
  });

  test('handles generic registration error', async () => {
    const user = userEvent.setup();
    const errorResponse = {
      response: {
        data: {}
      }
    };
    mockRegister.mockRejectedValue(errorResponse);
    
    renderWithAuthContext(<Register />);
    
    // Fill form
    await user.type(screen.getByPlaceholderText('First Name'), 'David');
    await user.type(screen.getByPlaceholderText('Last Name'), 'Wilson');
    await user.type(screen.getByPlaceholderText('Username'), 'davidw');
    await user.type(screen.getByPlaceholderText('Email'), 'david@example.com');
    
    const validDob = new Date();
    validDob.setFullYear(validDob.getFullYear() - 35);
    const dobValue = validDob.toISOString().split('T')[0];
    
    const dobInput = screen.getByPlaceholderText('Date of Birth');
    await user.clear(dobInput);
    await user.type(dobInput, dobValue);
    
    await user.type(screen.getByPlaceholderText('Password'), 'password123');
    
    await user.click(screen.getByRole('button', { name: 'Register' }));
    
    expect(await screen.findByText('Registration failed. Please try again.')).toBeInTheDocument();
  });

  test('validates date of birth from backend', async () => {
    const user = userEvent.setup();
    const errorResponse = {
      response: {
        data: {
          date_of_birth: ['Invalid date format or value.']
        }
      }
    };
    mockRegister.mockRejectedValue(errorResponse);
    
    renderWithAuthContext(<Register />);
    
    // Fill form
    await user.type(screen.getByPlaceholderText('First Name'), 'Emma');
    await user.type(screen.getByPlaceholderText('Last Name'), 'Taylor');
    await user.type(screen.getByPlaceholderText('Username'), 'emmat');
    await user.type(screen.getByPlaceholderText('Email'), 'emma@example.com');
    
    // Note: frontend validation passes but backend rejects
    const validDob = new Date();
    validDob.setFullYear(validDob.getFullYear() - 20);
    const dobValue = validDob.toISOString().split('T')[0];
    
    const dobInput = screen.getByPlaceholderText('Date of Birth');
    await user.clear(dobInput);
    await user.type(dobInput, dobValue);
    
    await user.type(screen.getByPlaceholderText('Password'), 'password123');
    
    await user.click(screen.getByRole('button', { name: 'Register' }));
    
    expect(await screen.findByText('Invalid date format or value.')).toBeInTheDocument();
  });

  test('prevents future date of birth', async () => {
    const user = userEvent.setup();
    renderWithAuthContext(<Register />);
    
    const dateInput = screen.getByPlaceholderText('Date of Birth');
    const maxDate = new Date().toISOString().split('T')[0];
    
    // The max attribute should be set to today
    expect(dateInput).toHaveAttribute('max', maxDate);
    
    // Try to type a future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    
    await user.clear(dateInput);
    await user.type(dateInput, futureDateStr);
    
    // The browser should prevent this, but let's check the value
    // Note: browser validation might clear invalid values
    expect(dateInput.value).not.toBe(futureDateStr);
  });
});