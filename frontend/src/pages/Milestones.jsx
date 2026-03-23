import { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import SmartInput from '../components/SmartInput';
import { milestonesApi, sitesApi } from '../services/api';

const Milestones = () => {
  const [milestones, setMilestones] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [selectedSite, setSelectedSite] = useState('all');
  const [availablePhases, setAvailablePhases] = useState([]);
  const [formData, setFormData] = useState({
    site_id: '',
    phase: '',
    notes: '',
    completion_date: '',
    status: 'not-started'
  });

  useEffect(() => {
    loadMilestones();
    loadSites();
  }, []);

  const loadMilestones = async () => {
    try {
      setLoading(true);
      const response = await milestonesApi.getAll();
      setMilestones(response.data);
      
      // Default phases list
      const defaultPhases = [
        'Site Preparation',
        'Excavation',
        'PCC',
        'Footing',
        'Back Filling',
        'Plinth Beam',
        'Column Casting',
        'Slab Work',
        'Brickwork',
        'Plastering',
        'Flooring',
        'Electrical',
        'Plumbing',
        'Painting',
        'Finishing'
      ];
      
      // Extract unique phases from existing milestones
      const existingPhases = [...new Set(response.data.map(m => m.phase).filter(Boolean))];
      
      // Combine and deduplicate
      const allPhases = [...new Set([...defaultPhases, ...existingPhases])];
      setAvailablePhases(allPhases);
    } catch (error) {
      console.error('Failed to load milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSites = async () => {
    try {
      const response = await sitesApi.getAll();
      setSites(response.data);
    } catch (error) {
      console.error('Failed to load sites:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      site_id: '',
      phase: '',
      notes: '',
      completion_date: '',
      status: 'not-started'
    });
    setEditingMilestone(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMilestone) {
        await milestonesApi.update(editingMilestone.id, formData);
      } else {
        await milestonesApi.create(formData);
      }
      setModalOpen(false);
      resetForm();
      loadMilestones();
    } catch (error) {
      console.error('Failed to save milestone:', error);
      alert('Failed to save milestone');
    }
  };

  const handleEdit = (milestone) => {
    setEditingMilestone(milestone);
    setFormData({
      site_id: milestone.site_id,
      phase: milestone.phase,
      notes: milestone.notes || '',
      completion_date: milestone.completion_date || '',
      status: milestone.status
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this milestone?')) return;
    try {
      await milestonesApi.delete(id);
      loadMilestones();
    } catch (error) {
      console.error('Failed to delete milestone:', error);
    }
  };

  const handleInitialize = async (siteId) => {
    if (!confirm('Initialize default milestones for this site?')) return;
    try {
      await milestonesApi.initialize(siteId);
      loadMilestones();
    } catch (error) {
      console.error('Failed to initialize milestones:', error);
    }
  };

  const getSiteName = (siteId) => {
    const site = sites.find(s => s.id === siteId);
    return site?.name || 'Unknown';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'not-started': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredMilestones = selectedSite === 'all' 
    ? milestones 
    : milestones.filter(m => m.site_id === parseInt(selectedSite));

  const groupedBySite = filteredMilestones.reduce((acc, milestone) => {
    const siteName = getSiteName(milestone.site_id);
    if (!acc[siteName]) acc[siteName] = [];
    acc[siteName].push(milestone);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Card
        title="Project Milestones"
        action={
          <div className="flex gap-3">
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Sites</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
            <Button onClick={() => { resetForm(); setModalOpen(true); }} icon="+">
              Add Milestone
            </Button>
          </div>
        }
      >
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : filteredMilestones.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No milestones yet</p>
            <p className="mt-2 text-sm">Track construction phases and project progress.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedBySite).map(([siteName, siteMilestones]) => (
              <div key={siteName} className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{siteName}</h3>
                <div className="space-y-3">
                  {siteMilestones.map((milestone) => (
                    <div key={milestone.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(milestone.status)}`}>
                            {milestone.status.replace('_', ' ')}
                          </span>
                          <span className="font-medium text-gray-900">{milestone.phase}</span>
                        </div>
                        {milestone.notes && (
                          <p className="text-sm text-gray-600 mt-1">{milestone.notes}</p>
                        )}
                        {milestone.status === 'completed' && milestone.actual_completion_date && milestone.completion_date ? (
                          <div className="text-xs mt-1 space-y-0.5">
                            <p className="text-gray-700">
                              <span className="font-medium">Completed:</span> {new Date(milestone.actual_completion_date).toLocaleDateString('en-IN')}
                            </p>
                            <p className="text-gray-700">
                              <span className="font-medium">Target:</span> {new Date(milestone.completion_date).toLocaleDateString('en-IN')}
                            </p>
                            {(() => {
                              const actualDate = new Date(milestone.actual_completion_date);
                              const targetDate = new Date(milestone.completion_date);
                              const diffTime = actualDate - targetDate;
                              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                              
                              if (diffDays < 0) {
                                return (
                                  <p className="text-green-600 font-medium">
                                    ✓ Early Completion ({Math.abs(diffDays)} {Math.abs(diffDays) === 1 ? 'day' : 'days'} ahead)
                                  </p>
                                );
                              } else if (diffDays > 0) {
                                return (
                                  <p className="text-orange-600 font-medium">
                                    ⚠ Delayed ({diffDays} {diffDays === 1 ? 'day' : 'days'} late)
                                  </p>
                                );
                              } else {
                                return (
                                  <p className="text-blue-600 font-medium">
                                    ✓ Completed On-Time
                                  </p>
                                );
                              }
                            })()}
                          </div>
                        ) : milestone.completion_date ? (
                          <p className="text-xs text-gray-500 mt-1">
                            Target: {new Date(milestone.completion_date).toLocaleDateString('en-IN')}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(milestone)} className="text-primary-600 hover:text-primary-900 text-sm">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(milestone.id)} className="text-red-600 hover:text-red-900 text-sm">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={editingMilestone ? 'Edit Milestone' : 'Add New Milestone'}>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <SmartInput
              label="Phase"
              required
              value={formData.phase}
              onChange={(value) => setFormData({ ...formData, phase: value })}
              suggestions={availablePhases}
              placeholder="Select or type a phase"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              placeholder="Additional details about this milestone"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Completion Date</label>
            <input
              type="date"
              value={formData.completion_date}
              onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
            <select
              required
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="not-started">Not Started</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => { setModalOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit">{editingMilestone ? 'Update' : 'Create'} Milestone</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Milestones;
