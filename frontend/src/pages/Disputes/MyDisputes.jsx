import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiLoader, FiAlertCircle, FiEye, FiAlertTriangle, FiCheckCircle, FiX } from 'react-icons/fi';
import { disputesAPI } from '../../api/disputes';
import { useToast } from '../../hooks/useToast';

const STATUS_CONFIG = {
  open: { color: 'bg-red-500/20 text-red-300', label: 'Open', icon: AlertTriangle },
  under_review: { color: 'bg-amber-500/20 text-amber-300', label: 'Under Review', icon: Loader },
  resolved: { color: 'bg-blue-500/20 text-blue-300', label: 'Resolved', icon: CheckCircle },
  rejected: { color: 'bg-slate-500/20 text-slate-300', label: 'Rejected', icon: AlertCircle },
  refunded: { color: 'bg-green-500/20 text-green-300', label: 'Refunded', icon: CheckCircle }
};

export default function MyDisputes() {
  const { addToast } = useToast();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDispute, setSelectedDispute] = useState(null);

  const fetchDisputes = async (page = 1) => {
    try {
      setLoading(true);
      const response = await disputesAPI.getMyDisputes(page, 10, statusFilter);
      setDisputes(response.data.disputes || []);
      setCurrentPage(response.data.page || 1);
      setTotalPages(response.data.total_pages || 1);
    } catch (error) {
      addToast('Failed to load disputes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchDisputes(1);
  }, [statusFilter]);

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchDisputes(newPage);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">My Disputes</h1>
              <p className="text-slate-400 mt-1">Track and manage your dispute reports</p>
            </div>
            <Link
              to="/disputes/report"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Report New Dispute
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Disputes List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FiLoader className="animate-spin" size={32} />
          </div>
        ) : disputes.length > 0 ? (
          <div className="space-y-4">
            {disputes.map((dispute) => {
              const config = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.open;
              const Icon = config.icon;

              return (
                <div
                  key={dispute._id || dispute.id}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:bg-slate-800/70 transition-colors"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold">{dispute.dispute_type?.replace(/_/g, ' ').title()}</h3>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
                          <Icon size={14} />
                          {config.label}
                        </span>
                      </div>

                      <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                        {dispute.reason}
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-slate-500">Dispute ID</p>
                          <p className="font-mono text-xs">{dispute._id?.slice(-8) || dispute.id?.slice(-8)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Amount</p>
                          <p className="font-medium">${(dispute.transaction_amount || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Date</p>
                          <p>{new Date(dispute.transaction_date).toLocaleDateString()}</p>
                        </div>
                        {dispute.refund_amount > 0 && (
                          <div>
                            <p className="text-slate-500">Refund</p>
                            <p className="font-medium text-green-400">${(dispute.refund_amount).toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedDispute(dispute)}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
                      title="View Details"
                    >
                      <FiEye size={20} />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Previous
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        page === currentPage
                          ? 'bg-blue-600'
                          : 'bg-slate-800 hover:bg-slate-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <FiAlertCircle size={48} className="mx-auto text-slate-500 mb-4" />
            <p className="text-slate-400 mb-4">No disputes found</p>
            <Link
              to="/disputes/report"
              className="text-blue-400 hover:text-blue-300 inline-block"
            >
              Report a new dispute
            </Link>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center">
              <h2 className="font-bold">Dispute Details</h2>
              <button
                onClick={() => setSelectedDispute(null)}
                className="text-slate-400 hover:text-white"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Status */}
              <div>
                <p className="text-sm text-slate-400 mb-1">Status</p>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                  STATUS_CONFIG[selectedDispute.status]?.color
                }`}>
                  {STATUS_CONFIG[selectedDispute.status]?.label}
                </span>
              </div>

              {/* Type */}
              <div>
                <p className="text-sm text-slate-400 mb-1">Dispute Type</p>
                <p className="font-medium">{selectedDispute.dispute_type?.replace(/_/g, ' ').title()}</p>
              </div>

              {/* Amount */}
              <div>
                <p className="text-sm text-slate-400 mb-1">Transaction Amount</p>
                <p className="font-medium">${(selectedDispute.transaction_amount || 0).toFixed(2)}</p>
              </div>

              {/* Reason */}
              <div>
                <p className="text-sm text-slate-400 mb-1">Your Reason</p>
                <p className="text-sm bg-slate-700/50 p-3 rounded text-slate-200">{selectedDispute.reason}</p>
              </div>

              {/* Created Date */}
              <div>
                <p className="text-sm text-slate-400 mb-1">Reported On</p>
                <p className="text-sm">{new Date(selectedDispute.created_at).toLocaleString()}</p>
              </div>

              {/* Resolution Notes */}
              {selectedDispute.resolution_notes && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Resolution Notes</p>
                  <p className="text-sm bg-slate-700/50 p-3 rounded text-slate-200">{selectedDispute.resolution_notes}</p>
                </div>
              )}

              {/* Refund Info */}
              {selectedDispute.refund_amount > 0 && (
                <div className="bg-green-500/10 border border-green-500/20 rounded p-3">
                  <p className="text-sm text-slate-400 mb-1">Refund Issued</p>
                  <p className="font-bold text-green-400">${(selectedDispute.refund_amount).toFixed(2)}</p>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => setSelectedDispute(null)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors mt-4"
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
