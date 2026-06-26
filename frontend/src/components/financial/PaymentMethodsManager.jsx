import { useState, useEffect } from 'react';
import { getPaymentMethods, addPaymentMethod, deletePaymentMethod, updatePaymentMethod } from '../../api/paymentMethods';
import { MessageBox, LoadingSpinner, Button } from '../ui';

export default function PaymentMethodsManager() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    method_type: 'bank_transfer',
    provider: 'paystack',
    account_info: {}
  });

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await getPaymentMethods();
      setMethods(response.data || []);
      setError('');
    } catch (err) {
      setError('Failed to load payment methods');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMethod = async (e) => {
    e.preventDefault();
    try {
      setError('');
      
      // Validate based on method type
      const { method_type, account_info } = formData;
      let required = [];
      
      if (method_type === 'bank_transfer') {
        required = ['bank_name', 'account_number', 'account_name', 'bank_code'];
      } else if (method_type === 'mobile_money') {
        required = ['phone', 'provider'];
      } else if (method_type === 'paypal') {
        required = ['email'];
      } else if (method_type === 'crypto') {
        required = ['wallet_address', 'currency'];
      }
      
      for (const field of required) {
        if (!account_info[field]) {
          setError(`Missing required field: ${field}`);
          return;
        }
      }
      
      await addPaymentMethod(formData);
      setSuccess('Payment method added successfully! It will be reviewed by admin before approval.');
      setFormData({
        method_type: 'bank_transfer',
        provider: 'paystack',
        account_info: {}
      });
      setShowForm(false);
      await loadPaymentMethods();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add payment method');
    }
  };

  const handleDeleteMethod = async (methodId) => {
    if (window.confirm('Are you sure? You cannot delete your only payment method.')) {
      try {
        await deletePaymentMethod(methodId);
        setSuccess('Payment method deleted');
        await loadPaymentMethods();
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete payment method');
      }
    }
  };

  const handleSetDefault = async (methodId) => {
    try {
      await updatePaymentMethod(methodId, { is_default: true });
      setSuccess('Payment method set as default');
      await loadPaymentMethods();
    } catch (err) {
      setError('Failed to set default payment method');
    }
  };

  const renderAccountInfo = (method) => {
    const { method_type, account_info } = method;
    
    if (method_type === 'bank_transfer') {
      const bankCode = account_info.bank_code ? ` / ${account_info.bank_code}` : '';
      return `${account_info.account_name} - ${account_info.account_number} (${account_info.bank_name}${bankCode})`;
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

  return (
    <div className="theme-panel">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="theme-heading text-xl font-semibold">Payment Methods</h2>
        <Button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 dark:bg-sky-500"
        >
          {showForm ? 'Cancel' : 'Add Method'}
        </Button>
      </div>

      {error && <MessageBox type="error" message={error} />}
      {success && <MessageBox type="success" message={success} />}

      {showForm && (
        <form onSubmit={handleAddMethod} className="theme-form">
          <div className="mb-4">
            <label className="theme-label">
              Payment Method Type
            </label>
            <select 
              value={formData.method_type}
              onChange={(e) => setFormData({
                ...formData, 
                method_type: e.target.value,
                account_info: {}
              })}
              className="theme-input"
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="paypal">PayPal</option>
              <option value="crypto">Cryptocurrency</option>
            </select>
          </div>

          {formData.method_type === 'bank_transfer' && (
            <>
              <input 
                type="text" placeholder="Bank Name" 
                onChange={(e) => setFormData({
                  ...formData,
                  account_info: { ...formData.account_info, bank_name: e.target.value }
                })}
                className="theme-input mb-3"
              />
              <input 
                type="text" placeholder="Account Number" 
                onChange={(e) => setFormData({
                  ...formData,
                  account_info: { ...formData.account_info, account_number: e.target.value }
                })}
                className="theme-input mb-3"
              />
              <input 
                type="text" placeholder="Account Name" 
                onChange={(e) => setFormData({
                  ...formData,
                  account_info: { ...formData.account_info, account_name: e.target.value }
                })}
                className="theme-input mb-3"
              />
              <input 
                type="text" placeholder="Bank Code (e.g. 058)" 
                onChange={(e) => setFormData({
                  ...formData,
                  account_info: { ...formData.account_info, bank_code: e.target.value }
                })}
                className="theme-input mb-3"
              />
            </>
          )}

          {formData.method_type === 'mobile_money' && (
            <>
              <input 
                type="tel" placeholder="Phone Number" 
                onChange={(e) => setFormData({
                  ...formData,
                  account_info: { ...formData.account_info, phone: e.target.value }
                })}
                className="theme-input mb-3"
              />
              <select 
                onChange={(e) => setFormData({
                  ...formData,
                  account_info: { ...formData.account_info, provider: e.target.value }
                })}
                className="theme-input mb-3"
              >
                <option value="">Select Provider</option>
                <option value="mtn">MTN Mobile Money</option>
                <option value="airtel">Airtel Money</option>
                <option value="vodafone">Vodafone Cash</option>
              </select>
            </>
          )}

          {formData.method_type === 'paypal' && (
            <input 
              type="email" placeholder="PayPal Email" 
              onChange={(e) => setFormData({
                ...formData,
                account_info: { ...formData.account_info, email: e.target.value }
              })}
              style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
            />
          )}

          {formData.method_type === 'crypto' && (
            <>
              <input 
                type="text" placeholder="Wallet Address" 
                onChange={(e) => setFormData({
                  ...formData,
                  account_info: { ...formData.account_info, wallet_address: e.target.value }
                })}
                className="theme-input mb-3"
              />
              <select 
                onChange={(e) => setFormData({
                  ...formData,
                  account_info: { ...formData.account_info, currency: e.target.value }
                })}
                className="theme-input mb-3"
              >
                <option value="">Select Currency</option>
                <option value="BTC">Bitcoin</option>
                <option value="ETH">Ethereum</option>
                <option value="USDC">USDC</option>
              </select>
            </>
          )}

          <Button
            type="submit"
            className="w-full rounded-md bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Add Payment Method
          </Button>
        </form>
      )}

      <div style={{ display: 'grid', gap: '1rem' }}>
        {methods.length === 0 ? (
          <p className="theme-card-muted py-8">
            No payment methods added yet
          </p>
        ) : (
          methods.map((method) => (
            <div
              key={method._id}
              className={`theme-card flex flex-wrap items-center justify-between gap-3 ${
                method.is_default ? 'ring-2 ring-sky-500 dark:ring-sky-400' : ''
              }`}
            >
              <div>
                <p className="theme-heading mb-1 font-semibold capitalize">
                  {method.method_type.replace('_', ' ')}
                </p>
                <p className="theme-muted text-sm">{renderAccountInfo(method)}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {method.is_default && (
                    <span className="inline-block rounded bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800 dark:bg-sky-900/40 dark:text-sky-200">
                      Default
                    </span>
                  )}
                  {method.approval_status === 'pending' && (
                    <span className="inline-block rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200">
                      ⏳ Pending Approval
                    </span>
                  )}
                  {method.approval_status === 'approved' && (
                    <span className="inline-block rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-200">
                      ✓ Approved
                    </span>
                  )}
                  {method.approval_status === 'rejected' && (
                    <span className="inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/40 dark:text-red-200">
                      ✗ Rejected
                    </span>
                  )}
                </div>
                {method.approval_status === 'rejected' && method.rejection_reason && (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                    Reason: {method.rejection_reason}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {!method.is_default && (
                  <Button
                    type="button"
                    onClick={() => handleSetDefault(method._id)}
                    className="rounded border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                  >
                    Set Default
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={() => handleDeleteMethod(method._id)}
                  className="rounded bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 dark:bg-red-950/50 dark:text-red-300"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
