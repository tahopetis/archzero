import { useEffect, useState } from 'react';
import { RelationshipMatrix } from '../components/relationships/RelationshipMatrix';
import type { MatrixCell } from '../lib/relationship-hooks';
import { api } from '../lib/api';

export function RelationshipMatrixPage() {
  const [nodes, setNodes] = useState<{ id: string; name: string }[]>([]);
  const [cells, setCells] = useState<MatrixCell[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch cards for the matrix
    async function fetchData() {
      try {
        const response = await api.get('/cards');
        const cards = response.data;

        // Transform cards into nodes
        const matrixNodes = cards.map((card: any) => ({
          id: card.id,
          name: card.name,
        }));

        // Create cells (you can customize this based on your relationship data)
        const matrixCells: MatrixCell[] = [];
        // TODO: Fetch actual relationship data and create cells

        setNodes(matrixNodes);
        setCells(matrixCells);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return <div className="container mx-auto py-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold" data-testid="matrix-page">Relationship Matrix</h1>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
            <select
              className="px-2 py-1 border-0 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              data-testid="dependency-type-filter"
              name="depType"
            >
              <option value="all">All Types</option>
              <option value="depends_on">Depends On</option>
              <option value="implements">Implements</option>
              <option value="uses">Uses</option>
            </select>
          </div>
        </div>
      </div>

      {/* Matrix Legend */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md" data-testid="matrix-legend">
        <h3 className="text-sm font-medium mb-3">Legend</h3>
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-200 dark:bg-blue-900 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Depends On</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-200 dark:bg-green-900 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Implements</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-200 dark:bg-purple-900 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Uses</span>
          </div>
        </div>
      </div>

      <div data-testid="dependency-matrix">
        <RelationshipMatrix nodes={nodes} cells={cells} />
      </div>
    </div>
  );
}
