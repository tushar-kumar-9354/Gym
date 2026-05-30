import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from './page';
import userEvent from '@testing-library/user-event';

describe('Login Page DOM Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Reset window.location mock
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
  });

  it('renders login form by default', () => {
    render(<Login />);
    
    // Verify login inputs are present
    expect(screen.getByPlaceholderText(/John Doe or name@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Log In/i })[1]).toBeInTheDocument();
  });

  it('switches to signup form when clicking Sign Up tab', async () => {
    const user = userEvent.setup();
    render(<Login />);
    
    // Click the Sign Up tab
    const signUpTab = screen.getByRole('button', { name: /^Sign Up$/i });
    await user.click(signUpTab);
    
    // Verify signup inputs are present
    expect(screen.getByPlaceholderText(/^John Doe$/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/name@example.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
  });

  it('submits login form and calls API', async () => {
    const user = userEvent.setup();
    // Mock the fetch response for login and then for sync sequentially
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ ok: true, user: { name: 'Test', email: 'test@example.com', role: 'client' } })
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ ok: true, data: { 'test_key': 'test_val' } })
      });

    render(<Login />);
    
    const idInput = screen.getByPlaceholderText(/John Doe or name@example.com/i);
    const passInput = screen.getByPlaceholderText(/••••••••/i);
    const submitBtn = screen.getAllByRole('button', { name: /Log In/i })[1];

    await user.type(idInput, 'test@example.com');
    await user.type(passInput, 'password123');
    await user.click(submitBtn);

    // Assert API was called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ identifier: 'test@example.com', password: 'password123' })
      }));
    });

    // Assert localStorage was populated
    await waitFor(() => {
      expect(localStorage.getItem('userEmail')).toBe('test@example.com');
      expect(window.location.href).toBe('/');
    });
  });

  it('submits signup form and calls API directly (no OTP)', async () => {
    const user = userEvent.setup();
    // Mock sequential fetch responses: first for register, second for sync
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ ok: true })
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ ok: true, data: {} })
      });

    render(<Login />);
    
    // Switch to Sign Up
    await user.click(screen.getByRole('button', { name: /^Sign Up$/i }));
    
    const nameInput = screen.getByPlaceholderText(/^John Doe$/i);
    const emailInput = screen.getByPlaceholderText(/name@example.com/i);
    const passInput = screen.getByPlaceholderText(/••••••••/i);
    const submitBtn = screen.getByRole('button', { name: /Create Account/i });

    await user.type(nameInput, 'John');
    await user.type(emailInput, 'john@example.com');
    await user.type(passInput, 'securepass');
    await user.click(submitBtn);

    // Assert API was called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'John', email: 'john@example.com', password: 'securepass' })
      }));
    });

    // Assert it didn't look for OTP
    expect(screen.queryByText(/Enter OTP/i)).not.toBeInTheDocument();
  });
});
