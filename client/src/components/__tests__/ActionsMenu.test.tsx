/**
 * HiBowan - ActionsMenu Component Tests
 * Demonstrates comprehensive component testing patterns
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActionsMenu } from '../ActionsMenu';
import { TEST_TRIP, TEST_USER } from '../../test/setup';

// Mock the auth context
const mockUseAuth = vi.fn();
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock the API client
const mockApiRequest = vi.fn();
vi.mock('../../lib/queryClient', () => ({
  apiRequest: mockApiRequest,
}));

describe('ActionsMenu Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: TEST_USER,
      isAuthenticated: true,
    });
  });

  describe('Rendering', () => {
    it('should render actions menu for authenticated user', () => {
      render(<ActionsMenu trip={TEST_TRIP} />);
      
      expect(screen.getByRole('button', { name: /more actions/i })).toBeInTheDocument();
    });

    it('should show correct actions for trip organizer', () => {
      const organizerTrip = { ...TEST_TRIP, organizerId: TEST_USER.id };
      render(<ActionsMenu trip={organizerTrip} />);
      
      fireEvent.click(screen.getByRole('button', { name: /more actions/i }));
      
      expect(screen.getByText(/edit trip/i)).toBeInTheDocument();
      expect(screen.getByText(/delete trip/i)).toBeInTheDocument();
    });

    it('should show different actions for non-organizer', () => {
      const otherTrip = { ...TEST_TRIP, organizerId: 'other-user-id' };
      render(<ActionsMenu trip={otherTrip} />);
      
      fireEvent.click(screen.getByRole('button', { name: /more actions/i }));
      
      expect(screen.getByText(/report trip/i)).toBeInTheDocument();
      expect(screen.queryByText(/delete trip/i)).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle pin/unpin action', async () => {
      mockApiRequest.mockResolvedValueOnce({ success: true });
      
      render(<ActionsMenu trip={TEST_TRIP} />);
      
      fireEvent.click(screen.getByRole('button', { name: /more actions/i }));
      fireEvent.click(screen.getByText(/pin trip/i));
      
      await waitFor(() => {
        expect(mockApiRequest).toHaveBeenCalledWith('/api/trips/save', {
          method: 'POST',
          body: JSON.stringify({
            tripId: TEST_TRIP.id,
            saveType: 'pinned',
          }),
        });
      });
    });

    it('should handle share action', () => {
      // Mock clipboard API
      const writeTextMock = vi.fn();
      Object.assign(navigator, {
        clipboard: { writeText: writeTextMock },
      });

      render(<ActionsMenu trip={TEST_TRIP} />);
      
      fireEvent.click(screen.getByRole('button', { name: /more actions/i }));
      fireEvent.click(screen.getByText(/share trip/i));
      
      expect(writeTextMock).toHaveBeenCalledWith(
        expect.stringContaining(`/trips/${TEST_TRIP.id}`)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockApiRequest.mockRejectedValueOnce(new Error('API Error'));
      
      render(<ActionsMenu trip={TEST_TRIP} />);
      
      fireEvent.click(screen.getByRole('button', { name: /more actions/i }));
      fireEvent.click(screen.getByText(/pin trip/i));
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<ActionsMenu trip={TEST_TRIP} />);
      
      const menuButton = screen.getByRole('button', { name: /more actions/i });
      expect(menuButton).toHaveAttribute('aria-haspopup');
      expect(menuButton).toHaveAttribute('aria-expanded');
    });

    it('should support keyboard navigation', () => {
      render(<ActionsMenu trip={TEST_TRIP} />);
      
      const menuButton = screen.getByRole('button', { name: /more actions/i });
      
      // Test Enter key
      fireEvent.keyDown(menuButton, { key: 'Enter', code: 'Enter' });
      expect(screen.getByRole('menu')).toBeInTheDocument();
      
      // Test Escape key
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = vi.fn();
      const MemoizedActionsMenu = vi.fn(() => {
        renderSpy();
        return <ActionsMenu trip={TEST_TRIP} />;
      });

      const { rerender } = render(<MemoizedActionsMenu />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props
      rerender(<MemoizedActionsMenu />);
      expect(renderSpy).toHaveBeenCalledTimes(1); // Should be memoized
    });
  });
});