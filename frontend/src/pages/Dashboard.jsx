import { useState, useEffect } from 'react';
import Card from '../components/Card';
import { reportsApi } from '../services/api';
import { formatCurrency } from '../utils/helpers';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await reportsApi.dashboardSummary();
      setSummary(response.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Command Center</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Sites */}
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
              <span className="text-3xl">🏗️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Sites</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary?.active_sites || 0}
              </p>
            </div>
          </div>
        </Card>

        {/* Active Workers */}
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-green-100 rounded-lg">
              <span className="text-3xl">👷</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Workers</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary?.active_workers || 0}
              </p>
            </div>
          </div>
        </Card>

        {/* Pending Payouts */}
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-yellow-100 rounded-lg">
              <span className="text-3xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Payouts</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(summary?.pending_payouts?.total || 0)}
              </p>
              <p className="text-xs text-gray-500">
                {summary?.pending_payouts?.count || 0} workers
              </p>
            </div>
          </div>
        </Card>

        {/* Pending Materials */}
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-red-100 rounded-lg">
              <span className="text-3xl">🧱</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vendor Debt</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(summary?.pending_materials?.total || 0)}
              </p>
              <p className="text-xs text-gray-500">
                {summary?.pending_materials?.count || 0} entries
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/attendance"
            className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all"
          >
            <div className="text-center">
              <span className="text-4xl">📋</span>
              <h3 className="mt-3 text-lg font-semibold text-gray-800">
                Mark Attendance
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Record today's attendance
              </p>
            </div>
          </a>

          <a
            href="/payouts"
            className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all"
          >
            <div className="text-center">
              <span className="text-4xl">💰</span>
              <h3 className="mt-3 text-lg font-semibold text-gray-800">
                Saturday Settlement
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Process weekly payouts
              </p>
            </div>
          </a>

          <a
            href="/reports"
            className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all"
          >
            <div className="text-center">
              <span className="text-4xl">📈</span>
              <h3 className="mt-3 text-lg font-semibold text-gray-800">
                Reports
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                View analytics & reports
              </p>
            </div>
          </a>
        </div>
      </Card>

      {/* Today's Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="System Status">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600">Database</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600">Last Backup</span>
              <span className="text-gray-800">Manual backup recommended</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">Week Cycle</span>
              <span className="text-gray-800">Sun - Sat Settlement</span>
            </div>
          </div>
        </Card>

        <Card title="Reminders">
          <div className="space-y-3">
            {summary?.pending_payouts?.count > 0 && (
              <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <p className="text-sm font-medium text-yellow-800">
                  {summary.pending_payouts.count} pending payout(s) to settle
                </p>
              </div>
            )}
            {summary?.pending_materials?.count > 0 && (
              <div className="p-3 bg-red-50 border-l-4 border-red-400 rounded">
                <p className="text-sm font-medium text-red-800">
                  {summary.pending_materials.count} material payment(s) pending
                </p>
              </div>
            )}
            {summary?.pending_payouts?.count === 0 && summary?.pending_materials?.count === 0 && (
              <div className="p-3 bg-green-50 border-l-4 border-green-400 rounded">
                <p className="text-sm font-medium text-green-800">
                  All payments up to date!
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
