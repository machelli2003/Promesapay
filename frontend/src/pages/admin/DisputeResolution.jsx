import { useState, useEffect } from 'react';
import { FiLoader, FiAlertCircle, FiCheckCircle, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { adminAPI } from '../../api/admin';
import { disputesAPI } from '../../api/disputes';
import { useToast } from '../../hooks/useToast';
import { formatCurrency } from '../../utils/formatters';
import AppButton from '../../components/ui/AppButton';

const STATUS_CONFIG = {
  open: { color: 'bg-red-500/20 text-red-300 border-red-500/20', label: 'Open' },
  under_review: { color: 'bg-amber-500/20 text-amber-300 border-amber-500/20', label: 'Under Review' },
  resolved: { color: 'bg-blue-500/20 text-blue-300 border-blue-500/20', label: 'Resolved' },
  rejected: { color: 'bg-slate-500/20 text-slate-300 border-slate-500/20', label: 'Rejected' },
  refunded: { color: 'bg-green-500/20 text-green-300 border-green-500/20', label: 'Refunded' }
};

const DISPUTE_STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'refunded', label: 'Refunded' }
];

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'bg-green-500/20 text-green-300' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-500/20 text-amber-300' },
  { value: 'high', label: 'High', color: 'bg-red-500/20 text-red-300' }
];

