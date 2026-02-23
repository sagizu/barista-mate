
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '@/app/page';
import * as storage from '@/lib/storage';
import * as auth from 'react-firebase-hooks/auth';
import type { SavedBean } from '@/lib/types';

// Mock the modules
vi.mock('@/lib/storage');
vi.mock('react-firebase-hooks/auth');

const mockBeans: SavedBean[] = [
  { id: '1', beanName: 'Espresso Blend', roasterName: 'Roastery A', createdAt: '' },
  { id: '2', beanName: 'Morning Delight', roasterName: 'Roastery A', createdAt: '' },
  { id: '3', beanName: 'Single Origin Ethiopia', roasterName: 'Roastery B', createdAt: '' },
];

const mockUser = {
  uid: 'test-user-id',
  displayName: 'Test User',
  email: 'test@example.com',
};

describe('Home Page and Settings Dialog', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();

    // Setup mocks for lib/storage
    vi.spyOn(storage, 'getStoredBeans').mockReturnValue(mockBeans);
    vi.spyOn(storage, 'getGeneralSettings').mockReturnValue({ defaultDose: 18, targetRatio: 2 });
    vi.spyOn(storage, 'getMachineName').mockReturnValue('My Test Machine');
    vi.spyOn(storage, 'getActiveBeanId').mockReturnValue(null);
    vi.spyOn(storage, 'getActiveBeanOpenedDate').mockReturnValue('');
    vi.spyOn(storage, 'setMachineName').mockImplementation(() => {});
    vi.spyOn(storage, 'setGeneralSettings').mockImplementation(() => {});
    vi.spyOn(storage, 'setActiveBeanId').mockImplementation(() => {});
    vi.spyOn(storage, 'setActiveBeanOpenedDate').mockImplementation(() => {});

    // Setup mock for useAuthState
    vi.spyOn(auth, 'useAuthState').mockReturnValue([mockUser, false, undefined]);
    
    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
        configurable: true,
        value: { reload: vi.fn() },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function openSettingsDialog() {
    render(<Home />);
    await user.click(screen.getByRole('button', { name: /הגדרות/i }));
    return screen.findByRole('dialog');
  }

  test('settings dialog opens and all beans are displayed in the dropdown', async () => {
    const dialog = await openSettingsDialog();

    // Check that all 3 beans + the "None" option are present
    const options = await within(dialog).findAllByRole('option');
    expect(options).toHaveLength(4); 
    expect(screen.getByRole('option', { name: 'Espresso Blend (Roastery A)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Morning Delight (Roastery A)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Single Origin Ethiopia (Roastery B)' })).toBeInTheDocument();
  });

  test('machine name input does not have a placeholder', async () => {
    const dialog = await openSettingsDialog();
    const machineNameInput = within(dialog).getByLabelText(/שם המכונה שלי/i);
    expect(machineNameInput).not.toHaveAttribute('placeholder');
  });

  test('opened date input and "Today" button are disabled when no bean is selected', async () => {
    const dialog = await openSettingsDialog();
    const dateInput = within(dialog).getByLabelText(/תאריך פתיחת שקית/i);
    const todayButton = within(dialog).getByRole('button', { name: /היום/i });

    expect(dateInput).toBeDisabled();
    expect(todayButton).toBeDisabled();
  });

  test('selecting a bean enables the opened date input and "Today" button', async () => {
    const dialog = await openSettingsDialog();
    const beanSelect = within(dialog).getByLabelText(/פולים פעילים/i);
    
    await user.selectOptions(beanSelect, '1');

    const dateInput = within(dialog).getByLabelText(/תאריך פתיחת שקית/i);
    const todayButton = within(dialog).getByRole('button', { name: /היום/i });

    expect(dateInput).toBeEnabled();
    expect(todayButton).toBeEnabled();
  });

  test('"Today" button fills the date input with the current date', async () => {
    const dialog = await openSettingsDialog();
    const beanSelect = within(dialog).getByLabelText(/פולים פעילים/i);
    await user.selectOptions(beanSelect, '1');

    const todayButton = within(dialog).getByRole('button', { name: /היום/i });
    await user.click(todayButton);

    const dateInput = within(dialog).getByLabelText(/תאריך פתיחת שקית/i);
    const today_date = new Date().toISOString().split('T')[0];
    expect(dateInput).toHaveValue(today_date);
  });

  test('saving settings calls the correct storage functions', async () => {
    const dialog = await openSettingsDialog();

    // Modify values
    const machineNameInput = within(dialog).getByLabelText(/שם המכונה שלי/i);
    await user.clear(machineNameInput);
    await user.type(machineNameInput, 'New Machine Name');
    await user.selectOptions(within(dialog).getByLabelText(/פולים פעילים/i), '3');
    await user.click(within(dialog).getByRole('button', { name: /היום/i }));
    
    // Save
    await user.click(within(dialog).getByRole('button', { name: /שמור/i }));

    // Verify calls
    await waitFor(() => {
      expect(storage.setMachineName).toHaveBeenCalledWith('New Machine Name');
      expect(storage.setActiveBeanId).toHaveBeenCalledWith('3');
      const today_date = new Date().toISOString().split('T')[0];
      expect(storage.setActiveBeanOpenedDate).toHaveBeenCalledWith(today_date);
      expect(window.location.reload).toHaveBeenCalled();
    });
  });
});
