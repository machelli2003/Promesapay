import { useState, useEffect } from 'react';
import { getPayouts, initiatePayouts, cancelPayout, getPayoutStats } from '../../api/payouts';
import { getPaymentMethods } from '../../api/paymentMethods';
import { MessageBox, LoadingSpinner, Button } from '../ui';

const STATUS_CLASS = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  cancelled: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

export default function WithdrawalManager() {
  const [payouts, setPayouts] = useState([]);
  const [stats, setStats] = useState(null);
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    amount: '',
    payment_method_id: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [payoutsRes, statsRes, methodsRes] = await Promise.all([
        getPayouts(),
        getPayoutStats(),
        getPaymentMethods(),
      ]);

      setPayouts(payoutsRes.data?.payouts || []);
      setStats(statsRes.data);
      setMethods(methodsRes.data || []);
      setError('');
    } catch (err) {
      setError('Failed to load withdrawal data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiatePayout = async (e) => {
    e.preventDefault();
    try {
      setError('');

      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      if (!formData.payment_method_id) {
        setError('Please select a payment method');
        return;
      }

      if (stats && parseFloat(formData.amount) > stats.wallet_balance) {
        setError('Insufficient wallet balance');
        return;
      }

      await initiatePayouts(formData);
      setSuccess('Withdrawal request submitted successfully');
      setFormData({ amount: '', payment_method_id: '', notes: '' });
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to initiate withdrawal');
    }
  };

  const handleCancelPayout = async (payoutId) => {
    if (window.confirm('Cancel this payout request?')) {
      try {
        await cancelPayout(payoutId);
        setSuccess('Payout cancelled');
        await loadData();
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to cancel payout');
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="theme-panel">
      <div className="mb-6">
        <h2 className="theme-heading mb-4 text-xl font-semibold">Withdrawals</h2>

        {stats && (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="theme-card">
              <p className="theme-muted mb-2 text-sm">Wallet Balance</p>
              <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                GH₵{(stats.wallet_balance ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="theme-card">
              <p className="theme-muted mb-2 text-sm">Total Earned</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                GH₵{(stats.total_earned ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="theme-card">
              <p className="theme-muted mb-2 text-sm">Total Withdrawn</p>
              <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                GH₵{(stats.total_withdrawn ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="theme-card">
              <p className="theme-muted mb-2 text-sm">Pending Payouts</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {stats.pending_payouts}
              </p>
            </div>
          </div>
        )}

        <Button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-sky-600 px-6 py-3 text-sm font-medium text-white hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600"
        >
          {showForm ? 'Cancel' : 'Request Withdrawal'}
        </Button>
      </div>

      {error && <MessageBox type="error" message={error} />}
      {success && <MessageBox type="success" message={success} />}

      {showForm && (
        <form onSubmit={handleInitiatePayout} className="theme-form">
          <div className="mb-4">
            <label className="theme-label">Amount (GH₵)</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="theme-input"
            />
            {stats && (
              <p className="theme-muted mt-2 text-xs">
                Available: GH₵{stats.wallet_balance.toFixed(2)}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="theme-label">Payment Method</label>
            <select
              value={formData.payment_method_id}
              onChange={(e) => setFormData({ ...formData, payment_method_id: e.target.value })}
              className="theme-input"
            >
              <option value="">Select a payment method</option>
              {methods.map((method) => (
                <option key={method._id} value={method._id}>
                  {method.method_type.replace('_', ' ')} - {method.is_default ? '(Default)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="theme-label">Notes (Optional)</label>
            <textarea
              placeholder="Any additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="theme-input min-h-[80px]"
            />
          </div>

          <Button
            type="submit"
            className="w-full rounded-md bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            Request Withdrawal
          </Button>
        </form>
      )}

      <div className="mt-6">
        <h3 className="theme-heading mb-4 text-lg font-semibold">Payout History</h3>

        {payouts.length === 0 ? (
          <p className="theme-card-muted py-8">No payouts yet</p>
        ) : (
          <div className="grid gap-3">
            {payouts.map((payout) => (
              <div
                key={payout._id}
                className="theme-card flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <p className="theme-heading font-semibold">
                    GH₵{payout.amount.toFixed(2)}
                  </p>
                  <p className="theme-muted text-sm">
                    {payout.payment_method_type.replace('_', ' ')} •{' '}
                    {new Date(payout.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded px-3 py-1 text-xs font-semibold capitalize ${
                      STATUS_CLASS[payout.status] || STATUS_CLASS.cancelled
                    }`}
                  >
                    {payout.status}
                  </span>
                  {payout.status === 'pending' && (
                    <Button
                      type="button"
                      onClick={() => handleCancelPayout(payout._id)}
                      className="rounded bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 dark:bg-red-950/50 dark:text-red-300 dark:hover:bg-red-900/50"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
