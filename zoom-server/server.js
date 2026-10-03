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
// Behind Render's proxy — needed so req.ip is the real visitor, otherwise the
// per-IP rate limits would count all visitors as one.
app.set('trust proxy', true);
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

// Teacher/admin logins — set KTK_LOGINS in the Render dashboard as a JSON
// object mapping code -> { name, email, password, courses }. Credentials are
// never stored in the website source; the browser only sends what the user
// types to this endpoint for checking.
let LOGINS = null;
try {
  LOGINS = process.env.KTK_LOGINS ? JSON.parse(process.env.KTK_LOGINS) : null;
} catch (e) {
  console.error('KTK_LOGINS env var is not valid JSON — logins disabled');
}

// Login attempts are limited to 10 per IP per 15 minutes.
const LOGIN_RATE_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const loginHits = new Map();
function loginLimited(ip) {
  const now = Date.now();
  const recent = (loginHits.get(ip) || []).filter(function (t) { return now - t < LOGIN_WINDOW_MS; });
  recent.push(now);
  loginHits.set(ip, recent);
  return recent.length > LOGIN_RATE_LIMIT;
}

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

// Login check for the teacher dashboard (codes + passwords live only here)
app.post('/api/login', function (req, res) {
  try {
    if (loginLimited(req.ip)) {
      return res.status(429).json({ success: false, error: 'Too many attempts — try again in a few minutes.' });
    }
    if (!LOGINS) {
      return res.status(500).json({ success: false, error: 'Logins are not configured on the server.' });
    }
    const { code, password } = req.body || {};
    const key = String(code || '').trim().toUpperCase();
    const rec = LOGINS[key];
    if (!rec || rec.password !== password) {
      return res.status(401).json({ success: false, error: 'Invalid code or password. Please try again.' });
    }
    res.json({
      success: true,
      code: key,
      name: rec.name,
      email: rec.email,
      courses: rec.courses || []
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed.' });
  }
});

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

    // Host key lets a teacher who is signed into their OWN Zoom account claim
    // host after joining via the student link (fallback if start_url misbehaves).
    let hostKey = null;
    try {
      const meRes = await fetch(`${ZOOM_CONFIG.baseUrl}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (meRes.ok) {
        const me = await meRes.json();
        if (me.host_key) hostKey = me.host_key;
      }
    } catch (_) { /* host key is optional */ }

    res.json({
      success: true,
      meetingId: meeting.id,
      joinUrl: meeting.join_url,
      hostUrl: meeting.start_url,
      hostKey: hostKey,
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
