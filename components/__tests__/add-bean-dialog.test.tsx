
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddBeanDialog } from '@/components/add-bean-dialog';
import * as firestore from '@/lib/firestore';
import { setupMocks } from '../../jest.setup';

describe('AddBeanDialog', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const onBeanAdded = vi.fn();
  const onDialogClose = vi.fn();

  beforeEach(() => {
    user = userEvent.setup();
    setupMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    onBeanAdded.mockClear();
    onDialogClose.mockClear();

    document.body.style.pointerEvents = '';
    document.body.removeAttribute('data-scroll-locked');
  });

  test('should display an error if bean name is missing', async () => {
    render(<AddBeanDialog open={true} onOpenChange={() => { }} onBeanAdded={onBeanAdded} beanToEdit={null} onDialogClose={onDialogClose} />);

    await user.click(screen.getByRole('button', { name: /הוסף פול/i }));

    expect(await screen.findByText(/"שם הפול" הוא שדה חובה./i)).toBeInTheDocument();
    expect(firestore.addBean).not.toHaveBeenCalled();
    expect(onBeanAdded).not.toHaveBeenCalled();
  });

  test('should add a new bean successfully', async () => {
    render(<AddBeanDialog open={true} onOpenChange={() => { }} onBeanAdded={onBeanAdded} beanToEdit={null} onDialogClose={onDialogClose} />);

    const dialog = screen.getByRole('dialog', { name: /הוסף פול חדש/i });

    // Select a roaster first (enables bean combobox)
    await user.click(within(dialog).getByRole('combobox', { name: /שם בית הקלייה/i }));
    await user.click(await screen.findByText('נחת'));

    // Interact with the new BeanCombobox
    const beanCombobox = within(dialog).getByRole('combobox', { name: /שם הפול/i });
    await user.click(beanCombobox);

    const beanInput = await screen.findByPlaceholderText(/חיפוש פול ממסד הנתונים/i);
    await user.type(beanInput, 'טסט פול');

    const addOption = await screen.findByText(/הוסף פול שאינו ברשימה: "טסט פול"/i);
    await user.click(addOption);

    // Click the 4th star
    await user.click(within(dialog).getByRole('radio', { name: /דרגת קלייה 4/ }));
    await user.click(within(dialog).getByRole('button', { name: /הוסף פול/i }));

    await waitFor(() => {
      expect(firestore.addBean).toHaveBeenCalledWith(expect.objectContaining({
        beanName: 'טסט פול',
        roasterName: 'נחת',
        flavorTags: [],
        roastLevel: 4,
        isTestData: true,
      }));
    });
    await waitFor(() => {
      expect(onBeanAdded).toHaveBeenCalled();
    });
  });

  test('should auto-populate beans metadata from global verified record', async () => {
    vi.spyOn(firestore, 'getGlobalBeans').mockImplementation(async () => [
      { id: 'global-1', roasterName: 'נחת', beanName: 'Verified Auto Bean', roastLevel: 3, flavorTags: ['שוקולדי'] }
    ]);
    render(<AddBeanDialog open={true} onOpenChange={() => { }} onBeanAdded={onBeanAdded} beanToEdit={null} onDialogClose={onDialogClose} />);

    const dialog = screen.getByRole('dialog', { name: /הוסף פול חדש/i });

    // Select roaster
    await user.click(within(dialog).getByRole('combobox', { name: /שם בית הקלייה/i }));
    await user.click(await screen.findByText('נחת'));

    // Interact with the new BeanCombobox
    const beanCombobox = within(dialog).getByRole('combobox', { name: /שם הפול/i });
    await user.click(beanCombobox);

    const beanInput = await screen.findByPlaceholderText(/חיפוש פול ממסד הנתונים/i);
    await user.type(beanInput, 'Verified Auto Bean');

    const verifiedOption = await screen.findByText(/Verified Auto Bean/i);
    await user.click(verifiedOption);

    // Verify auto-fill occurred correctly
    await waitFor(() => {
      const radio3 = within(dialog).getByRole('radio', { name: /דרגת קלייה 3/ }) as HTMLInputElement;
      expect(radio3.getAttribute('aria-checked')).toBe('true');
    });

    const chocButton = within(dialog).getByRole('button', { name: 'שוקולדי' });
    // Outline variant means inactive. If it doesn't have it, it's active "default"
    expect(chocButton.className).not.toMatch(/border-input bg-background/);
  });

  test('should edit an existing bean', async () => {
    const beanToEdit = { id: '1', beanName: 'פול ישן', roasterName: 'קפה רות', grindSetting: '4', roastLevel: 2 };
    render(<AddBeanDialog open={true} onOpenChange={() => { }} onBeanAdded={onBeanAdded} beanToEdit={beanToEdit} onDialogClose={onDialogClose} />);

    const dialog = screen.getByRole('dialog', { name: /ערוך פול קיים/i });

    // Change the roaster
    await user.click(within(dialog).getByRole('combobox', { name: /שם בית הקלייה/i }));
    await user.click(await screen.findByText('נחת'));

    // Interact with the new BeanCombobox
    const beanCombobox = within(dialog).getByRole('combobox', { name: /שם הפול/i });
    await user.click(beanCombobox);

    const beanInput = await screen.findByPlaceholderText(/חיפוש פול ממסד הנתונים/i);
    await user.type(beanInput, 'פול חדש');

    const addOption = await screen.findByText(/הוסף פול שאינו ברשימה: "פול חדש"/i);
    await user.click(addOption);

    // Change the rating
    await user.click(within(dialog).getByRole('radio', { name: /דרגת קלייה 5/ }));

    await user.click(within(dialog).getByRole('button', { name: /שמור שינויים/i }));

    await waitFor(() => {
      expect(firestore.updateBean).toHaveBeenCalledWith('1', { ...beanToEdit, beanName: 'פול חדש', roasterName: 'נחת', roastLevel: 5 });
    });
    await waitFor(() => {
      expect(onBeanAdded).toHaveBeenCalled();
    });
  });

  test('should call onClose when cancel button is clicked', async () => {
    render(<AddBeanDialog open={true} onOpenChange={() => { }} onBeanAdded={onBeanAdded} beanToEdit={null} onDialogClose={onDialogClose} />);

    await user.click(screen.getByRole('button', { name: /ביטול/i }));

    expect(onDialogClose).toHaveBeenCalled();
  });

  test('should allow adding a new private roaster', async () => {
    render(<AddBeanDialog open={true} onOpenChange={() => { }} onBeanAdded={onBeanAdded} beanToEdit={null} onDialogClose={onDialogClose} />);

    await user.click(screen.getByRole('combobox', { name: /שם בית הקלייה/i }));

    const addButton = await screen.findByText(/הוסף בית קלייה חדש/i);
    await user.click(addButton);

    const addRoasterDialog = await screen.findByRole('dialog', { name: /הוסף בית קלייה חדש/i });
    await user.type(within(addRoasterDialog).getByLabelText(/שם/i), 'My New Roaster');
    await user.click(within(addRoasterDialog).getByRole('button', { name: /שמור/i }));

    await waitFor(() => {
      expect(firestore.addPrivateRoaster).toHaveBeenCalledWith('My New Roaster');
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /הוסף בית קלייה חדש/i })).not.toBeInTheDocument();
    });

    await waitFor(() => {
      const combobox = screen.getByRole('combobox', { name: /שם בית הקלייה/i });
      expect(combobox).toHaveTextContent('My New Roaster');
    });

    expect(firestore.addBean).not.toHaveBeenCalled();
    expect(onBeanAdded).not.toHaveBeenCalled();
  });

  test('should allow deleting a private roaster', async () => {
    vi.spyOn(firestore, 'getPrivateRoasters').mockImplementation(async () => ['My Private Roaster']);
    render(<AddBeanDialog open={true} onOpenChange={() => { }} onBeanAdded={onBeanAdded} beanToEdit={null} onDialogClose={onDialogClose} />);

    const mainDialog = screen.getByRole('dialog', { name: /הוסף פול חדש/i });

    // Open the roaster combobox
    await user.click(within(mainDialog).getByRole('combobox', { name: /שם בית הקלייה/i }));

    const privateRoasterItem = await screen.findByText('My Private Roaster');
    // Check that private roaster has delete button and public does not
    expect(within(privateRoasterItem.closest('[role="option"]')!).getByRole('button')).toBeInTheDocument();

    const publicRoasterItem = await screen.findByText('נחת');
    expect(within(publicRoasterItem.closest('[role="option"]')!).queryByRole('button')).not.toBeInTheDocument();

    // Click the delete button
    await user.click(within(privateRoasterItem.closest('[role="option"]')!).getByRole('button'));

    // A confirmation dialog should appear
    const deleteDialog = await screen.findByRole('dialog', { name: /מחק את "My Private Roaster"\?/i });
    await user.click(within(deleteDialog).getByRole('button', { name: /מחק/i }));

    // Verify the roaster was deleted
    await waitFor(() => {
      expect(firestore.deletePrivateRoaster).toHaveBeenCalledWith('My Private Roaster');
    });

    // The delete dialog should close
    expect(screen.queryByRole('dialog', { name: /מחק את "My Private Roaster"\?/i })).not.toBeInTheDocument();

    // The roaster should be removed from the list
    await user.click(within(mainDialog).getByRole('combobox', { name: /שם בית הקלייה/i }));
    expect(screen.queryByText('My Private Roaster')).not.toBeInTheDocument();
  });

  test('should show add option when no roaster matches search', async () => {
    render(<AddBeanDialog open={true} onOpenChange={() => { }} onBeanAdded={onBeanAdded} beanToEdit={null} onDialogClose={onDialogClose} />);

    const mainDialog = screen.getByRole('dialog', { name: /הוסף פול חדש/i });

    // Open the roaster combobox and search for something that doesn't exist
    await user.click(within(mainDialog).getByRole('combobox', { name: /שם בית הקלייה/i }));
    const searchInput = screen.getByPlaceholderText(/חיפוש בית קלייה/i);
    await user.type(searchInput, 'NonExistent Roaster');

    // An option to add the searched term should appear
    const addSearchedOption = await screen.findByText(/הוסף את "NonExistent Roaster".../i);
    expect(addSearchedOption).toBeInTheDocument();

    // Click to add the new roaster
    await user.click(addSearchedOption);

    // The add dialog should open with the value pre-filled
    const addRoasterDialog = await screen.findByRole('dialog', { name: /הוסף בית קלייה חדש/i });
    expect(within(addRoasterDialog).getByLabelText(/שם/i)).toHaveValue('NonExistent Roaster');
  });
});
