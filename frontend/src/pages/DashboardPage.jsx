import { useEffect, useState } from 'react';
import { getDashboardStats, getModelInfo } from '../services/api';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, modelResponse] = await Promise.all([
          getDashboardStats(),
          getModelInfo(),
        ]);
        setStats(statsResponse.data.data);
        setModelInfo(modelResponse.data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-slate-300">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Overview</p>
          <h2 className="mt-2 text-3xl font-bold text-white">Fraud Detection Dashboard</h2>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ['Total Notifications', stats?.totalAdsAnalyzed ?? 0],
          ['Genuine', stats?.genuine ?? 0],
          ['Suspicious', stats?.suspicious ?? 0],
          ['Fake', stats?.fake ?? 0],
          ['Average Risk Score', `${stats?.averageRiskScore ?? 0}`],
        ].map(([label, value]) => (
          <div key={label} className="metric-card">
            <div className="text-sm text-slate-400">{label}</div>
            <div className="mt-3 text-3xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-surface p-5">
          <h3 className="mb-4 text-lg font-semibold">Model Evaluation</h3>
          <div className="space-y-4">
            {[
              ['Accuracy', modelInfo?.accuracy],
              ['Precision', modelInfo?.precision],
              ['Recall', modelInfo?.recall],
              ['F1 Score', modelInfo?.f1_score || modelInfo?.['f1 score'] || modelInfo?.f1Score],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="mb-1 flex justify-between text-sm text-slate-300">
                  <span>{label}</span>
                  <span>{value ? Number(value).toFixed(3) : 'N/A'}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    style={{ width: `${Math.min(100, (Number(value || 0) * 100) || 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-surface p-5">
          <h3 className="mb-4 text-lg font-semibold">Recent Predictions</h3>
          <div className="space-y-3">
            {(stats?.recentPredictions || []).map((item) => (
              <div key={item._id} className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950/60 p-3">
                <div>
                  <div className="font-medium text-white">{item.jobTitle}</div>
                  <div className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-cyan-300">{item.prediction}</div>
                  <div className="text-xs text-slate-400">Risk {item.riskScore}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
