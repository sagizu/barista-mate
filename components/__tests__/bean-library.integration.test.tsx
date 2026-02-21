
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BeanLibrary } from '../bean-library';
import { addBean, updateBean } from '@/lib/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

// --- Mocks ---
jest.mock('@/lib/firestore', () => ({
  addBean: jest.fn(),
  updateBean: jest.fn(),
}));

jest.mock('react-firebase-hooks/auth', () => ({
  useAuthState: jest.fn(),
}));

jest.mock('react-firebase-hooks/firestore', () => ({
  useCollection: jest.fn(),
}));

jest.mock('../roaster-combobox', () => ({
    RoasterCombobox: ({ value, onChange }: { value: string, onChange: (v: string) => void}) => (
        <input 
            aria-label="Roaster"
            value={value} 
            onChange={(e) => onChange(e.target.value)} 
        />
    )
}));

// --- Test Suite ---
describe('BeanLibrary Integration Test', () => {
  const user = { uid: 'test-user' };
  let mockDocs: any[] = [];
  let triggerCollectionUpdate: () => void = () => {};

  beforeEach(() => {
    jest.clearAllMocks();
    mockDocs = [];

    (useAuthState as jest.Mock).mockReturnValue([user, false, undefined]);

    // This mock now correctly captures the trigger and returns the current state of mockDocs
    (useCollection as jest.Mock).mockImplementation(() => {
      const [, forceUpdate] = React.useReducer(x => x + 1, 0);
      React.useEffect(() => {
          triggerCollectionUpdate = forceUpdate;
      }, []);
      return [{ docs: mockDocs.map(bean => ({ id: bean.id, data: () => bean })) }, false, undefined];
    });

    // --- IMMUTABLE MOCK IMPLEMENTATIONS ---
    (addBean as jest.Mock).mockImplementation(async (beanData) => {
      const newBean = { ...beanData, id: `bean-${Date.now()}`, createdAt: new Date() };
      mockDocs = [...mockDocs, newBean]; // Create new array
      act(() => {
        triggerCollectionUpdate(); 
      });
      return Promise.resolve({ id: newBean.id });
    });

    (updateBean as jest.Mock).mockImplementation(async (id, beanData) => {
        const beanIndex = mockDocs.findIndex(b => b.id === id);
        if (beanIndex > -1) {
            const newDocs = [...mockDocs]; // Create new array
            newDocs[beanIndex] = { ...newDocs[beanIndex], ...beanData };
            mockDocs = newDocs; // Replace with new array
            act(() => {
                triggerCollectionUpdate();
            });
        }
        return Promise.resolve();
    });
  });

  test('full user flow: add, set open date, and edit beans', async () => {
    const user = userEvent.setup();
    render(<BeanLibrary />);

    const addTestBean = async (roaster: string, name: string) => {
      await user.click(screen.getByRole('button', { name: /הוסף פול/i }));
      const dialogTitle = /הוסף פול חדש לספרייה/i;
      await screen.findByText(dialogTitle);
      await user.type(screen.getByLabelText(/Roaster/i), roaster);
      await user.type(screen.getByLabelText(/שם הפול/i), name);
      await user.click(screen.getByRole('button', { name: "שמור" }));
      await waitFor(() => {
        expect(screen.queryByText(dialogTitle)).not.toBeInTheDocument();
      });
    };

    await addTestBean('Roaster A', 'Bean A1');
    await addTestBean('Roaster B', 'Bean B1');
    
    await waitFor(() => {
      expect(screen.getByText('Roaster A')).toBeInTheDocument();
      expect(screen.getByText('Roaster B')).toBeInTheDocument();
    });

    const editBean = async (beanName: string, newName: string) => {
        const beanCard = screen.getByText(beanName).closest('div.border-t');
        if (!beanCard) throw new Error(`Could not find card for ${beanName}`);
        const editButton = Array.from(beanCard.querySelectorAll('button')).find(b => b.getAttribute('aria-label') === 'ערוך') as HTMLElement;
        await user.click(editButton);

        const editDialogTitle = /ערוך פול קפה/i;
        await screen.findByText(editDialogTitle);

        const beanNameInput = screen.getByLabelText(/שם הפול/i);
        await user.clear(beanNameInput);
        await user.type(beanNameInput, newName);
        await user.click(screen.getByRole('button', { name: "שמור" }));
        
        await waitFor(() => {
           expect(screen.queryByText(editDialogTitle)).not.toBeInTheDocument();
        });
    };

    await editBean('Bean A1', 'Bean A1 Edited');

    await waitFor(() => {
      expect(screen.getByText('Bean A1 Edited')).toBeInTheDocument();
    });
  });
});
