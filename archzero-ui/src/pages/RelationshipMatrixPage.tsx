import { useRelationshipMatrix } from '../lib/relationship-hooks';
import { RelationshipMatrix } from '../components/relationships/RelationshipMatrix';
import type { MatrixCell } from '../lib/relationship-hooks';

export function RelationshipMatrixPage() {
  const { data: matrixData, isLoading } = useRelationshipMatrix();

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-48 mb-4"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const nodes = matrixData?.nodes || [];
  const cells = matrixData?.cells || [];

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

      <div data-testid="relationship-matrix" className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <RelationshipMatrix nodes={nodes} cells={cells} />
      </div>
    </div>
  );
}
