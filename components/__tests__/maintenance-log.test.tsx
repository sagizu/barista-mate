import { render, screen, waitFor, act, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MaintenanceLog } from '@/components/maintenance-log';
import * as firestore from '@/lib/firestore';
import * as auth from 'react-firebase-hooks/auth';
import * as fs from 'firebase/firestore';
import { format, subDays } from 'date-fns';

// Mock dependencies
vi.mock('firebase/firestore');
vi.mock('@/lib/firestore');
vi.mock('react-firebase-hooks/auth');

const mockUser = {
  uid: 'test-user-id',
  displayName: 'Test User',
};

// This will be the global mock for onSnapshot callbacks
let onSnapshotCallback: (snapshot: any) => void;

describe('MaintenanceLog Component', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockUpdateMaintenanceDates: any;

  beforeEach(() => {
    user = userEvent.setup();

    vi.spyOn(auth, 'useAuthState').mockReturnValue([mockUser as any, false, undefined]);
    vi.spyOn(fs, 'doc').mockImplementation((...args) => {
        // Based on call, return a specific mock
        if (args[1] === 'users' && args[3] === 'maintenance') {
            return { type: 'document', path: 'maintenance' } as any;
        }
        // Default mock for user preferences
        return { type: 'document', path: 'user' } as any;
    });

    mockUpdateMaintenanceDates = vi.spyOn(firestore, 'updateMaintenanceDates').mockResolvedValue();

    // This mock will now handle both maintenance and user preference snapshots
    vi.spyOn(fs, 'onSnapshot').mockImplementation((ref: any, callback) => {
        if (ref.path === 'maintenance') {
            onSnapshotCallback = callback;
            callback({ exists: () => false, data: () => ({}) });
        } else { // For user preferences
            callback({ exists: () => true, data: () => ({ preferences: { maintenanceFrequencies: {} } }) });
        }
      return () => {}; // Return an unsubscribe function
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders tasks and displays dates from firestore', async () => {
    render(<MaintenanceLog />);
    
    const mockData = {
      lastBackflush: '2026-02-20',
      lastDescaling: '2026-01-15',
    };

    await act(async () => {
      onSnapshotCallback({ exists: () => true, data: () => mockData });
    });

    expect(screen.getByLabelText(/תאריך אחרון/i, { selector: 'input[id="date-lastBackflush"]' })).toHaveValue('2026-02-20');
    expect(screen.getByLabelText(/תאריך אחרון/i, { selector: 'input[id="date-lastDescaling"]' })).toHaveValue('2026-01-15'); 
  });

  test('"Done Today" button calls updateMaintenanceDates with the current date', async () => {
    render(<MaintenanceLog />);
    await user.click(screen.getByRole('button', { name: /התחל לתעד/i }));

    const backflushCard = screen.getByText(/ניקוי ראש עם טבליה \(Backflush\)/i).closest('div.rounded-xl');
    const doneTodayButton = backflushCard?.querySelector('button');

    expect(doneTodayButton).not.toBeNull();
    if(doneTodayButton) {
        await user.click(doneTodayButton);
    }
    
    const today = format(new Date(), 'yyyy-MM-dd');
    await waitFor(() => {
      expect(mockUpdateMaintenanceDates).toHaveBeenCalledWith({ lastBackflush: today });
    });
  });

  test('changing a date manually calls updateMaintenanceDates', async () => {
    render(<MaintenanceLog />);
    await user.click(screen.getByRole('button', { name: /התחל לתעד/i }));

    const filterCard = screen.getByText(/החלפת פילטר מים/i).closest('div.rounded-xl') as HTMLElement;
    const dateInput = within(filterCard).getByLabelText(/תאריך אחרון/i);
    
    expect(dateInput).not.toBeNull();
    if(dateInput) {
        fireEvent.change(dateInput, { target: { value: '2026-02-23' } });
        expect(dateInput).toHaveValue('2026-02-23');
    }

    await waitFor(() => {
      expect(mockUpdateMaintenanceDates).toHaveBeenCalledWith({ waterFilterLastChanged: '2026-02-23' });
    });
  });

  test('displays "Time to do it!" badge for overdue tasks', async () => {
    render(<MaintenanceLog />);
    
    const sixtyOneDaysAgo = format(subDays(new Date(), 61), 'yyyy-MM-dd');
    const mockData = { waterFilterLastChanged: sixtyOneDaysAgo };
    
    await act(async () => {
      onSnapshotCallback({ exists: () => true, data: () => mockData });
    });

    const badge = await screen.findByText(/הגיע הזמן!/i);
    expect(badge).toBeInTheDocument();
    // Check for the orange border
    expect(badge.closest('div.rounded-xl')).toHaveClass('border-[#C67C4E]');
  });
  
  test('does not display overdue badge if date is recent', async () => {
    render(<MaintenanceLog />);
    
    const fiftyNineDaysAgo = format(subDays(new Date(), 59), 'yyyy-MM-dd');
    const mockData = { waterFilterLastChanged: fiftyNineDaysAgo };
    
    await act(async () => {
      onSnapshotCallback({ exists: () => true, data: () => mockData });
    });

    expect(screen.queryByText(/הגיע הזמן!/i)).not.toBeInTheDocument();
  });
});
