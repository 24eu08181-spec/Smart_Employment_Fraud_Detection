import { useEffect, useState } from 'react';
import { getPredictions } from '../services/api';

export default function HistoryPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getPredictions({ status: filter });
        setItems(response.data.data || []);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, [filter]);

  return (
    <div className="card-surface p-6">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">History</p>
          <h2 className="mt-2 text-3xl font-bold text-white">Previous Analyses</h2>
        </div>

        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-xs">
          <option value="all">All</option>
          <option value="Genuine">Genuine</option>
          <option value="Suspicious">Suspicious</option>
          <option value="Fake">Fake</option>
        </select>
      </div>

      <div className="table-wrap">
        <table className="min-w-full text-left text-sm text-slate-200">
          <thead className="bg-slate-800/70 text-slate-300">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Job Title</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Prediction</th>
              <th className="px-4 py-3">Risk Score</th>
              <th className="px-4 py-3">Risk Level</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id} className="border-t border-slate-700">
                <td className="px-4 py-3">{new Date(item.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">{item.jobTitle}</td>
                <td className="px-4 py-3">{item.companyName || 'N/A'}</td>
                <td className="px-4 py-3">{item.prediction}</td>
                <td className="px-4 py-3">{item.riskScore}</td>
                <td className="px-4 py-3">{item.riskLevel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
