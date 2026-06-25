import { useState, useEffect } from 'react';
import { getRefunds, requestRefund } from '../../api/refunds';
import { getDonations } from '../../api/donations';
import { getCoffees } from '../../api/coffee';
import { MessageBox, LoadingSpinner, Button } from '../ui';

export default function RefundManager() {
  const [refunds, setRefunds] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    transaction_id: '',
    transaction_type: '',
    reason: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const refundsRes = await getRefunds();
      setRefunds(refundsRes.data?.refunds || []);
      
      // Load available transactions for refund
      try {
        const [donationsRes, coffeesRes] = await Promise.all([
          getDonations(),
          getCoffees()
        ]);
        
        const all = [
          ...(donationsRes.data?.donations || []).map(d => ({ ...d, type: 'donation' })),
          ...(coffeesRes.data?.coffees || []).map(c => ({ ...c, type: 'doll' }))
        ];
        
        // Filter only successful transactions within 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        setTransactions(all.filter(t => 
          t.status === 'success' && new Date(t.created_at) > thirtyDaysAgo
        ));
      } catch (err) {
        console.error('Error loading transactions:', err);
      }
      
      setError('');
    } catch (err) {
      setError('Failed to load refund data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRefund = async (e) => {
    e.preventDefault();
    try {
      setError('');
      
      if (!formData.transaction_id || !formData.transaction_type) {
        setError('Please select a transaction');
        return;
      }
      
      if (!formData.reason) {
        setError('Please provide a reason for refund');
        return;
      }
      
      await requestRefund(formData);
      setSuccess('Refund request submitted successfully');
      setFormData({ transaction_id: '', transaction_type: '', reason: '' });
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request refund');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#fbbf24',
      approved: '#60a5fa',
      processing: '#8b5cf6',
      completed: '#10b981',
      rejected: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="theme-panel">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="theme-heading text-xl font-semibold">Refunds</h2>
        <Button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 dark:bg-sky-500"
        >
          {showForm ? 'Cancel' : 'Request Refund'}
        </Button>
      </div>

      {error && <MessageBox type="error" message={error} />}
      {success && <MessageBox type="success" message={success} />}

      {showForm && (
        <form onSubmit={handleRequestRefund} className="theme-form">
          <div className="mb-4">
            <label className="theme-label">Select Transaction</label>
            <select
              value={formData.transaction_id ? `${formData.transaction_id}:${formData.transaction_type}` : ''}
              onChange={(e) => {
                const [txId, type] = e.target.value.split(':');
                setFormData({ ...formData, transaction_id: txId, transaction_type: type });
              }}
              className="theme-input"
            >
              <option value="">Select a transaction to refund</option>
              {transactions.map((tx) => (
                <option key={`${tx._id}:${tx.type}`} value={`${tx._id}:${tx.type}`}>
                  {tx.type === 'doll' ? 'DOLL' : tx.type.toUpperCase()} - GH₵{tx.amount.toFixed(2)} ({new Date(tx.created_at).toLocaleDateString()})
                </option>
              ))}
            </select>
            {transactions.length === 0 && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                No eligible transactions for refund (must be successful and within 30 days)
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="theme-label">Reason for Refund</label>
            <textarea
              placeholder="Please explain why you're requesting this refund..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="theme-input min-h-[100px]"
            />
          </div>

          <Button
            type="submit"
            className="w-full rounded-md bg-red-600 px-6 py-3 text-sm font-medium text-white hover:bg-red-700"
          >
            Submit Refund Request
          </Button>
        </form>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        <h3 className="theme-heading mb-4 text-lg font-semibold">Refund Requests</h3>

        {refunds.length === 0 ? (
          <p className="theme-card-muted py-8">No refund requests</p>
        ) : (
          <div className="grid gap-3">
            {refunds.map((refund) => (
              <div key={refund._id} className="theme-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="theme-heading font-semibold">
                      GH₵{refund.refund_amount.toFixed(2)} - {refund.transaction_type === 'doll' ? 'DOLL' : refund.transaction_type.toUpperCase()}
                    </p>
                    <p className="theme-muted text-sm">
                      {new Date(refund.created_at).toLocaleDateString()} • {refund.reason}
                    </p>
                  </div>
                  <span
                    className="whitespace-nowrap rounded px-3 py-1 text-xs font-semibold capitalize"
                    style={{
                      background: `${getStatusColor(refund.status)}20`,
                      color: getStatusColor(refund.status),
                    }}
                  >
                    {refund.status}
                  </span>
                </div>
                {refund.notes && (
                  <p className="theme-muted mt-2 text-xs italic">
                    <strong>Admin Notes:</strong> {refund.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
