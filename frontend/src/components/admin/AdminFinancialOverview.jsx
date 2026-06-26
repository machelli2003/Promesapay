import { useState, useEffect } from 'react';
import { getFinancialOverview } from '../../api/adminPayments';
import { LoadingSpinner, MessageBox } from '../ui';

export default function AdminFinancialOverview() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOverview();
    // Refresh every 30 seconds
    const interval = setInterval(loadOverview, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadOverview = async () => {
    try {
      const response = await getFinancialOverview();
      setOverview(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load financial overview');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!overview) {
    return <MessageBox type="error" message="Failed to load financial data" />;
  }

  const stats = [
    {
      label: 'Total Donations Received',
      value: `GH₵${overview.total_donations_received.toFixed(2)}`,
      color: 'bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-200',
      icon: '💰',
    },
    {
      label: 'Total Withdrawn',
      value: `GH₵${overview.total_withdrawn.toFixed(2)}`,
      color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200',
      icon: '💸',
    },
    {
      label: 'Admin Allocations',
      value: `GH₵${overview.total_admin_allocations.toFixed(2)}`,
      color: 'bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-200',
      icon: '📊',
    },
    {
      label: 'Current Platform Balance',
      value: `GH₵${overview.current_platform_balance.toFixed(2)}`,
      color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200',
      icon: '🏦',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <div key={idx} className={`theme-card ${stat.color} p-6`}>
            <p className="text-3xl mb-2">{stat.icon}</p>
            <p className="text-sm font-medium opacity-75">{stat.label}</p>
            <p className="text-2xl font-bold mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Detailed Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pending Withdrawals */}
        <div className="theme-panel">
          <h3 className="theme-heading mb-4 text-lg font-semibold">Pending Withdrawals</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded">
              <span className="font-medium">Count</span>
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {overview.pending_withdrawals.count}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded">
              <span className="font-medium">Total Amount</span>
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                GH₵{overview.pending_withdrawals.total_amount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Platform Statistics */}
        <div className="theme-panel">
          <h3 className="theme-heading mb-4 text-lg font-semibold">Platform Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between p-3 border-b border-slate-200 dark:border-slate-700">
              <span className="theme-muted">Total Users</span>
              <span className="font-semibold">{overview.statistics.total_users}</span>
            </div>
            <div className="flex justify-between p-3 border-b border-slate-200 dark:border-slate-700">
              <span className="theme-muted">Completed Withdrawals</span>
              <span className="font-semibold">{overview.statistics.completed_withdrawals}</span>
            </div>
            <div className="flex justify-between p-3">
              <span className="theme-muted">Approved Payment Methods</span>
              <span className="font-semibold">{overview.statistics.total_approved_payment_methods}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Payment Method Approvals */}
      <div className="theme-panel">
        <h3 className="theme-heading mb-4 text-lg font-semibold">Pending Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Pending Payment Method Approvals</p>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
              {overview.pending_payment_approvals}
            </p>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Pending Withdrawals</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
              {overview.pending_withdrawals.count}
            </p>
          </div>
        </div>
      </div>

      {/* Financial Health */}
      <div className="theme-panel">
        <h3 className="theme-heading mb-4 text-lg font-semibold">Financial Health</h3>
        
        {overview.current_platform_balance >= 0 ? (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">✓ Platform Balance is Positive</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
              +GH₵{overview.current_platform_balance.toFixed(2)}
            </p>
            <p className="text-xs text-green-700 dark:text-green-300 mt-2">
              The platform has sufficient funds to cover all pending withdrawals and operations.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">⚠ Platform Balance is Negative</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
              -GH₵{Math.abs(overview.current_platform_balance).toFixed(2)}
            </p>
            <p className="text-xs text-red-700 dark:text-red-300 mt-2">
              The platform is operating at a deficit. Immediate action may be needed.
            </p>
          </div>
        )}

        <div className="mt-6 space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Calculation:</strong> Total Donations Received - Total Withdrawn + Total Admin Allocations
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}
