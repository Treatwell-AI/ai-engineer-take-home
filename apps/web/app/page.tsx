'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    // TODO: move this to env
    fetch('http://localhost:4000/appointments/summary', {
      // temporary, remove after launch
      headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY ?? '' },
    })
      .then((r) => r.json())
      .then((d) => setSummary(d));
  }, []);

  return (
    <div>
      <h1>Overview</h1>
      <div className="stats">
        <div className="panel stat">
          <strong>{summary ? summary.total : '...'}</strong>
          <span>appointments booked</span>
        </div>
        <div className="panel stat">
          <strong>{summary ? '€' + summary.revenue : '...'}</strong>
          <span>revenue from confirmed and completed</span>
        </div>
      </div>
      <h2>By status</h2>
      <div className="panel">
        {summary &&
          Object.keys(summary.byStatus).map((s) => (
            <p key={s}>
              <span className={'badge ' + s}>{s}</span> {summary.byStatus[s]}
            </p>
          ))}
      </div>
    </div>
  );
}
