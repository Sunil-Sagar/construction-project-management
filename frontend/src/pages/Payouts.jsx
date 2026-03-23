import { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { payoutsApi } from '../services/api';
import { formatCurrency } from '../utils/helpers';

const Payouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getSaturday());
  const [calculatedPayouts, setCalculatedPayouts] = useState([]);
  const [hasExistingPayouts, setHasExistingPayouts] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [paymentData, setPaymentData] = useState({ payment_mode: 'cash', payment_date: new Date().toISOString().split('T')[0], amount_paid: 0, notes: '' });

  function getSaturday() {
    const today = new Date();
    const day = today.getDay();
    const diff = (day === 6) ? 0 : (6 - day + 7) % 7;
    const saturday = new Date(today);
    saturday.setDate(today.getDate() + diff - 7);
    return saturday.toISOString().split('T')[0];
  }

  useEffect(() => {
    loadPayouts();
  }, [selectedDate]);

  const loadPayouts = async () => {
    try {
      setLoading(true);
      const response = await payoutsApi.getByWeek(selectedDate);
      setPayouts(response.data);
    } catch (error) {
      console.error('Failed to load payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    try {
      // Check if payouts already exist for this week
      const existingResponse = await payoutsApi.getByWeek(selectedDate);
      const alreadyExists = existingResponse.data && existingResponse.data.length > 0;
      setHasExistingPayouts(alreadyExists);
      
      const response = await payoutsApi.calculate(selectedDate);
      setCalculatedPayouts(response.data.workers || []);
      
      if (alreadyExists) {
        alert('Note: Payouts already exist for this week. This is just a preview. If you want to recalculate, use "Delete This Week" first.');
      }
      
      setModalOpen(true);
    } catch (error) {
      console.error('Failed to calculate payouts:', error);
      alert('Failed to calculate payouts');
    }
  };

  const handleProcess = async () => {
    try {
      await payoutsApi.process(selectedDate);
      setModalOpen(false);
      loadPayouts();
      alert('Payouts processed successfully!');
    } catch (error) {
      console.error('Failed to process payouts:', error);
      if (error.response?.status === 409) {
        alert(error.response.data.message || 'This week has already been processed. Delete existing payouts first if you want to recalculate.');
      } else {
        alert('Failed to process payouts');
      }
    }
  };

  const handleMarkPaid = async (e) => {
    e.preventDefault();
    try {
      await payoutsApi.markPaid(selectedPayout.id, paymentData);
      setPaymentModal(false);
      setSelectedPayout(null);
      setPaymentData({ payment_mode: 'cash', payment_date: new Date().toISOString().split('T')[0], amount_paid: 0, notes: '' });
      loadPayouts();
    } catch (error) {
      console.error('Failed to mark payout as paid:', error);
      alert('Failed to mark payout as paid');
    }
  };

  const handleMarkCarryover = async (id) => {
    const notes = prompt('Enter reason for carryover:');
    if (!notes) return;
    try {
      await payoutsApi.markCarryover(id, notes);
      loadPayouts();
    } catch (error) {
      console.error('Failed to mark payout as carryover:', error);
    }
  };

  const handleDeletePayout = async (id) => {
    if (!confirm('Are you sure you want to delete this payout? This action cannot be undone.')) return;
    try {
      await payoutsApi.delete(id);
      loadPayouts();
    } catch (error) {
      console.error('Failed to delete payout:', error);
      alert('Failed to delete payout');
    }
  };

  const handleDeleteWeek = async () => {
    if (!confirm(`Are you sure you want to delete ALL payouts for week ending ${selectedDate}? This action cannot be undone.`)) return;
    try {
      const response = await payoutsApi.deleteWeek(selectedDate);
      alert(response.data.message);
      loadPayouts();
    } catch (error) {
      console.error('Failed to delete week payouts:', error);
      alert('Failed to delete week payouts');
    }
  };

  const openPaymentModal = (payout) => {
    setSelectedPayout(payout);
    setPaymentData({ 
      ...paymentData, 
      amount_paid: payout.net_payable 
    });
    setPaymentModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'carryover': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card
        title="Saturday Settlement"
        action={
          <div className="flex gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
            <Button onClick={handleCalculate} icon="+">
              Calculate Payouts
            </Button>
            {payouts.length > 0 && (
              <Button onClick={handleDeleteWeek} variant="secondary">
                Delete This Week
              </Button>
            )}
          </div>
        }
      >
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : payouts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No payouts for week ending {selectedDate}</p>
            <p className="mt-2 text-sm">Click "Calculate Payouts" to generate weekly settlement.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worker</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Worked</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">OT Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross Wages</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Advances</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Payable</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payout.worker_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {payout.days_worked}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {payout.ot_hours}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(payout.gross_wage)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {formatCurrency(payout.advances)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                      payout.net_payable >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(payout.net_payable)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payout.status)}`}>
                        {payout.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                      {payout.status === 'pending' && (
                        <>
                          <button onClick={() => openPaymentModal(payout)} className="text-green-600 hover:text-green-900">
                            Mark Paid
                          </button>
                          <button onClick={() => handleMarkCarryover(payout.id)} className="text-blue-600 hover:text-blue-900">
                            Carryover
                          </button>
                        </>
                      )}
                      <button onClick={() => handleDeletePayout(payout.id)} className="text-red-600 hover:text-red-900">
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`Calculated Payouts - Week ending ${selectedDate}`}>
        <div className="space-y-4">
          {calculatedPayouts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">No attendance records found for this week</p>
              <p className="mt-2 text-sm">Mark daily attendance first, then calculate payouts.</p>
            </div>
          ) : (
            <>
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Worker</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Days</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Net Payable</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {calculatedPayouts.map((payout, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm">{payout.worker_name}</td>
                        <td className="px-4 py-2 text-sm">{payout.days_worked}</td>
                        <td className={`px-4 py-2 text-sm font-semibold ${
                          payout.net_payable >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(payout.net_payable)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {hasExistingPayouts && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                  ⚠️ Payouts already exist for this week. Delete existing payouts first if you want to recalculate.
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                  {hasExistingPayouts ? 'Close' : 'Cancel'}
                </Button>
                {!hasExistingPayouts && (
                  <Button onClick={handleProcess}>Process Payouts</Button>
                )}
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal isOpen={paymentModal} onClose={() => { setPaymentModal(false); setSelectedPayout(null); }} title="Mark Payout as Paid">
        <form onSubmit={handleMarkPaid} className="space-y-4">
          {selectedPayout && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Worker: <span className="font-medium text-gray-900">{selectedPayout.worker_name}</span></div>
              <div className="text-lg font-semibold text-green-600 mt-1">Amount: {formatCurrency(selectedPayout.net_payable)}</div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Pay (₹) *</label>
            <input
              type="number"
              required
              step="0.01"
              min="0"
              value={paymentData.amount_paid}
              onChange={(e) => setPaymentData({ ...paymentData, amount_paid: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
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
            <Button type="button" variant="secondary" onClick={() => { setPaymentModal(false); setSelectedPayout(null); }}>
              Cancel
            </Button>
            <Button type="submit">Confirm Payment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Payouts;
