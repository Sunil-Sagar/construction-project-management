import { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { wipApi, sitesApi, milestonesApi } from '../services/api';

const WIP = () => {
  const [wipEntries, setWipEntries] = useState([]);
  const [sites, setSites] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [filteredMilestones, setFilteredMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    site_id: '',
    milestone_id: '',
    work_details: '',
    progress_status: 'in-progress'
  });

  useEffect(() => {
    loadSites();
    loadMilestones();
    loadWipEntries();
  }, []);

  // Filter milestones when site is selected
  useEffect(() => {
    if (formData.site_id) {
      const filtered = milestones.filter(m => m.site_id === parseInt(formData.site_id));
      setFilteredMilestones(filtered);
      // Reset milestone selection if current selection is not in filtered list
      if (formData.milestone_id && !filtered.find(m => m.id === parseInt(formData.milestone_id))) {
        setFormData({ ...formData, milestone_id: '' });
      }
    } else {
      setFilteredMilestones([]);
      setFormData({ ...formData, milestone_id: '' });
    }
  }, [formData.site_id, milestones]);

  const loadSites = async () => {
    try {
      const response = await sitesApi.getAll();
      setSites(response.data);
    } catch (error) {
      console.error('Failed to load sites:', error);
    }
  };

  const loadMilestones = async () => {
    try {
      const response = await milestonesApi.getAll();
      setMilestones(response.data);
    } catch (error) {
      console.error('Failed to load milestones:', error);
    }
  };

  const loadWipEntries = async () => {
    try {
      setLoading(true);
      const response = await wipApi.getAll();
      setWipEntries(response.data);
    } catch (error) {
      console.error('Failed to load WIP entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      site_id: '',
      milestone_id: '',
      work_details: '',
      progress_status: 'in-progress'
    });
    setEditingId(null);
    setFilteredMilestones([]);
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.date || !formData.site_id || !formData.milestone_id || !formData.work_details) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingId) {
        await wipApi.update(editingId, formData);
        alert('WIP entry updated successfully!');
      } else {
        await wipApi.create(formData);
        alert('WIP entry created successfully!');
      }
      resetForm();
      loadWipEntries();
      loadMilestones(); // Reload to see updated milestone statuses
    } catch (error) {
      console.error('Failed to save WIP entry:', error);
      alert('Failed to save WIP entry');
    }
  };

  const handleEdit = (entry) => {
    setEditingId(entry.id);
    setFormData({
      date: entry.date,
      site_id: entry.site_id,
      milestone_id: entry.milestone_id,
      work_details: entry.work_details,
      progress_status: entry.progress_status
    });
  };

  const handleCancel = () => {
    resetForm();
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this WIP entry?')) return;
    try {
      await wipApi.delete(id);
      loadWipEntries();
      loadMilestones();
    } catch (error) {
      console.error('Failed to delete WIP entry:', error);
      alert('Failed to delete WIP entry');
    }
  };

  const getStatusColor = (status) => {
    return status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const getStatusBadge = (status) => {
    return status === 'completed' ? '✓ Completed' : '⏳ In-Progress';
  };

  return (
    <div className="space-y-6">
      <Card title="Daily Work In-Progress (WIP)">
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          ℹ️ Logging work here will auto-update the related Milestone status
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{width: '120px'}}>Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{width: '150px'}}>Site</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{width: '180px'}}>Phase</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Work Details</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{width: '180px'}}>Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase" style={{width: '180px'}}>Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Inline Entry Form Row */}
                <tr className="bg-green-50">
                  <td className="px-4 py-3">
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={formData.site_id}
                      onChange={(e) => setFormData({ ...formData, site_id: e.target.value, milestone_id: '' })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-primary-500 focus:border-primary-500"
                      disabled={editingId}
                    >
                      <option value="">Select Site</option>
                      {sites.map(site => (
                        <option key={site.id} value={site.id}>{site.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={formData.milestone_id}
                      onChange={(e) => setFormData({ ...formData, milestone_id: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-primary-500 focus:border-primary-500"
                      disabled={!formData.site_id || editingId}
                    >
                      <option value="">Select Phase</option>
                      {filteredMilestones.map(milestone => (
                        <option key={milestone.id} value={milestone.id}>
                          {milestone.phase} ({milestone.status})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <textarea
                      value={formData.work_details}
                      onChange={(e) => setFormData({ ...formData, work_details: e.target.value })}
                      rows={2}
                      placeholder="e.g., North wall completed up to 3ft"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={formData.progress_status}
                      onChange={(e) => setFormData({ ...formData, progress_status: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="in-progress">⏳ In-Progress</option>
                      <option value="completed">✓ Completed</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {editingId ? (
                      <>
                        <button 
                          onClick={handleSubmit}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Update
                        </button>
                        <button 
                          onClick={handleCancel}
                          className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={handleSubmit}
                        className="px-4 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700"
                      >
                        Add Entry
                      </button>
                    )}
                  </td>
                </tr>

                {/* Existing Entries */}
                {wipEntries.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      <p className="text-lg">No WIP entries recorded yet</p>
                      <p className="mt-2 text-sm">Use the form above to add your first entry</p>
                    </td>
                  </tr>
                ) : (
                  wipEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {new Date(entry.date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {entry.site_name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {entry.milestone_phase}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="max-w-md" title={entry.work_details}>
                          {entry.work_details}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(entry.progress_status)}`}>
                          {getStatusBadge(entry.progress_status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm space-x-2">
                        <button onClick={() => handleEdit(entry)} className="text-blue-600 hover:text-blue-900">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(entry.id)} className="text-red-600 hover:text-red-900">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default WIP;
