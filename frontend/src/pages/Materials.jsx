import { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import SmartInput from '../components/SmartInput';
import { materialsApi, sitesApi } from '../services/api';
import { formatCurrency } from '../utils/helpers';

const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [entries, setEntries] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendorNames, setVendorNames] = useState([]);
  const [units, setUnits] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    material_name: '',
    site_id: '',
    quantity: '',
    unit: 'units',
    rate: '',
    vendor_name: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [paymentData, setPaymentData] = useState({ payment_mode: 'cash', payment_date: new Date().toISOString().split('T')[0], notes: '' });

  useEffect(() => {
    loadMaterials();
    loadEntries();
    loadSites();
  }, []);

  const loadMaterials = async () => {
    try {
      const response = await materialsApi.getAll();
      setMaterials(response.data);
    } catch (error) {
      console.error('Failed to load materials:', error);
    }
  };

  const loadEntries = async () => {
    try {
      setLoading(true);
      const response = await materialsApi.getEntries();
      setEntries(response.data);
      
      // Extract unique vendor names and units for autocomplete
      const uniqueVendors = [...new Set(response.data.map(e => e.vendor_name).filter(Boolean))];
      const uniqueUnits = [...new Set(response.data.map(e => e.material_unit).filter(Boolean))];
      setVendorNames(uniqueVendors);
      setUnits(uniqueUnits);
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setLoading(false);
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

  const resetForm = () => {
    setFormData({
      material_name: '',
      site_id: '',
      quantity: '',
      unit: 'units',
      rate: '',
      vendor_name: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setFilteredMaterials([]);
    setShowSuggestions(false);
    setEditingEntry(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEntry) {
        // Update existing entry - only send editable fields
        const updateData = {
          site_id: formData.site_id,
          quantity: formData.quantity,
          rate: formData.rate,
          vendor_name: formData.vendor_name,
          date: formData.date,
          notes: formData.notes
        };
        await materialsApi.updateEntry(editingEntry.id, updateData);
      } else {
        // Create new entry - send all fields
        await materialsApi.createEntry(formData);
        loadMaterials(); // Refresh materials list to include any new materials
      }
      setModalOpen(false);
      resetForm();
      loadEntries();
    } catch (error) {
      console.error('Failed to save material entry:', error);
      alert('Failed to save material entry');
    }
  };

  const handleMaterialNameChange = (value) => {
    setFormData({ ...formData, material_name: value });
    
    if (value.length >= 1) {
      const filtered = materials.filter(m => 
        m.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredMaterials(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredMaterials([]);
      setShowSuggestions(false);
    }
  };

  const selectMaterial = (material) => {
    setFormData({ 
      ...formData, 
      material_name: material.name,
      unit: material.unit 
    });
    setShowSuggestions(false);
  };

  const handleMarkPaid = async (e) => {
    e.preventDefault();
    try {
      await materialsApi.markEntryPaid(selectedEntry.id, paymentData);
      setPaymentModal(false);
      setSelectedEntry(null);
      setPaymentData({ payment_mode: 'cash', payment_date: new Date().toISOString().split('T')[0], notes: '' });
      loadEntries();
    } catch (error) {
      console.error('Failed to mark entry as paid:', error);
      alert('Failed to mark entry as paid');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    try {
      await materialsApi.deleteEntry(id);
      loadEntries();
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  const openPaymentModal = (entry) => {
    setSelectedEntry(entry);
    setPaymentModal(true);
  };

  const handleEdit = (entry) => {
    // Find the material name from the material_id
    const material = materials.find(m => m.id === entry.material_id);
    
    setEditingEntry(entry);
    setFormData({
      material_name: material?.name || '',
      site_id: entry.site_id,
      quantity: entry.quantity,
      unit: entry.material_unit || 'units',
      rate: entry.rate,
      vendor_name: entry.vendor_name,
      date: entry.date,
      notes: entry.notes || ''
    });
    setModalOpen(true);
  };

  const getMaterialName = (id) => {
    const material = materials.find(m => m.id === id);
    return material?.name || 'Unknown';
  };

  const getSiteName = (id) => {
    const site = sites.find(s => s.id === id);
    return site?.name || 'Unknown';
  };

  const getStatusColor = (status) => {
    return status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="space-y-6">
      <Card
        title="Materials & Expenses"
        action={
          <Button onClick={() => { resetForm(); setModalOpen(true); }} icon="+">
            Add Material Entry
          </Button>
        }
      >
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No material entries recorded yet</p>
            <p className="mt-2 text-sm">Track material deliveries, vendor payments, and expenses.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(entry.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{getMaterialName(entry.material_id)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {getSiteName(entry.site_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {entry.quantity} {entry.material_unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatCurrency(entry.rate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(entry.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {entry.vendor_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(entry.payment_status)}`}>
                        {entry.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                      <button onClick={() => handleEdit(entry)} className="text-blue-600 hover:text-blue-900">
                        Edit
                      </button>
                      {entry.payment_status === 'pending' && (
                        <button onClick={() => openPaymentModal(entry)} className="text-green-600 hover:text-green-900">
                          Mark Paid
                        </button>
                      )}
                      <button onClick={() => handleDelete(entry.id)} className="text-red-600 hover:text-red-900">
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

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm(); setShowSuggestions(false); }} title={editingEntry ? "Edit Material Entry" : "Add Material Entry"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Material Name *</label>
            {editingEntry ? (
              <input
                type="text"
                disabled
                value={formData.material_name}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            ) : (
              <>
                <input
                  type="text"
                  required
                  value={formData.material_name}
                  onChange={(e) => handleMaterialNameChange(e.target.value)}
                  onFocus={() => formData.material_name && setShowSuggestions(filteredMaterials.length > 0)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Cement, Sand, Steel"
                  autoComplete="off"
                />
                {showSuggestions && filteredMaterials.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredMaterials.map((material) => (
                      <div
                        key={material.id}
                        onClick={() => selectMaterial(material)}
                        className="px-4 py-2 hover:bg-primary-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{material.name}</div>
                        <div className="text-xs text-gray-500">Unit: {material.unit}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site *</label>
            <select
              required
              value={formData.site_id}
              onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select Site</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              {editingEntry ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <input
                    type="text"
                    disabled
                    value={formData.unit}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>
              ) : (
                <SmartInput
                  label="Unit"
                  required
                  value={formData.unit}
                  onChange={(value) => setFormData({ ...formData, unit: value })}
                  suggestions={units}
                  placeholder="units, bags, tons"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rate per Unit (₹) *</label>
            <input
              type="number"
              required
              step="0.01"
              min="0"
              value={formData.rate}
              onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <SmartInput
              label="Vendor Name"
              required
              value={formData.vendor_name}
              onChange={(value) => setFormData({ ...formData, vendor_name: value })}
              suggestions={vendorNames}
              placeholder="Enter vendor name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date *</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
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
            <Button type="submit">{editingEntry ? 'Update Entry' : 'Create Entry'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={paymentModal} onClose={() => { setPaymentModal(false); setSelectedEntry(null); }} title="Mark Material Payment">
        <form onSubmit={handleMarkPaid} className="space-y-4">
          {selectedEntry && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Material: <span className="font-medium text-gray-900">{getMaterialName(selectedEntry.material_id)}</span></div>
              <div className="text-sm text-gray-600">Vendor: <span className="font-medium text-gray-900">{selectedEntry.vendor_name}</span></div>
              <div className="text-lg font-semibold text-green-600 mt-1">Amount: {formatCurrency(selectedEntry.total_amount)}</div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
            <select
              required
              value={paymentData.payment_mode}
              onChange={(e) => setPaymentData({ ...paymentData, payment_mode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="upi">UPI</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
            <input
              type="date"
              required
              value={paymentData.payment_date}
              onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={paymentData.notes}
              onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => { setPaymentModal(false); setSelectedEntry(null); }}>
              Cancel
            </Button>
            <Button type="submit">Confirm Payment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Materials;
