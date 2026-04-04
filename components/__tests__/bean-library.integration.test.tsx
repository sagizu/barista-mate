import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BeanLibrary } from '../bean-library';
import { SavedBean } from '@/lib/types';
import { onSnapshot } from 'firebase/firestore';

// Mock firestore
vi.mock('@/lib/firestore', () => ({
  deleteBean: vi.fn(),
  addBean: vi.fn(),
  updateBean: vi.fn(),
  getPrivateRoasters: vi.fn(() => Promise.resolve(['A Roastery', 'B Roastery'])),
  getGlobalRoasters: vi.fn(() => Promise.resolve([])),
  getGlobalBeans: vi.fn(() => Promise.resolve([])),
}));

// Mock firebase/firestore
vi.mock('firebase/firestore', async () => {
    const actual = await vi.importActual('firebase/firestore');
    return {
        ...actual,
        collection: vi.fn(),
        query: vi.fn(),
        orderBy: vi.fn(),
        onSnapshot: vi.fn(),
        doc: vi.fn(() => ({ type: 'document' })),
    };
});


// Mock firebase-config
vi.mock('@/firebase-config', () => ({
  db: {},
  auth: {
    currentUser: {
      uid: 'test-user-id',
    },
  },
}));


const mockBeans: SavedBean[] = [
  { id: '1', roasterName: 'B Roastery', beanName: 'Z Blend', roastLevel: 3, pricePerKilo: 120, flavorTags: ['שוקולדי', 'אגוזי'], createdAt: '2023-01-01', grindSetting: '' },
  { id: '2', roasterName: 'A Roastery', beanName: 'Y Blend', roastLevel: 2, pricePerKilo: 150, flavorTags: ['פירותי'], createdAt: '2023-01-02', grindSetting: '' },
  { id: '3', roasterName: 'B Roastery', beanName: 'X Blend', roastLevel: 5, pricePerKilo: 200, flavorTags: ['קרמל'], createdAt: '2023-01-03', grindSetting: '' },
];

