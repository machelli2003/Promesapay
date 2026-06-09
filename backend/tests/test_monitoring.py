"""
Comprehensive test suite for system monitoring (Phase 3.3)
Tests health checks, metrics, error tracking, and performance monitoring
"""

import pytest
from datetime import datetime, timedelta
from bson import ObjectId


class TestHealthCheck:
    """Tests for health check endpoints"""

    def test_basic_health_check_no_auth(self, client):
        """Basic health check works without authentication"""
        response = client.get('/api/monitoring/health')

        assert response.status_code == 200
        assert response.json['status'] in ['healthy', 'degraded', 'unhealthy']
        assert 'database' in response.json
        assert 'system' in response.json

    def test_health_check_has_cpu_memory(self, client):
        """Health check includes CPU and memory metrics"""
        response = client.get('/api/monitoring/health')

        assert response.status_code == 200
        assert 'cpu_percent' in response.json['system']
        assert 'memory_percent' in response.json['system']
        assert 'disk_percent' in response.json['system']

    def test_detailed_health_check_requires_admin(self, client, auth_token):
        """Detailed health check requires admin role"""
        response = client.get(
            '/api/monitoring/health/detailed',
            headers={'Authorization': f'Bearer {auth_token}'}
        )

        # Non-admin should get 403
        assert response.status_code == 403

    def test_detailed_health_check_admin_access(self, client, admin_token):
        """Admin can access detailed health check"""
        response = client.get(
            '/api/monitoring/health/detailed',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        assert 'database' in response.json
        assert 'system' in response.json
        assert 'process' in response.json
        assert 'uptime_hours' in response.json['system']

    def test_health_check_includes_collections(self, client, admin_token):
        """Detailed health check includes collection counts"""
        response = client.get(
            '/api/monitoring/health/detailed',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        assert 'collections' in response.json['database']
        assert 'users' in response.json['database']['collections']
        assert 'donations' in response.json['database']['collections']


class TestSystemStatistics:
    """Tests for system statistics endpoints"""

    def test_stats_overview_requires_admin(self, client, auth_token):
        """Stats overview requires admin role"""
        response = client.get(
            '/api/monitoring/stats/overview',
            headers={'Authorization': f'Bearer {auth_token}'}
        )

        assert response.status_code == 403

    def test_stats_overview_includes_user_stats(self, client, admin_token):
        """Stats overview includes user counts"""
        response = client.get(
            '/api/monitoring/stats/overview',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        assert 'users' in response.json
        assert 'total' in response.json['users']
        assert 'verified' in response.json['users']
        assert 'admin' in response.json['users']

    def test_stats_overview_includes_transactions(self, client, admin_token):
        """Stats overview includes transaction stats"""
        response = client.get(
            '/api/monitoring/stats/overview',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        assert 'transactions' in response.json
        assert 'donations' in response.json['transactions']
        assert 'coffee' in response.json['transactions']

    def test_stats_overview_includes_revenue(self, client, admin_token):
        """Stats overview includes revenue metrics"""
        response = client.get(
            '/api/monitoring/stats/overview',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        assert 'revenue' in response.json
        assert 'total' in response.json['revenue']
        assert response.json['revenue']['currency'] == 'USD'

    def test_daily_statistics(self, client, admin_token):
        """Admin can retrieve daily statistics"""
        response = client.get(
            '/api/monitoring/stats/daily?days=7',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        assert 'data' in response.json
        assert response.json['days'] == 7

    def test_daily_statistics_custom_range(self, client, admin_token):
        """Daily statistics accepts custom day range"""
        response = client.get(
            '/api/monitoring/stats/daily?days=30',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        assert response.json['days'] == 30

    def test_hourly_statistics(self, client, admin_token):
        """Admin can retrieve hourly statistics"""
        response = client.get(
            '/api/monitoring/stats/hourly',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        assert 'data' in response.json
        assert isinstance(response.json['data'], list)


class TestErrorTracking:
    """Tests for error tracking endpoints"""

    def test_error_logs_requires_admin(self, client, auth_token):
        """Error logs require admin access"""
        response = client.get(
            '/api/monitoring/errors',
            headers={'Authorization': f'Bearer {auth_token}'}
        )

        assert response.status_code == 403

    def test_error_logs_retrieval(self, client, admin_token):
        """Admin can retrieve error logs"""
        response = client.get(
            '/api/monitoring/errors',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        assert 'errors' in response.json
        assert 'count' in response.json
        assert isinstance(response.json['errors'], list)

    def test_error_logs_custom_hours(self, client, admin_token):
        """Error logs can be filtered by time range"""
        response = client.get(
            '/api/monitoring/errors?hours=48&limit=50',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        assert response.json['hours'] == 48

    def test_error_logs_limit(self, client, admin_token):
        """Error logs respects limit parameter"""
        response = client.get(
            '/api/monitoring/errors?hours=24&limit=10',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        assert len(response.json['errors']) <= 10

    def test_error_summary(self, client, admin_token):
        """Admin can get error summary by type"""
        response = client.get(
            '/api/monitoring/errors/summary',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        assert 'summary' in response.json
        assert isinstance(response.json['summary'], list)


class TestActivityMonitoring:
    """Tests for activity tracking"""

    def test_recent_activity_requires_admin(self, client, auth_token):
        """Recent activity requires admin access"""
        response = client.get(
            '/api/monitoring/activity/recent',
            headers={'Authorization': f'Bearer {auth_token}'}
        )

        assert response.status_code == 403

    def test_recent_activity_retrieval(self, client, admin_token):
        """Admin can retrieve recent activity"""
        response = client.get(
            '/api/monitoring/activity/recent',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        assert 'activity' in response.json
        assert 'count' in response.json
        assert isinstance(response.json['activity'], list)

    def test_recent_activity_limit(self, client, admin_token):
        """Recent activity respects limit parameter"""
        response = client.get(
            '/api/monitoring/activity/recent?limit=20',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        assert len(response.json['activity']) <= 20

    def test_activity_summary(self, client, admin_token):
        """Admin can get activity summary by action"""
        response = client.get(
            '/api/monitoring/activity/summary',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        assert 'summary' in response.json
        assert isinstance(response.json['summary'], list)


class TestPerformanceMetrics:
    """Tests for performance monitoring"""

    def test_database_performance_requires_admin(self, client, auth_token):
        """Database performance requires admin access"""
        response = client.get(
            '/api/monitoring/performance/database',
            headers={'Authorization': f'Bearer {auth_token}'}
        )

        assert response.status_code == 403

    def test_database_performance_retrieval(self, client, admin_token):
        """Admin can retrieve database performance metrics"""
        response = client.get(
            '/api/monitoring/performance/database',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        assert 'metrics' in response.json
        assert 'users_collection' in response.json['metrics']
        assert 'count' in response.json['metrics']['users_collection']
        assert 'indexes' in response.json['metrics']['users_collection']

    def test_endpoint_performance(self, client, admin_token):
        """Admin can access endpoint performance"""
        response = client.get(
            '/api/monitoring/performance/endpoints',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        # This returns placeholder while middleware is being implemented
        assert response.status_code == 200
        assert 'status' in response.json


class TestStatusMonitoring:
    """Tests for real-time status"""

    def test_current_status_requires_admin(self, client, auth_token):
        """Current status requires admin access"""
        response = client.get(
            '/api/monitoring/status/current',
            headers={'Authorization': f'Bearer {auth_token}'}
        )

        assert response.status_code == 403

    def test_current_status_retrieval(self, client, admin_token):
        """Admin can retrieve current system status"""
        response = client.get(
            '/api/monitoring/status/current',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        assert 'status' in response.json
        assert response.json['status'] in ['healthy', 'degraded', 'critical']
        assert 'checks' in response.json
        assert 'metrics' in response.json

    def test_current_status_includes_checks(self, client, admin_token):
        """Status includes all system checks"""
        response = client.get(
            '/api/monitoring/status/current',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        checks = response.json['checks']
        assert 'database' in checks
        assert 'cpu' in checks
        assert 'memory' in checks


class TestAlertsSystem:
    """Tests for alerts and thresholds"""

    def test_alerts_requires_admin(self, client, auth_token):
        """Alerts require admin access"""
        response = client.get(
            '/api/monitoring/alerts',
            headers={'Authorization': f'Bearer {auth_token}'}
        )

        assert response.status_code == 403

    def test_alerts_retrieval(self, client, admin_token):
        """Admin can retrieve current alerts"""
        response = client.get(
            '/api/monitoring/alerts',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        assert 'alerts' in response.json
        assert 'alert_count' in response.json
        assert isinstance(response.json['alerts'], list)

    def test_alert_structure(self, client, admin_token):
        """Alerts have correct structure"""
        response = client.get(
            '/api/monitoring/alerts',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        for alert in response.json['alerts']:
            assert 'level' in alert
            assert 'message' in alert
            assert 'metric' in alert
            assert alert['level'] in ['warning', 'critical']


class TestMonitoringAuthorization:
    """Tests for authorization checks"""

    def test_unauthenticated_cannot_access_admin_monitoring(self, client):
        """Unauthenticated users cannot access admin monitoring"""
        response = client.get('/api/monitoring/stats/overview')
        assert response.status_code == 401

    def test_non_admin_cannot_access_monitoring(self, client, auth_token):
        """Non-admin users cannot access monitoring"""
        response = client.get(
            '/api/monitoring/stats/overview',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code == 403

    def test_health_check_public_endpoint(self, client):
        """Health check is publicly accessible"""
        response = client.get('/api/monitoring/health')
        assert response.status_code == 200


class TestMonitoringIntegration:
    """Integration tests for monitoring workflow"""

    def test_full_monitoring_workflow(self, client, admin_token):
        """Admin can access complete monitoring dashboard"""
        # Get health
        health = client.get(
            '/api/monitoring/health/detailed',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert health.status_code == 200

        # Get stats
        stats = client.get(
            '/api/monitoring/stats/overview',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert stats.status_code == 200

        # Get alerts
        alerts = client.get(
            '/api/monitoring/alerts',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert alerts.status_code == 200

        # Get activity
        activity = client.get(
            '/api/monitoring/activity/recent',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert activity.status_code == 200

    def test_monitoring_refresh_cycle(self, client, admin_token):
        """Monitoring can be refreshed in quick succession"""
        for _ in range(3):
            response = client.get(
                '/api/monitoring/status/current',
                headers={'Authorization': f'Bearer {admin_token}'}
            )
            assert response.status_code == 200


class TestMonitoringDataAccuracy:
    """Tests for monitoring data accuracy"""

    def test_user_count_accuracy(self, client, admin_token, registered_user):
        """User count in stats is accurate"""
        response = client.get(
            '/api/monitoring/stats/overview',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        assert response.json['users']['total'] >= 1

    def test_verified_user_count_accuracy(self, client, admin_token):
        """Verified user count is accurate"""
        response = client.get(
            '/api/monitoring/stats/overview',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        users = response.json['users']
        assert users['verified'] + users['unverified'] == users['total']


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
