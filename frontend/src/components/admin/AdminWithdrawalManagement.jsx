import { useState, useEffect } from 'react';
import { getPendingWithdrawals, getAllWithdrawals, approveWithdrawal, rejectWithdrawal, completeWithdrawal } from '../../api/adminPayments';
import { MessageBox, LoadingSpinner, Button } from '../ui';

const STATUS_CLASS = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
};

export default function AdminWithdrawalManagement() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('pending'); // pending | approved | completed | rejected | all
  const [showModal, setShowModal] = useState(null); // 'approve' | 'reject' | 'complete' | null
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [modalData, setModalData] = useState({
    reason: '',
    notes: '',
    transactionId: '',
  });

  useEffect(() => {
    loadWithdrawals();
  }, [filter]);

  const loadWithdrawals = async () => {
    try {
      setLoading(true);
      let response;
      if (filter === 'pending') {
        response = await getPendingWithdrawals();
      } else if (filter === 'all') {
        response = await getAllWithdrawals();
      } else {
        response = await getAllWithdrawals({ status: filter });
      }
      setWithdrawals(response.data?.withdrawals || []);
      setError('');
    } catch (err) {
      setError('Failed to load withdrawals');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowModal(type);
    setModalData({ reason: '', notes: '', transactionId: '' });
  };

  const handleApprove = async () => {
    try {
      await approveWithdrawal(selectedWithdrawal._id, { notes: modalData.notes });
      setSuccess('Withdrawal approved successfully');
      setShowModal(null);
      await loadWithdrawals();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve withdrawal');
    }
  };

  const handleReject = async () => {
    if (!modalData.reason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    try {
      await rejectWithdrawal(selectedWithdrawal._id, { rejection_reason: modalData.reason });
      setSuccess('Withdrawal rejected successfully');
      setShowModal(null);
      await loadWithdrawals();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject withdrawal');
    }
  };

  const handleComplete = async () => {
    try {
      await completeWithdrawal(selectedWithdrawal._id, { transaction_id: modalData.transactionId });
      setSuccess('Withdrawal marked as completed');
      setShowModal(null);
      await loadWithdrawals();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete withdrawal');
    }
  };

  if (loading) return <LoadingSpinner />;

  const filteredWithdrawals = filter === 'all'
    ? withdrawals
    : withdrawals.filter(w => w.status === filter);

  return (
    <div className="theme-panel">
      <div className="mb-6">
        <h2 className="theme-heading mb-4 text-xl font-semibold">Withdrawal Management</h2>

        <div className="mb-4 flex flex-wrap gap-2">
          {['pending', 'approved', 'completed', 'rejected', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`rounded px-4 py-2 text-sm font-medium capitalize ${
                filter === status
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {error && <MessageBox type="error" message={error} />}
      {success && <MessageBox type="success" message={success} />}

      <div className="grid gap-4">
        {filteredWithdrawals.length === 0 ? (
          <p className="theme-card-muted py-8">No withdrawals to display</p>
        ) : (
          filteredWithdrawals.map((withdrawal) => (
            <div key={withdrawal._id} className="theme-card flex flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="theme-heading font-semibold">GH₵{withdrawal.amount.toFixed(2)}</p>
                  <p className="theme-muted text-sm">{withdrawal.user_name || withdrawal.user_email}</p>
                  <p className="theme-muted text-xs mt-2">{withdrawal.user_email}</p>
                </div>
                <span className={`rounded px-3 py-1 text-xs font-semibold capitalize ${STATUS_CLASS[withdrawal.status]}`}>
                  {withdrawal.status}
                </span>
              </div>

              {withdrawal.reason && (
                <p className="theme-muted text-sm">
                  <strong>Reason:</strong> {withdrawal.reason}
                </p>
              )}

              {withdrawal.rejection_reason && (
                <div className="rounded bg-red-100 p-3 dark:bg-red-900/40">
                  <p className="text-sm text-red-700 dark:text-red-200">
                    <strong>Rejection reason:</strong> {withdrawal.rejection_reason}
                  </p>
                </div>
              )}

              <p className="text-xs text-gray-500">
                Requested: {new Date(withdrawal.created_at).toLocaleDateString()} • {new Date(withdrawal.created_at).toLocaleTimeString()}
              </p>

              <div className="flex flex-wrap gap-2">
                {withdrawal.status === 'pending' && (
                  <>
                    <Button
                      type="button"
                      onClick={() => openModal('approve', withdrawal)}
                      className="flex-1 rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                      ✓ Approve
                    </Button>
                    <Button
                      type="button"
                      onClick={() => openModal('reject', withdrawal)}
                      className="flex-1 rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                    >
                      ✗ Reject
                    </Button>
                  </>
                )}
                {withdrawal.status === 'approved' && (
                  <Button
                    type="button"
                    onClick={() => openModal('complete', withdrawal)}
                    className="flex-1 rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    ✓ Mark as Completed
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Modal */}
      {showModal && selectedWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="theme-card max-w-md w-full mx-4 p-6">
            <h3 className="theme-heading mb-4 text-lg font-semibold">
              {showModal === 'approve' && 'Approve Withdrawal'}
              {showModal === 'reject' && 'Reject Withdrawal'}
              {showModal === 'complete' && 'Mark as Completed'}
            </h3>

            <p className="theme-muted mb-4">
              User: {selectedWithdrawal.user_email} • Amount: GH₵{selectedWithdrawal.amount.toFixed(2)}
            </p>

            {showModal === 'approve' && (
              <div className="mb-4">
                <label className="theme-label">Notes (Optional)</label>
                <textarea
                  value={modalData.notes}
                  onChange={(e) => setModalData({ ...modalData, notes: e.target.value })}
                  placeholder="Any notes for the user..."
                  className="theme-input min-h-[80px]"
                />
              </div>
            )}

            {showModal === 'reject' && (
              <div className="mb-4">
                <label className="theme-label">Rejection Reason</label>
                <textarea
                  value={modalData.reason}
                  onChange={(e) => setModalData({ ...modalData, reason: e.target.value })}
                  placeholder="Explain why this withdrawal is being rejected..."
                  className="theme-input min-h-[100px]"
                />
              </div>
            )}

            {showModal === 'complete' && (
              <div className="mb-4">
                <label className="theme-label">Transaction ID (Optional)</label>
                <input
                  type="text"
                  value={modalData.transactionId}
                  onChange={(e) => setModalData({ ...modalData, transactionId: e.target.value })}
                  placeholder="Payment provider transaction ID"
                  className="theme-input"
                />
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => setShowModal(null)}
                className="flex-1 rounded bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (showModal === 'approve') handleApprove();
                  else if (showModal === 'reject') handleReject();
                  else if (showModal === 'complete') handleComplete();
                }}
                className={`flex-1 rounded px-4 py-2 text-sm font-medium text-white ${
                  showModal === 'reject'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {showModal === 'approve' && 'Approve'}
                {showModal === 'reject' && 'Reject'}
                {showModal === 'complete' && 'Complete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
