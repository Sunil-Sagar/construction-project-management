import { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { reportsApi, sitesApi, workersApi } from '../services/api';
import { formatCurrency } from '../utils/helpers';

const Reports = () => {
  const [sites, setSites] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [reportType, setReportType] = useState('attendance');
  const [filters, setFilters] = useState({
    start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    site_id: '',
    worker_id: ''
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    loadSites();
    loadWorkers();
  }, []);

  // Clear report data when report type changes
  useEffect(() => {
    setReportData(null);
    setSortConfig({ key: null, direction: 'asc' });
  }, [reportType]);

  const loadSites = async () => {
    try {
      const response = await sitesApi.getAll();
      setSites(response.data);
    } catch (error) {
      console.error('Failed to load sites:', error);
    }
  };

  const loadWorkers = async () => {
    try {
      const response = await workersApi.getAll();
      setWorkers(response.data);
    } catch (error) {
      console.error('Failed to load workers:', error);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = (data) => {
    if (!sortConfig.key || !data) return data;
    
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      // Handle dates
      if (sortConfig.key === 'date') {
        const aDate = new Date(aVal);
        const bDate = new Date(bVal);
        return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
      }
      
      // Handle strings
      if (typeof aVal === 'string') {
        return sortConfig.direction === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      // Handle numbers
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  };

  const generateReport = async () => {
    setLoading(true);
    setReportData(null);
    setSortConfig({ key: null, direction: 'asc' });
    try {
      let response;
      const { start_date, end_date, site_id, worker_id } = filters;
      
      switch (reportType) {
        case 'attendance':
          response = await reportsApi.attendance(start_date, end_date, site_id || null);
          break;
        case 'labor_cost':
          response = await reportsApi.laborCost(start_date, end_date, site_id || null, worker_id || null);
          break;
        case 'material_consumption':
          response = await reportsApi.materialConsumption(start_date, end_date, site_id || null);
          break;
        case 'financial_outflow':
          response = await reportsApi.financialOutflow(start_date, end_date);
          break;
        case 'milestone_progress':
          response = await reportsApi.milestoneProgress(site_id || null);
          break;
        default:
          return;
      }
      
      setReportData(response.data);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const getSiteName = (siteId) => {
    const site = sites.find(s => s.id === siteId);
    return site?.name || 'Unknown';
  };

  const getWorkerName = (workerId) => {
    const worker = workers.find(w => w.id === workerId);
    return worker?.name || 'Unknown';
  };

  const renderAttendanceReport = () => {
    if (!reportData?.summary) return null;
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Total Attendance</div>
            <div className="text-2xl font-bold text-blue-900">{reportData.summary.total_attendance}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 font-medium">Total Workers</div>
            <div className="text-2xl font-bold text-green-900">{reportData.summary.total_workers}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm text-yellow-600 font-medium">Total OT Hours</div>
            <div className="text-2xl font-bold text-yellow-900">{reportData.summary.total_ot_hours}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-purple-600 font-medium">Avg Workers/Day</div>
            <div className="text-2xl font-bold text-purple-900">{reportData.summary.avg_attendance_per_day}</div>
          </div>
        </div>
        
        {reportData.details && reportData.details.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      Date
                      {sortConfig.key === 'date' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('worker_name')}
                  >
                    <div className="flex items-center gap-1">
                      Worker
                      {sortConfig.key === 'worker_name' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('site_name')}
                  >
                    <div className="flex items-center gap-1">
                      Site
                      {sortConfig.key === 'site_name' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('ot_hours')}
                  >
                    <div className="flex items-center gap-1">
                      OT Hours
                      {sortConfig.key === 'ot_hours' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getSortedData(reportData.details).map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm">{new Date(row.date).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-2 text-sm">{row.worker_name}</td>
                    <td className="px-4 py-2 text-sm">{row.site_name}</td>
                    <td className="px-4 py-2 text-sm">{row.ot_hours || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderLaborCostReport = () => {
    if (!reportData?.summary) return null;
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 font-medium">Total Wages</div>
            <div className="text-2xl font-bold text-green-900">{formatCurrency(reportData.summary.total_wages)}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm text-red-600 font-medium">Total Advances</div>
            <div className="text-2xl font-bold text-red-900">{formatCurrency(reportData.summary.total_advances)}</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Net Payout</div>
            <div className="text-2xl font-bold text-blue-900">{formatCurrency(reportData.summary.net_payout)}</div>
          </div>
        </div>
        
        {reportData.by_worker && reportData.by_worker.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Worker</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">OT Hours</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Gross Wages</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Advances</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Net Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.by_worker.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-medium">{row.worker_name}</td>
                    <td className="px-4 py-2 text-sm">{row.days_worked}</td>
                    <td className="px-4 py-2 text-sm">{row.total_ot_hours}</td>
                    <td className="px-4 py-2 text-sm">{formatCurrency(row.total_wages)}</td>
                    <td className="px-4 py-2 text-sm text-red-600">{formatCurrency(row.total_advances)}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-green-600">{formatCurrency(row.net_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderMaterialConsumptionReport = () => {
    if (!reportData?.summary) return null;
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Total Entries</div>
            <div className="text-2xl font-bold text-blue-900">{reportData.summary.total_entries}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 font-medium">Total Cost</div>
            <div className="text-2xl font-bold text-green-900">{formatCurrency(reportData.summary.total_cost)}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm text-yellow-600 font-medium">Pending Payment</div>
            <div className="text-2xl font-bold text-yellow-900">{formatCurrency(reportData.summary.pending_payment)}</div>
          </div>
        </div>
        
        {reportData.by_material && reportData.by_material.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Quantity</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate per Unit</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.by_material.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-medium">{row.material_name}</td>
                    <td className="px-4 py-2 text-sm">{row.total_quantity} {row.unit}</td>
                    <td className="px-4 py-2 text-sm">{formatCurrency(row.total_cost)}</td>
                    <td className="px-4 py-2 text-sm">{formatCurrency(row.avg_rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderFinancialOutflowReport = () => {
    if (!reportData?.summary) return null;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm text-yellow-600 font-medium">Cash Payments</div>
            <div className="text-2xl font-bold text-yellow-900">{formatCurrency(reportData.summary.cash)}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 font-medium">UPI/Bank Payments</div>
            <div className="text-2xl font-bold text-green-900">{formatCurrency(reportData.summary.upi)}</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Total Outflow</div>
            <div className="text-2xl font-bold text-blue-900">{formatCurrency(reportData.summary.total)}</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-sm text-orange-600 font-medium">Pending Obligations</div>
            <div className="text-2xl font-bold text-orange-900">{formatCurrency(reportData.pending?.total || 0)}</div>
          </div>
        </div>
        
        <div className="space-y-4">
          {reportData.labor_payouts && reportData.labor_payouts.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Labor Payouts</h4>
              <div className="bg-gray-50 p-4 rounded">
                {reportData.labor_payouts.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1">
                    <span>{item.payment_mode}</span>
                    <span className="font-semibold">{formatCurrency(item.total_amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {reportData.advances && reportData.advances.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Advances</h4>
              <div className="bg-gray-50 p-4 rounded">
                {reportData.advances.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1">
                    <span>{item.payment_mode}</span>
                    <span className="font-semibold">{formatCurrency(item.total_amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {reportData.materials && reportData.materials.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Material Payments</h4>
              <div className="bg-gray-50 p-4 rounded">
                {reportData.materials.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1">
                    <span>{item.payment_mode}</span>
                    <span className="font-semibold">{formatCurrency(item.total_amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reportData.pending && (reportData.pending.materials > 0 || reportData.pending.labor > 0) && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Pending Obligations</h4>
              <div className="bg-orange-50 p-4 rounded border border-orange-200">
                {reportData.pending.materials > 0 && (
                  <div className="flex justify-between py-1">
                    <span>Pending Material Payments</span>
                    <span className="font-semibold text-orange-700">{formatCurrency(reportData.pending.materials)}</span>
                  </div>
                )}
                {reportData.pending.labor > 0 && (
                  <div className="flex justify-between py-1">
                    <span>Pending Labor Payouts</span>
                    <span className="font-semibold text-orange-700">{formatCurrency(reportData.pending.labor)}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 mt-2 pt-2 border-t border-orange-300">
                  <span className="font-semibold">Total Pending</span>
                  <span className="font-bold text-orange-800">{formatCurrency(reportData.pending.total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMilestoneProgressReport = () => {
    if (!reportData?.by_site) return null;
    
    return (
      <div className="space-y-6">
        {reportData.by_site.map((site, idx) => (
          <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{site.site_name}</h3>
              <p className="text-sm text-gray-600">{site.location} • {site.client_name}</p>
              <div className="mt-3 flex gap-4 text-sm">
                <span className="text-green-600">✓ {site.completed_count} Completed</span>
                <span className="text-blue-600">◐ {site.in_progress_count} In Progress</span>
                <span className="text-gray-600">○ {site.not_started_count} Not Started</span>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {site.milestones.map((milestone, mIdx) => (
                  <div key={mIdx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{milestone.phase}</div>
                      {milestone.notes && <div className="text-sm text-gray-500 mt-1">{milestone.notes}</div>}
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        milestone.status === 'completed' ? 'bg-green-100 text-green-800' :
                        milestone.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {milestone.status}
                      </span>
                      {milestone.completion_date && (
                        <div className="text-xs text-gray-500 mt-1">{milestone.completion_date}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderReport = () => {
    if (!reportData) return null;
    
    switch (reportType) {
      case 'attendance': return renderAttendanceReport();
      case 'labor_cost': return renderLaborCostReport();
      case 'material_consumption': return renderMaterialConsumptionReport();
      case 'financial_outflow': return renderFinancialOutflowReport();
      case 'milestone_progress': return renderMilestoneProgressReport();
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card title="Report Center">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="attendance">Attendance Report</option>
                <option value="labor_cost">Labor Cost Report</option>
                <option value="material_consumption">Material Payment Report</option>
                <option value="financial_outflow">Financial Outflow Report</option>
                <option value="milestone_progress">Milestone Progress Report</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
              <select
                value={filters.site_id}
                onChange={(e) => setFilters({ ...filters, site_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Sites</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
            </div>

            {(reportType === 'labor_cost' || reportType === 'worker_summary') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Worker</label>
                <select
                  value={filters.worker_id}
                  onChange={(e) => setFilters({ ...filters, worker_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Workers</option>
                  {workers.map(worker => (
                    <option key={worker.id} value={worker.id}>{worker.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={generateReport} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </div>
      </Card>

      {reportData && (
        <Card title={`${reportType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} - ${filters.start_date} to ${filters.end_date}`}>
          {renderReport()}
        </Card>
      )}
    </div>
  );
};

export default Reports;
