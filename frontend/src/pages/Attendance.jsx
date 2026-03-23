import { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { attendanceApi, workersApi, sitesApi } from '../services/api';
import { formatCurrency } from '../utils/helpers';

const Attendance = () => {
  const [workers, setWorkers] = useState([]);
  const [sites, setSites] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSite, setSelectedSite] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkData, setBulkData] = useState({});

  useEffect(() => {
    loadWorkers();
    loadSites();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadAttendance();
    }
  }, [selectedDate]);

  const loadWorkers = async () => {
    try {
      const response = await workersApi.getActive();
      setWorkers(response.data);
    } catch (error) {
      console.error('Failed to load workers:', error);
    }
  };

  const loadSites = async () => {
    try {
      const response = await sitesApi.getActive();
      setSites(response.data);
    } catch (error) {
      console.error('Failed to load sites:', error);
    }
  };

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const response = await attendanceApi.getByDate(selectedDate);
      setAttendance(response.data);
    } catch (error) {
      console.error('Failed to load attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const openBulkModal = () => {
    const data = {};
    workers.forEach(worker => {
      const existing = attendance.find(a => a.worker_id === worker.id);
      data[worker.id] = {
        present: existing ? true : false,
        site_id: existing?.site_id || selectedSite || '',
        attendance_value: existing?.attendance_value || 1.0,
        ot_hours: existing?.ot_hours || 0,
        notes: existing?.notes || ''
      };
    });
    setBulkData(data);
    setModalOpen(true);
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    const records = Object.entries(bulkData)
      .filter(([_, data]) => data.present)
      .map(([worker_id, data]) => ({
        worker_id: parseInt(worker_id),
        site_id: parseInt(data.site_id),
        date: selectedDate,
        attendance_value: parseFloat(data.attendance_value) || 1.0,
        ot_hours: parseFloat(data.ot_hours) || 0,
        notes: data.notes
      }));

    if (records.length === 0) {
      alert('Please select at least one worker');
      return;
    }

    try {
      await attendanceApi.markBulk({ records });
      setModalOpen(false);
      loadAttendance();
    } catch (error) {
      console.error('Failed to mark attendance:', error);
      alert('Failed to mark attendance');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this attendance record?')) return;
    try {
      await attendanceApi.delete(id);
      loadAttendance();
    } catch (error) {
      console.error('Failed to delete attendance:', error);
    }
  };

  const getWorkerName = (workerId) => {
    const worker = workers.find(w => w.id === workerId);
    return worker?.name || 'Unknown';
  };

  const getSiteName = (siteId) => {
    const site = sites.find(s => s.id === siteId);
    return site?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <Card
        title="Daily Attendance"
        action={
          <div className="flex gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
            <Button onClick={openBulkModal} icon="+">
              Mark Attendance
            </Button>
          </div>
        }
      >
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : attendance.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No attendance marked for {selectedDate}</p>
            <p className="mt-2 text-sm">Click "Mark Attendance" to record today's attendance.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worker</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">OT Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendance.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{getWorkerName(record.worker_id)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {getSiteName(record.site_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {record.attendance_value === 0.5 ? '0.5 (Half)' : record.attendance_value === 1 ? '1.0 (Full)' : record.attendance_value || '1.0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {record.ot_hours || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {record.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button onClick={() => handleDelete(record.id)} className="text-red-600 hover:text-red-900">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`Mark Attendance - ${selectedDate}`}>
        <form onSubmit={handleBulkSubmit} className="space-y-4">
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> For workers at multiple sites, mark them as "Half day" at each site separately. 
              Example: 0.5 days at Site A + 0.5 days at Site B = 1 full day total.
            </p>
          </div>
          <div className="max-h-96 overflow-y-auto space-y-3">
            {workers.map((worker) => (
              <div key={worker.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  checked={bulkData[worker.id]?.present || false}
                  onChange={(e) => setBulkData({
                    ...bulkData,
                    [worker.id]: { ...bulkData[worker.id], present: e.target.checked }
                  })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{worker.name}</div>
                  <div className="text-sm text-gray-500">{worker.role}</div>
                </div>
                {bulkData[worker.id]?.present && (
                  <div className="flex gap-2">
                    <select
                      value={bulkData[worker.id]?.site_id || ''}
                      onChange={(e) => setBulkData({
                        ...bulkData,
                        [worker.id]: { ...bulkData[worker.id], site_id: e.target.value }
                      })}
                      className="px-2 py-1 text-sm border border-gray-300 rounded"
                      required
                    >
                      <option value="">Select Site</option>
                      {sites.map(site => (
                        <option key={site.id} value={site.id}>{site.name}</option>
                      ))}
                    </select>
                    <select
                      value={bulkData[worker.id]?.attendance_value || 1.0}
                      onChange={(e) => setBulkData({
                        ...bulkData,
                        [worker.id]: { ...bulkData[worker.id], attendance_value: e.target.value }
                      })}
                      className="px-2 py-1 text-sm border border-gray-300 rounded w-24"
                      title="Days worked at this site"
                    >
                      <option value="1.0">Full day</option>
                      <option value="0.5">Half day</option>
                    </select>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="OT Hrs"
                      value={bulkData[worker.id]?.ot_hours || ''}
                      onChange={(e) => setBulkData({
                        ...bulkData,
                        [worker.id]: { ...bulkData[worker.id], ot_hours: e.target.value }
                      })}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Attendance</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Attendance;
