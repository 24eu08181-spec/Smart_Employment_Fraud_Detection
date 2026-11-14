import evaluation from '../data/publicSampleEvaluation.json';

const formatCount = (value) => Number(value ?? 0).toLocaleString();
const chartTop = 24;
const chartBottom = 190;
const chartHeight = chartBottom - chartTop;
const chartMax = evaluation.sample_size;
const chartStep = Math.max(1, Math.ceil(chartMax / 4));
const predictions = [
  { label: 'Genuine', count: evaluation.predicted_counts.Genuine, color: '#111827', x: 210 },
  { label: 'Fake', count: evaluation.predicted_counts.Fake, color: '#5c4033', x: 410 },
];

export default function PublicSampleEvaluation() {
  return (
    <section className="card-surface space-y-5 p-5">
      <div>
        <h3 className="text-xl font-semibold text-white">40-Record Benchmark Summary</h3>
        <p className="mt-1 text-sm text-slate-400">
          Aggregate results from a balanced sample in the model&apos;s held-out test split. Individual
          posting details are not stored in the project; dataset labels are not live verification of jobs.
        </p>
        <a
          className="mt-2 inline-block text-sm font-medium text-cyan-300 underline hover:text-cyan-200"
          href={evaluation.source_url}
          rel="noreferrer"
          target="_blank"
        >
          Source: {evaluation.source_name} ({evaluation.source_license})
        </a>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['Sample size', evaluation.sample_size],
          ['Correct predictions', `${evaluation.correct_count}/${evaluation.sample_size}`],
          ['Average risk score', `${evaluation.average_risk_score}/100`],
        ].map(([label, value]) => (
          <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4" key={label}>
            <div className="text-sm text-slate-400">{label}</div>
            <div className="mt-2 text-2xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      <div>
        <h4 className="mb-1 font-semibold text-white">Sample prediction graph</h4>
        <p className="mb-3 text-sm text-slate-400">Model-predicted Genuine and Fake counts; total 40 records.</p>
        <div className="overflow-x-auto">
          <svg
            aria-label={`Out of ${evaluation.sample_size} public sample records, ${evaluation.predicted_counts.Genuine} predicted Genuine and ${evaluation.predicted_counts.Fake} predicted Fake`}
            className="min-w-[420px] w-full"
            role="img"
            viewBox="0 0 640 240"
          >
            {[0, 1, 2, 3, 4].map((tick) => {
              const value = chartStep * tick;
              const y = chartBottom - (value / chartMax) * chartHeight;
              return (
                <g key={tick}>
                  <line x1="100" x2="580" y1={y} y2={y} stroke="#dbe5f2" strokeDasharray="4 5" />
                  <text x="88" y={y + 4} fill="#62738c" fontSize="12" textAnchor="end">
                    {formatCount(value)}
                  </text>
                </g>
              );
            })}
            <line x1="100" x2="100" y1={chartTop} y2={chartBottom} stroke="#94a3b8" />
            <line x1="100" x2="580" y1={chartBottom} y2={chartBottom} stroke="#94a3b8" />
            <text fill="#405773" fontSize="12" textAnchor="middle" transform="translate(24 110) rotate(-90)">
              Total records
            </text>
            {predictions.map(({ label, count, color, x }) => {
              const height = (count / chartMax) * chartHeight;
              const y = chartBottom - height;
              return (
                <g key={label}>
                  <rect fill={color} height={height} rx="4" width="72" x={x} y={y} />
                  <text fill="#405773" fontSize="12" textAnchor="middle" x={x + 36} y={y - 6}>
                    {formatCount(count)}
                  </text>
                  <text fill="#334761" fontSize="13" textAnchor="middle" x={x + 36} y="216">
                    {label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="space-y-2 text-sm leading-6 text-slate-200">
        <h4 className="font-semibold text-white">Result analysis</h4>
        <p>
          The sample contains 20 dataset-labeled Genuine and 20 dataset-labeled Fake postings. The model
          predicted {formatCount(evaluation.predicted_counts.Genuine)} Genuine and {formatCount(evaluation.predicted_counts.Fake)} Fake;
          {` ${formatCount(evaluation.correct_count)} of ${formatCount(evaluation.sample_size)} `}
          predictions matched the dataset labels ({(evaluation.accuracy * 100).toFixed(1)}% accuracy).
        </p>
        <p>
          It missed {formatCount(evaluation.false_negative_fake)} Fake postings and flagged
          {' '}{formatCount(evaluation.false_positive_fake)} Genuine postings as Fake. Mean rule-based risk
          score was {evaluation.average_risk_score}/100.
        </p>
        <p className="text-xs text-slate-400">
          This is a deliberately balanced, historical benchmark sample, so its Fake/Genuine percentages
          do not represent current job-market prevalence. Use predictions as a screening aid.
        </p>
      </div>

    </section>
  );
}
