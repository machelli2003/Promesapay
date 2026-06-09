import WithdrawalManager from '../components/financial/WithdrawalManager';

export default function WalletPage() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Wallet</h1>
        <p className="text-gray-600">Request withdrawals and manage payout history.</p>
      </div>
      <WithdrawalManager />
    </div>
  );
}
