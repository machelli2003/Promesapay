import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiAlertCircle, FiCheckCircle, FiLoader } from 'react-icons/fi';
import { disputesAPI } from '../../api/disputes';
import { transactionsAPI } from '../../api/transactions';
import { useToast } from '../../hooks/useToast';
import { formatCurrency } from '../../utils/formatters';
import AppButton from '../../components/ui/AppButton';

const DISPUTE_TYPES = [
  { value: 'unauthorized_transaction', label: 'Unauthorized Transaction' },
  { value: 'services_not_rendered', label: 'Services Not Rendered' },
  { value: 'incorrect_amount', label: 'Incorrect Amount' },
  { value: 'duplicate_charge', label: 'Duplicate Charge' },
  { value: 'billing_error', label: 'Billing Error' },
  { value: 'other', label: 'Other' }
];

export default function ReportDispute() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [step, setStep] = useState(1); // 1: Select transaction, 2: Report details, 3: Confirmation
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  const [formData, setFormData] = useState({
    transaction_id: '',
    dispute_type: '',
    reason: ''
  });
  
  const [submitted, setSubmitted] = useState(false);
  const [disputeId, setDisputeId] = useState(null);

  // Fetch user's transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const response = await transactionsAPI.getUserTransactions(1, 50);
        setTransactions(response.data.transactions || []);
      } catch (error) {
        addToast('Failed to load transactions', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (step === 1) {
      fetchTransactions();
    }
  }, [step, addToast]);

  const handleSelectTransaction = (txn) => {
    setSelectedTransaction(txn);
    setFormData(prev => ({
      ...prev,
      transaction_id: txn._id || txn.id
    }));
    setStep(2);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.dispute_type) {
      addToast('Please select a dispute type', 'error');
      return;
    }

    if (formData.reason.trim().length < 10) {
      addToast('Reason must be at least 10 characters', 'error');
      return;
    }

    if (formData.reason.trim().length > 1000) {
      addToast('Reason cannot exceed 1000 characters', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await disputesAPI.reportDispute(formData);
      
      setDisputeId(response.data.dispute_id);
      setSubmitted(true);
      setStep(3);
      addToast('Dispute reported successfully', 'success');
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to report dispute', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToTransactions = () => {
    setStep(1);
    setSelectedTransaction(null);
    setFormData({
      transaction_id: '',
      dispute_type: '',
      reason: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => submitted ? navigate('/transactions') : navigate(-1)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <FiArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Report a Dispute</h1>
              <p className="text-slate-400">Step {step} of 3</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Step Indicator */}
        <div className="mb-8 flex gap-4">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex-1">
              <div className={`h-2 rounded-full transition-colors ${
                step >= num ? 'bg-blue-500' : 'bg-slate-700'
              }`} />
              <p className="text-sm mt-2 text-slate-400">
                {num === 1 && 'Select Transaction'}
                {num === 2 && 'Report Details'}
                {num === 3 && 'Confirmation'}
              </p>
            </div>
          ))}
        </div>

        {/* Step 1: Select Transaction */}
        {step === 1 && !submitted && (
          <div className="space-y-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <FiAlertCircle className="text-amber-500 flex-shrink-0" size={20} />
                <p className="text-sm text-slate-300">
                  Select a transaction to report a dispute about. You can only dispute transactions you were part of.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <FiLoader className="animate-spin" size={32} />
              </div>
            ) : transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((txn) => (
                  <button
                    key={txn._id || txn.id}
                    onClick={() => handleSelectTransaction(txn)}
                    className="w-full p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-left transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {txn.type === 'donation' ? 'Donation' : 'Doll'} - ${(txn.amount || 0).toFixed(2)}
                        </p>
                        <p className="text-sm text-slate-400 mt-1">
                          {txn.description || 'No description'}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          {new Date(txn.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        txn.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                        txn.status === 'pending' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-slate-600/20 text-slate-300'
                      }`}>
                        {txn.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FiAlertCircle size={48} className="mx-auto text-slate-500 mb-4" />
                <p className="text-slate-400">No transactions found</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Report Details */}
        {step === 2 && !submitted && (
          <div className="space-y-6">
            {/* Selected Transaction Summary */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-2">Selected Transaction:</p>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">
                    ${(selectedTransaction?.amount || 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-slate-400">
                    {new Date(selectedTransaction?.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={handleBackToTransactions}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Change
                </button>
              </div>
            </div>

            {/* Dispute Form */}
            <form onSubmit={handleSubmitReport} className="space-y-6">
              {/* Dispute Type */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Dispute Type <span className="text-red-400">*</span>
                </label>
                <select
                  name="dispute_type"
                  value={formData.dispute_type}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a reason for your dispute...</option>
                  {DISPUTE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Explain Your Dispute <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleFormChange}
                  placeholder="Please provide detailed information about your dispute (10-1000 characters)..."
                  maxLength={1000}
                  rows={6}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
                <p className="text-sm text-slate-400 mt-2">
                  {formData.reason.length}/1000 characters
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleBackToTransactions}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                >
                  Back
                </button>
                <AppButton
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Submitting...' : 'Review & Submit'}
                </AppButton>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && submitted && (
          <div className="space-y-6">
            {/* Success Message */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center">
              <FiCheckCircle size={48} className="mx-auto text-green-400 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Dispute Submitted Successfully</h2>
              <p className="text-slate-300 mb-4">
                Our team will review your dispute and get back to you within 48 hours.
              </p>
              <div className="bg-slate-800 rounded p-4 mb-4">
                <p className="text-sm text-slate-400">Dispute ID:</p>
                <p className="font-mono text-lg">{disputeId}</p>
              </div>
            </div>

            {/* What Happens Next */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="font-bold mb-4">What Happens Next?</h3>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs">1</span>
                  <span>Our support team will review your dispute</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs">2</span>
                  <span>You'll receive email updates on the status</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs">3</span>
                  <span>If approved, a refund will be issued to your wallet</span>
                </li>
              </ol>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <AppButton
                onClick={() => navigate('/transactions')}
                className="flex-1"
              >
                View Transactions
              </AppButton>
              <AppButton
                onClick={() => navigate('/disputes/my-disputes')}
                variant="secondary"
                className="flex-1"
              >
                View My Disputes
              </AppButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
