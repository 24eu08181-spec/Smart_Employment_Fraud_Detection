export const formatRiskLabel = (value) => {
  if (!value) return 'Low Risk';
  return value;
};

export const formatCurrency = (value) => {
  if (!value) return 'N/A';
  return `${value}`;
};

export const getRiskColors = (riskLevel) => {
  switch (riskLevel) {
    case 'High Risk':
      return 'bg-red-500/20 text-red-200 border-red-500/60';
    case 'Medium Risk':
      return 'bg-amber-500/20 text-amber-200 border-amber-500/60';
    case 'Low Risk':
    default:
      return 'bg-emerald-500/20 text-emerald-200 border-emerald-500/60';
  }
};
