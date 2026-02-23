import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SmartDialIn } from '@/components/smart-dial-in';
import { setupMocks, mockActiveBean } from '../../jest.setup.js';
import * as storage from '@/lib/storage';
import { AddBeanDialog } from '@/components/add-bean-dialog';

vi.mock('@/components/add-bean-dialog', () => ({
    AddBeanDialog: vi.fn(),
}));

describe('SmartDialIn', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    setupMocks();
    user = userEvent.setup();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should open AddBeanDialog in "add" mode even when an active bean is selected', async () => {
    // Mock that there is an active bean
    vi.spyOn(storage, 'getActiveBeanId').mockReturnValue(mockActiveBean.id);
    vi.spyOn(storage, 'getStoredBeans').mockReturnValue([mockActiveBean]);

    render(<SmartDialIn />);

    // Fill form and calculate
    await user.clear(screen.getByLabelText(/קפה נכנס/i));
    await user.type(screen.getByLabelText(/קפה נכנס/i), '18');
    await user.clear(screen.getByLabelText(/אספרסו יצא/i));
    await user.type(screen.getByLabelText(/אספרסו יצא/i), '36');
    await user.clear(screen.getByLabelText(/^זמן \(שניות\)/i));
    await user.type(screen.getByLabelText(/^זמן \(שניות\)/i), '27');
    // Grind setting is pre-filled from active bean, but let's clear and re-type
    const grindInput = screen.getByLabelText(/דרגת טחינה/i);
    await user.clear(grindInput);
    await user.type(grindInput, '2.0');
    
    await user.click(screen.getByRole('button', { name: /חשב/i }));

    // Click the save button
    const saveButton = await screen.findByRole('button', { name: /שמור הגדרה לספרייה/i });
    await user.click(saveButton);

    // Check that AddBeanDialog was opened in "add" mode (no ID)
    await waitFor(() => {
        expect(AddBeanDialog).toHaveBeenCalled();
        const lastCallProps = (AddBeanDialog as any).mock.lastCall[0];
        expect(lastCallProps.beanToEdit).not.toBeNull();
        expect(lastCallProps.beanToEdit.id).toBeUndefined();
        expect(lastCallProps.beanToEdit.beanName).toBe(mockActiveBean.beanName);
        expect(lastCallProps.beanToEdit.grindSetting).toBe('2.0');
    });
  });
  
  test('should disable calculate button when required fields are empty', async () => {
    render(<SmartDialIn />);

    const calculateButton = screen.getByRole('button', { name: /חשב/i });
    expect(calculateButton).toBeDisabled();
  });

  test('should calculate and show perfect feedback when time is within range', async () => {
    render(<SmartDialIn />);

    // Fill in all required fields
    const doseInput = screen.getByLabelText(/קפה נכנס/i);
    const yieldInput = screen.getByLabelText(/אספרסו יצא/i);
    const timeInput = screen.getByLabelText(/^זמן \(שניות\)/i);
    const grindInput = screen.getByLabelText(/דרגת טחינה/i);
    const minInput = screen.getByDisplayValue('25');
    const maxInput = screen.getByDisplayValue('30');

    await user.clear(doseInput);
    await user.type(doseInput, '18');
    await user.clear(yieldInput);
    await user.type(yieldInput, '36');
    await user.clear(timeInput);
    await user.type(timeInput, '27');
    await user.type(grindInput, '1.5');

    const calculateButton = screen.getByRole('button', { name: /חשב/i });
    expect(calculateButton).not.toBeDisabled();

    await user.click(calculateButton);

    // Check for perfect feedback
    await waitFor(() => {
      expect(screen.getByText(/שוט מושלם/i)).toBeInTheDocument();
    });
  });

  test('should show too_fast feedback when time is below minimum range', async () => {
    render(<SmartDialIn />);

    await user.clear(screen.getByLabelText(/קפה נכנס/i));
    await user.type(screen.getByLabelText(/קפה נכנס/i), '18');
    await user.clear(screen.getByLabelText(/אספרסו יצא/i));
    await user.type(screen.getByLabelText(/אספרסו יצא/i), '36');
    await user.clear(screen.getByLabelText(/^זמן \(שניות\)/i));
    await user.type(screen.getByLabelText(/^זמן \(שניות\)/i), '20');
    await user.type(screen.getByLabelText(/דרגת טחינה/i), '1.5');

    await user.click(screen.getByRole('button', { name: /חשב/i }));

    await waitFor(() => {
      expect(screen.getByText(/מהיר מדי/i)).toBeInTheDocument();
      expect(screen.getByText(/טחן דק יותר/i)).toBeInTheDocument();
    });
  });

  test('should show too_slow feedback when time is above maximum range', async () => {
    render(<SmartDialIn />);

    await user.clear(screen.getByLabelText(/קפה נכנס/i));
    await user.type(screen.getByLabelText(/קפה נכנס/i), '18');
    await user.clear(screen.getByLabelText(/אספרסו יצא/i));
    await user.type(screen.getByLabelText(/אספרסו יצא/i), '36');
    await user.clear(screen.getByLabelText(/^זמן \(שניות\)/i));
    await user.type(screen.getByLabelText(/^זמן \(שניות\)/i), '35');
    await user.type(screen.getByLabelText(/דרגת טחינה/i), '1.5');

    await user.click(screen.getByRole('button', { name: /חשב/i }));

    await waitFor(() => {
      expect(screen.getByText(/איטי מדי/i)).toBeInTheDocument();
      expect(screen.getByText(/טחן גס יותר/i)).toBeInTheDocument();
    });
  });

  test('should calculate ratio correctly', async () => {
    render(<SmartDialIn />);

    await user.clear(screen.getByLabelText(/קפה נכנס/i));
    await user.type(screen.getByLabelText(/קפה נכנס/i), '18');
    await user.clear(screen.getByLabelText(/אספרסו יצא/i));
    await user.type(screen.getByLabelText(/אספרסו יצא/i), '36');
    await user.clear(screen.getByLabelText(/^זמן \(שניות\)/i));
    await user.type(screen.getByLabelText(/^זמן \(שניות\)/i), '27');
    await user.type(screen.getByLabelText(/דרגת טחינה/i), '1.5');

    await user.click(screen.getByRole('button', { name: /חשב/i }));

    // Expected ratio: 36 / 18 = 2.00
    await waitFor(() => {
      expect(screen.getByText(/2\.00/)).toBeInTheDocument();
    });
  });

  test('should allow changing target range and recalculate feedback', async () => {
    render(<SmartDialIn />);

    // Set initial values
    await user.clear(screen.getByLabelText(/קפה נכנס/i));
    await user.type(screen.getByLabelText(/קפה נכנס/i), '18');
    await user.clear(screen.getByLabelText(/אספרסו יצא/i));
    await user.type(screen.getByLabelText(/אספרסו יצא/i), '36');
    await user.clear(screen.getByLabelText(/^זמן \(שניות\)/i));
    await user.type(screen.getByLabelText(/^זמן \(שניות\)/i), '32');
    await user.type(screen.getByLabelText(/דרגת טחינה/i), '1.5');

    await user.click(screen.getByRole('button', { name: /חשב/i }));

    // Should show too_slow (32 > 30)
    await waitFor(() => {
      expect(screen.getByText(/איטי מדי/i)).toBeInTheDocument();
    });

    // Change target max to 35
    const maxInput = screen.getByDisplayValue('30');
    await user.clear(maxInput);
    await user.type(maxInput, '35');

    await user.click(screen.getByRole('button', { name: /חשב/i }));

    // Should now show perfect (32 is between 25-35)
    await waitFor(() => {
      expect(screen.getByText(/שוט מושלם/i)).toBeInTheDocument();
    });
  });

  test('should disable save button when grind setting is empty', async () => {
    render(<SmartDialIn />);

    await user.clear(screen.getByLabelText(/קפה נכנס/i));
    await user.type(screen.getByLabelText(/קפה נכנס/i), '18');
    await user.clear(screen.getByLabelText(/אספרסו יצא/i));
    await user.type(screen.getByLabelText(/אספרסו יצא/i), '36');
    await user.clear(screen.getByLabelText(/^זמן \(שניות\)/i));
    await user.type(screen.getByLabelText(/^זמן \(שניות\)/i), '27');
    const grindInput = screen.getByLabelText(/דרגת טחינה/i);
    // Don't fill grind setting - leave it empty

    const calculateButton = screen.getByRole('button', { name: /חשב/i });
    expect(calculateButton).toBeDisabled();
  });
});
