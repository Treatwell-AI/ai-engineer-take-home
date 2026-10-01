'use client';

import { useEffect, useState } from 'react';

type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  function load() {
    fetch('/api/customers?search=' + search)
      .then((r) => r.json())
      .then((d) => setCustomers(d));
  }

  useEffect(() => {
    load();
  }, [search]);

  function add() {
    fetch('/api/customers', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, email, phone }),
    }).then(() => {
      setName('');
      setEmail('');
      setPhone('');
      load();
    });
  }

  return (
    <div>
      <h1>Customers</h1>
      <div className="filters">
        <label>
          Search
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or email" />
        </label>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.email}</td>
              <td>{c.phone}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Add a customer</h2>
      <div className="panel">
        <div className="form-grid">
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Phone
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
        </div>
        <button onClick={add}>Add customer</button>
      </div>
    </div>
  );
}
