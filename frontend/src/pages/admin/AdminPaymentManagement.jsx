import { useState } from 'react';
import AdminPaymentMethods from '../../components/admin/AdminPaymentMethods';
import AdminWithdrawalManagement from '../../components/admin/AdminWithdrawalManagement';
import AdminFundAllocation from '../../components/admin/AdminFundAllocation';
import AdminFinancialOverview from '../../components/admin/AdminFinancialOverview';

const TABS = {
  OVERVIEW: 'overview',
  PAYMENT_METHODS: 'payment_methods',
  WITHDRAWALS: 'withdrawals',
  FUND_ALLOCATION: 'fund_allocation',
};

export default function AdminPaymentManagement() {
  const [activeTab, setActiveTab] = useState(TABS.OVERVIEW);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Payment Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage payment methods, withdrawals, fund allocations, and financial overview
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8 flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800">
        {[
          { key: TABS.OVERVIEW, label: '📊 Financial Overview' },
          { key: TABS.PAYMENT_METHODS, label: '💳 Payment Methods' },
          { key: TABS.WITHDRAWALS, label: '💰 Withdrawals' },
          { key: TABS.FUND_ALLOCATION, label: '➕ Fund Allocation' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === key
                ? 'border-b-2 border-sky-600 text-sky-600 dark:text-sky-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === TABS.OVERVIEW && <AdminFinancialOverview />}
        {activeTab === TABS.PAYMENT_METHODS && <AdminPaymentMethods />}
        {activeTab === TABS.WITHDRAWALS && <AdminWithdrawalManagement />}
        {activeTab === TABS.FUND_ALLOCATION && <AdminFundAllocation />}
      </div>
    </div>
  );
}
