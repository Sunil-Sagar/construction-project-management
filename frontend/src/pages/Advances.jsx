import { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { advancesApi, workersApi } from '../services/api';
import { formatCurrency } from '../utils/helpers';

const Advances = () => {
  const [advances, setAdvances] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState(null);
  const [formData, setFormData] = useState({
    worker_id: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    payment_mode: 'Cash',
    notes: ''
  });

  useEffect(() => {
    loadAdvances();
    loadWorkers();
  }, []);

  const loadAdvances = async () => {
    try {
      const response = await advancesApi.getAll();
      setAdvances(response.data);
    } catch (error) {
      console.error('Failed to load advances:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkers = async () => {
    try {
      const response = await workersApi.getActive();
      setWorkers(response.data);
    } catch (error) {
      console.error('Failed to load workers:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      worker_id: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      payment_mode: 'Cash',
      notes: ''
    });
    setEditingAdvance(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAdvance) {
        await advancesApi.update(editingAdvance.id, formData);
      } else {
        await advancesApi.create(formData);
      }
      setModalOpen(false);
      resetForm();
      loadAdvances();
    } catch (error) {
      console.error('Failed to save advance:', error);
      alert('Failed to save advance');
    }
  };

  const handleEdit = (advance) => {
    setEditingAdvance(advance);
    setFormData({
      worker_id: advance.worker_id,
      amount: advance.amount,
      date: advance.date,
      payment_mode: advance.payment_mode || 'Cash',
      notes: advance.notes || ''
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this advance?')) return;
    try {
      await advancesApi.delete(id);
      loadAdvances();
    } catch (error) {
      console.error('Failed to delete advance:', error);
    }
  };

  const getWorkerName = (workerId) => {
    const worker = workers.find(w => w.id === workerId);
    return worker?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <Card
        title="Advances & Cash Outs"
        action={
          <Button onClick={() => { resetForm(); setModalOpen(true); }} icon="+">
            Add Advance
          </Button>
        }
      >
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : advances.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No advances recorded yet</p>
            <p className="mt-2 text-sm">Record cash advances given to workers.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worker</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {advances.map((advance) => (
                  <tr key={advance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(advance.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{getWorkerName(advance.worker_id)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                      - {formatCurrency(advance.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {advance.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                      <button onClick={() => handleEdit(advance)} className="text-primary-600 hover:text-primary-900">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(advance.id)} className="text-red-600 hover:text-red-900">
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

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={editingAdvance ? 'Edit Advance' : 'Add New Advance'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Worker *</label>
            <select
              required
              value={formData.worker_id}
              onChange={(e) => setFormData({ ...formData, worker_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select Worker</option>
              {workers.map(worker => (
                <option key={worker.id} value={worker.id}>{worker.name} - {worker.role}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
            <input
              type="number"
              required
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
            <select
              required
              value={formData.payment_mode}
              onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => { setModalOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit">{editingAdvance ? 'Update' : 'Create'} Advance</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Advances;
