/**
 * complaintService.js
 *
 * Civic report CRUD — backed by the Express API which writes to Supabase.
 * Keeps the same public function signatures as the previous localStorage
 * version so page components need no changes.
 *
 * Falls back gracefully: if the backend is unreachable the service throws
 * a structured error that callers can display to the user.
 */
import { apiFetch }            from './apiClient';
import { supabase }            from '../lib/supabaseClient';
import { getFromStorage, saveToStorage } from './storage';

// ─────────────────────────────────────────────────────────────
// Image upload helper — uploads a File to Supabase Storage and
// returns the storage object path (NOT a signed URL).
// ─────────────────────────────────────────────────────────────
const BUCKET = 'report-images';
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function uploadReportImage(file, userId) {
  if (!file) return null;

  if (file.size > MAX_FILE_BYTES) {
    throw Object.assign(new Error('Image must be 5 MB or smaller.'), { code: 'INVALID_FILE' });
  }
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    throw Object.assign(new Error('Only JPEG, PNG and WebP images are accepted.'), { code: 'INVALID_FILE' });
  }

  // Build a safe, non-guessable path:  {userId}/{timestamp}-{randomHex}.{ext}
  const ext      = file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const rand     = Math.random().toString(16).slice(2, 10);
  const objPath  = `${userId}/${Date.now()}-${rand}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(objPath, file, { cacheControl: '3600', upsert: false, contentType: file.type });

  if (error) throw Object.assign(new Error(`Image upload failed: ${error.message}`), { code: 'UPLOAD_FAILED' });

  return objPath;   // store this path in reports.image_path
}

/**
 * Returns a short-lived signed URL for a storage object path.
 * Defaults to 1 hour expiry.
 */
export async function getImageUrl(imagePath, expiresInSeconds = 3600) {
  if (!imagePath) return null;
  // If it's already an http URL (legacy mock data) return as-is
  if (imagePath.startsWith('http')) return imagePath;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(imagePath, expiresInSeconds);

  if (error) {
    console.warn('[complaintService] Could not create signed URL:', error.message);
    return null;
  }
  return data.signedUrl;
}

// ─────────────────────────────────────────────────────────────
// Department mapping (kept for UI badge compatibility)
// ─────────────────────────────────────────────────────────────
const categoryDeptMap = {
  Road:        'Road Maintenance',
  Sanitation:  'Sanitation',
  Water:       'Water Supply',
  Electricity: 'Electrical',
  Drainage:    'Drainage',
  road:        'Road Maintenance',
  sanitation:  'Sanitation',
  water:       'Water Supply',
  electricity: 'Electrical',
  drainage:    'Drainage',
  pothole:     'Road Maintenance',
  garbage:     'Sanitation',
  streetlight: 'Electrical',
};

// ─────────────────────────────────────────────────────────────
// Normalize a Supabase report row into the shape the UI expects.
// ─────────────────────────────────────────────────────────────
function normalize(r) {
  if (!r) return null;
  return {
    // Core fields (kept identical)
    id:                  r.tracking_id || r.id,
    dbId:                r.id,
    trackingId:          r.tracking_id,
    category:            r.category,
    title:               r.title,
    description:         r.description,
    location:            r.address || `${r.latitude}, ${r.longitude}`,
    latitude:            r.latitude,
    longitude:           r.longitude,
    image:               r.image_path,   // callers use getImageUrl() when displaying
    priority:            r.priority ? capitalize(r.priority) : 'Medium',
    status:              r.status   ? capitalizeStatus(r.status) : 'Submitted',
    assignedDepartment:  categoryDeptMap[r.category] || 'Road Maintenance',
    dateReported:        r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', {
                           month: 'short', day: '2-digit', year: 'numeric'
                         }) : '',
    createdAt:           r.created_at,
    updatedAt:           r.updated_at,
    resolvedAt:          r.resolved_at,
    aiCategory:          r.ai_category,
    aiConfidence:        r.ai_confidence,
    // Worker / assignment fields (preserved for dept/worker dashboards)
    assignedTo:          r.assigned_to,
    // Worker assignment fields are local-only: WORKER_ASSIGNMENTS in
    // localStorage (see the department/worker helpers below). The reports
    // table has no worker_ids / worker_updates columns, so keep the shape
    // the dashboards expect but never read them off the DB row.
    workerIds:           [],
    workerUpdates:       [],
    timeline:            buildTimeline(r),
    authorityUpdate:     'Report logged in Supabase.',
    resolution:          null,
    feedback:            null,
  };
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function capitalizeStatus(s) {
  if (!s) return 'Submitted';
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function buildTimeline(r) {
  const statuses = ['Submitted', 'Under Review', 'In Progress', 'Resolved'];
  const current  = capitalizeStatus(r.status);
  const idx      = statuses.findIndex(s => s === current);
  return statuses.map((s, i) => ({
    status:    s,
    timestamp: i <= idx ? (r.created_at ? new Date(r.created_at).toLocaleString() : null) : null,
    completed: i <= idx,
  }));
}

// ─────────────────────────────────────────────────────────────
// Public API — same shape as the old localStorage service
// ─────────────────────────────────────────────────────────────

export const complaintService = {

  /** Fetch all reports belonging to the current user. */
  async getMyComplaints() {
    try {
      const { reports } = await apiFetch('/api/reports/mine');
      return (reports || []).map(normalize);
    } catch (err) {
      console.error('[complaintService] getMyComplaints failed:', err.message);
      // Fall back to localStorage demo data so the UI doesn't break
      return getFromStorage('COMPLAINTS') || [];
    }
  },

  /** Fetch a paginated list of all reports (public). */
  async getAllComplaints({ category, status, priority, page = 1, pageSize = 20 } = {}) {
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (status)   params.set('status',   status);
      if (priority) params.set('priority', priority);
      params.set('page',     page);
      params.set('pageSize', pageSize);

      const { reports, total } = await apiFetch(`/api/reports?${params}`);
      return { reports: (reports || []).map(normalize), total: total || 0 };
    } catch (err) {
      console.error('[complaintService] getAllComplaints failed:', err.message);
      const local = getFromStorage('COMPLAINTS') || [];
      return { reports: local, total: local.length };
    }
  },

  /** Fetch a single report by its database UUID or tracking_id. */
  async getComplaintById(id) {
    try {
      // Try tracking ID format first (CIV-XXXXXXXX)
      if (/^CIV-/i.test(id)) {
        const { report, history } = await apiFetch(`/api/reports/track/${id}`);
        const norm = normalize(report);
        norm.statusHistory = history || [];
        return norm;
      }
      const { report, history } = await apiFetch(`/api/reports/${id}`);
      const norm = normalize(report);
      norm.statusHistory = history || [];
      return norm;
    } catch (err) {
      console.error('[complaintService] getComplaintById failed:', err.message);
      // Fall back to localStorage
      const complaints = getFromStorage('COMPLAINTS') || [];
      return complaints.find(c => c.id === id) || null;
    }
  },

  /**
   * Create a new report.
   * Accepts the same shape as before but now:
   *   - uploads data.imageFile (File object) to Supabase Storage
   *   - posts to the backend API
   *   - falls back to localStorage on backend unavailability
   */
  async createComplaint(data) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw Object.assign(new Error('Please log in to submit a report.'), { code: 'AUTH_REQUIRED' });
      }

      // Upload image file if provided (File object)
      let imagePath = null;
      if (data.imageFile instanceof File) {
        imagePath = await uploadReportImage(data.imageFile, user.id);
      } else if (data.image && !data.image.startsWith('blob:') && !data.image.startsWith('data:')) {
        // Already a URL (preset mock image) — store as-is for demo
        imagePath = data.image;
      }

      const payload = {
        title:          data.title || data.description?.slice(0, 60) || 'Civic Issue',
        description:    data.description,
        category:       (data.category || 'other').toLowerCase(),
        latitude:       parseFloat(data.latitude  || data.lat  || 0),
        longitude:      parseFloat(data.longitude || data.lng  || 0),
        address:        data.location || data.address || null,
        image_path:     imagePath,
        ai_category:    data.ai_category    || null,
        ai_confidence:  data.ai_confidence  || null,
        priority:       (data.priority || 'medium').toLowerCase(),
      };

      const { report } = await apiFetch('/api/reports', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const norm = normalize(report);

      // Mirror into localStorage so offline/demo views still work
      const local = getFromStorage('COMPLAINTS') || [];
      local.unshift(norm);
      saveToStorage('COMPLAINTS', local);

      // Add a notification to localStorage
      const notifs = getFromStorage('NOTIFICATIONS') || [];
      notifs.unshift({
        id:          `notif-${Date.now()}`,
        complaintId: norm.id,
        title:       'Complaint Submitted Successfully',
        message:     `Your complaint ${norm.id} has been logged and saved to the database.`,
        type:        'info',
        timestamp:   'Just now',
        read:        false,
      });
      saveToStorage('NOTIFICATIONS', notifs);

      return norm;
    } catch (err) {
      // Fall back to local demo storage ONLY when the backend is unreachable (network error)
      // or the database is not configured (503). Auth, validation, upload and other server
      // errors must reach the user; otherwise the UI shows success for a report that was never saved.
      const canFallBack = !err.code && (err.status === undefined || err.status === 503);
      if (!canFallBack) throw err;
      console.error('[complaintService] createComplaint failed, falling back to localStorage:', err.message);

      // Graceful offline fallback — preserve original localStorage behaviour
      const complaints = getFromStorage('COMPLAINTS') || [];
      const nextNum = complaints.reduce((max, c) => {
        const num = parseInt((c.id || '').split('-')[1] || '0', 10);
        return num > max ? num : max;
      }, 1025) + 1;
      const newId = `CIV-${nextNum}`;

      const fallback = {
        id:                  newId,
        trackingId:          newId,
        category:            data.category || 'other',
        title:               data.title || data.description?.slice(0, 60) || 'Civic Issue',
        description:         data.description,
        location:            data.location || 'Unknown',
        latitude:            data.latitude || '11.0168',
        longitude:           data.longitude || '76.9558',
        dateReported:        new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        priority:            data.priority || 'Medium',
        status:              'Submitted',
        assignedDepartment:  categoryDeptMap[data.category] || 'Road Maintenance',
        image:               data.image || null,
        possibleDuplicateOf: data.possibleDuplicateOf || [],
        timeline: [
          { status: 'Submitted',   timestamp: new Date().toLocaleString(), completed: true },
          { status: 'Acknowledged', timestamp: null, completed: false },
          { status: 'Assigned',    timestamp: null, completed: false },
          { status: 'In Progress', timestamp: null, completed: false },
          { status: 'Resolved',    timestamp: null, completed: false },
        ],
        authorityUpdate: 'Complaint received (offline mode — will sync when backend is available).',
        resolution:  null,
        feedback:    null,
      };
      complaints.unshift(fallback);
      saveToStorage('COMPLAINTS', complaints);

      const notifs = getFromStorage('NOTIFICATIONS') || [];
      notifs.unshift({
        id:          `notif-${Date.now()}`,
        complaintId: newId,
        title:       'Complaint Submitted (Offline)',
        message:     `Your complaint ${newId} was saved locally. It will sync when the database is available.`,
        type:        'info',
        timestamp:   'Just now',
        read:        false,
      });
      saveToStorage('NOTIFICATIONS', notifs);

      return fallback;
    }
  },

  /** Update report status — officers/admins only. */
  async updateReportStatus(id, newStatus, comment = '') {
    try {
      // Resolve DB UUID from tracking ID if needed
      let dbId = id;
      if (/^CIV-/i.test(id)) {
        const { report } = await apiFetch(`/api/reports/track/${id}`);
        dbId = report?.id || id;
      }
      const { report } = await apiFetch(`/api/reports/${dbId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus.toLowerCase(), comment }),
      });
      return normalize(report);
    } catch (err) {
      console.error('[complaintService] updateReportStatus failed:', err.message);
      throw err;
    }
  },

  /** Dashboard stats — tries API first, falls back to localStorage counts. */
  async getDashboardStats() {
    try {
      const { reports, total } = await this.getAllComplaints({ pageSize: 200 });
      const pending    = reports.filter(r => ['Submitted','Under Review','Acknowledged','Assigned'].includes(r.status)).length;
      const inProgress = reports.filter(r => r.status === 'In Progress').length;
      const resolved   = reports.filter(r => r.status === 'Resolved').length;
      return { total: total || reports.length, pending, inProgress, resolved };
    } catch {
      const complaints = getFromStorage('COMPLAINTS') || [];
      return {
        total:      complaints.length,
        pending:    complaints.filter(c => ['Submitted','Acknowledged','Assigned'].includes(c.status)).length,
        inProgress: complaints.filter(c => c.status === 'In Progress').length,
        resolved:   complaints.filter(c => c.status === 'Resolved').length,
      };
    }
  },

  /** Submit user feedback — localStorage only for now. */
  async submitFeedback(id, feedbackData) {
    const complaints = getFromStorage('COMPLAINTS') || [];
    const idx = complaints.findIndex(c => c.id === id);
    if (idx !== -1) {
      complaints[idx].feedback = feedbackData;
      saveToStorage('COMPLAINTS', complaints);
      return complaints[idx];
    }
    throw new Error('Complaint not found');
  },

  // ── Department-specific helpers (localStorage, unchanged from original) ──

  async getDepartmentComplaints(deptName = 'Road Maintenance') {
    try {
      const { reports } = await this.getAllComplaints({ pageSize: 100 });
      return reports.filter(r => {
        const dept = (categoryDeptMap[r.category] || '').toLowerCase();
        return dept.includes(deptName.toLowerCase()) || deptName === 'All';
      });
    } catch {
      return getFromStorage('COMPLAINTS') || [];
    }
  },

  async getDepartmentStats(deptName = 'Road Maintenance') {
    const complaints = await this.getDepartmentComplaints(deptName);
    const assignments = getFromStorage('WORKER_ASSIGNMENTS') || {};
    const resolved  = complaints.filter(c => c.status === 'Resolved').length;
    const assigned  = complaints.filter(c => assignments[c.id]?.workerIds?.length > 0).length;
    return {
      complaintsArised:  Math.max(48, complaints.length + 40),
      assignedToWorkers: Math.max(31, assigned),
      resolved:          Math.max(17, resolved),
    };
  },

  async assignWorkerToComplaint(complaintId, workerIds) {
    const assignments = getFromStorage('WORKER_ASSIGNMENTS') || {};
    const existing    = assignments[complaintId] || { workerIds: [], updates: [] };
    assignments[complaintId] = { ...existing, workerIds };
    saveToStorage('WORKER_ASSIGNMENTS', assignments);

    const complaints = getFromStorage('COMPLAINTS') || [];
    const idx        = complaints.findIndex(c => c.id === complaintId);
    if (idx !== -1 && ['Submitted','Acknowledged'].includes(complaints[idx].status)) {
      complaints[idx].status = 'Assigned';
      saveToStorage('COMPLAINTS', complaints);
    }
    return assignments[complaintId];
  },

  async getWorkerAllocatedComplaints(workerId = 'WRK-001') {
    const complaints  = getFromStorage('COMPLAINTS') || [];
    const assignments = getFromStorage('WORKER_ASSIGNMENTS') || {};
    const allocated   = complaints.filter(c =>
      assignments[c.id]?.workerIds?.includes(workerId)
    );
    if (allocated.length === 0 && workerId.startsWith('WRK')) {
      return complaints.filter(c => ['CIV-1024','CIV-1011','CIV-1012'].includes(c.id));
    }
    return allocated;
  },

  async updateWorkByWorker(complaintId, { workerId, workerName, status, remarks, image }) {
    const complaints  = getFromStorage('COMPLAINTS') || [];
    const assignments = getFromStorage('WORKER_ASSIGNMENTS') || {};
    const idx         = complaints.findIndex(c => c.id === complaintId);
    if (idx === -1) throw new Error('Complaint not found');

    const ts        = new Date().toLocaleString('en-US', { month:'short', day:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
    const newStatus = status === 'Completed' ? 'Resolved' : 'In Progress';
    complaints[idx].status = newStatus;
    complaints[idx].authorityUpdate = `Worker (${workerName || 'Assigned'}): ${remarks}`;
    if (newStatus === 'Resolved') {
      complaints[idx].resolution = {
        beforeImage:  complaints[idx].image,
        afterImage:   image || 'https://images.unsplash.com/photo-1605281317010-fe5fed77a941?w=600&auto=format&fit=crop&q=80',
        description:  remarks,
        resolvedDate: ts,
      };
    }
    saveToStorage('COMPLAINTS', complaints);

    const existing = assignments[complaintId] || { workerIds: [workerId || 'WRK-001'], updates: [] };
    existing.updates = [{ workerId, workerName, status, remarks, timestamp: ts, image: image || null }, ...existing.updates];
    assignments[complaintId] = existing;
    saveToStorage('WORKER_ASSIGNMENTS', assignments);

    // Also update status in Supabase if backend is available
    try {
      await this.updateReportStatus(complaintId, newStatus, `Worker update: ${remarks}`);
    } catch { /* non-critical — localStorage already updated */ }

    return complaints[idx];
  },
};
