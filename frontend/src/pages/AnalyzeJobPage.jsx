import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { predictJob } from '../services/api';

const initialState = {
  job_title: '',
  company_name: '',
  location: '',
  salary_range: '',
  company_profile: '',
  description: '',
  requirements: '',
  benefits: '',
  employment_type: '',
  education: '',
  industry: '',
  function: '',
  company_website: '',
  recruiter_email: '',
  job_source_url: '',
};

export default function AnalyzeJobPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.job_title.trim() || !form.description.trim()) {
      setError('Job title and description are required.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...form,
        company_name: form.company_name || '',
      };

      const response = await predictJob(payload);
      navigate('/result', { state: { result: response.data.data } });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to analyze the advertisement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-surface p-6">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Analysis</p>
        <h2 className="mt-2 text-3xl font-bold text-white">Analyze Job Advertisement</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="form-grid">
          {[
            ['job_title', 'Job Title'],
            ['company_name', 'Company Name'],
            ['location', 'Location'],
            ['salary_range', 'Salary Range'],
            ['employment_type', 'Employment Type'],
            ['education', 'Education'],
            ['industry', 'Industry'],
            ['function', 'Function'],
            ['company_website', 'Company Website'],
            ['recruiter_email', 'Recruiter Email'],
            ['job_source_url', 'Job Source URL'],
          ].map(([name, label]) => (
            <div key={name}>
              <label htmlFor={name}>{label}</label>
              <input id={name} name={name} value={form[name]} onChange={handleChange} />
            </div>
          ))}
        </div>

        <div>
          <label htmlFor="company_profile">Company Profile</label>
          <textarea id="company_profile" name="company_profile" value={form.company_profile} onChange={handleChange} />
        </div>

        <div>
          <label htmlFor="description">Job Description</label>
          <textarea id="description" name="description" value={form.description} onChange={handleChange} />
        </div>

        <div>
          <label htmlFor="requirements">Requirements</label>
          <textarea id="requirements" name="requirements" value={form.requirements} onChange={handleChange} />
        </div>

        <div>
          <label htmlFor="benefits">Benefits</label>
          <textarea id="benefits" name="benefits" value={form.benefits} onChange={handleChange} />
        </div>

        {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="rounded-xl bg-cyan-500 px-5 py-2.5 font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60" disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze Job'}
          </button>
          <button type="button" className="rounded-xl border border-slate-600 bg-slate-800 px-5 py-2.5 font-semibold text-slate-200 hover:bg-slate-700" onClick={() => setForm(initialState)}>
            Clear Form
          </button>
        </div>
      </form>
    </div>
  );
}
