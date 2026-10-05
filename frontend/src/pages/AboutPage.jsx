export default function AboutPage() {
  return (
    <div className="card-surface p-6">
      <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Project</p>
      <h2 className="mt-2 text-3xl font-bold text-white">About the Project</h2>

      <div className="mt-6 space-y-4 text-slate-200">
        <p>
          SMART EMPLOYMENT FRAUD DETECTION is an academic ML and NLP system designed to detect fraudulent online recruitment content.
        </p>
        <p>
          The system combines a rule-based fraud indicator engine with a Linear SVM classifier trained on TF-IDF text features. This separation keeps the ML prediction explainable while still allowing a risk score to reflect suspicious language, salary anomalies, and weak verification signals.
        </p>
        <p>
          The primary final decision categories are Genuine, Suspicious, and Fake, with Suspicious created through a documented rule + risk layer rather than a fake dataset label invention.
        </p>
      </div>
    </div>
  );
}
