/**
 * Import Types
 */

export interface ColumnMapping {
  name?: string;
  type?: string;
  lifecycle_phase?: string;
  description?: string;
  tags?: string;
  owner_id?: string;
  quality_score?: string;
}

export interface ImportJob {
  id: string;
  status: ImportStatus;
  total_rows: number;
  processed_rows: number;
  successful_rows: number;
  failed_rows: number;
  errors: ImportError[];
  started_at: string;
  completed_at?: string;
}

export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface ImportError {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ImportResult {
  job_id: string;
  status: ImportStatus;
  total_rows: number;
  successful_rows: number;
  failed_rows: number;
  errors: ImportError[];
}
