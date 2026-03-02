
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import UserSettingsDialog from '../user-settings-dialog';
import { useAuth } from '../../lib/auth-context';
import { updateProfile } from 'firebase/auth';
import { deleteUserData } from '@/lib/user-service';

// Mocks
vi.mock('../../lib/auth-context');
const mockUseAuth = useAuth as vi.Mock;

vi.mock('@/lib/user-service', () => ({
    deleteUserData: vi.fn(),
}));

// 1. Mock the specific Auth function
vi.mock('firebase/auth', () => ({
    updateProfile: vi.fn(),
}));

// 2. Create the missing "mockWriteBatch" object with fake functions
const mockWriteBatch = {
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    commit: vi.fn().mockResolvedValue(undefined),
};

// 3. Mock Firestore and tell it to return our mockWriteBatch
vi.mock('firebase/firestore', () => ({
    doc: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    getDocs: vi.fn().mockResolvedValue([]),
    writeBatch: vi.fn(() => mockWriteBatch),
}));

describe('UserSettingsDialog', () => {
    const mockUser = {
        uid: 'test-uid',
        displayName: 'Test User',
        email: 'test@example.com',
        isAnonymous: false,
        delete: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAuth.mockReturnValue({ user: mockUser });
        mockUser.delete.mockResolvedValue(undefined);
        (updateProfile as vi.Mock).mockResolvedValue(undefined);
    });

    test('should open the dialog and show user settings for a registered user', () => {
        render(
            <UserSettingsDialog>
                <button>Open Dialog</button>
            </UserSettingsDialog>
        );

        fireEvent.click(screen.getByText('Open Dialog'));

        expect(screen.getByText('הגדרות חשבון')).toBeInTheDocument();
        expect(screen.getByLabelText('שם')).toHaveValue('Test User');
        expect(screen.getByText('מחיקת חשבון')).toBeInTheDocument();
        expect(screen.getByText('שמור שינויים')).toBeInTheDocument();
    });

    test('should show a message for anonymous users', () => {
        mockUseAuth.mockReturnValue({
            user: { ...mockUser, isAnonymous: true, displayName: null },
        });

        render(
            <UserSettingsDialog>
                <button>Open Dialog</button>
            </UserSettingsDialog>
        );

        fireEvent.click(screen.getByText('Open Dialog'));

        expect(screen.getByText('אתה מחובר כאורח. כדי לשמור את הנתונים שלך, עליך להירשם.')).toBeInTheDocument();
        expect(screen.queryByText('מחיקת חשבון')).not.toBeInTheDocument();
        expect(screen.queryByText('שמור שינויים')).not.toBeInTheDocument();
    });

    test('should update the display name when "Save Changes" is clicked', async () => {
        render(
            <UserSettingsDialog>
                <button>Open Dialog</button>
            </UserSettingsDialog>
        );

        fireEvent.click(screen.getByText('Open Dialog'));

        const nameInput = screen.getByLabelText('שם');
        fireEvent.change(nameInput, { target: { value: 'New Name' } });
        expect(nameInput).toHaveValue('New Name');

        fireEvent.click(screen.getByText('שמור שינויים'));

        await waitFor(() => {
            expect(updateProfile).toHaveBeenCalledWith(expect.any(Object), { displayName: 'New Name' });
            expect(mockWriteBatch.update).toHaveBeenCalled();
            expect(mockWriteBatch.commit).toHaveBeenCalled();
        });
    });

    test('should open the delete confirmation dialog', () => {
        render(
            <UserSettingsDialog>
                <button>Open Dialog</button>
            </UserSettingsDialog>
        );

        fireEvent.click(screen.getByText('Open Dialog'));
        fireEvent.click(screen.getByText('מחיקת חשבון'));

        expect(screen.getByText('האם אתה בטוח?')).toBeInTheDocument();
        expect(screen.getByText('פעולה זו תמחק את חשבונך ואת כל הנתונים המשויכים אליו לצמיתות. לא ניתן יהיה לשחזר את הנתונים.')).toBeInTheDocument();
    });

    test('should delete the account when deletion is confirmed', async () => {
        render(
            <UserSettingsDialog>
                <button>Open Dialog</button>
            </UserSettingsDialog>
        );

        fireEvent.click(screen.getByText('Open Dialog'));
        fireEvent.click(screen.getByText('מחיקת חשבון'));
        fireEvent.click(screen.getByText('מחק חשבון'));
        
        await waitFor(() => {
            expect(deleteUserData).toHaveBeenCalledWith(mockUser.uid);
            expect(mockUser.delete).toHaveBeenCalled();
        });
    });
});
