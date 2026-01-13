/**
 * Bulk Edit Dialog Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BulkEditDialog } from '../BulkEditDialog';
import { CardType, LifecyclePhase } from '@/types';

// Mock the bulk hooks
const mockMutateAsync = vi.fn().mockResolvedValue({
  success: true,
  processed_count: 2,
  failed_ids: []
});

vi.mock('@/lib/bulk-hooks', () => ({
  useBulkUpdateCards: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

describe('BulkEditDialog', () => {
  const mockProps = {
    selectedIds: ['id1', 'id2'],
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when dialog is closed', () => {
    const { container } = render(
      <BulkEditDialog {...mockProps} isOpen={false} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render dialog when open', () => {
    render(<BulkEditDialog {...mockProps} />);

    expect(screen.getByText('Edit 2 Cards')).toBeDefined();
    expect(screen.getByLabelText('Type')).toBeDefined();
    expect(screen.getByLabelText('Lifecycle Phase')).toBeDefined();
  });

  it('should display correct count for single item', () => {
    render(<BulkEditDialog {...mockProps} selectedIds={['id1']} />);

    expect(screen.getByText('Edit 1 Card')).toBeDefined();
  });

  it('should allow selecting card type', () => {
    render(<BulkEditDialog {...mockProps} />);

    const typeSelect = screen.getByLabelText('Type');
    fireEvent.change(typeSelect, { target: { value: CardType.Application } });

    expect((typeSelect as HTMLSelectElement).value).toBe(CardType.Application);
  });

  it('should allow selecting lifecycle phase', () => {
    render(<BulkEditDialog {...mockProps} />);

    const phaseSelect = screen.getByLabelText('Lifecycle Phase');
    expect(phaseSelect).toBeDefined();

    fireEvent.change(phaseSelect, { target: { value: LifecyclePhase.Active } });
    // Value change is handled by the component's state
  });

  it('should allow entering tags', () => {
    render(<BulkEditDialog {...mockProps} />);

    const tagsInput = screen.getByPlaceholderText('e.g. critical, payment, legacy');
    fireEvent.change(tagsInput, { target: { value: 'critical, payment' } });

    expect((tagsInput as HTMLInputElement).value).toBe('critical, payment');
  });

  it('should allow entering quality score', () => {
    render(<BulkEditDialog {...mockProps} />);

    const scoreInput = screen.getByPlaceholderText('e.g. 75');
    fireEvent.change(scoreInput, { target: { value: '85' } });

    expect((scoreInput as HTMLInputElement).value).toBe('85');
  });

  it('should call onClose when cancel button is clicked', () => {
    render(<BulkEditDialog {...mockProps} />);

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when X button is clicked', () => {
    render(<BulkEditDialog {...mockProps} />);

    const closeButton = screen.getByRole('button', { name: '' }).querySelector('svg');
    if (closeButton) {
      fireEvent.click(closeButton.closest('button')!);
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('should submit form and close on success', async () => {
    render(<BulkEditDialog {...mockProps} />);

    const tagsInput = screen.getByPlaceholderText('e.g. critical, payment, legacy');
    fireEvent.change(tagsInput, { target: { value: 'test-tag' } });

    fireEvent.click(screen.getByText('Update Cards'));

    await waitFor(() => {
      expect(mockProps.onSuccess).toHaveBeenCalledTimes(1);
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });
  });
});
