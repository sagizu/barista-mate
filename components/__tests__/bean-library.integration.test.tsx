
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BeanLibrary } from '@/components/bean-library';
import { setupMocks } from '../../jest.setup.js';

// Utility to flush pending timers (for async Firestore mock)
async function flushTimers() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('BeanLibrary', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    setupMocks();
    user = userEvent.setup();
    let store: { [key: string]: string } = {};
    vi.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation((key: string) => store[key] || null);
    vi.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation((key: string, value: string) => {
      store[key] = value.toString();
    });
    vi.spyOn(window.localStorage.__proto__, 'clear').mockImplementation(() => {
      store = {};
    });

    localStorage.setItem('beans', '[]');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should add, edit, and delete a bean, and display info correctly', async () => {
    render(<BeanLibrary />);

    await user.click(screen.getByRole('button', { name: /הוסף פול/i }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/הוסף פול חדש/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('combobox', { name: /שם בית הקלייה/i }));
    await user.click(await screen.findByText("בראשית"));
    await user.type(within(dialog).getByLabelText(/שם הפול/i), 'קולומביה');
    await user.type(within(dialog).getByLabelText(/דרגת טחינה/i), '4.2');
    await user.click(within(dialog).getByRole('radio', { name: 'דרגת קלייה 4 מתוך 5' }));
    await user.type(within(dialog).getByLabelText(/מחיר ששולם/i), '80');
    await user.type(within(dialog).getByLabelText(/משקל שקית/i), '250');
    await user.click(within(dialog).getByRole('button', { name: 'הוסף פול' }));

    await flushTimers();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Verify bean was added and displays correctly
    const roasteryTitle = await waitFor(() => screen.getByTestId("roastery-title"));
    expect(roasteryTitle).toHaveTextContent("בראשית");
    expect(screen.getByText('קולומביה')).toBeInTheDocument();
    expect(screen.getByText(/טחינה: 4.2/i)).toBeInTheDocument();
    expect(screen.getByText(/320.00₪/i)).toBeInTheDocument();

    // New: Verify the roast rating is displayed correctly
    const ratingDisplay = screen.getByRole('radiogroup');
    const checkedBeans = within(ratingDisplay).getAllByRole('radio', { checked: true });
    expect(checkedBeans).toHaveLength(4);

    // 2. Edit the bean
    await user.click(screen.getByRole('button', { name: /ערוך/i }));
    const editDialog = await screen.findByRole('dialog');
    expect(within(editDialog).getByText(/ערוך פול קיים/i)).toBeInTheDocument();
    const grindSettingInput = within(editDialog).getByLabelText(/דרגת טחינה/i);
    await user.clear(grindSettingInput);
    await user.type(grindSettingInput, '4.5');
    await user.click(within(editDialog).getByRole('radio', { name: 'דרגת קלייה 2 מתוך 5' }));
    await user.click(within(editDialog).getByRole('button', { name: /שמור שינויים/i }));

    await flushTimers();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Verify bean was edited
    expect(await screen.findByText(/טחינה: 4.5/i)).toBeInTheDocument();
    const editedRatingDisplay = screen.getByRole('radiogroup');
    const editedCheckedBeans = within(editedRatingDisplay).getAllByRole('radio', { checked: true });
    expect(editedCheckedBeans).toHaveLength(2);

    // 3. Delete the bean
    await user.click(screen.getByRole('button', { name: /מחק/i }));

    await flushTimers();
    await waitFor(() => {
      expect(screen.queryByText(/בראשית/i)).not.toBeInTheDocument();
      expect(screen.getByText(/אין פולים בספרייה/i)).toBeInTheDocument();
    });
  });
});
