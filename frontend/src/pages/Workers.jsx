import { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import SmartInput from '../components/SmartInput';
import { workersApi } from '../services/api';
import { formatCurrency } from '../utils/helpers';

const Workers = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [workerNames, setWorkerNames] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: 'Male Helper',
    current_rate: '',
    ot_rate: '100',
    status: 'active'
  });

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    try {
      const response = await workersApi.getAll();
      setWorkers(response.data);
      
      // Extract unique worker names for autocomplete
      const uniqueNames = [...new Set(response.data.map(w => w.name).filter(Boolean))];
      setWorkerNames(uniqueNames);
    } catch (error) {
      console.error('Error loading workers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        current_rate: parseFloat(formData.current_rate),
        ot_rate: parseFloat(formData.ot_rate)
      };
      
      if (editingWorker) {
        await workersApi.update(editingWorker.id, submitData);
      } else {
        await workersApi.create(submitData);
      }
      setModalOpen(false);
      resetForm();
      loadWorkers();
    } catch (error) {
      console.error('Error saving worker:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save worker';
      alert('Failed to save worker: ' + errorMessage);
    }
  };

  const handleEdit = (worker) => {
    setEditingWorker(worker);
    setFormData({
      name: worker.name,
      phone: worker.phone || '',
      role: worker.role,
      current_rate: worker.current_rate,
      ot_rate: worker.ot_rate,
      status: worker.status
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this worker?')) return;
    try {
      await workersApi.delete(id);
      loadWorkers();
    } catch (error) {
      console.error('Error deleting worker:', error);
      alert('Failed to delete worker');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      role: 'Male Helper',
      current_rate: '',
      ot_rate: '100',
      status: 'active'
    });
    setEditingWorker(null);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Mestri': return 'bg-purple-100 text-purple-800';
      case 'Male Helper': return 'bg-blue-100 text-blue-800';
      case 'Female Helper': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <Card 
        title="Labor Master"
        action={
          <Button onClick={() => { resetForm(); setModalOpen(true); }} icon="+">
            Add Worker
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Daily Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">OT Hourly Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active State</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Balance</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workers.map((worker) => (
                <tr key={worker.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{worker.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {worker.phone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(worker.role)}`}>
                      {worker.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(worker.current_rate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatCurrency(worker.ot_rate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      worker.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {worker.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(worker.current_balance || 0)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                    <button onClick={() => handleEdit(worker)} className="text-primary-600 hover:text-primary-900">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(worker.id)} className="text-red-600 hover:text-red-900">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {workers.length === 0 && (
            <div className="text-center py-8 text-gray-500">No workers found.</div>
          )}
        </div>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={editingWorker ? 'Edit Worker' : 'Add New Worker'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <SmartInput
              label="Name"
              required
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              suggestions={workerNames}
              placeholder="Enter worker name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <select
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="Mestri">Mestri</option>
              <option value="Male Helper">Male Helper</option>
              <option value="Female Helper">Female Helper</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Daily Rate (₹) *</label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.current_rate}
                onChange={(e) => setFormData({ ...formData, current_rate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">OT Rate/Hr (₹) *</label>
              <input
                type="number"
                required
                step="0.01"Hourly Rate
                value={formData.ot_rate}
                onChange={(e) => setFormData({ ...formData, ot_rate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Active State</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => { setModalOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit">{editingWorker ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Workers;
