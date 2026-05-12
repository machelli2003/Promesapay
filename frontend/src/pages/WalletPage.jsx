import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getWalletBalance, getWalletTransactions } from '../api/wallet';
import AppButton from '../components/ui/AppButton';
import AppCard from '../components/ui/AppCard';
import Loading from '../components/common/Loading';
import EmptyState from '../components/ui/EmptyState';
import { formatCurrency } from '../utils/formatters';

const WalletPage = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const [balanceData, transactionsData] = await Promise.all([
        getWalletBalance(),
        getWalletTransactions()
      ]);
      setBalance(balanceData);
      setTransactions(transactionsData.transactions);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!balance || balance.wallet_balance < 50) {
      alert('Minimum withdrawal amount is 50 GHC');
      return;
    }

    setWithdrawing(true);
    try {
      // This would integrate with withdrawal API
      alert('Withdrawal feature coming soon! Contact support for manual withdrawal.');
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Wallet</h1>
        <p className="text-gray-600">Manage your earnings and withdrawals</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <AppCard className="text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Available Balance</h3>
          <p className="text-3xl font-bold text-green-600">
            {formatCurrency(balance?.wallet_balance || 0)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Ready for withdrawal</p>
        </AppCard>

        <AppCard className="text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Earned</h3>
          <p className="text-3xl font-bold text-blue-600">
            {formatCurrency(balance?.total_earned || 0)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Lifetime earnings</p>
        </AppCard>

        <AppCard className="text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Supporters</h3>
          <p className="text-3xl font-bold text-purple-600">
            {balance?.total_donations || 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">People who supported you</p>
        </AppCard>
      </div>

      {/* Withdrawal Section */}
      <AppCard className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Withdraw Funds</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 mb-2">
              Minimum withdrawal: <span className="font-semibold">50 GHC</span>
            </p>
            <p className="text-sm text-gray-500">
              Processing time: 3-5 business days
            </p>
          </div>
          <AppButton
            onClick={handleWithdraw}
            disabled={!balance || balance.wallet_balance < 50 || withdrawing}
            className="px-6 py-2"
          >
            {withdrawing ? 'Processing...' : 'Request Withdrawal'}
          </AppButton>
        </div>
      </AppCard>

      {/* Transaction History */}
      <AppCard>
        <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
        {transactions.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            description="Your transaction history will appear here once you start receiving donations."
            icon="💰"
          />
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-gray-500">{transaction.date}</p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-sm text-gray-500">{transaction.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </AppCard>
    </div>
  );
};

export default WalletPage;