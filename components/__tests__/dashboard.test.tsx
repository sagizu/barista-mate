import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '@/components/dashboard';
import * as firestore from '@/lib/firestore';
import * as fs from 'firebase/firestore';
import * as AuthContext from '@/lib/auth-context';
import type { SavedBean, GeneralSettings } from '@/lib/types';
import type { User } from 'firebase/auth';
import { deleteUserData } from '@/lib/user-service';
import { signOut } from 'firebase/auth';

// Mock child components
vi.mock('@/components/bean-library', () => ({ BeanLibrary: () => <div>Bean Library</div> }));
vi.mock('@/components/smart-dial-in', () => ({ SmartDialIn: () => <div>Smart Dial-In</div> }));
vi.mock('@/components/maintenance-log', () => ({ MaintenanceLog: () => <div>Maintenance Log</div> }));
vi.mock('@/components/user-settings-dialog', () => ({ 
    __esModule: true,
    default: ({children}: {children: React.ReactNode}) => <div data-testid="user-settings-dialog">{children}</div>
}));


// Mock dependencies
vi.mock('firebase/firestore');
vi.mock('@/lib/firestore');
vi.mock('@/lib/user-service', () => ({
  deleteUserData: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  signOut: vi.fn(),
  getAuth: vi.fn(),
}));

const mockBeans: SavedBean[] = [
  { id: '1', beanName: 'Espresso Blend', roasterName: 'Roastery A', createdAt: new Date().toISOString() },
  { id: '2', beanName: 'Morning Delight', roasterName: 'Roastery A', createdAt: new Date().toISOString() },
  { id: '3', beanName: 'Single Origin Ethiopia', roasterName: 'Roastery B', createdAt: new Date().toISOString() },
];

const mockSettings: GeneralSettings = {
  machineName: 'My Test Machine',
  activeBeanId: null,
  activeBeanOpenedDate: '',
};

const mockUser = {
  uid: 'test-user-id',
  displayName: 'Test User',
  email: 'test@example.com',
} as User;

beforeEach(() => {
  vi.spyOn(fs, 'onSnapshot').mockImplementation((ref: any, callback: (snapshot: any) => void) => {
    if (ref.type === 'document') {
        callback({ exists: () => true, data: () => ({ settings: { general: mockSettings }, preferences: {} }) });
    } else if (ref.type === 'query') {
        callback({ docs: mockBeans.map(bean => ({ id: bean.id, data: () => bean })) });
    }
    return () => {}; // Return an unsubscribe function
  });
  vi.spyOn(fs, 'doc').mockImplementation(() => ({ type: 'document' }) as any);
  vi.spyOn(fs, 'collection').mockImplementation(() => ({ type: 'collection' }) as any);
  vi.spyOn(fs, 'query').mockImplementation(() => ({ type: 'query' }) as any);
  vi.spyOn(fs, 'orderBy').mockImplementation(() => 'orderBy' as any);
});

describe('Dashboard', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockUpdateGeneralSettings: any;
  let mockUpdateMaintenanceFrequencies: any;

  beforeEach(() => {
    user = userEvent.setup();

    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ user: mockUser, loading: false });

    mockUpdateGeneralSettings = vi.spyOn(firestore, 'updateGeneralSettings').mockResolvedValue();
    mockUpdateMaintenanceFrequencies = vi.spyOn(firestore, 'updateMaintenanceFrequencies').mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  async function openSettingsDialog() {
    render(<Dashboard />);
    await user.click(screen.getByRole('button', { name: /הגדרות/i }));
    return screen.findByRole('dialog');
  }

  test('settings dialog opens and displays data from Firestore', async () => {
    const dialog = await openSettingsDialog();

    await waitFor(() => {
        expect(within(dialog).getByLabelText(/שם המכונה שלי/i)).toHaveValue(mockSettings.machineName);
    });
  });

  test('saving settings calls updateGeneralSettings and updateMaintenanceFrequencies with new values', async () => {
    const dialog = await openSettingsDialog();

    const newMachineName = 'New Machine Name';
    const machineNameInput = within(dialog).getByLabelText(/שם המכונה שלי/i);
    await user.clear(machineNameInput);
    await user.type(machineNameInput, newMachineName);
    
    const descalingInput = within(dialog).getByLabelText(/תדירות ניקוי אבנית/i);
    await user.clear(descalingInput);
    await user.type(descalingInput, '200');

    await user.click(within(dialog).getByRole('button', { name: /שמור/i }));

    await waitFor(() => {
      expect(mockUpdateGeneralSettings).toHaveBeenCalledWith(expect.objectContaining({
        machineName: newMachineName
      }));
      expect(mockUpdateMaintenanceFrequencies).toHaveBeenCalledWith(expect.objectContaining({
        lastDescaling: 200,
      }));
    });
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('anonymous user sign out triggers confirmation and data deletion', async () => {
    const deleteUserMock = vi.fn().mockResolvedValue(undefined);
    const anonymousUser = {
      ...mockUser,
      isAnonymous: true,
      delete: deleteUserMock,
    } as unknown as User;

    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ user: anonymousUser, loading: false });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<Dashboard />);

    const userMenuBtn = screen.getByLabelText('תפריט משתמש');
    await user.click(userMenuBtn);

    const logoutBtn = screen.getByText('התנתק');
    await user.click(logoutBtn);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(deleteUserData).toHaveBeenCalledWith(anonymousUser.uid);
      expect(deleteUserMock).toHaveBeenCalled();
    });
  });
});

describe('Feedback Form', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockSubmitFeedback: any;

  beforeEach(() => {
    user = userEvent.setup();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ user: mockUser, loading: false });
    mockSubmitFeedback = vi.spyOn(firestore, 'submitFeedback').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function openFeedbackDialog() {
    render(<Dashboard />);
    await user.click(screen.getByRole('button', { name: /פידבק/i }));
    return screen.findByRole('dialog');
  }

  test('feedback dialog opens when feedback button is clicked', async () => {
    const dialog = await openFeedbackDialog();
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: 'פידבק' })).toBeInTheDocument();
  });

  test('send button is disabled when message is empty', async () => {
    const dialog = await openFeedbackDialog();
    const sendButton = within(dialog).getByRole('button', { name: /שלח פידבק/i });
    expect(sendButton).toBeDisabled();
  });

  test('send button is enabled when message is not empty', async () => {
    const dialog = await openFeedbackDialog();
    const messageInput = within(dialog).getByPlaceholderText(/יש לך הצעה/i);
    await user.type(messageInput, 'This is a test feedback message.');
    const sendButton = within(dialog).getByRole('button', { name: /שלח פידבק/i });
    expect(sendButton).toBeEnabled();
  });

  test('character counter updates as user types', async () => {
    const dialog = await openFeedbackDialog();
    const messageInput = within(dialog).getByPlaceholderText(/יש לך הצעה/i);
    await user.type(messageInput, 'Hello');
    expect(within(dialog).getByText('5/500')).toBeInTheDocument();
  });

  test('character counter turns red when character limit is reached', async () => {
    const dialog = await openFeedbackDialog();
    const messageInput = within(dialog).getByPlaceholderText(/יש לך הצעה/i);
    const longMessage = 'a'.repeat(500);
    await user.type(messageInput, longMessage);
    const charCounter = within(dialog).getByText('500/500');
    expect(charCounter).toHaveClass('text-red-500');
  });
});
