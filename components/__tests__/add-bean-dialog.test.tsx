
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddBeanDialog } from '@/components/add-bean-dialog';
import * as firestore from '@/lib/firestore';
import * as roasteryStorage from '@/lib/roasteries-storage';

describe('AddBeanDialog', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const onBeanAdded = vi.fn();
  const onDialogClose = vi.fn();

  beforeEach(() => {
    user = userEvent.setup();
    vi.spyOn(firestore, 'addBean').mockImplementation(async () => ({ id: 'mock-id' }));
    vi.spyOn(firestore, 'updateBean').mockImplementation(async () => {});
    vi.spyOn(roasteryStorage, 'addStoredRoastery').mockImplementation(() => {});
    vi.spyOn(roasteryStorage, 'getStoredRoasteries').mockReturnValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    onBeanAdded.mockClear();
    onDialogClose.mockClear();
  });

  test('should display an error if bean name is missing', async () => {
    render(<AddBeanDialog open={true} onOpenChange={() => {}} onBeanAdded={onBeanAdded} beanToEdit={null} onDialogClose={onDialogClose} />);
    
    await user.click(screen.getByRole('button', { name: /הוסף פול/i }));

    expect(await screen.findByText(/"שם הפול" הוא שדה חובה./i)).toBeInTheDocument();
    expect(firestore.addBean).not.toHaveBeenCalled();
    expect(onBeanAdded).not.toHaveBeenCalled();
  });

  test('should add a new bean successfully', async () => {
    render(<AddBeanDialog open={true} onOpenChange={() => {}} onBeanAdded={onBeanAdded} beanToEdit={null} onDialogClose={onDialogClose} />);
    
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText(/שם הפול/i), 'טסט פול');
    await user.type(within(dialog).getByLabelText(/שם בית הקלייה/i), 'טסט קלייה');
    // Click the 4th star
    await user.click(within(dialog).getByRole('radio', { name: /דרגת קלייה 4/ }));
    await user.click(within(dialog).getByRole('button', { name: /הוסף פול/i }));

    await waitFor(() => {
      expect(firestore.addBean).toHaveBeenCalledWith({ beanName: 'טסט פול', roasterName: 'טסט קלייה', flavorTags: [], roastLevel: 4 });
    });
    await waitFor(() => {
        expect(onBeanAdded).toHaveBeenCalled();
    });
  });

  test('should edit an existing bean', async () => {
    const beanToEdit = { id: '1', beanName: 'פול ישן', roasterName: 'קלייה ישנה', grindSetting: '4', roastLevel: 2 };
    render(<AddBeanDialog open={true} onOpenChange={() => {}} onBeanAdded={onBeanAdded} beanToEdit={beanToEdit} onDialogClose={onDialogClose} />);
    
    const dialog = screen.getByRole('dialog');
    const beanNameInput = within(dialog).getByLabelText(/שם הפול/i);
    await user.clear(beanNameInput);
    await user.type(beanNameInput, 'פול חדש');

    // Change the rating
    await user.click(within(dialog).getByRole('radio', { name: /דרגת קלייה 5/ }));

    await user.click(within(dialog).getByRole('button', { name: /שמור שינויים/i }));

    await waitFor(() => {
      expect(firestore.updateBean).toHaveBeenCalledWith('1', { ...beanToEdit, beanName: 'פול חדש', roastLevel: 5 });
    });
     await waitFor(() => {
        expect(onBeanAdded).toHaveBeenCalled();
    });
  });

  test('should call onClose when cancel button is clicked', async () => {
    render(<AddBeanDialog open={true} onOpenChange={() => {}} onBeanAdded={onBeanAdded} beanToEdit={null} onDialogClose={onDialogClose} />);
    
    await user.click(screen.getByRole('button', { name: /ביטול/i }));

    expect(onDialogClose).toHaveBeenCalled();
  });
});
