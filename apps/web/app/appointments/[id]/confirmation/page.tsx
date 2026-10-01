'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// Shareable page: the customer opens it from the confirmation email.
type Appointment = {
  id: number;
  startsAt: string;
  status: string;
  price: number;
  customer: { name: string };
  treatment: { name: string; durationMin: number };
};

export default function ConfirmationPage() {
  const params = useParams<{ id: string }>();
  const [appointment, setAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    fetch('/api/appointments/' + params.id)
      .then((r) => r.json())
      .then((d) => setAppointment(d));
  }, [params.id]);

  if (!appointment) return <p>Loading...</p>;

  return (
    <div className="confirmation panel">
      <h1>Your booking</h1>
      <dl>
        <dt>Name</dt>
        <dd>{appointment.customer.name}</dd>
        <dt>Treatment</dt>
        <dd>
          {appointment.treatment.name} ({appointment.treatment.durationMin} min)
        </dd>
        <dt>When</dt>
        <dd>{new Date(appointment.startsAt).toLocaleString()}</dd>
        <dt>Price</dt>
        <dd>€{appointment.price}</dd>
        <dt>Status</dt>
        <dd>
          <span className={'badge ' + appointment.status}>{appointment.status}</span>
        </dd>
      </dl>
    </div>
  );
}
