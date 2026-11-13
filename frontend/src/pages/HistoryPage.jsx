import { useEffect, useState } from 'react';
import { getPredictions, getTrainingHistory } from '../services/api';

export default function HistoryPage() {
  const [items, setItems] = useState([]);
  const [trainingRuns, setTrainingRuns] = useState([]);
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('predictions');

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (activeTab === 'predictions') {
          const response = await getPredictions({ status: filter });
          setItems(response.data.data || []);
        } else {
          const response = await getTrainingHistory();
          setTrainingRuns(response.data.data || []);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, [activeTab, filter]);

  return (
    <div className="card-surface p-6">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">History</p>
          <h2 className="mt-2 text-3xl font-bold text-white">
            {activeTab === 'predictions' ? 'Previous Analyses' : 'Model Training Runs'}
          </h2>
        </div>

        {activeTab === 'predictions' && (
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-xs">
            <option value="all">All</option>
            <option value="Genuine">Genuine</option>
            <option value="Suspicious">Suspicious</option>
            <option value="Fake">Fake</option>
          </select>
        )}
      </div>

      <div className="mb-5 flex gap-3 border-b border-slate-700">
        {[
          ['predictions', 'Job analyses'],
          ['training', 'Model training'],
        ].map(([tab, label]) => (
          <button
            key={tab}
            aria-pressed={activeTab === tab}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              activeTab === tab
                ? 'border-cyan-400 text-cyan-200'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'predictions' ? (
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
      ) : (
        <div className="table-wrap">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-800/70 text-slate-300">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Dataset</th>
                <th className="px-4 py-3">Rows</th>
                <th className="px-4 py-3">Train / Test</th>
                <th className="px-4 py-3">Train Genuine / Fake</th>
                <th className="px-4 py-3">Train Avg Risk</th>
                <th className="px-4 py-3">Test Avg Risk</th>
                <th className="px-4 py-3">Accuracy</th>
                <th className="px-4 py-3">Fake Recall</th>
                <th className="px-4 py-3">F1 Score</th>
              </tr>
            </thead>
            <tbody>
              {trainingRuns.map((run) => (
                <tr key={run._id} className="border-t border-slate-700">
                  <td className="whitespace-nowrap px-4 py-3">
                    {new Date(run.completedAt || run.startedAt || run.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{run.status}</td>
                  <td className="px-4 py-3">{run.datasetName || 'EMSCAD'}</td>
                  <td className="px-4 py-3">{Number(run.datasetSize || 0).toLocaleString()}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {Number(run.trainingSize || 0).toLocaleString()} / {Number(run.testingSize || 0).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {Number(run.trainingClassCounts?.genuine || 0).toLocaleString()} / {Number(run.trainingClassCounts?.fake || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{run.trainingAverageRiskScore == null ? 'N/A' : Number(run.trainingAverageRiskScore).toFixed(2)}</td>
                  <td className="px-4 py-3">{run.testingAverageRiskScore == null ? 'N/A' : Number(run.testingAverageRiskScore).toFixed(2)}</td>
                  <td className="px-4 py-3">{run.accuracy == null ? 'N/A' : `${(run.accuracy * 100).toFixed(2)}%`}</td>
                  <td className="px-4 py-3">{run.recall == null ? 'N/A' : `${(run.recall * 100).toFixed(2)}%`}</td>
                  <td className="px-4 py-3">{run.f1Score == null ? 'N/A' : `${(run.f1Score * 100).toFixed(2)}%`}</td>
                </tr>
              ))}
              {trainingRuns.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-400" colSpan={11}>
                    No model training runs have been saved yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
