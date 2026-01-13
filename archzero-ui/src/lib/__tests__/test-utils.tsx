/**
 * Test Utilities
 */

import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Create a custom render function that includes providers
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  return render(ui, { wrapper: AllTheProviders, ...options });
}

// Mock data generators
export const mockCard = (overrides = {}) => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test Card',
  type_: 'Application',
  lifecycle_phase: 'Production',
  description: 'Test description',
  tags: ['test', 'mock'],
  quality_score: 75,
  owner_id: 'user-123',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const mockRelationship = (overrides = {}) => ({
  id: 'rel-123',
  source_card_id: 'card-1',
  target_card_id: 'card-2',
  type: 'depends_on',
  description: 'Test relationship',
  confidence: 0.8,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const mockImportJob = (overrides = {}) => ({
  id: 'job-123',
  status: 'processing',
  total_rows: 100,
  processed_rows: 50,
  successful_rows: 45,
  failed_rows: 5,
  errors: [],
  started_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const mockSearchResult = (overrides = {}) => ({
  id: 'result-1',
  type: 'card',
  domain: 'cards',
  title: 'Test Result',
  description: 'Test description',
  url: '/cards/test',
  score: 0.9,
  highlights: [],
  ...overrides,
});

// Mock API responses
export const createMockResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  blob: async () => new Blob([JSON.stringify(data)]),
  text: async () => JSON.stringify(data),
});

// Mock handlers for testing
export const mockHandlers = [
  // Add MSW handlers here as needed
];

// Helper to wait for async operations
export const waitFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
