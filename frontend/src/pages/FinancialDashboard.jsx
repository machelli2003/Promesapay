import { useState } from 'react';
import { FiCreditCard, FiFileText, FiRefreshCw } from 'react-icons/fi';
import CediSign from '../components/common/CediSign';
import { useResponsive } from '../utils/responsiveUtils';
import { PaymentMethodsManager, WithdrawalManager, TransactionHistory, RefundManager } from '../components/financial';

export default function FinancialDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { isMobile } = useResponsive();

  const tabs = [
    { id: 'overview', label: 'Withdrawals & Payouts', icon: CediSign },
    { id: 'payment-methods', label: 'Payment Methods', icon: FiCreditCard },
    { id: 'history', label: 'Transaction History', icon: FiFileText },
    { id: 'refunds', label: 'Refunds', icon: FiRefreshCw },
  ];

  return (
    <div className={`theme-page ${isMobile ? 'px-4 py-6' : 'px-8 py-8'}`}>
      <div className="mx-auto max-w-6xl">
        <div className={`mb-6 sm:mb-8 ${isMobile ? 'text-center' : ''}`}>
          <h1 className={`theme-heading ${isMobile ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'} font-bold`}>
            Financial Dashboard
          </h1>
          <p className="theme-muted mt-1 text-sm">
            Manage your payments, withdrawals, and refunds
          </p>
        </div>

        <div className={`mb-4 sm:mb-6 flex gap-2 overflow-x-auto border-b border-slate-200 pb-4 dark:border-slate-700 ${isMobile ? '-mx-4 px-4' : ''}`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap text-xs sm:text-sm transition-colors ${
                activeTab === tab.id 
                  ? 'theme-tab theme-tab-active border-b-2 border-blue-600' 
                  : 'theme-tab text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {<tab.icon className="inline-block mr-1 sm:mr-2" />}
              <span className={isMobile ? 'hidden sm:inline' : ''}>{tab.label}</span>
              <span className={isMobile ? '' : 'hidden'}>{<tab.icon />}</span>
            </button>
          ))}
        </div>

        <div className={isMobile ? 'overflow-hidden' : ''}>
          {activeTab === 'overview' && <WithdrawalManager />}
          {activeTab === 'payment-methods' && <PaymentMethodsManager />}
          {activeTab === 'history' && <TransactionHistory />}
          {activeTab === 'refunds' && <RefundManager />}
        </div>
      </div>
    </div>
  );
}
