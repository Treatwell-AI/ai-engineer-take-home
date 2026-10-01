'use client';

import { useEffect, useState } from 'react';

export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const r = await fetch('/api/treatments');
      setTreatments(await r.json());
    }
    load();
  }, []);

  return (
    <div>
      <h1>Treatments</h1>
      <table>
        <thead>
          <tr>
            <th>Treatment</th>
            <th>Category</th>
            <th>Duration</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {treatments.map((t) => (
            <tr key={t.id}>
              <td>{t.name}</td>
              <td>{t.category}</td>
              <td>{t.durationMin} min</td>
              <td>€{t.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
