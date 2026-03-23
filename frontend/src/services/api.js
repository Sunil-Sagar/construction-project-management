import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Sites API
export const sitesApi = {
  getAll: () => api.get('/sites'),
  getActive: () => api.get('/sites/active'),
  getById: (id) => api.get(`/sites/${id}`),
  create: (data) => api.post('/sites', data),
  update: (id, data) => api.put(`/sites/${id}`, data),
  delete: (id) => api.delete(`/sites/${id}`),
};

// Workers API
export const workersApi = {
  getAll: () => api.get('/workers'),
  getActive: () => api.get('/workers/active'),
  getById: (id) => api.get(`/workers/${id}`),
  getByRole: (role) => api.get(`/workers/role/${role}`),
  create: (data) => api.post('/workers', data),
  update: (id, data) => api.put(`/workers/${id}`, data),
  delete: (id) => api.delete(`/workers/${id}`),
};

// Attendance API
export const attendanceApi = {
  getByDate: (date) => api.get(`/attendance/date/${date}`),
  getByRange: (startDate, endDate, siteId = null, workerId = null) => 
    api.get('/attendance/range', { params: { start_date: startDate, end_date: endDate, site_id: siteId, worker_id: workerId } }),
  getByWorker: (workerId, startDate = null, endDate = null) => 
    api.get(`/attendance/worker/${workerId}`, { params: { start_date: startDate, end_date: endDate } }),
  mark: (data) => api.post('/attendance', data),
  markBulk: (data) => api.post('/attendance/bulk', data),
  update: (id, data) => api.put(`/attendance/${id}`, data),
  delete: (id) => api.delete(`/attendance/${id}`),
};

// Advances API
export const advancesApi = {
  getAll: () => api.get('/advances'),
  getByWorker: (workerId, startDate = null, endDate = null) => 
    api.get(`/advances/worker/${workerId}`, { params: { start_date: startDate, end_date: endDate } }),
  getByRange: (startDate, endDate) => 
    api.get('/advances/range', { params: { start_date: startDate, end_date: endDate } }),
  create: (data) => api.post('/advances', data),
  update: (id, data) => api.put(`/advances/${id}`, data),
  delete: (id) => api.delete(`/advances/${id}`),
};

// Payouts API
export const payoutsApi = {
  getAll: () => api.get('/payouts'),
  getByWeek: (date) => api.get(`/payouts/week/${date}`),
  getPending: () => api.get('/payouts/pending'),
  calculate: (date) => api.post('/payouts/calculate', { date }),
  process: (date) => api.post('/payouts/process', { date }),
  markPaid: (id, data) => api.post(`/payouts/${id}/pay`, data),
  markCarryover: (id, notes) => api.post(`/payouts/${id}/carryover`, { notes }),
  getById: (id) => api.get(`/payouts/${id}`),
  delete: (id) => api.delete(`/payouts/${id}`),
  deleteWeek: (date) => api.delete(`/payouts/week/${date}`),
};

// Materials API
export const materialsApi = {
  getAll: () => api.get('/materials'),
  getEntries: (startDate = null, endDate = null, siteId = null, paymentStatus = null) => 
    api.get('/materials/entries', { params: { start_date: startDate, end_date: endDate, site_id: siteId, payment_status: paymentStatus } }),
  getPendingEntries: () => api.get('/materials/entries/pending'),
  create: (data) => api.post('/materials', data),
  createEntry: (data) => api.post('/materials/entries', data),
  markEntryPaid: (id, data) => api.post(`/materials/entries/${id}/pay`, data),
  update: (id, data) => api.put(`/materials/${id}`, data),
  updateEntry: (id, data) => api.put(`/materials/entries/${id}`, data),
  delete: (id) => api.delete(`/materials/${id}`),
  deleteEntry: (id) => api.delete(`/materials/entries/${id}`),
};

// Milestones API
export const milestonesApi = {
  getAll: () => api.get('/milestones'),
  getBySite: (siteId) => api.get(`/milestones/site/${siteId}`),
  create: (data) => api.post('/milestones', data),
  update: (id, data) => api.put(`/milestones/${id}`, data),
  initialize: (siteId) => api.post(`/milestones/initialize/${siteId}`),
  delete: (id) => api.delete(`/milestones/${id}`),
};

// WIP (Work In-Progress) API
export const wipApi = {
  getAll: (siteId = null, milestoneId = null, startDate = null, endDate = null) => 
    api.get('/wip', { params: { site_id: siteId, milestone_id: milestoneId, start_date: startDate, end_date: endDate } }),
  getById: (id) => api.get(`/wip/${id}`),
  getByMilestone: (milestoneId) => api.get(`/wip/milestone/${milestoneId}`),
  create: (data) => api.post('/wip', data),
  update: (id, data) => api.put(`/wip/${id}`, data),
  delete: (id) => api.delete(`/wip/${id}`),
};

// Reports API
export const reportsApi = {
  attendance: (startDate, endDate, siteId = null) => 
    api.get('/reports/attendance', { params: { start_date: startDate, end_date: endDate, site_id: siteId } }),
  laborCost: (startDate, endDate, siteId = null, workerId = null) => 
    api.get('/reports/labor-cost', { params: { start_date: startDate, end_date: endDate, site_id: siteId, worker_id: workerId } }),
  financialOutflow: (startDate, endDate) => 
    api.get('/reports/financial-outflow', { params: { start_date: startDate, end_date: endDate } }),
  materialConsumption: (startDate, endDate, siteId = null) => 
    api.get('/reports/material-consumption', { params: { start_date: startDate, end_date: endDate, site_id: siteId } }),
  milestoneProgress: (siteId = null) => 
    api.get('/reports/milestone-progress', { params: { site_id: siteId } }),
  dashboardSummary: () => api.get('/reports/dashboard-summary'),
};

export default api;
