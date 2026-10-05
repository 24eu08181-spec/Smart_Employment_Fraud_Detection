import { useEffect, useState } from 'react';
import { getModelInfo } from '../services/api';

export default function ModelInfoPage() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getModelInfo();
        setInfo(response.data.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="card-surface p-6">
      <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Model</p>
      <h2 className="mt-2 text-3xl font-bold text-white">Model Information</h2>

      {info?.status === 'not trained yet' || info?.message === 'Model not trained yet' ? (
        <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">Model not trained yet.</div>
      ) : (
        <div className="mt-6 space-y-4 text-slate-200">
          <div><span className="text-slate-400">Model:</span> {info?.model_name || 'Linear SVM'}</div>
          <div><span className="text-slate-400">Feature Extraction:</span> {info?.feature_extraction || 'TF-IDF'}</div>
          <div><span className="text-slate-400">Dataset:</span> {info?.dataset || 'EMSCAD'}</div>
          <div><span className="text-slate-400">Accuracy:</span> {info?.accuracy ? Number(info.accuracy).toFixed(3) : 'N/A'}</div>
          <div><span className="text-slate-400">Precision:</span> {info?.precision ? Number(info.precision).toFixed(3) : 'N/A'}</div>
          <div><span className="text-slate-400">Recall:</span> {info?.recall ? Number(info.recall).toFixed(3) : 'N/A'}</div>
          <div><span className="text-slate-400">F1-score:</span> {info?.f1_score || info?.['f1 score'] || info?.f1Score || 'N/A'}</div>
        </div>
      )}
    </div>
  );
}
