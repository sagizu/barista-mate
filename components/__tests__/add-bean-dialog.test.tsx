
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddBeanDialog } from '@/components/add-bean-dialog';
import * as firestore from '@/lib/firestore';

describe('AddBeanDialog', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const onBeanAdded = vi.fn();
  const onDialogClose = vi.fn();

  beforeEach(() => {
    user = userEvent.setup();
    vi.spyOn(firestore, 'addBean').mockImplementation(async () => ({ id: 'mock-id' }));
    vi.spyOn(firestore, 'updateBean').mockImplementation(async () => {});
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
    
    // Select a roaster
    await user.click(within(dialog).getByRole('combobox', { name: /שם בית הקלייה/i }));
    await user.click(await screen.findByText('קפה נעימה – Caffe Naima'));

    // Click the 4th star
    await user.click(within(dialog).getByRole('radio', { name: /דרגת קלייה 4/ }));
    await user.click(within(dialog).getByRole('button', { name: /הוסף פול/i }));

    await waitFor(() => {
      expect(firestore.addBean).toHaveBeenCalledWith(expect.objectContaining({
        beanName: 'טסט פול',
        roasterName: 'קפה נעימה – Caffe Naima',
        flavorTags: [],
        roastLevel: 4,
      }));
    });
    await waitFor(() => {
        expect(onBeanAdded).toHaveBeenCalled();
    });
  });

  test('should edit an existing bean', async () => {
    const beanToEdit = { id: '1', beanName: 'פול ישן', roasterName: 'קפה רות', grindSetting: '4', roastLevel: 2 };
    render(<AddBeanDialog open={true} onOpenChange={() => {}} onBeanAdded={onBeanAdded} beanToEdit={beanToEdit} onDialogClose={onDialogClose} />);
    
    const dialog = screen.getByRole('dialog');
    const beanNameInput = within(dialog).getByLabelText(/שם הפול/i);
    await user.clear(beanNameInput);
    await user.type(beanNameInput, 'פול חדש');

    // Change the roaster
    await user.click(within(dialog).getByRole('combobox', { name: /שם בית הקלייה/i }));
    await user.click(await screen.findByText('ניחוח קפה'));

    // Change the rating
    await user.click(within(dialog).getByRole('radio', { name: /דרגת קלייה 5/ }));

    await user.click(within(dialog).getByRole('button', { name: /שמור שינויים/i }));

    await waitFor(() => {
      expect(firestore.updateBean).toHaveBeenCalledWith('1', { ...beanToEdit, beanName: 'פול חדש', roasterName: 'ניחוח קפה', roastLevel: 5 });
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
