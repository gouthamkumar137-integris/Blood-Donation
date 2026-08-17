let loggedInDonor = null;

document.addEventListener('DOMContentLoaded', () => {
  setMinimumDateTime();
  loadDonors();
  loadRequests();
});

// Smooth Scroll for Header
function scrollToSec(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}

// Modal Helpers
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// Phone Validation
function validatePhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

// Restrict Past Date/Time
function setMinimumDateTime() {
  const timeInput = document.getElementById('req-time');
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  timeInput.min = now.toISOString().slice(0, 16);
}

// Fetch Only Available Donors
async function loadDonors() {
  const bg = document.getElementById('search-bg').value;
  const loc = document.getElementById('search-loc').value;

  const res = await fetch(`/api/donors?blood_group=${encodeURIComponent(bg)}&location=${encodeURIComponent(loc)}`);
  const donors = await res.json();

  const container = document.getElementById('donors-list');
  if (!donors.length) {
    container.innerHTML = '<p style="color:#777; font-size:13px;">No available donors found.</p>';
    return;
  }

  container.innerHTML = donors.map(d => `
    <div class="item-box">
      <div>
        <strong>${d.name}</strong> <span class="badge">${d.blood_group}</span>
        <div style="font-size:12px; color:#666; margin-top:3px;">
          Location: ${d.location}
        </div>
      </div>
    </div>
  `).join('');
}

// Donor Register
async function handleRegister(e) {
  e.preventDefault();
  const contact = document.getElementById('reg-contact').value;

  if (!validatePhone(contact)) {
    alert('Please enter a valid 10-digit mobile number.');
    return;
  }

  const payload = {
    name: document.getElementById('reg-name').value,
    email: document.getElementById('reg-email').value,
    blood_group: document.getElementById('reg-bg').value,
    contact: contact,
    location: document.getElementById('reg-location').value,
    notes: document.getElementById('reg-notes').value
  };

  const res = await fetch('/api/donors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (res.ok) {
    alert('Registered successfully!');
    closeModal('register-modal');
    loginSession({ id: data.id, name: payload.name, email: payload.email, available: 1, contact: payload.contact, location: payload.location, blood_group: payload.blood_group });
  } else {
    alert(data.error);
  }
}

// Donor Login
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;

  const res = await fetch('/api/donors/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  const data = await res.json();
  if (res.ok) {
    closeModal('login-modal');
    loginSession(data);
  } else {
    alert(data.error);
  }
}

function loginSession(donor) {
  loggedInDonor = donor;
  document.getElementById('user-name').innerText = donor.name;
  document.getElementById('avail-checkbox').checked = donor.available === 1;
  document.getElementById('session-bar').classList.remove('hidden');
  document.getElementById('auth-buttons').classList.add('hidden');
  loadDonors();
}

function logout() {
  loggedInDonor = null;
  document.getElementById('session-bar').classList.add('hidden');
  document.getElementById('auth-buttons').classList.remove('hidden');
  loadDonors();
}

// Toggle Donor Availability
async function toggleAvailability(checked) {
  if (!loggedInDonor) return;
  loggedInDonor.available = checked ? 1 : 0;

  await fetch(`/api/donors/${loggedInDonor.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loggedInDonor)
  });

  loadDonors(); // Reloads list; if unchecked, user disappears from the list
}

// Fetch Requests
async function loadRequests() {
  const res = await fetch('/api/requests');
  const requests = await res.json();

  const container = document.getElementById('requests-list');
  if (!requests.length) {
    container.innerHTML = '<p style="color:#777; font-size:13px;">No emergency requests right now.</p>';
    return;
  }

  container.innerHTML = requests.map(r => `
    <div class="item-box">
      <div>
        <strong>Patient: ${r.patient_name}</strong> <span class="badge">${r.blood_group}</span>
        <div style="font-size:12px; color:#666; margin-top:3px;">
          ${r.hospital} (${r.location}) • ${r.quantity} Unit(s)
        </div>
      </div>
      <div>
        <span class="status-tag status-${r.status}">${r.status}</span>
        <button class="btn btn-outline" style="padding: 3px 6px; font-size:11px;" onclick="viewRequestDetails(${r.id})">Details</button>
      </div>
    </div>
  `).join('');
}

// Create Request
async function handleCreateRequest(e) {
  e.preventDefault();
  const contact = document.getElementById('req-contact').value;
  const time = document.getElementById('req-time').value;

  if (!validatePhone(contact)) {
    alert('Please enter a 10-digit phone number.');
    return;
  }

  if (new Date(time) < new Date()) {
    alert('Date and time cannot be in the past.');
    return;
  }

  const payload = {
    patient_name: document.getElementById('req-patient').value,
    blood_group: document.getElementById('req-bg').value,
    quantity: document.getElementById('req-qty').value,
    hospital: document.getElementById('req-hospital').value,
    location: document.getElementById('req-location').value,
    required_by: time,
    contact: contact,
    description: document.getElementById('req-desc').value
  };

  const res = await fetch('/api/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    alert('Emergency Request Posted!');
    closeModal('request-modal');
    loadRequests();
  } else {
    const data = await res.json();
    alert(data.error);
  }
}

// View Request Details Modal
async function viewRequestDetails(id) {
  const res = await fetch(`/api/requests/${id}`);
  if (!res.ok) {
    alert('Request not found.');
    return;
  }

  const req = await res.json();
  const body = document.getElementById('details-body');

  body.innerHTML = `
    <p style="margin-bottom:6px; font-size:13px;"><strong>Patient:</strong> ${req.patient_name}</p>
    <p style="margin-bottom:6px; font-size:13px;"><strong>Blood Group:</strong> ${req.blood_group}</p>
    <p style="margin-bottom:6px; font-size:13px;"><strong>Units Required:</strong> ${req.quantity}</p>
    <p style="margin-bottom:6px; font-size:13px;"><strong>Hospital:</strong> ${req.hospital}, ${req.location}</p>
    <p style="margin-bottom:6px; font-size:13px;"><strong>Required Date:</strong> ${new Date(req.required_by).toLocaleString()}</p>
    <p style="margin-bottom:6px; font-size:13px;"><strong>Contact:</strong> ${req.contact}</p>
    <p style="margin-bottom:10px; font-size:13px;"><strong>Description:</strong> ${req.description || 'None'}</p>
    <p style="margin-bottom:15px; font-size:13px;"><strong>Status:</strong> <span class="status-tag status-${req.status}">${req.status}</span></p>
    
    <div style="display:flex; gap:8px; flex-wrap:wrap;">
      <button class="btn btn-blue" onclick="updateStatus(${req.id}, 'FULFILLED')">Mark Fulfilled</button>
      <button class="btn btn-outline" onclick="updateStatus(${req.id}, 'CANCELLED')">Cancel</button>
      <button class="btn btn-red" onclick="deleteRequest(${req.id})">Delete Request</button>
    </div>
  `;

  openModal('details-modal');
}

// Update Request Status
async function updateStatus(id, status) {
  await fetch(`/api/requests/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });

  closeModal('details-modal');
  loadRequests();
}

// Delete Request Completely
async function deleteRequest(id) {
  if (confirm('Are you sure you want to permanently delete this request?')) {
    const res = await fetch(`/api/requests/${id}`, { method: 'DELETE' });
    if (res.ok) {
      alert('Request deleted!');
      closeModal('details-modal');
      loadRequests();
    } else {
      alert('Delete failed.');
    }
  }
}