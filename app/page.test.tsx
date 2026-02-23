import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '@/app/page';
import * as firestore from '@/lib/firestore';
import * as auth from 'react-firebase-hooks/auth';
import * as fs from 'firebase/firestore';
import type { SavedBean, GeneralSettings } from '@/lib/types';

// Mock dependencies
vi.mock('firebase/firestore');
vi.mock('@/lib/firestore');
vi.mock('react-firebase-hooks/auth');
vi.mock('@/components/bean-library', () => ({ BeanLibrary: () => <div>Bean Library</div> }));
vi.mock('@/components/smart-dial-in', () => ({ SmartDialIn: () => <div>Smart Dial-In</div> }));
vi.mock('@/components/maintenance-log', () => ({ MaintenanceLog: () => <div>Maintenance Log</div> }));
vi.mock('@/components/people-orders', () => ({ PeopleOrders: () => <div>People Orders</div> }));

const mockBeans: SavedBean[] = [
  { id: '1', beanName: 'Espresso Blend', roasterName: 'Roastery A', createdAt: new Date().toISOString() },
  { id: '2', beanName: 'Morning Delight', roasterName: 'Roastery A', createdAt: new Date().toISOString() },
  { id: '3', beanName: 'Single Origin Ethiopia', roasterName: 'Roastery B', createdAt: new Date().toISOString() },
];

const mockSettings: GeneralSettings = {
  machineName: 'My Test Machine',
  defaultDose: 18,
  targetRatio: 2,
  activeBeanId: null,
  activeBeanOpenedDate: '',
};

const mockUser = {
  uid: 'test-user-id',
  displayName: 'Test User',
  email: 'test@example.com',
};

describe('Home Page and Settings Dialog with Firestore', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockUpdateGeneralSettings: any;

  beforeEach(() => {
    user = userEvent.setup();

    // Mock useAuthState to return a logged-in user
    vi.spyOn(auth, 'useAuthState').mockReturnValue([mockUser as any, false, undefined]);

    // Mock Firestore `doc`, `collection`, and `query` to return typed identifiers
    vi.spyOn(fs, 'doc').mockImplementation(() => ({ type: 'document' }) as any);
    vi.spyOn(fs, 'collection').mockImplementation(() => ({ type: 'collection' }) as any);
    vi.spyOn(fs, 'query').mockImplementation(() => ({ type: 'query' }) as any);
    vi.spyOn(fs, 'orderBy').mockImplementation(() => 'orderBy' as any);

    // Mock `onSnapshot` to provide data based on the ref type
    vi.spyOn(fs, 'onSnapshot').mockImplementation((ref: any, callback: (snapshot: any) => void) => {
      if (ref.type === 'document') { // This will be the settings listener
        callback({
          exists: () => true,
          data: () => mockSettings,
        });
      } else if (ref.type === 'query') { // This will be the beans listener
        callback({
          docs: mockBeans.map(bean => ({ id: bean.id, data: () => bean })),
        });
      }
      return () => {}; // Return an unsubscribe function
    });
    
    // Mock the update function to verify it's called
    mockUpdateGeneralSettings = vi.spyOn(firestore, 'updateGeneralSettings').mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function openSettingsDialog() {
    render(<Home />);
    await user.click(screen.getByRole('button', { name: /הגדרות/i }));
    return screen.findByRole('dialog');
  }

  test('settings dialog opens and displays data from Firestore', async () => {
    const dialog = await openSettingsDialog();

    // Check machine name
    expect(within(dialog).getByLabelText(/שם המכונה שלי/i)).toHaveValue(mockSettings.machineName);

    // Check that all 3 beans + the "None" option are present
    const options = await within(dialog).findAllByRole('option');
    expect(options).toHaveLength(4);
    expect(screen.getByRole('option', { name: 'Espresso Blend (Roastery A)' })).toBeInTheDocument();
  });

  test('opened date input is disabled when no bean is selected', async () => {
    const dialog = await openSettingsDialog();
    const dateInput = within(dialog).getByLabelText(/תאריך פתיחת שקית/i);
    expect(dateInput).toBeDisabled();
  });
  
  test('selecting a bean enables the opened date input', async () => {
    const dialog = await openSettingsDialog();
    const beanSelect = within(dialog).getByLabelText(/פולים פעילים/i);
    
    await user.selectOptions(beanSelect, '1');

    const dateInput = within(dialog).getByLabelText(/תאריך פתיחת שקית/i);
    expect(dateInput).toBeEnabled();
  });

  test('saving settings calls updateGeneralSettings with the new values', async () => {
    const dialog = await openSettingsDialog();

    const newMachineName = 'New Machine Name';
    const machineNameInput = within(dialog).getByLabelText(/שם המכונה שלי/i);
    await user.clear(machineNameInput);
    await user.type(machineNameInput, newMachineName);
    
    await user.selectOptions(within(dialog).getByLabelText(/פולים פעילים/i), '3');
    
    await user.click(within(dialog).getByRole('button', { name: /שמור/i }));

    await waitFor(() => {
      expect(mockUpdateGeneralSettings).toHaveBeenCalledTimes(1);
      expect(mockUpdateGeneralSettings).toHaveBeenCalledWith(expect.objectContaining({
        machineName: newMachineName,
        activeBeanId: '3',
      }));
    });
    
    // Check that the dialog is closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
