# DashCaf

A campus food-delivery platform. Customers order from on-campus stores, delivery riders fulfil orders, and an admin control panel manages everything.

## Architecture

```
DashCaf/
├── backend/           NestJS API (TypeScript, PostgreSQL, Socket.io)
├── frontend-customer/ React app — customers browse & order
├── frontend-store/    React app — store staff manage orders & menu
├── frontend-delivery/ React app — riders claim & deliver orders
├── frontend-control/  React app — admin dashboard
└── docker-compose.yml spins up backend + PostgreSQL
```

## Quick start (local)

### 1. Database
```bash
docker compose up db -d
```

### 2. Backend
```bash
cd backend
cp .env.example .env   # fill in your values
npm install
npm run dev            # http://localhost:5000
```

### 3. Any frontend
```bash
cd frontend-customer   # or frontend-store / frontend-delivery / frontend-control
npm install
npm run dev
```

## Environment variables

See `backend/.env.example` for a full list. Key ones:

| Variable | Description |
|---|---|
| `DB_*` | PostgreSQL connection |
| `JWT_ACCESS_SECRET` | Random 64-byte hex string |
| `JWT_REFRESH_SECRET` | Random 64-byte hex string |
| `PAYFAST_MERCHANT_ID` | From your PayFast dashboard |
| `PAYFAST_MERCHANT_KEY` | From your PayFast dashboard |
| `PAYFAST_PASSPHRASE` | Set in your PayFast security settings |
| `PAYFAST_SANDBOX` | `true` for testing, `false` for production |
| `PAYFAST_NOTIFY_URL` | Public URL PayFast POSTs ITN to — must be reachable by PayFast |
| `APP_URL` | Your backend's public URL |
| `SMTP_*` | Gmail or other SMTP for transactional emails |
| `VAPID_*` | Web push keys — generate with `npx web-push generate-vapid-keys` |

## Running tests
```bash
cd backend
npm test              # unit tests
npm run test:cov      # with coverage report
```

## Docker (full stack)
```bash
cp backend/.env.example backend/.env  # fill in values
docker compose up --build
```

## Payment flow

1. Customer places order → order created with status `PENDING`
2. Frontend calls `POST /api/payments/initiate` → receives PayFast form fields
3. Browser redirects to PayFast payment page
4. On success, PayFast POSTs ITN to `POST /api/payments/payfast/itn`
5. Backend validates signature → sets order to `CONFIRMED` → notifies store + customer via WebSocket

## WebSocket events

| Event | Direction | Description |
|---|---|---|
| `order_status_update` | Server → Client | Order moved to a new status |
| `new_order` | Server → Store | New order arrived |
| `order_ready` | Server → Riders | Order is ready to be claimed |
| `chat_message` | Bidirectional | In-order chat message |
| `rider_location` | Server → Customer | Rider GPS coordinates (every 10s) |
| `handoff_confirmed` | Server → Customer/Rider | Handoff code verified, order delivered |
