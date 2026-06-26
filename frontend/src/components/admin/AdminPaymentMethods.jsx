import { useState, useEffect } from 'react';
import { getPendingPaymentMethods, approvePaymentMethod, rejectPaymentMethod, getAllPaymentMethods } from '../../api/adminPayments';
import { MessageBox, LoadingSpinner, Button } from '../ui';

const STATUS_CLASS = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
};

export default function AdminPaymentMethods() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all'); // all | pending | approved | rejected
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');

  useEffect(() => {
    loadMethods();
  }, [filter]);

  const loadMethods = async () => {
    try {
      setLoading(true);
      const query = filter === 'all' ? {} : { status: filter };
      const response = await getAllPaymentMethods(query);
      setMethods(response.data?.methods || []);
      setError('');
    } catch (err) {
      setError('Failed to load payment methods');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (methodId) => {
    try {
      await approvePaymentMethod(methodId, { notes: approvalNotes });
      setSuccess('Payment method approved successfully');
      setApprovalNotes('');
      await loadMethods();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve payment method');
    }
  };

  const handleRejectClick = (method) => {
    setSelectedMethod(method);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    try {
      await rejectPaymentMethod(selectedMethod._id, { rejection_reason: rejectionReason });
      setSuccess('Payment method rejected');
      setShowRejectModal(false);
      setSelectedMethod(null);
      setRejectionReason('');
      await loadMethods();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject payment method');
    }
  };

  const renderAccountInfo = (method) => {
    const { method_type, account_info } = method;
    
    if (method_type === 'bank_transfer') {
      return `${account_info.account_name} - ${account_info.account_number} (${account_info.bank_name})`;
    } else if (method_type === 'mobile_money') {
      return `${account_info.phone} (${account_info.provider})`;
    } else if (method_type === 'paypal') {
      return account_info.email;
    } else if (method_type === 'crypto') {
      return `${account_info.wallet_address} (${account_info.currency})`;
    }
    return 'Unknown';
  };

  if (loading) return <LoadingSpinner />;

  const filteredMethods = filter === 'all' 
    ? methods 
    : methods.filter(m => m.approval_status === filter);

  return (
    <div className="theme-panel">
      <div className="mb-6">
        <h2 className="theme-heading mb-4 text-xl font-semibold">Payment Method Approvals</h2>

        <div className="mb-4 flex flex-wrap gap-2">
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
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
        {filteredMethods.length === 0 ? (
          <p className="theme-card-muted py-8">No payment methods to display</p>
        ) : (
          filteredMethods.map((method) => (
            <div key={method._id} className="theme-card flex flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="theme-heading font-semibold">{method.user_name || method.user_email}</p>
                  <p className="theme-muted text-sm">{method.user_email}</p>
                  <p className="text-sm font-semibold capitalize text-blue-600 dark:text-blue-400 mt-2">
                    {method.method_type.replace('_', ' ')}
                  </p>
                  <p className="theme-muted text-sm mt-1">{renderAccountInfo(method)}</p>
                </div>
                <span className={`rounded px-3 py-1 text-xs font-semibold capitalize ${STATUS_CLASS[method.approval_status]}`}>
                  {method.approval_status}
                </span>
              </div>

              {method.approval_status === 'rejected' && method.rejection_reason && (
                <div className="rounded bg-red-100 p-3 dark:bg-red-900/40">
                  <p className="text-sm text-red-700 dark:text-red-200">
                    <strong>Rejection reason:</strong> {method.rejection_reason}
                  </p>
                </div>
              )}

              <p className="text-xs text-gray-500">
                Submitted: {new Date(method.created_at).toLocaleDateString()} • {new Date(method.created_at).toLocaleTimeString()}
              </p>

              {method.approval_status === 'pending' && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => handleApprove(method._id)}
                    className="flex-1 rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    ✓ Approve
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleRejectClick(method)}
                    className="flex-1 rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    ✗ Reject
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="theme-card max-w-md w-full mx-4 p-6">
            <h3 className="theme-heading mb-4 text-lg font-semibold">
              Reject Payment Method
            </h3>
            <p className="theme-muted mb-4">
              Are you sure you want to reject this payment method for {selectedMethod.user_email}?
            </p>
            <div className="mb-4">
              <label className="theme-label">Rejection Reason</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this payment method is being rejected..."
                className="theme-input min-h-[100px]"
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="flex-1 rounded bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleReject}
                className="flex-1 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
