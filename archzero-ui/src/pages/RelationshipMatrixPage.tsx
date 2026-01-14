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
      <h1 className="text-3xl font-bold mb-6">Relationship Matrix</h1>

      <RelationshipMatrix nodes={nodes} cells={cells} />
    </div>
  );
}
