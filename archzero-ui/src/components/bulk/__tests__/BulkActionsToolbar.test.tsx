/**
 * Bulk Actions Toolbar Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BulkActionsToolbar } from '../BulkActionsToolbar';

describe('BulkActionsToolbar', () => {
  const mockHandlers = {
    onBulkDelete: vi.fn(),
    onBulkEdit: vi.fn(),
    onBulkTag: vi.fn(),
    onBulkExport: vi.fn(),
    onClearSelection: vi.fn(),
  };

  it('should not render when no items are selected', () => {
    const { container } = render(
      <BulkActionsToolbar {...mockHandlers} selectedCount={0} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render toolbar when items are selected', () => {
    render(<BulkActionsToolbar {...mockHandlers} selectedCount={3} />);

    expect(screen.getByText('3 items selected')).toBeDefined();
  });

  it('should show singular form when 1 item is selected', () => {
    render(<BulkActionsToolbar {...mockHandlers} selectedCount={1} />);

    expect(screen.getByText('1 item selected')).toBeDefined();
  });

  it('should call onBulkEdit when Edit button is clicked', () => {
    render(<BulkActionsToolbar {...mockHandlers} selectedCount={2} />);

    fireEvent.click(screen.getByText('Edit'));
    expect(mockHandlers.onBulkEdit).toHaveBeenCalledTimes(1);
  });

  it('should call onBulkTag when Tag button is clicked', () => {
    render(<BulkActionsToolbar {...mockHandlers} selectedCount={2} />);

    fireEvent.click(screen.getByText('Tag'));
    expect(mockHandlers.onBulkTag).toHaveBeenCalledTimes(1);
  });

  it('should call onBulkExport when Export button is clicked', () => {
    render(<BulkActionsToolbar {...mockHandlers} selectedCount={2} />);

    fireEvent.click(screen.getByText('Export'));
    expect(mockHandlers.onBulkExport).toHaveBeenCalledTimes(1);
  });

  it('should call onBulkDelete when Delete button is clicked', () => {
    render(<BulkActionsToolbar {...mockHandlers} selectedCount={2} />);

    fireEvent.click(screen.getByText('Delete'));
    expect(mockHandlers.onBulkDelete).toHaveBeenCalledTimes(1);
  });

  it('should call onClearSelection when clear button is clicked', () => {
    render(<BulkActionsToolbar {...mockHandlers} selectedCount={2} />);

    const clearButton = screen.getByTitle('Clear selection');
    fireEvent.click(clearButton);
    expect(mockHandlers.onClearSelection).toHaveBeenCalledTimes(1);
  });

  it('should apply correct styling to delete button', () => {
    render(<BulkActionsToolbar {...mockHandlers} selectedCount={2} />);

    const deleteButton = screen.getByText('Delete').closest('button');
    expect(deleteButton?.className).toContain('bg-rose-600');
  });
});
