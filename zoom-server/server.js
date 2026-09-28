// KTK Zoom Server — creates Zoom meetings on demand for the teacher dashboard.
// Runs on Render in production and locally during development.
//
// Required environment variables (set in the Render dashboard, or in your
// shell when running locally — never hardcode them in this file):
//   ZOOM_ACCOUNT_ID
//   ZOOM_CLIENT_ID
//   ZOOM_CLIENT_SECRET
// Optional:
//   PORT (defaults to 3001; Render sets this automatically)

const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());

// Only the real site (and local dev) may call this from a browser.
const ALLOWED_ORIGINS = [
  'https://ktkacton.com',
  'https://www.ktkacton.com',
  'https://micefyyy.github.io',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];
app.use(cors({ origin: ALLOWED_ORIGINS }));

const ZOOM_CONFIG = {
  accountId: process.env.ZOOM_ACCOUNT_ID,
  clientId: process.env.ZOOM_CLIENT_ID,
  clientSecret: process.env.ZOOM_CLIENT_SECRET,
  baseUrl: 'https://api.zoom.us/v2'
};

const zoomConfigured = Boolean(
  ZOOM_CONFIG.accountId && ZOOM_CONFIG.clientId && ZOOM_CONFIG.clientSecret
);

// Basic per-IP rate limit on meeting creation (20 per hour) so the endpoint
// can't be hammered by strangers now that it's on the public internet.
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(function (t) { return now - t < RATE_WINDOW_MS; });
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

// Server-to-Server OAuth token cache
let accessToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (!zoomConfigured) {
    throw new Error('Zoom credentials not configured (set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET)');
  }
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const auth = Buffer.from(`${ZOOM_CONFIG.clientId}:${ZOOM_CONFIG.clientSecret}`).toString('base64');

  const response = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `grant_type=account_credentials&account_id=${ZOOM_CONFIG.accountId}`
  });

  if (!response.ok) {
    const errBody = await response.text();
    console.error('Token response:', response.status, errBody);
    throw new Error('Failed to get Zoom access token: ' + response.status);
  }

  const data = await response.json();
  accessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;

  return accessToken;
}

// Health checks (Render uses /api/health)
app.get('/', function (req, res) {
  res.json({ ok: true, service: 'ktk-zoom-server' });
});

app.get('/api/health', function (req, res) {
  res.json({ ok: true, zoomConfigured: zoomConfigured });
});

// Create a new meeting
app.post('/api/create-meeting', async (req, res) => {
  try {
    if (rateLimited(req.ip)) {
      return res.status(429).json({ success: false, error: 'Too many requests — try again later.' });
    }

    const { courseId, courseName, teacherEmail, duration, timezone, weeklyDays, endTimes } = req.body || {};

    const token = await getAccessToken();

    const body = {
      topic: `KTK - ${courseName || 'Class'}`,
      type: 2,
      duration: duration || 60,
      timezone: timezone || 'America/New_York',
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        waiting_room: false,
        allow_multiple_instances: false
      }
    };

    // Optional weekly recurrence (e.g. weeklyDays: '6' = Saturdays, 0=Sun..6=Sat).
    // If not provided the meeting is one-off — teachers just press Start Class again.
    if (weeklyDays) {
      body.recurrence = {
        type: 2,
        weekly_days: String(weeklyDays),
        end_times: endTimes || 8
      };
    }

    const response = await fetch(`${ZOOM_CONFIG.baseUrl}/users/me/meetings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Zoom API error:', error);
      throw new Error(error.message || 'Failed to create meeting');
    }

    const meeting = await response.json();

    res.json({
      success: true,
      meetingId: meeting.id,
      joinUrl: meeting.join_url,
      hostEmail: teacherEmail || null,
      topic: meeting.topic,
      password: meeting.password
    });

  } catch (error) {
    console.error('Meeting creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete a meeting
app.delete('/api/meeting/:meetingId', async (req, res) => {
  try {
    const token = await getAccessToken();
    const response = await fetch(`${ZOOM_CONFIG.baseUrl}/meetings/${req.params.meetingId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to delete meeting');
    res.json({ success: true });
  } catch (error) {
    console.error('Meeting deletion error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get meeting details
app.get('/api/meeting/:meetingId', async (req, res) => {
  try {
    const token = await getAccessToken();
    const response = await fetch(`${ZOOM_CONFIG.baseUrl}/meetings/${req.params.meetingId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch meeting');
    const meeting = await response.json();
    res.json({ success: true, meeting });
  } catch (error) {
    console.error('Meeting fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', function () {
  console.log(`KTK Zoom Server running on port ${PORT}`);
  if (!zoomConfigured) {
    console.warn('WARNING: Zoom env vars are not set — meeting creation will fail.');
  }
});
