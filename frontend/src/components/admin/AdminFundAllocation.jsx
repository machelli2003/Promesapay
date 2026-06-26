import { useState, useEffect } from 'react';
import { allocateFundsToUser, getFundAllocations } from '../../api/adminPayments';
import { MessageBox, LoadingSpinner, Button } from '../ui';

export default function AdminFundAllocation() {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    user_id: '',
    amount: '',
    reason: '',
  });
  const [userSearch, setUserSearch] = useState('');
  const [allocationsLoading, setAllocationsLoading] = useState(true);

  useEffect(() => {
    loadAllocations();
  }, []);

  const loadAllocations = async () => {
    try {
      setAllocationsLoading(true);
      const response = await getFundAllocations({ per_page: 50 });
      setAllocations(response.data?.allocations || []);
    } catch (err) {
      setError('Failed to load allocations');
      console.error(err);
    } finally {
      setAllocationsLoading(false);
    }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    try {
      setError('');

      if (!formData.user_id.trim()) {
        setError('User ID is required');
        return;
      }

      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        setError('Amount must be greater than 0');
        return;
      }

      if (!formData.reason.trim()) {
        setError('Reason for allocation is required');
        return;
      }

      setLoading(true);
      await allocateFundsToUser({
        user_id: formData.user_id,
        amount: parseFloat(formData.amount),
        reason: formData.reason,
      });

      setSuccess(`Successfully allocated GH₵${parseFloat(formData.amount).toFixed(2)} to user`);
      setFormData({ user_id: '', amount: '', reason: '' });
      await loadAllocations();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to allocate funds');
    } finally {
      setLoading(false);
    }
  };

  const filteredAllocations = allocations.filter(a =>
    userSearch === '' ||
    (a.user_email && a.user_email.toLowerCase().includes(userSearch.toLowerCase())) ||
    (a.user_name && a.user_name.toLowerCase().includes(userSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Allocation Form */}
      <div className="theme-panel">
        <h2 className="theme-heading mb-6 text-xl font-semibold">Allocate Funds to User</h2>

        {error && <MessageBox type="error" message={error} />}
        {success && <MessageBox type="success" message={success} />}

        <form onSubmit={handleAllocate} className="theme-form space-y-4">
          <div>
            <label className="theme-label">User ID or Email</label>
            <input
              type="text"
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              placeholder="Enter user ID or email"
              className="theme-input"
            />
            <p className="theme-muted text-xs mt-1">Enter the MongoDB user ID or email address</p>
          </div>

          <div>
            <label className="theme-label">Amount (GH₵)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              className="theme-input"
            />
          </div>

          <div>
            <label className="theme-label">Reason for Allocation</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Why are you allocating these funds? (e.g., Promotional bonus, refund, correction, etc.)"
              className="theme-input min-h-[100px]"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Allocate Funds'}
          </Button>
        </form>
      </div>

      {/* Allocation History */}
      <div className="theme-panel">
        <div className="mb-6">
          <h2 className="theme-heading mb-4 text-xl font-semibold">Allocation History</h2>

          <input
            type="text"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Search by user email or name..."
            className="theme-input"
          />
        </div>

        {allocationsLoading ? (
          <LoadingSpinner />
        ) : filteredAllocations.length === 0 ? (
          <p className="theme-card-muted py-8">No allocations found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left font-semibold">User</th>
                  <th className="px-4 py-3 text-left font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold">Reason</th>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredAllocations.map((alloc) => (
                  <tr key={alloc._id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold">{alloc.user_name || alloc.user_email}</p>
                        <p className="theme-muted text-xs">{alloc.user_email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                      +GH₵{alloc.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm">{alloc.metadata?.reason || alloc.description}</p>
                    </td>
                    <td className="px-4 py-3 theme-muted text-xs">
                      {new Date(alloc.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