export default function DisputeResolution() {
  const { addToast } = useToast();
  
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDisputes, setTotalDisputes] = useState(0);
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  const [stats, setStats] = useState(null);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const [refundForm, setRefundForm] = useState({ amount: '' });
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: '', notes: '' });
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Fetch disputes list
  const fetchDisputes = async (page = 1) => {
    try {
      setLoading(true);
      const response = await disputesAPI.getAllDisputes(page, 20, statusFilter, priorityFilter);
      setDisputes(response.data.disputes || []);
      setCurrentPage(response.data.page || 1);
      setTotalPages(response.data.total_pages || 1);
      setTotalDisputes(response.data.total || 0);
    } catch (error) {
      addToast('Failed to load disputes', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await disputesAPI.getDisputeStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchDisputes(1);
    fetchStats();
  }, [statusFilter, priorityFilter]);

  const handleSelectDispute = async (dispute) => {
    try {
      const response = await disputesAPI.getDisputeDetails(dispute._id || dispute.id);
      setSelectedDispute(response.data.dispute);
      setShowDetailModal(true);
      setStatusForm({ status: response.data.dispute.status, notes: '' });
      setRefundForm({ amount: response.data.dispute.transaction_amount || '' });
    } catch (error) {
      addToast('Failed to load dispute details', 'error');
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();

    if (!statusForm.status) {
      addToast('Please select a status', 'error');
      return;
    }

    try {
      setSubmittingStatus(true);
      await disputesAPI.updateDisputeStatus(selectedDispute._id || selectedDispute.id, {
        status: statusForm.status,
        notes: statusForm.notes
      });
      
      addToast('Dispute status updated', 'success');
      setShowDetailModal(false);
      setStatusForm({ status: '', notes: '' });
      fetchDisputes(currentPage);
      fetchStats();
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleIssueRefund = async (e) => {
    e.preventDefault();

    const amount = parseFloat(refundForm.amount);
    if (!amount || amount <= 0) {
      addToast('Please enter a valid refund amount', 'error');
      return;
    }

    if (!window.confirm(`Issue refund of ${formatCurrency(amount)}?`)) {
      return;
    }

    try {
      setSubmittingRefund(true);
      await disputesAPI.issueRefund(selectedDispute._id || selectedDispute.id, { amount });
      
      addToast('Refund issued successfully', 'success');
      setShowDetailModal(false);
      setRefundForm({ amount: '' });
      fetchDisputes(currentPage);
      fetchStats();
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to issue refund', 'error');
    } finally {
      setSubmittingRefund(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold">Dispute Resolution</h1>
          <p className="text-slate-400 mt-1">Review and resolve customer disputes</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <p className="text-sm text-slate-400">Total Disputes</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <p className="text-sm text-slate-400">Open</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{stats.open}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <p className="text-sm text-slate-400">Under Review</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{stats.under_review}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <p className="text-sm text-slate-400">Refunded</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(stats.total_refunded_amount || 0)}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
            <option value="refunded">Refunded</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Disputes List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin" size={32} />
          </div>
        ) : disputes.length > 0 ? (
          <div className="space-y-4">
            {disputes.map((dispute) => {
              const config = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.open;
              const priorityConfig = PRIORITY_LEVELS.find(p => p.value === dispute.priority);

              return (
                <button
                  key={dispute._id || dispute.id}
                  onClick={() => handleSelectDispute(dispute)}
                  className="w-full text-left bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:bg-slate-800/70 transition-colors group"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-bold">{dispute.dispute_type?.replace(/_/g, ' ').title()}</h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${config.color}`}>
                          {config.label}
                        </span>
                        {priorityConfig && (
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${priorityConfig.color}`}>
                            {priorityConfig.label}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-slate-400 mb-2 line-clamp-1">
                        {dispute.reason}
                      </p>

                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 text-sm">
                        <div>
                          <p className="text-slate-500">User</p>
                          <p className="text-xs truncate">{dispute.user_email}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Amount</p>
                          <p className="font-medium">{formatCurrency(dispute.transaction_amount || 0)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Date</p>
                          <p className="text-xs">{new Date(dispute.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Type</p>
                          <p className="text-xs">{dispute.transaction_type}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-500">ID</p>
                          <p className="font-mono text-xs">{(dispute._id || dispute.id)?.slice(-6)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0 p-2 group-hover:bg-slate-700 rounded transition-colors">
                      <FiChevronRight size={20} />
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => {
                    const newPage = Math.max(1, currentPage - 1);
                    setCurrentPage(newPage);
                    fetchDisputes(newPage);
                  }}
                  disabled={currentPage === 1}
                  className="p-2 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <FiChevronLeft size={20} />
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = currentPage <= 3 ? i + 1 : Math.min(totalPages - 4, currentPage - 2) + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => {
                          setCurrentPage(pageNum);
                          fetchDisputes(pageNum);
                        }}
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          pageNum === currentPage
                            ? 'bg-blue-600'
                            : 'bg-slate-800 hover:bg-slate-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => {
                    const newPage = Math.min(totalPages, currentPage + 1);
                    setCurrentPage(newPage);
                    fetchDisputes(newPage);
                  }}
                  disabled={currentPage === totalPages}
                  className="p-2 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <FiAlertCircle size={48} className="mx-auto text-slate-500 mb-4" />
            <p className="text-slate-400">No disputes found</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedDispute && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center">
              <div>
                <h2 className="font-bold">Dispute Details</h2>
                <p className="text-sm text-slate-400">ID: {(selectedDispute._id || selectedDispute.id)?.slice(-12)}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-white p-2 hover:bg-slate-700 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User & Transaction Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400 mb-1">User</p>
                  <div>
                    <p className="font-medium text-sm">{selectedDispute.user?.username || 'N/A'}</p>
                    <p className="text-xs text-slate-400">{selectedDispute.user?.email}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Transaction Type</p>
                  <p className="font-medium text-sm capitalize">{selectedDispute.transaction_type}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Amount</p>
                  <p className="font-bold text-lg">{formatCurrency(selectedDispute.transaction?.amount || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Transaction Date</p>
                  <p className="text-sm">{new Date(selectedDispute.transaction?.date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="border-t border-slate-700 pt-4">
                <p className="text-sm text-slate-400 mb-2">Dispute Type</p>
                <p className="font-medium">{selectedDispute.dispute_type?.replace(/_/g, ' ').title()}</p>
              </div>

              <div className="border-t border-slate-700 pt-4">
                <p className="text-sm text-slate-400 mb-2">Reason</p>
                <p className="text-sm bg-slate-700/50 p-3 rounded text-slate-200 whitespace-pre-wrap">
                  {selectedDispute.reason}
                </p>
              </div>

              {/* Current Status */}
              <div className="border-t border-slate-700 pt-4">
                <p className="text-sm text-slate-400 mb-2">Current Status</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                  STATUS_CONFIG[selectedDispute.status]?.color
                }`}>
                  {STATUS_CONFIG[selectedDispute.status]?.label}
                </span>
              </div>

              {/* Refund Info */}
              {selectedDispute.refund_issued && selectedDispute.refund && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="text-green-400 flex-shrink-0" size={20} />
                    <div>
                      <p className="font-bold text-green-400">Refund Issued</p>
                      <p className="text-sm text-slate-300">Amount: {formatCurrency(selectedDispute.refund?.amount || 0)}</p>
                      <p className="text-xs text-slate-400">Date: {new Date(selectedDispute.refund?.date).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Actions */}
              <div className="border-t border-slate-700 pt-4 space-y-4">
                <h3 className="font-bold">Admin Actions</h3>

                {/* Update Status Form */}
                <form onSubmit={handleUpdateStatus} className="space-y-3 bg-slate-700/50 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium mb-2">Update Status</label>
                    <select
                      value={statusForm.status}
                      onChange={(e) => setStatusForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select new status...</option>
                      {DISPUTE_STATUSES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Notes</label>
                    <textarea
                      value={statusForm.notes}
                      onChange={(e) => setStatusForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add resolution notes..."
                      maxLength={500}
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <AppButton
                    type="submit"
                    disabled={submittingStatus}
                    className="w-full"
                  >
                    {submittingStatus ? 'Updating...' : 'Update Status'}
                  </AppButton>
                </form>

                {/* Issue Refund Form */}
                {!selectedDispute.refund_issued && (
                  <form onSubmit={handleIssueRefund} className="space-y-3 bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                    <div>
                      <label className="block text-sm font-medium mb-2">Issue Refund</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={refundForm.amount}
                        onChange={(e) => setRefundForm({ amount: e.target.value })}
                        placeholder="Refund amount..."
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <AppButton
                      type="submit"
                      disabled={submittingRefund}
                      className="w-full"
                    >
                      {submittingRefund ? 'Processing...' : 'Issue Refund'}
                    </AppButton>
                  </form>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
