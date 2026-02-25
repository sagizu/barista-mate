
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { SmartDialIn } from '@/components/smart-dial-in';
import * as dialIn from '@/lib/dial-in';
import * as firestore from '@/lib/firestore';
import { AddBeanDialog } from '@/components/add-bean-dialog';

vi.mock('@/lib/firestore', () => ({
  addDialInRecord: vi.fn(),
}));

vi.mock('@/components/add-bean-dialog', () => ({
  AddBeanDialog: vi.fn(() => null),
}));

describe('SmartDialIn', () => {

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  test('initial render: timer is 0, start button is disabled', () => {
    render(<SmartDialIn />);
    expect(screen.getByText('0.0s')).toBeInTheDocument();
    const startButton = screen.getByRole('button', { name: /התחל/i });
    expect(startButton).toBeDisabled();
  });

  test('enables start button only when all inputs are filled', async () => {
    const user = userEvent.setup();
    render(<SmartDialIn />);
    const startButton = screen.getByRole('button', { name: /התחל/i });

    await user.click(screen.getByRole('button', { name: /אספרסו/i }));
    expect(startButton).toBeDisabled();

    const roastStars = screen.getAllByRole('radio');
    await user.click(roastStars[2]); 
    expect(startButton).toBeEnabled();
  });

  test('timer starts and stops on button click', async () => {
    const user = userEvent.setup();
    render(<SmartDialIn />);
    
    await user.click(screen.getByRole('button', { name: /אספרסו/i }));
    const roastStars = screen.getAllByRole('radio');
    await user.click(roastStars[2]);

    const toggleButton = screen.getByRole('button', { name: /התחל/i });
    await user.click(toggleButton);

    await waitFor(() => expect(screen.getByRole('button', { name: /עצור/i })).toBeInTheDocument());

    await new Promise(r => setTimeout(r, 250)); // wait for timer to run

    const calculateSpy = vi.spyOn(dialIn, 'calculateSmartDialIn');
    await user.click(screen.getByRole('button', { name: /עצור/i }));

    await waitFor(() => expect(screen.getByRole('button', { name: /התחל/i })).toBeInTheDocument());
    expect(calculateSpy).toHaveBeenCalledWith('espresso', 3, expect.any(Number));
  });

  test('displays feedback after calculation', async () => {
    const user = userEvent.setup();
    const mockResult = {
      feedback: 'perfect',
      message: 'חילוץ מעולה!',
      advice: '',
      targetTime: 28,
      actualTime: 27.8,
    };
    vi.spyOn(dialIn, 'calculateSmartDialIn').mockReturnValue(mockResult);
    const addRecordSpy = vi.spyOn(firestore, 'addDialInRecord');

    render(<SmartDialIn />);

    await user.click(screen.getByRole('button', { name: /אספרסו/i }));
    const roastStars = screen.getAllByRole('radio');
    await user.click(roastStars[3]);

    await user.click(screen.getByRole('button', { name: /התחל/i }));
    await new Promise(r => setTimeout(r, 200));
    await user.click(screen.getByRole('button', { name: /עצור/i }));

    await waitFor(() => {
      expect(screen.getByText('חילוץ מעולה!')).toBeInTheDocument();
      expect(screen.getByText((content, element) => content.startsWith('זמן יעד:'))).toBeInTheDocument();
    });

    expect(addRecordSpy).toHaveBeenCalledWith(expect.any(Object));
  });

  test('opens save dialog with correct data', async () => {
    const user = userEvent.setup();
    vi.spyOn(dialIn, 'calculateSmartDialIn').mockReturnValue({
      feedback: 'good',
      message: 'כמעט שם.',
      advice: 'טחן דק יותר ⬆️',
      targetTime: 26,
      actualTime: 22,
    });

    render(<SmartDialIn />);
    
    await user.click(screen.getByRole('button', { name: /ריסטרטו/i }));
    const roastStars = screen.getAllByRole('radio');
    await user.click(roastStars[4]);

    await user.click(screen.getByRole('button', { name: /התחל/i }));
    await new Promise(r => setTimeout(r, 200));
    await user.click(screen.getByRole('button', { name: /עצור/i }));
    
    const saveButton = await screen.findByRole('button', { name: /שמור הגדרה לספרייה/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(AddBeanDialog).toHaveBeenCalled();
      const props = (AddBeanDialog as any).mock.lastCall[0];
      expect(props.beanToEdit).toEqual({
        roastLevel: 5,
      });
    });
  });
});
