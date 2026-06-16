import { useState, useEffect } from 'react';
import { getReceipts, resendReceipt, downloadReceiptPDF } from '../../api/receipts';
import { MessageBox, LoadingSpinner, Button } from '../ui';
import { FiMail, FiDownload } from 'react-icons/fi';

export default function TransactionHistory() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [receiptType, setReceiptType] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    loadReceipts();
  }, [receiptType, page]);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      const params = { page, per_page: 10 };
      if (receiptType) {
        params.type = receiptType;
      }
      
      const response = await getReceipts(params);
      setReceipts(response.data?.receipts || []);
      setPagination(response.data?.pagination);
      setError('');
    } catch (err) {
      setError('Failed to load transaction history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendReceipt = async (receiptId) => {
    try {
      await resendReceipt(receiptId);
      setSuccess('Receipt email sent successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend receipt');
    }
  };

  const handleDownloadReceipt = async (receiptId) => {
    try {
      await downloadReceiptPDF(receiptId);
      setSuccess('Download started');
    } catch (err) {
      setError('PDF download not yet available');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="theme-panel">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="theme-heading text-xl font-semibold">Transaction History</h2>
        <select
          value={receiptType}
          onChange={(e) => {
            setReceiptType(e.target.value);
            setPage(1);
          }}
          className="theme-input w-auto min-w-[180px]"
        >
          <option value="">All Transactions</option>
          <option value="payment">Payments Sent</option>
          <option value="income">Income Received</option>
        </select>
      </div>

      {error && <MessageBox type="error" message={error} />}
      {success && <MessageBox type="success" message={success} />}

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {receipts.length === 0 ? (
          <p className="theme-card-muted py-8">No transactions found</p>
        ) : (
          receipts.map((receipt) => (
            <div key={receipt._id} className="theme-card flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="theme-heading mb-1 font-semibold">#{receipt.receipt_number}</p>
                <div className="theme-muted mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 sm:gap-4">
                  <div>
                    <p style={{ margin: 0, marginBottom: '0.25rem' }}>
                      <strong>From:</strong> {receipt.payer_name}
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>Type:</strong> {receipt.transaction_type}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: 0, marginBottom: '0.25rem' }}>
                      <strong>Date:</strong> {new Date(receipt.created_at).toLocaleDateString()}
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>Amount:</strong> {receipt.currency} {receipt.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Button
                  type="button"
                  onClick={() => handleResendReceipt(receipt._id)}
                  title="Resend receipt email"
                  className="rounded bg-sky-100 px-3 py-1.5 text-xs font-medium text-sky-800 hover:bg-sky-200 dark:bg-sky-900/40 dark:text-sky-200"
                >
                  <FiMail size={14} className="inline mr-1" /> Resend
                </Button>
                <Button
                  type="button"
                  onClick={() => handleDownloadReceipt(receipt._id)}
                  title="Download PDF receipt"
                  className="rounded bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-200"
                >
                  <FiDownload size={14} className="inline mr-1" /> PDF
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <Button
            type="button"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="theme-tab disabled:opacity-50"
          >
            Previous
          </Button>
          <span className="theme-muted self-center px-3 text-sm">
            Page {page} of {pagination.pages}
          </span>
          <Button
            type="button"
            disabled={page === pagination.pages}
            onClick={() => setPage(page + 1)}
            className="theme-tab disabled:opacity-50"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
