import { useState, useEffect } from 'react';
import { getWalletBalance, getFinancialSummary, requestWithdrawal, getWithdrawals, cancelWithdrawal } from '../../api/wallet';
import { getPaymentMethods } from '../../api/paymentMethods';
import { MessageBox, LoadingSpinner, Button } from '../ui';

const STATUS_CLASS = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  cancelled: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

export default function WithdrawalManager() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    amount: '',
    payment_method_id: '',
    reason: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryRes, withdrawalsRes, methodsRes] = await Promise.all([
        getFinancialSummary(),
        getWithdrawals(),
        getPaymentMethods(),
      ]);

      setSummary(summaryRes.data);
      setWithdrawals(withdrawalsRes.data?.withdrawals || []);
      setMethods(methodsRes.data || []);
      setError('');
    } catch (err) {
      setError('Failed to load withdrawal data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestWithdrawal = async (e) => {
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

      if (summary && parseFloat(formData.amount) > summary.wallet_balance) {
        setError('Insufficient wallet balance');
        return;
      }

      const selectedMethod = methods.find(m => m._id === formData.payment_method_id);
      if (!selectedMethod) {
        setError('Payment method not found');
        return;
      }

      if (selectedMethod.approval_status !== 'approved') {
        setError(`Payment method must be approved first. Status: ${selectedMethod.approval_status}`);
        return;
      }

      await requestWithdrawal({
        amount: parseFloat(formData.amount),
        payment_method_id: formData.payment_method_id,
        reason: formData.reason,
      });
      setSuccess('Withdrawal request submitted successfully! Admin will review and process it shortly.');
      setFormData({ amount: '', payment_method_id: '', reason: '' });
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request withdrawal');
    }
  };

  const handleCancelWithdrawal = async (withdrawalId) => {
    if (window.confirm('Cancel this withdrawal request?')) {
      try {
        await cancelWithdrawal(withdrawalId);
        setSuccess('Withdrawal cancelled');
        await loadData();
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to cancel withdrawal');
      }
    }
  };

  // Get only approved payment methods
  const approvedMethods = methods.filter(m => m.approval_status === 'approved');

  if (loading) return <LoadingSpinner />;

  return (
    <div className="theme-panel">
      <div className="mb-6">
        <h2 className="theme-heading mb-4 text-xl font-semibold">Withdrawals</h2>

        {summary && (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="theme-card">
              <p className="theme-muted mb-2 text-sm">Wallet Balance</p>
              <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                GH₵{(summary.wallet_balance ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="theme-card">
              <p className="theme-muted mb-2 text-sm">Available to Withdraw</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                GH₵{(summary.available_for_withdrawal ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="theme-card">
              <p className="theme-muted mb-2 text-sm">Total Withdrawn</p>
              <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                GH₵{(summary.total_withdrawn ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="theme-card">
              <p className="theme-muted mb-2 text-sm">Pending Withdrawals</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {summary.pending_withdrawals?.count ?? 0}
              </p>
            </div>
          </div>
        )}

        {approvedMethods.length === 0 && (
          <div className="mb-4 rounded-md bg-amber-50 p-4 dark:bg-amber-900/20">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              ⓘ You need to add and get an approved payment method before you can withdraw funds. Please add a payment method and wait for admin approval.
            </p>
          </div>
        )}

        {approvedMethods.length > 0 && (
          <Button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="rounded-md bg-sky-600 px-6 py-3 text-sm font-medium text-white hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600"
          >
            {showForm ? 'Cancel' : 'Request Withdrawal'}
          </Button>
        )}
      </div>

      {error && <MessageBox type="error" message={error} />}
      {success && <MessageBox type="success" message={success} />}

      {showForm && approvedMethods.length > 0 && (
        <form onSubmit={handleRequestWithdrawal} className="theme-form">
          <div className="mb-4">
            <label className="theme-label">Amount (GH₵)</label>
            <input
              type="number"
              step="0.01"
              min="50"
              placeholder="Minimum: 50"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="theme-input"
            />
            {summary && (
              <p className="theme-muted mt-2 text-xs">
                Available: GH₵{summary.available_for_withdrawal.toFixed(2)}
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
              {approvedMethods.map((method) => (
                <option key={method._id} value={method._id}>
                  {method.method_type.replace('_', ' ')} {method.is_default ? '(Default)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="theme-label">Reason (Optional)</label>
            <textarea
              placeholder="Any reason for this withdrawal..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
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
        <h3 className="theme-heading mb-4 text-lg font-semibold">Withdrawal History</h3>

        {withdrawals.length === 0 ? (
          <p className="theme-card-muted py-8">No withdrawal requests yet</p>
        ) : (
          <div className="grid gap-3">
            {withdrawals.map((withdrawal) => (
              <div
                key={withdrawal._id}
                className="theme-card flex flex-col gap-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="theme-heading font-semibold">
                      GH₵{withdrawal.amount.toFixed(2)}
                    </p>
                    <p className="theme-muted text-sm">
                      {new Date(withdrawal.created_at).toLocaleDateString()} • {new Date(withdrawal.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <span
                    className={`rounded px-3 py-1 text-xs font-semibold capitalize ${
                      STATUS_CLASS[withdrawal.status] || STATUS_CLASS.cancelled
                    }`}
                  >
                    {withdrawal.status}
                  </span>
                </div>

                {withdrawal.reason && (
                  <p className="theme-muted text-sm">
                    <strong>Reason:</strong> {withdrawal.reason}
                  </p>
                )}

                {withdrawal.status === 'rejected' && withdrawal.rejection_reason && (
                  <p className="rounded bg-red-100 p-2 text-sm text-red-700 dark:bg-red-900/40 dark:text-red-200">
                    <strong>Rejection reason:</strong> {withdrawal.rejection_reason}
                  </p>
                )}

                {withdrawal.status === 'pending' && (
                  <Button
                    type="button"
                    onClick={() => handleCancelWithdrawal(withdrawal._id)}
                    className="self-start rounded bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 dark:bg-red-950/50 dark:text-red-300 dark:hover:bg-red-900/50"
                  >
                    Cancel Request
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
