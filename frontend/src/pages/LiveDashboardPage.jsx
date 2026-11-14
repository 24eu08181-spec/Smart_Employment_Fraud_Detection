import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../services/api';
import PublicSampleEvaluation from '../components/PublicSampleEvaluation';
import publicEvaluation from '../data/publicSampleEvaluation.json';

const metricColors = {
  Accuracy: '#2563eb',
  Precision: '#0f766e',
  Recall: '#d97706',
  'F1 Score': '#7c3aed',
};

function percentage(value) {
  const score = Number(value);
  if (!Number.isFinite(score)) return null;
  return Math.min(100, Math.max(0, score <= 1 ? score * 100 : score));
}

export default function LiveDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsResponse = await getDashboardStats();
        setStats(statsResponse.data.data);
      } catch (fetchError) {
        console.error(fetchError);
        setError(fetchError.response?.data?.message || 'Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-slate-300">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="card-surface p-6 text-sm text-red-200" role="alert">{error}</div>;
  }

  const formatCount = (value) => Number(value ?? 0).toLocaleString();
  const metrics = [
    ['Total Notifications', stats?.totalAdsAnalyzed ?? 0],
    ['Genuine', stats?.genuine ?? 0],
    ['Fake', stats?.fake ?? 0],
    ['Average Risk Score', stats?.averageRiskScore ?? 0, true],
  ];
  const modelMetrics = [
    ['Accuracy', publicEvaluation.accuracy],
    ['Precision', publicEvaluation.precision],
    ['Recall', publicEvaluation.recall],
    ['F1 Score', publicEvaluation.f1_score],
  ];
  const notificationTotal = Number(stats?.totalAdsAnalyzed ?? 0);
  const graphValues = [
    { label: 'Genuine', value: Number(stats?.genuine ?? 0), color: '#111827' },
    { label: 'Fake', value: Number(stats?.fake ?? 0), color: '#5c4033' },
  ];
  const graphMax = Math.max(1, notificationTotal, ...graphValues.map(({ value }) => value));
  const graphStep = Math.max(1, Math.ceil(graphMax / 4));
  const graphTop = 28;
  const graphBottom = 252;
  const graphHeight = graphBottom - graphTop;
  const resultSummary = [
    ['Genuine', Number(stats?.genuine ?? 0)],
    ['Fake', Number(stats?.fake ?? 0)],
  ];
  const genuineShare = notificationTotal
    ? (resultSummary[0][1] / notificationTotal) * 100
    : 0;
  const fakeOutcomeShare = notificationTotal
    ? (resultSummary[1][1] / notificationTotal) * 100
    : 0;
  const livePieCircumference = 2 * Math.PI * 34;
  const fakeShare = notificationTotal
    ? ((Number(stats?.fake ?? 0) / notificationTotal) * 100).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Live Analysis</p>
          <h2 className="mt-2 text-3xl font-bold text-white">Fraud Detection Dashboard</h2>
          <p className="mt-2 text-sm text-slate-400">
            A live summary of the job advertisements analyzed in your account.
          </p>
        </div>
        <Link
          className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          to="/analyze"
        >
          Analyze a Job
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, isRisk]) => (
          <div className="metric-card" key={label}>
            <div className="text-sm text-slate-400">{label}</div>
            <div className="mt-3 text-3xl font-bold text-white">
              {isRisk ? Number(value).toFixed(2) : formatCount(value)}
            </div>
          </div>
        ))}
      </div>

      <section className="card-surface p-5">
        <h3 className="mb-1 text-xl font-semibold text-white">Graphs</h3>
        <p className="mb-4 text-sm text-slate-400">
          Genuine and fake counts shown against your total notifications analyzed.
        </p>
        <div className="overflow-x-auto">
          <svg
            aria-label="Bar chart showing genuine and fake notification totals"
            className="min-w-[620px] w-full"
            role="img"
            viewBox="0 0 760 330"
          >
            {[0, 1, 2, 3, 4].map((tick) => {
              const y = graphBottom - (tick / 4) * graphHeight;
              return (
                <g key={tick}>
                  <line x1="100" x2="700" y1={y} y2={y} stroke="#dbe5f2" strokeDasharray="4 5" />
                  <text x="88" y={y + 4} fill="#62738c" fontSize="12" textAnchor="end">
                    {formatCount(graphStep * tick)}
                  </text>
                </g>
              );
            })}
            <line x1="100" x2="100" y1={graphTop} y2={graphBottom} stroke="#94a3b8" />
            <line x1="100" x2="700" y1={graphBottom} y2={graphBottom} stroke="#94a3b8" />
            <text
              fill="#405773"
              fontSize="13"
              textAnchor="middle"
              transform="translate(25 140) rotate(-90)"
            >
              Total Notifications
            </text>
            {graphValues.map((item, index) => {
              const x = 260 + index * 180;
              const barHeight = (item.value / (graphStep * 4)) * graphHeight;
              const y = graphBottom - barHeight;
              return (
                <g key={item.label}>
                  <rect x={x} y={y} width="72" height={barHeight} fill={item.color} rx="4" />
                  <text
                    x={x + 36}
                    y={Math.max(graphTop + 12, y - 6)}
                    fill="#405773"
                    fontSize="12"
                    textAnchor="middle"
                  >
                    {formatCount(item.value)}
                  </text>
                  <text x={x + 36} y="278" fill="#334761" fontSize="13" textAnchor="middle">
                    {item.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </section>

      <PublicSampleEvaluation />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <section className="card-surface p-5">
            <h3 className="mb-1 text-xl font-semibold text-white">40-Record Sample Performance Pie Chart</h3>
            <p className="mb-5 text-sm text-slate-400">
              Metrics are measured against labels in the public held-out sample.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {modelMetrics.map(([label, value]) => {
                const score = percentage(value);
                const circumference = 2 * Math.PI * 34;
                return (
                  <div key={label} className="flex flex-col items-center rounded-xl border border-slate-700 bg-slate-950/70 p-4">
                    <svg
                      aria-label={`${label}: ${score == null ? 'not available' : `${score.toFixed(1)} percent`}`}
                      className="h-24 w-24"
                      role="img"
                      viewBox="0 0 88 88"
                    >
                      <circle cx="44" cy="44" r="34" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                      {score != null && (
                        <circle
                          cx="44"
                          cy="44"
                          r="34"
                          fill="none"
                          stroke={metricColors[label]}
                          strokeDasharray={`${(score / 100) * circumference} ${circumference}`}
                          strokeLinecap="round"
                          strokeWidth="10"
                          transform="rotate(-90 44 44)"
                        />
                      )}
                      <text x="44" y="48" fill="#10264b" fontSize="13" fontWeight="700" textAnchor="middle">
                        {score == null ? 'N/A' : `${score.toFixed(1)}%`}
                      </text>
                    </svg>
                    <span className="mt-2 text-sm font-medium text-slate-300">{label}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="card-surface p-5">
            <h3 className="mb-1 text-xl font-semibold text-white">Live Results Pie Chart</h3>
            <p className="mb-4 text-sm text-slate-400">
              Genuine and fake results from your analyzed notifications. This updates as new analyses are saved.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <svg
                aria-label={
                  notificationTotal
                    ? `Live results out of ${formatCount(notificationTotal)} notifications: genuine ${genuineShare.toFixed(1)} percent, fake ${fakeOutcomeShare.toFixed(1)} percent`
                    : 'No genuine or fake notifications have been analyzed yet'
                }
                className="h-36 w-36 shrink-0"
                role="img"
                viewBox="0 0 88 88"
              >
                <circle
                  cx="44"
                  cy="44"
                  r="34"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="12"
                />
                {notificationTotal > 0 && (
                  <circle
                    cx="44"
                    cy="44"
                    r="34"
                    fill="none"
                    stroke="#111827"
                    strokeDasharray={`${(genuineShare / 100) * livePieCircumference} ${livePieCircumference}`}
                    strokeLinecap="butt"
                    strokeWidth="12"
                    transform="rotate(-90 44 44)"
                  />
                )}
                {notificationTotal > 0 && (
                  <circle
                    cx="44"
                    cy="44"
                    r="34"
                    fill="none"
                    stroke="#5c4033"
                    strokeDasharray={`${(fakeOutcomeShare / 100) * livePieCircumference} ${livePieCircumference}`}
                    strokeDashoffset={`${-(genuineShare / 100) * livePieCircumference}`}
                    strokeLinecap="butt"
                    strokeWidth="12"
                    transform="rotate(-90 44 44)"
                  />
                )}
                <text x="44" y="42" fill="#10264b" fontSize="12" fontWeight="700" textAnchor="middle">
                  {formatCount(notificationTotal)}
                </text>
                <text x="44" y="54" fill="#62738c" fontSize="7" textAnchor="middle">
                  RESULTS
                </text>
              </svg>
              <div className="grid w-full gap-3 sm:max-w-xs">
                {resultSummary.map(([label, count], index) => {
                  const share = notificationTotal ? (count / notificationTotal) * 100 : 0;
                  const color = index === 0 ? '#111827' : '#5c4033';
                  return (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-700 p-3" key={label}>
                      <span className="flex items-center gap-2 text-sm text-slate-300">
                        <span aria-hidden="true" className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
                        {label}
                      </span>
                      <span className="text-right text-sm font-semibold text-white">
                        {formatCount(count)} ({share.toFixed(1)}%)
                      </span>
                    </div>
                  );
                })}
                <p className="text-xs text-slate-400">
                  Percentages are shares of all {formatCount(notificationTotal)} analyzed notifications.
                </p>
              </div>
            </div>
          </section>

          <section className="card-surface p-5">
            <h3 className="mb-3 text-xl font-semibold text-white">Result Analysis</h3>
            {notificationTotal === 0 ? (
              <p className="text-sm leading-6 text-slate-200">
                No notifications have been analyzed yet. Analyze a job advertisement to see genuine and fake totals here.
              </p>
            ) : (
              <div className="space-y-4 text-sm leading-6 text-slate-200">
                <p>
                  Of {formatCount(notificationTotal)} total notifications analyzed, your results include:
                </p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {resultSummary.map(([label, count]) => (
                    <li key={label} className="rounded-xl bg-blue-50 p-3 text-blue-900">
                      <span className="block text-xs">{label}</span>
                      <span className="font-semibold">{formatCount(count)} ({((count / notificationTotal) * 100).toFixed(1)}%)</span>
                    </li>
                  ))}
                </ul>
                <p>
                  {fakeShare}% of analyzed notifications were classified as fake.
                  {Number(stats?.averageRiskScore) > 0 && ` The average risk score across all results is ${Number(stats.averageRiskScore).toFixed(2)} out of 100.`}
                </p>
                <p className="text-xs text-slate-400">
                  The totals above are percentages of all notifications analyzed.
                </p>
                <p>
                  Treat these predictions as a screening aid. Verify company identity and recruiter contact details,
                  especially before sharing personal information or paying fees.
                </p>
              </div>
            )}
          </section>
        </div>

        <section className="card-surface p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">Recent Predictions</h3>
            <Link className="text-sm font-medium text-cyan-300 hover:text-cyan-200" to="/history">
              View history
            </Link>
          </div>
          {stats?.recentPredictions?.length ? (
            <div className="space-y-3">
              {stats.recentPredictions.map((item) => (
                <article
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-950/60 p-3"
                  key={item._id}
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-white">{item.jobTitle}</div>
                    <div className="mt-1 text-xs text-slate-400">
                      {item.companyName || 'Company not provided'} · {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-cyan-300">{item.prediction}</div>
                    <div className="text-xs text-slate-400">Risk {item.riskScore} / 100</div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center">
              <p className="text-sm text-slate-300">No job advertisements analyzed yet.</p>
              <Link className="mt-3 inline-block text-sm font-medium text-cyan-300 hover:text-cyan-200" to="/analyze">
                Analyze your first job
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
