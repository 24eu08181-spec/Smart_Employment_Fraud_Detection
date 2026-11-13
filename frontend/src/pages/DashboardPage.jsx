import { useEffect, useState } from 'react';
import { getModelInfo, getTrainingHistory } from '../services/api';

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

export default function DashboardPage() {
  const [modelInfo, setModelInfo] = useState(null);
  const [trainingRuns, setTrainingRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [modelResponse, trainingResponse] = await Promise.all([
          getModelInfo(),
          getTrainingHistory(),
        ]);
        setModelInfo(modelResponse.data.data);
        setTrainingRuns(trainingResponse.data.data || []);
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

  const latestCompletedRun = trainingRuns.find((run) => run.status === 'completed');
  const datasetSize = latestCompletedRun?.datasetSize ?? modelInfo?.dataset_size;
  const trainingSize = latestCompletedRun?.trainingSize ?? modelInfo?.training_size;
  const testingSize = latestCompletedRun?.testingSize ?? modelInfo?.testing_size;
  const trainingClassCounts = latestCompletedRun?.trainingClassCounts ?? modelInfo?.training_class_counts;
  const testingClassCounts = latestCompletedRun?.testingClassCounts ?? modelInfo?.testing_class_counts;
  const classCounts = latestCompletedRun?.classCounts ?? modelInfo?.class_counts;
  const averageRiskScore = latestCompletedRun?.averageRiskScore ?? modelInfo?.average_risk_score;
  const trainingAverageRiskScore = latestCompletedRun?.trainingAverageRiskScore ?? modelInfo?.training_average_risk_score;
  const testingAverageRiskScore = latestCompletedRun?.testingAverageRiskScore ?? modelInfo?.testing_average_risk_score;
  const formatCount = (value) => Number(value ?? 0).toLocaleString();
  const metricValues = [
    ['Accuracy', modelInfo?.accuracy],
    ['Precision', modelInfo?.precision],
    ['Recall', modelInfo?.recall],
    ['F1 Score', modelInfo?.f1_score ?? modelInfo?.['f1 score'] ?? modelInfo?.f1Score],
  ];
  const trainingGenuine = Number(trainingClassCounts?.genuine ?? 0);
  const trainingFake = Number(trainingClassCounts?.fake ?? 0);
  const testingGenuine = Number(testingClassCounts?.genuine ?? 0);
  const testingFake = Number(testingClassCounts?.fake ?? 0);
  const largestClassCount = Math.max(trainingGenuine, trainingFake, testingGenuine, testingFake);
  const rawTickStep = Math.max(1, largestClassCount / 4);
  const tickMagnitude = 10 ** Math.floor(Math.log10(rawTickStep));
  const tickStep = Math.ceil(rawTickStep / tickMagnitude) * tickMagnitude;
  const chartMax = tickStep * 4;
  const chartTop = 28;
  const chartBottom = 252;
  const chartHeight = chartBottom - chartTop;
  const chartGroups = [
    { label: 'Genuine', center: 275, training: trainingGenuine, testing: testingGenuine },
    { label: 'Fake', center: 555, training: trainingFake, testing: testingFake },
  ];
  const fakeShare = classCounts && datasetSize
    ? ((Number(classCounts.fake ?? 0) / Number(datasetSize)) * 100).toFixed(1)
    : null;
  const confusionMatrix = modelInfo?.confusion_matrix;
  const falseNegatives = Array.isArray(confusionMatrix) ? confusionMatrix[1]?.[0] : null;
  const falsePositives = Array.isArray(confusionMatrix) ? confusionMatrix[0]?.[1] : null;
  const renderDatasetMetrics = (title, total, counts, riskScore) => (
    <section className="card-surface p-5">
      <h3 className="mb-4 text-xl font-semibold text-white">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ['Total Notifications', total],
          ['Genuine', counts?.genuine],
          ['Fake', counts?.fake],
          ['Average Risk Score', riskScore],
        ].map(([label, value]) => (
          <div key={label} className="metric-card">
            <div className="text-sm text-slate-400">{label}</div>
            <div className="mt-3 text-2xl font-bold text-white">
              {value == null ? 'N/A' : label === 'Average Risk Score' ? Number(value).toFixed(2) : formatCount(value)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Model Dataset</p>
          <h2 className="mt-2 text-3xl font-bold text-white">Dataset Overview</h2>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {renderDatasetMetrics(
          'Training Data (80%)',
          trainingSize,
          trainingClassCounts,
          trainingAverageRiskScore ?? averageRiskScore,
        )}
        {renderDatasetMetrics(
          'Testing Data (20%)',
          testingSize,
          testingClassCounts,
          testingAverageRiskScore,
        )}
      </div>

      <section className="card-surface p-5">
        <h3 className="mb-1 text-xl font-semibold text-white">Graphs</h3>
        <p className="mb-4 text-sm text-slate-400">
          Genuine and fake job notifications in the training and testing splits.
        </p>
        <div className="overflow-x-auto">
          <svg
            aria-label="Grouped bar chart comparing genuine and fake job notifications in training and testing data"
            className="min-w-[620px] w-full"
            role="img"
            viewBox="0 0 760 350"
          >
            {[0, 1, 2, 3, 4].map((tick) => {
              const y = chartBottom - (tick / 4) * chartHeight;
              return (
                <g key={tick}>
                  <line x1="100" x2="700" y1={y} y2={y} stroke="#dbe5f2" strokeDasharray="4 5" />
                  <text x="88" y={y + 4} fill="#62738c" fontSize="12" textAnchor="end">
                    {formatCount(tickStep * tick)}
                  </text>
                </g>
              );
            })}
            <line x1="100" x2="100" y1={chartTop} y2={chartBottom} stroke="#94a3b8" />
            <line x1="100" x2="700" y1={chartBottom} y2={chartBottom} stroke="#94a3b8" />
            <text
              fill="#405773"
              fontSize="13"
              textAnchor="middle"
              transform="translate(25 140) rotate(-90)"
            >
              Total Notifications
            </text>
            {chartGroups.map((group) => (
              <g key={group.label}>
                {[
                  { label: 'Training', value: group.training, color: '#111827', offset: -48 },
                  { label: 'Testing', value: group.testing, color: '#5c4033', offset: 8 },
                ].map((series) => {
                  const barHeight = (series.value / chartMax) * chartHeight;
                  const x = group.center + series.offset;
                  const y = chartBottom - barHeight;
                  return (
                    <g key={series.label}>
                      <rect
                        x={x}
                        y={y}
                        width="40"
                        height={barHeight}
                        fill={series.color}
                        rx="3"
                      />
                      <text
                        x={x + 20}
                        y={Math.max(chartTop + 12, y - 6)}
                        fill="#405773"
                        fontSize="11"
                        textAnchor="middle"
                      >
                        {formatCount(series.value)}
                      </text>
                    </g>
                  );
                })}
                <text x={group.center} y="278" fill="#334761" fontSize="14" textAnchor="middle">
                  {group.label}
                </text>
              </g>
            ))}
            <rect x="280" y="312" width="12" height="12" fill="#111827" rx="2" />
            <text x="299" y="323" fill="#405773" fontSize="12">Training</text>
            <rect x="390" y="312" width="12" height="12" fill="#5c4033" rx="2" />
            <text x="409" y="323" fill="#405773" fontSize="12">Testing</text>
          </svg>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card-surface p-5">
          <h3 className="mb-1 text-xl font-semibold text-white">Performance Pie Chart</h3>
          <p className="mb-5 text-sm text-slate-400">
            Each chart shows a model metric as a percentage of its full score.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {metricValues.map(([label, value]) => {
              const score = percentage(value);
              const circumference = 2 * Math.PI * 34;
              const color = metricColors[label];
              return (
                <div key={label} className="flex flex-col items-center rounded-xl border border-slate-700 bg-slate-950/70 p-4">
                  <svg aria-label={`${label}: ${score == null ? 'not available' : `${score.toFixed(1)} percent`}`} role="img" viewBox="0 0 88 88" className="h-24 w-24">
                    <circle cx="44" cy="44" r="34" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                    {score != null && (
                      <circle
                        cx="44"
                        cy="44"
                        r="34"
                        fill="none"
                        stroke={color}
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
          <h3 className="mb-3 text-xl font-semibold text-white">Result Analysis</h3>
          <div className="space-y-4 text-sm leading-6 text-slate-200">
            <p>
              The {modelInfo?.dataset_name || 'EMSCAD'} dataset contains {formatCount(datasetSize)} job advertisements,
              split into {formatCount(trainingSize)} training notifications and {formatCount(testingSize)} testing notifications.
            </p>
            <p>
              {fakeShare == null
                ? 'Review the genuine and fake class counts above to understand the dataset balance.'
                : `${fakeShare}% of the dataset is labeled fake, so the classes are imbalanced. Accuracy alone may hide missed fraudulent listings.`}
              {percentage(modelInfo?.recall) != null && percentage(modelInfo?.precision) != null && (
                <> The model has {percentage(modelInfo.recall).toFixed(1)}% fake-job recall and {percentage(modelInfo.precision).toFixed(1)}% precision.</>
              )}
            </p>
            {(falseNegatives != null || falsePositives != null) && (
              <p>
                On the held-out test data, the confusion matrix reports {formatCount(falseNegatives)} fake listings missed
                {falsePositives != null && ` and ${formatCount(falsePositives)} genuine listings flagged as fake`}.
              </p>
            )}
            <p className="rounded-xl bg-blue-50 p-3 text-blue-900">
              Use the model as a screening aid: investigate suspicious ads and verify employers and recruiter contact details before taking action.
            </p>
          </div>
        </section>
      </div>

      <div className="card-surface p-5">
        <h3 className="mb-4 text-lg font-semibold text-white">Training Data Split</h3>
        {datasetSize == null ? (
          <p className="text-sm text-slate-400">Train the model to see dataset totals and the 80/20 split.</p>
        ) : (
          <dl className="space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Unique dataset records</dt>
              <dd className="font-semibold text-white">{formatCount(datasetSize)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Training records (80%)</dt>
              <dd className="font-semibold text-white">{formatCount(trainingSize)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Test records (20%)</dt>
              <dd className="font-semibold text-white">{formatCount(testingSize)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">All records: genuine / fake</dt>
              <dd className="font-semibold text-white">
                {formatCount(classCounts?.genuine)} / {formatCount(classCounts?.fake)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Train split: genuine / fake</dt>
              <dd className="font-semibold text-white">
                {formatCount(trainingClassCounts?.genuine)} / {formatCount(trainingClassCounts?.fake)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Test split: genuine / fake</dt>
              <dd className="font-semibold text-white">
                {formatCount(testingClassCounts?.genuine)} / {formatCount(testingClassCounts?.fake)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Training runs saved</dt>
              <dd className="font-semibold text-white">{formatCount(trainingRuns.length)}</dd>
            </div>
          </dl>
        )}
        {averageRiskScore != null && (
          <p className="mt-5 border-t border-slate-700 pt-4 text-xs text-slate-400">
            Average risk scores are calculated separately for each split using model predictions and the app&apos;s risk rules.
          </p>
        )}
      </div>
    </div>
  );
}
