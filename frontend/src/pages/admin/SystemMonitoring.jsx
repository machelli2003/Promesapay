import { useState, useEffect } from 'react';
import { FiLoader, FiAlertCircle, FiCheckCircle, FiAlertTriangle, FiTrendingUp, FiUsers, FiActivity, FiZap } from 'react-icons/fi';
import { monitoringAPI } from '../../api/monitoring';
import { useToast } from '../../hooks/useToast';
import { formatCurrency } from '../../utils/formatters';

const STATUS_COLORS = {
  healthy: 'bg-green-500/20 text-green-300 border-green-500/20',
  degraded: 'bg-amber-500/20 text-amber-300 border-amber-500/20',
  critical: 'bg-red-500/20 text-red-300 border-red-500/20',
  unhealthy: 'bg-red-500/20 text-red-300 border-red-500/20'
};

const STATUS_ICONS = {
  healthy: CheckCircle,
  degraded: AlertTriangle,
  critical: AlertCircle,
  unhealthy: AlertCircle
};

export default function SystemMonitoring() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  
  const [healthStatus, setHealthStatus] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Fetch all monitoring data
  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      
      const [health, stats, alertsData, activity, daily] = await Promise.all([
        monitoringAPI.getDetailedHealthCheck(),
        monitoringAPI.getSystemStats(),
        monitoringAPI.getAlerts(),
        monitoringAPI.getRecentActivity(),
        monitoringAPI.getDailyStats(7)
      ]);

      setHealthStatus(health.data);
      setSystemStats(stats.data);
      setAlerts(alertsData.data.alerts || []);
      setRecentActivity(activity.data.activity || []);
      setDailyStats(daily.data.data || []);
    } catch (error) {
      addToast('Failed to load monitoring data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();

    // Set up auto-refresh
    const interval = setInterval(fetchMonitoringData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (loading && !healthStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <Loader className="animate-spin" size={32} />
      </div>
    );
  }

  const StatusIcon = STATUS_ICONS[healthStatus?.system?.status] || CheckCircle;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">System Monitoring</h1>
              <p className="text-slate-400 mt-1">Real-time health and performance metrics</p>
            </div>
            <div className="flex gap-2">
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              >
                <option value={10000}>Every 10s</option>
                <option value={30000}>Every 30s</option>
                <option value={60000}>Every 60s</option>
              </select>
              <button
                onClick={fetchMonitoringData}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Health Status */}
        {healthStatus && (
          <div className={`mb-8 border rounded-lg p-6 ${STATUS_COLORS[healthStatus.system?.status]}`}>
            <div className="flex items-center gap-4">
              <StatusIcon size={40} />
              <div>
                <h2 className="text-xl font-bold capitalize">
                  System Status: {healthStatus.system?.status}
                </h2>
                <p className="text-sm opacity-75">
                  Last updated: {new Date(healthStatus.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4">Active Alerts ({alerts.length})</h3>
            <div className="space-y-3">
              {alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`border rounded-lg p-4 ${
                    alert.level === 'critical'
                      ? 'bg-red-500/10 border-red-500/20'
                      : 'bg-amber-500/10 border-amber-500/20'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold">
                        <FiAlertTriangle className="inline-block mr-1" size={16} /> {alert.message}
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        Metric: {alert.metric} | Value: {alert.value}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* System Metrics */}
        {systemStats && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* CPU */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-400">CPU Usage</p>
                <Zap size={20} className="text-amber-400" />
              </div>
              <p className="text-3xl font-bold">{systemStats.system?.cpu_percent.toFixed(1)}%</p>
              <div className="mt-3 w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, systemStats.system?.cpu_percent)}%` }}
                />
              </div>
            </div>

            {/* Memory */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-400">Memory Usage</p>
                <Activity size={20} className="text-blue-400" />
              </div>
              <p className="text-3xl font-bold">{systemStats.system?.memory_percent.toFixed(1)}%</p>
              <p className="text-xs text-slate-400 mt-2">
                {(systemStats.system?.memory_mb?.used / 1024).toFixed(1)}GB / {(systemStats.system?.memory_mb?.total / 1024).toFixed(1)}GB
              </p>
              <div className="mt-2 w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, systemStats.system?.memory_percent)}%` }}
                />
              </div>
            </div>

            {/* Disk */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-400">Disk Usage</p>
                <TrendingUp size={20} className="text-purple-400" />
              </div>
              <p className="text-3xl font-bold">{systemStats.system?.disk_percent.toFixed(1)}%</p>
              <div className="mt-3 w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, systemStats.system?.disk_percent)}%` }}
                />
              </div>
            </div>

            {/* Uptime */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-400">Uptime</p>
                <CheckCircle size={20} className="text-green-400" />
              </div>
              <p className="text-3xl font-bold">{(systemStats.system?.uptime_hours || 0).toFixed(1)}h</p>
              <p className="text-xs text-slate-400 mt-2">
                Process: {systemStats.process?.pid}
              </p>
            </div>
          </div>
        )}

        {/* Collections Stats */}
        {systemStats && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Users */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <FiUsers size={20} /> Users
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Users</span>
                  <span className="font-bold">{systemStats.users?.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Verified</span>
                  <span className="font-bold text-green-400">{systemStats.users?.verified}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Admin</span>
                  <span className="font-bold text-blue-400">{systemStats.users?.admin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Unverified</span>
                  <span className="font-bold text-amber-400">{systemStats.users?.unverified}</span>
                </div>
              </div>
            </div>

            {/* Transactions */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <TrendingUp size={20} /> Transactions
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Donations (Total)</span>
                  <span className="font-bold">{systemStats.transactions?.donations?.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Donations (Completed)</span>
                  <span className="font-bold text-green-400">{systemStats.transactions?.donations?.completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Dolls (Total)</span>
                  <span className="font-bold">{systemStats.transactions?.coffee?.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Revenue</span>
                  <span className="font-bold text-green-400">{formatCurrency(systemStats.revenue?.total || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700 bg-slate-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left">Action</th>
                    <th className="px-4 py-3 text-left">Admin</th>
                    <th className="px-4 py-3 text-left">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.slice(0, 10).map((log, idx) => (
                    <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3 font-mono">{log.action}</td>
                      <td className="px-4 py-3 text-slate-400">{log.admin_id?.slice(-8) || 'System'}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {recentActivity.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                No recent activity
              </div>
            )}
          </div>
        </div>

        {/* Daily Trend */}
        {dailyStats.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4">7-Day Trend</h3>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <div className="space-y-3">
                {dailyStats.map((day, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">{day._id}</span>
                      <span className="text-sm font-bold">{formatCurrency(day.amount || 0)}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-1">
                      <div
                        className="bg-blue-500 h-1 rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            ((day.amount || 0) / Math.max(...dailyStats.map(d => d.amount || 0), 1)) * 100
                          )}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
