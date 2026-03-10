import { render, screen } from '@testing-library/react';
import Home from '@/app/page';
import * as AuthContext from '@/lib/auth-context';
import type { User } from 'firebase/auth';

// Mock child components
vi.mock('@/components/dashboard', () => ({ default: () => <div data-testid="dashboard">Dashboard</div> }));

const mockUser = {
  uid: 'test-user-id',
  displayName: 'Test User',
  email: 'test@example.com',
} as User;

describe('Home Page', () => {
  describe('when user is not authenticated', () => {
    beforeEach(() => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ user: null, loading: false });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    test('renders landing page', () => {
      render(<Home />);
      expect(screen.getByText('Barista Mate')).toBeInTheDocument();
      expect(screen.getByText('הכלי האולטימטיבי לשיפור חווית האספרסו הביתית שלך.')).toBeInTheDocument();
    });
  });

  describe('when user is authenticated', () => {
    beforeEach(() => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ user: mockUser, loading: false });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    test('renders dashboard', () => {
      render(<Home />);
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });
  });
});


