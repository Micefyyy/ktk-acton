# KTK Zoom Server

Creates Zoom meetings on demand for the teacher dashboard's **Start Class** button.

- **Production:** hosted free on Render at `https://ktk-zoom-server.onrender.com`
  (dashboard: https://dashboard.render.com → web service `ktk-zoom-server`,
  connected to this repo, root directory `zoom-server`).
- **Local dev:** `npm install && npm start` here, then the site automatically
  uses `http://localhost:3001` when opened on localhost.
- The dashboard code in `../ktk-acton.html` picks the URL automatically and can
  be overridden with `window.KTK_ZOOM_API_URL`.

## Environment variables (required)

| Name | Value |
|---|---|
| `ZOOM_ACCOUNT_ID` | Server-to-Server OAuth account ID |
| `ZOOM_CLIENT_ID` | OAuth app client ID |
| `ZOOM_CLIENT_SECRET` | OAuth app client secret |

Secrets live only in the Render dashboard — never in this repo.

## Endpoints

- `GET /api/health` — health check (`{ ok, zoomConfigured }`)
- `POST /api/create-meeting` — body: `{ courseName, teacherEmail?, duration?, timezone?, weeklyDays?, endTimes? }`
- `GET /api/meeting/:id`, `DELETE /api/meeting/:id`

CORS is limited to `ktkacton.com`, `www.ktkacton.com`, `micefyyy.github.io`,
and localhost. Meeting creation is rate-limited to 20 requests per IP per hour.
