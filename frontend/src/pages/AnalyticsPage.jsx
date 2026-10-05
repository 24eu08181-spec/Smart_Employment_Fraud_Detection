import { useEffect, useState } from 'react';
import { getDashboardStats, getModelInfo } from '../services/api';

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);

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
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ['Total Notifications', stats?.totalAdsAnalyzed ?? 0],
          ['Genuine', stats?.genuine ?? 0],
          ['Suspicious', stats?.suspicious ?? 0],
          ['Fake', stats?.fake ?? 0],
          ['Average risk score', stats?.averageRiskScore ?? 0],
        ].map(([label, value]) => (
          <div key={label} className="metric-card">
            <div className="text-sm text-slate-400">{label}</div>
            <div className="mt-3 text-3xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="card-surface p-6">
        <h3 className="mb-4 text-lg font-semibold">Model Metrics</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ['Accuracy', modelInfo?.accuracy],
            ['Precision', modelInfo?.precision],
            ['Recall', modelInfo?.recall],
            ['F1 Score', modelInfo?.f1_score || modelInfo?.f1Score],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-700 bg-slate-950/70 p-4">
              <div className="text-sm text-slate-400">{label}</div>
              <div className="mt-2 text-2xl font-bold text-white">{value ? Number(value).toFixed(3) : 'N/A'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
