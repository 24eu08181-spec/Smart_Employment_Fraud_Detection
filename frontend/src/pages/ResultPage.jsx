import { useLocation, useNavigate } from 'react-router-dom';
import { getRiskColors } from '../utils/formatters';

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;

  if (!result) {
    return (
      <div className="card-surface p-8 text-center text-slate-300">
        No result available. Please analyze a job advertisement first.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card-surface p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Final Assessment</p>
            <h2 className="mt-2 text-4xl font-bold text-white">{result.prediction}</h2>
          </div>
          <div className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${getRiskColors(result.risk_level || result.riskLevel)}`}>
            {result.risk_level || result.riskLevel}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-surface p-5">
          <div className="text-sm text-slate-400">Risk Score</div>
          <div className="mt-2 text-3xl font-bold text-white">{result.risk_score || result.riskScore} / 100</div>
        </div>
        <div className="card-surface p-5">
          <div className="text-sm text-slate-400">ML Prediction</div>
          <div className="mt-2 text-2xl font-bold text-cyan-300">{result.ml_prediction || result.mlPrediction}</div>
        </div>
        <div className="card-surface p-5">
          <div className="text-sm text-slate-400">Confidence</div>
          <div className="mt-2 text-2xl font-bold text-emerald-300">{Math.round(((result.confidence || 0) * 100))}%</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-surface p-5">
          <h3 className="mb-4 text-lg font-semibold">Fraud Indicators</h3>
          <ul className="space-y-2 text-slate-200">
            {(result.fraud_indicators || result.fraudIndicators || []).map((indicator, index) => (
              <li key={`${indicator}-${index}`} className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm">
                ⚠ {indicator}
              </li>
            ))}
          </ul>
        </div>

        <div className="card-surface p-5">
          <h3 className="mb-4 text-lg font-semibold">Verification</h3>
          <div className="space-y-3 text-sm text-slate-200">
            <div><span className="text-slate-400">Status:</span> {result.verification?.verification_status || 'Not Verified'}</div>
            <div><span className="text-slate-400">Company Domain:</span> {result.verification?.company_domain || 'N/A'}</div>
            <div><span className="text-slate-400">Recruiter Email:</span> {result.verification?.free_email_provider ? 'Free Email Provider' : 'Not Verified'}</div>
            <div><span className="text-slate-400">Source Verification:</span> {result.verification?.source_verified ? 'Verified' : 'Not Verified'}</div>
          </div>
        </div>
      </div>

      <div className="card-surface p-5">
        <h3 className="mb-4 text-lg font-semibold">Salary Analysis</h3>
        <div className="text-sm text-slate-200">
          {result.salary_analysis?.salary_detected ? `Detected salary: ${result.salary_analysis.salary_value}` : 'No salary information detected'}
          <div className="mt-2 text-slate-400">{result.salary_analysis?.message}</div>
        </div>
      </div>

      <div className="flex justify-start">
        <button className="rounded-xl bg-cyan-500 px-5 py-2.5 font-semibold text-slate-950 hover:bg-cyan-400" onClick={() => navigate('/analyze')}>
          Analyze Another Job
        </button>
      </div>
    </div>
  );
}
