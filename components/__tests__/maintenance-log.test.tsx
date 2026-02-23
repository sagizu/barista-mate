
import { render, screen, waitFor, act } from '@testing-library/react';
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
    vi.spyOn(fs, 'doc').mockReturnValue({ type: 'document' } as any);
    mockUpdateMaintenanceDates = vi.spyOn(firestore, 'updateMaintenanceDates').mockResolvedValue();

    vi.spyOn(fs, 'onSnapshot').mockImplementation((ref, callback) => {
      onSnapshotCallback = callback;
      // Immediately call with empty data to simulate initial state
      callback({ exists: () => false, data: () => ({}) });
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

    const backflushCard = screen.getByText(/ניקוי "עיוור"/i).parentElement?.parentElement;
    const descalingCard = screen.getByText(/ניקוי אבנית/i).parentElement?.parentElement;

    const backflushInput = backflushCard?.querySelector('input');
    const descalingInput = descalingCard?.querySelector('input');

    expect(backflushInput).toHaveValue('2026-02-20');
    expect(descalingInput).toHaveValue('2026-01-15');
  });

  test('"Done Today" button calls updateMaintenanceDates with the current date', async () => {
    render(<MaintenanceLog />);

    const groupHeadCard = screen.getByText(/ניקוי ראש/i).parentElement?.parentElement;
    const doneTodayButton = groupHeadCard?.querySelector('button');

    expect(doneTodayButton).not.toBeNull();
    if(doneTodayButton) {
        await user.click(doneTodayButton);
    }
    
    const today = format(new Date(), 'yyyy-MM-dd');
    await waitFor(() => {
      expect(mockUpdateMaintenanceDates).toHaveBeenCalledWith({ lastGroupHeadCleaning: today });
    });
  });

  test('changing a date manually calls updateMaintenanceDates', async () => {
    render(<MaintenanceLog />);

    const filterCard = screen.getByText(/החלפת פילטר מים/i).parentElement?.parentElement;
    const dateInput = filterCard?.querySelector('input');
    
    expect(dateInput).not.toBeNull();
    if(dateInput) {
        await user.clear(dateInput);
        await user.type(dateInput, '2026-02-23');
    }

    await waitFor(() => {
      expect(mockUpdateMaintenanceDates).toHaveBeenCalledWith({ waterFilterLastChanged: '2026-02-23' });
    });
  });

  test('displays overdue filter warning if date is > 90 days ago', async () => {
    render(<MaintenanceLog />);
    
    const ninetyOneDaysAgo = format(subDays(new Date(), 91), 'yyyy-MM-dd');
    const mockData = { waterFilterLastChanged: ninetyOneDaysAgo };
    
    await act(async () => {
      onSnapshotCallback({ exists: () => true, data: () => mockData });
    });

    const warning = await screen.findByText(/אזהרה: החלף פילטר מים/i);
    expect(warning).toBeInTheDocument();
  });
  
  test('does not display overdue filter warning if date is < 90 days ago', async () => {
    render(<MaintenanceLog />);
    
    const eightyNineDaysAgo = format(subDays(new Date(), 89), 'yyyy-MM-dd');
    const mockData = { waterFilterLastChanged: eightyNineDaysAgo };
    
    await act(async () => {
      onSnapshotCallback({ exists: () => true, data: () => mockData });
    });

    // The queryBy* is used because it returns null if not found, instead of throwing an error.
    expect(screen.queryByText(/אזהרה: החלף פילטר מים/i)).not.toBeInTheDocument();
  });
});