describe('BeanLibrary', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    (onSnapshot as vi.Mock).mockImplementation((queryOrRef, callback) => {
        if (queryOrRef?.type === 'document') {
           const userSnapshot = {
               exists: () => true,
               data: () => ({ settings: { general: { activeBeanId: null, activeBeanOpenedDate: '' } } })
           };
           callback(userSnapshot);
        } else {
           const snapshot = {
               docs: mockBeans.map(bean => ({
                   id: bean.id,
                   data: () => bean,
               })),
           };
           callback(snapshot);
        }
        return () => {}; // Unsubscribe function
    });
  });

  it('renders and sorts beans correctly', async () => {
    render(<BeanLibrary />);
    
    await waitFor(() => {
      const roasteryTitles = screen.getAllByTestId('roastery-title');
      expect(roasteryTitles[0]).toHaveTextContent('A Roastery');
      expect(roasteryTitles[1]).toHaveTextContent('B Roastery');
    });

    // Check bean name sorting within the same roastery
    const bRoasteryBeans = screen.getAllByText(/Blend/);
    // Based on sorting: Y Blend (from A), then X Blend, then Z Blend (both from B)
    expect(bRoasteryBeans[0]).toHaveTextContent('Y Blend');
    expect(bRoasteryBeans[1]).toHaveTextContent('X Blend');
    expect(bRoasteryBeans[2]).toHaveTextContent('Z Blend');
  });

  it('filters by roastery', async () => {
    render(<BeanLibrary />);
    
    // Open filter
    fireEvent.click(screen.getByText('הצג סינון'));
    
    let filterContent;
    await waitFor(() => {
        filterContent = screen.getByText('סינון פולים').parentElement!.parentElement;
    });

    // Find and click the Combobox trigger to open the dropdown
    const comboboxTrigger = within(filterContent!).getByRole('combobox');
    fireEvent.click(comboboxTrigger);
    
    // Wait for the dropdown (dialog/popover) to appear and click the specific option
    await waitFor(() => {
        // Find the specific role="option" (the CommandItem) containing our text
        const optionToClick = screen.getByRole('option', { name: /A Roastery/i });
        fireEvent.click(optionToClick);
    });

    // Assert that the filter worked
    await waitFor(() => {
      const roasteryTitles = screen.getAllByTestId('roastery-title');
      expect(roasteryTitles.length).toBe(1);
      expect(roasteryTitles[0]).toHaveTextContent('A Roastery');
    });
  });

  it('filters by flavor tag', async () => {
    render(<BeanLibrary />);
    
    fireEvent.click(screen.getByText('הצג סינון'));
    
    let filterContent;
    await waitFor(() => {
        filterContent = screen.getByText('סינון פולים').parentElement.parentElement;
    });

    await waitFor(() => {
        fireEvent.click(within(filterContent).getByText('שוקולדי'));
    });

    await waitFor(() => {
      const roasteryTitles = screen.getAllByTestId('roastery-title');
      expect(roasteryTitles.length).toBe(1);
      expect(roasteryTitles[0]).toHaveTextContent('B Roastery');
      const beanNames = screen.getAllByText(/Blend/);
      expect(beanNames.length).toBe(1);
      expect(beanNames[0]).toHaveTextContent('Z Blend');
    });
  });

    it('clears filters', async () => {
    render(<BeanLibrary />);
    
    // Open filter and apply a filter
    fireEvent.click(screen.getByText('הצג סינון'));
    
    let filterContent;
    await waitFor(() => {
        filterContent = screen.getByText('סינון פולים').parentElement.parentElement;
    });

    await waitFor(() => {
        fireEvent.click(within(filterContent).getByText('שוקולדי'));
    });

    // Make sure filter is applied
    await waitFor(() => {
      expect(screen.getAllByTestId('roastery-title').length).toBe(1);
    });

    // Clear filters
    fireEvent.click(within(filterContent).getByText('נקה'));

    await waitFor(() => {
      // Should display all roasteries again
      const roasteryTitles = screen.getAllByTestId('roastery-title');
      expect(roasteryTitles.length).toBe(2);
    });
  });

  it('renders the Spotlight Layout when an active bean exists', async () => {
    // Override the mock to return an active bean (id: '2', which is 'Y Blend' from 'A Roastery')
    (onSnapshot as vi.Mock).mockImplementation((queryOrRef, callback) => {
        if (queryOrRef?.type === 'document') {
           const userSnapshot = {
               exists: () => true,
               data: () => ({ settings: { general: { activeBeanId: '2', activeBeanOpenedDate: '2023-01-01' } } })
           };
           callback(userSnapshot);
        } else {
           const snapshot = {
               docs: mockBeans.map(bean => ({
                   id: bean.id,
                   data: () => bean,
               })),
           };
           callback(snapshot);
        }
        return () => {}; // Unsubscribe function
    });

    render(<BeanLibrary />);
    
    // Verify that the Spotlight section title exists
    await waitFor(() => {
       const spotlightHeading = screen.getByRole('heading', { name: /הפול הפעיל שלך/i });
       expect(spotlightHeading).toBeInTheDocument();
    });

    // Verify the library section exists below it
    expect(screen.getByRole('heading', { name: /ספריית הפולים/i })).toBeInTheDocument();

    // Verify 'A Roastery' list is COMPLETELY GONE from the collection
    // (Because its ONLY bean, Y Blend, was extracted to the Spotlight)
    const roasterCards = screen.queryAllByTestId('roastery-title');
    expect(roasterCards.some(t => t.textContent === 'A Roastery')).toBe(false);

    // B Roastery should still exist for the other beans
    expect(roasterCards.some(t => t.textContent === 'B Roastery')).toBe(true);

    const yBlendInstances = screen.getAllByText('Y Blend');
    expect(yBlendInstances.length).toBe(1); // Should only exist in the spotlight, not twice
  });
  
});
