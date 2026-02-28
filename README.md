# Tour de Vino

The user wants an expanded specification for a coding agent to iterate on and implement. The spec should include details such as architecture, tech stack, data models, API design, front-end components, routes, state management, authentication, payment integration, map integration, admin vendor flows, data validation, error handling, deployment considerations. Provide a comprehensive functional specification: high-level architecture diagram, technology choices (React + Redux + TypeScript or Vue + Pinia etc.), backend (Node.js/Express, Django, Go), database schema (PostgreSQL). Provide API endpoints with request/response payloads. Provide front-end component tree and responsibilities. Provide user stories, acceptance criteria. Provide UI/UX guidelines. Provide security considerations. Provide CI/CD pipeline steps. Provide performance considerations. Provide test strategy.

Goal: Expand spec so a coding agent can iterate on it and implement it. So produce a detailed spec for both front-end and back-end, with all necessary details.

We need to structure the answer clearly: Overview, Architecture diagram, Tech stack, Data model (entities), API contract, Front-end component architecture, State management, Routing, Auth flows, Payment integration details (Stripe/PayPal). Map integration: Google Maps or Leaflet. Admin dashboards UI components and data flows. Vendor portal features. Deployment environment: Docker, Kubernetes, CI/CD with GitHub Actions or GitLab CI.

Also include test coverage plan: unit tests, integration tests, e2e tests with Cypress or Playwright. Provide acceptance criteria for each user story.

Also include documentation guidelines: OpenAPI spec, Swagger UI, Postman collection. Provide a roadmap and iteration plan.

The coding agent should be able to start implementing, so we need actionable items: create repo structure, set up frameworks.

Let's produce a robust spec. Use markdown for clarity.

We'll include:

- Overview
- High-level diagram (text-based)
- Tech stack
- Database schema (ER diagram in text or Mermaid)
- API design with OpenAPI spec snippets
- Front-end architecture: component tree, pages, shared components
- State management: store modules
- Auth flow diagrams
- Payment integration steps
- Map integration details
- Admin & Vendor dashboards UI components list
- Testing strategy
- CI/CD pipeline steps
- Deployment architecture
- Security considerations (OAuth2, JWT)
- Data validation & error handling patterns

We need to be thorough.

Let's start with a high-level architecture diagram:

```
┌───────────────────────┐
│  Client (React/Vue)   │
├───────────────────────┤
│   Redux/Pinia store   │
├───────────────────────┤
│      API calls        │
│  (Axios/Fetch)        │
├───────────────────────┤
│   Map API             │
│  (Google Maps/Leaflet)│
└───────────────────────┘
          │
          ▼
┌───────────────────────┐
│   API Gateway (Nginx) │
├───────────────────────┤
│  Auth Service (JWT)   │
├───────────────────────┤
│  REST/GraphQL API     │
│   (Node.js / Django)  │
├───────────────────────┤
│ PostgreSQL DB         │
└───────────────────────┘
          ▲
          │
   ┌───────────────┐
   │  Stripe/PayPal│
   └───────────────┘
```

Then we need the data model: Entities: User, Vendor, Tour, Booking, Review, Payment, Region/Location, Media, etc.

We'll provide a Mermaid diagram:

```mermaid
erDiagram
    USER {
        int id PK
        string email
        string password_hash
        string role ENUM('customer','vendor','admin')
        date created_at
    }
    VENDOR {
        int id PK
        int user_id FK
        string name
        string description
        string address
        string phone
        string website
        bool approved
    }
    TOUR {
        int id PK
        int vendor_id FK
        string title
        text description
        float price
        int duration_hours
        int capacity
        string region_id FK
        bool active
        timestamp created_at
    }
    REGION {
        int id PK
        string name
        string country
        float latitude
        float longitude
    }
    BOOKING {
        int id PK
        int user_id FK
        int tour_id FK
        date start_date
        int guests
        string status ENUM('pending','confirmed','cancelled','completed')
        decimal total_amount
    }
    REVIEW {
        int id PK
        int user_id FK
        int tour_id FK
        int rating INT
        text comment
        timestamp created_at
    }
    PAYMENT {
        int id PK
        int booking_id FK
        string provider ENUM('stripe','paypal')
        string transaction_id
        decimal amount
        timestamp paid_at
    }
    TOUR_MEDIA {
        int id PK
        int tour_id FK
        string url
        string type ENUM('image','video')
    }
```

Now the API endpoints: Provide path, method, auth requirements, request body schema (JSON), response schema. Use OpenAPI spec.

We need to produce a full OpenAPI v3 spec maybe as YAML snippet. Provide for each resource.

Also front-end pages: list them, map out navigation flows.

User stories with acceptance criteria:

- As a tourist, I can search for tours by region and date. Acceptance: Search results show tours with pagination.
- As a tourist, I can view tour details and book. Acceptance: Booking form validates guest count <= capacity, date available, payment success triggers booking confirmation.
- As a vendor, I can upload a new tour with media. Acceptance: Tour appears in search after approval.

Admin functions similarly.

Also state management: e.g., store modules: auth, tours, bookings, vendors. Provide skeleton.

Map integration: Use Google Maps JavaScript API or Leaflet with OpenStreetMap; show markers for tours.

Payment integration: Use Stripe Checkout or PayPal Buttons; implement webhook endpoints to confirm payment and update booking status.

Security: JWT for API, CSRF protection for stateful sessions if needed; rate limiting.

Testing: Unit tests with Jest (React) or Vitest, integration tests for API using supertest. E2E tests with Cypress.

CI/CD: GitHub Actions to lint, test, build; Docker images; push to registry; deploy to Kubernetes cluster (e.g., EKS or GKE). Use Helm charts.

Deployment: Docker Compose for dev, Kubernetes for prod. Provide environment variables config via secrets.

Now produce a thorough spec.

Also include folder structure:

```
/backend
  /src
    /controllers
    /services
    /models
    /routes
    /middleware
  /tests
/ frontend
  /client
    /src
      /components
      /pages
      /store
      /router
      /utils
  /admin
    ...
  /vendor
    ...
```

Also include a README skeleton.

Now produce final answer.<|end|><|start|>assistant<|channel|>final<|message|>## 1️⃣ Project Overview

| Layer | Responsibility |
|-------|----------------|
| **Client** – End‑user website (tour seekers) |
| **Vendor** – Tour operator portal |
| **Admin** – Site‑wide management dashboard |
| **API Gateway / Auth** – JWT + OAuth2 token issuance, rate‑limit |
| **Domain API (REST)** – Business logic, PostgreSQL persistence |
| **Payments** – Stripe + PayPal webhooks |
| **Map** – Google Maps/Leaflet for geo‑display |
| **Deployment** – Docker + Kubernetes (EKS / GKE) with GitHub Actions CI/CD |

> *All three front‑ends are **single‑page applications** (React + TypeScript) that consume the same API surface.  The API is stateless, secured by signed JWTs issued by an Auth Service.*

---

## 2️⃣ High‑Level Architecture Diagram

```
┌───────────────────────┐
│  Client (React/TS)    │
├───────────────────────┤
│   Redux Toolkit store │
├───────────────────────┤
│  Axios / Fetch API    │
│   (CORS‑enabled)      │
├───────────────────────┤
│  Google Maps / Leaflet│
└───────────────────────┘
          │
          ▼
┌───────────────────────┐   ┌───────────────────────┐
│  Nginx API Gateway    │◄──►|  Auth Service (JWT)   |
├───────────────────────┤   └───────────────────────┘
│  Rate‑limit / CORS    │            ▲
├───────────────────────┤            │
│  Domain API (Node/Express)◄────────────┘
├───────────────────────┤   ┌───────────────────────┐
│  PostgreSQL DB        │◄──►|  Stripe Webhooks      |
├───────────────────────┤   └───────────────────────┘
│  PayPal Webhooks      │
└───────────────────────┘
```

---

## 3️⃣ Tech Stack

| Front‑End | Back‑End | Database | Auth | Payments | Map |
|-----------|----------|----------|------|----------|-----|
| React 18 + TypeScript | Node.js 20 + Express (or NestJS) | PostgreSQL 15 | Auth0 / custom JWT service | Stripe Checkout + PayPal SDK | Google Maps JS API (fallback: Leaflet+OpenStreetMap) |
| Redux Toolkit + RTK Query | TypeORM / Prisma (ORM) | pg | OAuth2 for admin/vendor login | Webhooks + server‑side verification | |
| React Router v6 | Joi / Zod for validation | | Bcrypt for passwords | Stripe Webhooks, PayPal IPN | |
| Chakra‑UI / MUI (for rapid prototyping) | Express‑Rate-Limit | | JWT refresh tokens | | |
| Vite / CRA (dev) | Winston / Pino for logging | | | | |

> *All code is written in **TypeScript**.  Testing uses Jest + Supertest for the API, Vitest + React Testing Library for components, and Cypress (or Playwright) for E2E.*

---

## 4️⃣ Data Model

> *PostgreSQL schema with referential integrity.  Below is a Mermaid ER diagram.*

```mermaid
erDiagram
    USER {
        int id PK
        string email UNIQUE NOT NULL
        string password_hash NOT NULL
        enum role {customer, vendor, admin} NOT NULL DEFAULT 'customer'
        timestamp created_at
    }
    VENDOR {
        int id PK
        int user_id FK USER(id) NOT NULL
        string name NOT NULL
        text description
        string address
        string phone
        string website
        bool approved NOT NULL DEFAULT FALSE
    }
    REGION {
        int id PK
        string name UNIQUE NOT NULL
        string country
        float latitude
        float longitude
    }
    TOUR {
        int id PK
        int vendor_id FK VENDOR(id) NOT NULL
        int region_id FK REGION(id)
        string title NOT NULL
        text description
        decimal price NOT NULL
        int duration_hours NOT NULL
        int capacity NOT NULL
        bool active NOT NULL DEFAULT TRUE
        timestamp created_at
    }
    TOUR_MEDIA {
        int id PK
        int tour_id FK TOUR(id) NOT NULL
        string url NOT NULL
        enum type {image, video} NOT NULL
    }
    BOOKING {
        int id PK
        int user_id FK USER(id) NOT NULL
        int tour_id FK TOUR(id) NOT NULL
        date start_date NOT NULL
        int guests NOT NULL
        enum status {pending, confirmed, cancelled, completed} NOT NULL DEFAULT 'pending'
        decimal total_amount NOT NULL
        timestamp created_at
    }
    REVIEW {
        int id PK
        int user_id FK USER(id) NOT NULL
        int tour_id FK TOUR(id) NOT NULL
        int rating 1..5 NOT NULL
        text comment
        timestamp created_at
    }
    PAYMENT {
        int id PK
        int booking_id FK BOOKING(id) NOT NULL
        enum provider {stripe, paypal} NOT NULL
        string transaction_id UNIQUE NOT NULL
        decimal amount NOT NULL
        timestamp paid_at
    }
```

> *Indexes:*  
> `ON TOUR(title, region_id)` – for search.  
> `ON BOOKING(start_date, status)` – for availability queries.  
> `ON REVIEW(rating)` – analytics.

---

## 5️⃣ API Contract (OpenAPI v3)

> *Only the most critical endpoints are shown.  The full spec lives in `backend/src/openapi.yaml`.*

```yaml
openapi: 3.0.3
info:
  title: VineTours API
  version: 1.0.0

servers:
  - url: https://api.vinetours.com/v1

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    User:
      type: object
      properties:
        id: {type: integer}
        email: {type: string, format: email}
        role: {enum: [customer,vendor,admin]}
      required: [id,email,role]

    Tour:
      type: object
      properties:
        id: {type: integer}
        title: {type: string}
        description: {type: string}
        price: {type: number, format: float}
        duration_hours: {type: integer}
        capacity: {type: integer}
        region_id: {type: integer}
        active: {type: boolean}
      required:
        - id
        - title
        - price
        - duration_hours
        - capacity
        - region_id

    Booking:
      type: object
      properties:
        id: {type: integer}
        tour_id: {type: integer}
        user_id: {type: integer}
        start_date: {type: string, format: date}
        guests: {type: integer}
        status: {enum: [pending,confirmed,cancelled,completed]}
        total_amount: {type: number}
      required:
        - id
        - tour_id
        - user_id
        - start_date
        - guests

paths:
  /auth/login:
    post:
      summary: Login & obtain JWT
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                email: {type:string}
                password:{type:string}
      responses:
        '200':
          description: Successful login
          content:
            application/json:
              schema:
                type: object
                properties:
                  token:{type:string}
        '401':
          description: Invalid credentials

  /tours:
    get:
      summary: Search tours
      parameters:
        - in: query
          name: region_id
          schema: {type: integer}
        - in: query
          name: start_date
          schema: {type: string, format: date}
        - in: query
          name: price_min
          schema: {type: number}
        - in: query
          name: price_max
          schema: {type: number}
        - in: query
          name: page
          schema: {type: integer, default: 1}
        - in: query
          name: limit
          schema: {type: integer, default: 20}
      responses:
        '200':
          description: Paginated list of tours
          content:
            application/json:
              schema:
                type: object
                properties:
                  total:{type: integer}
                  page:{type: integer}
                  limit:{type: integer}
                  data:
                    type: array
                    items: {$ref:'#/components/schemas/Tour'}

  /tours/{id}:
    get:
      summary: Get tour detail
      parameters:
        - in: path
          name: id
          required: true
          schema:{type: integer}
      responses:
        '200':
          description: Tour detail
          content:
            application/json:
              schema:{$ref:'#/components/schemas/Tour'}
        '404':
          description: Tour not found

  /tours/{id}/availability:
    get:
      summary: Check available dates for a tour
      parameters:
        - in: path
          name: id
          required: true
          schema:{type: integer}
        - in: query
          name: start_date
          schema:{type: string, format: date}
        - in: query
          name: end_date
          schema:{type: string, format: date}
      responses:
        '200':
          description: Array of dates with remaining capacity
          content:
            application/json:
              schema:
                type: array
                items:{type:string,format:date}

  /bookings:
    post:
      security:
        - bearerAuth:[]
      summary: Create a booking (triggers payment)
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                tour_id:{type:integer}
                start_date:{type:string,format:date}
                guests:{type:integer}
              required:[tour_id,start_date,guests]
      responses:
        '201':
          description: Booking created – payment link returned
          content:
            application/json:
              schema:
                type: object
                properties:
                  booking_id:{type:integer}
                  payment_url:{type:string}
        '400':
          description: Validation error
        '409':
          description: Tour not available

  /bookings/{id}:
    get:
      security:[{bearerAuth:[]}]
      summary: Get booking status
      parameters:
        - in: path
          name:id
          required:true
          schema:{type:integer}
      responses:
        '200':
          content:
            application/json:
              schema:{$ref:'#/components/schemas/Booking'}
        '404':
          description: Not found
    delete:
      security:[{bearerAuth:[]}]
      summary: Cancel booking (if allowed)
      responses:
        '200':
          description: Booking cancelled
```

> *The remaining CRUD endpoints (vendors, tours admin, reviews) follow the same pattern.*

---

## 6️⃣ Front‑End Architecture

### 6.1 Folder Structure (React + Vite)

```
client/
 ├─ public/              # static assets
 ├─ src/
 │   ├─ api/             # RTK Query endpoints
 │   │   └─ tours.ts
 │   ├─ app/             # store, root reducer
 │   │   └─ store.ts
 │   ├─ components/      # UI primitives (Button, Card, Map)
 │   ├─ features/
 │   │   ├─ auth/        # login / signup components
 │   │   ├─ tours/
 │   │   │   ├─ TourCard.tsx
 │   │   │   └─ MapView.tsx
 │   │   ├─ bookings/
 │   │   └─ reviews/
 │   ├─ pages/           # React Router pages
 │   │   ├─ Home.tsx
 │   │   ├─ SearchResults.tsx
 │   │   ├─ TourDetail.tsx
 │   │   ├─ BookingForm.tsx
 │   │   └─ Account/
 │   ├─ router/          # route definitions
 │   ├─ styles/
 │   └─ utils/           # helpers, API wrappers
 ├─ tests/
 ├─ index.html
 └─ vite.config.ts
```

### 6.2 Page / Route Tree

| Path | Component | Auth? |
|------|-----------|-------|
| `/` | `HomePage` – hero, search bar, featured tours | No |
| `/search` | `SearchResultsPage` – list with pagination & filters | No |
| `/map` | `MapViewPage` – interactive map with markers | No |
| `/tours/:id` | `TourDetailPage` – full description, media gallery, price | No |
| `/tours/:id/book` | `BookingFormPage` – guest count, date picker, payment modal | Yes (customer) |
| `/account/profile` | `ProfilePage` – edit personal data | Yes |
| `/account/bookings` | `BookingsPage` – list + status | Yes |
| `/account/reviews` | `ReviewsPage` – write / edit review | Yes |
| `/login` | `LoginPage` | No |
| `/signup` | `SignupPage` | No |
| `/reset-password` | `ResetPasswordPage` | No |

> *Admin & Vendor sites follow a similar structure under `/admin/*` and `/vendor/*`.*

### 6.3 State Management

| Slice | Purpose |
|-------|---------|
| `auth` | JWT, refresh token, role |
| `tours` | Search cache, selected tour, map markers |
| `bookings` | Current booking flow, status updates |
| `reviews` | User reviews cache |
| `vendors` | Vendor profile (only for vendor site) |

> *RTK Query automatically caches GET responses; we use custom hooks like `useSearchToursQuery`, `useTourDetailQuery`.*

### 6.4 Auth Flow

1. **Login** → POST `/auth/login` → receive `token` & optional `refreshToken`.  
2. Store in **HttpOnly cookie** (recommended) or **localStorage** (simpler).  
3. All subsequent API calls include `Authorization: Bearer <token>`.  
4. Refresh token endpoint (`/auth/refresh`) called automatically by RTK Query when 401 is received.  
5. **Logout** clears tokens & redirects to `/login`.

> *For security, use a short access token (e.g., 15 min) and a longer refresh token.*

### 6.5 Map Integration

- **Google Maps JS API** (free tier, 28 k loads/day).  
- Load via `<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_KEY&libraries=places"></script>`.  
- `MapView` component receives `tours: Tour[]` and renders markers.  
- Marker click opens a small popup with tour title + link to detail page.  
- For **offline / fallback** use `react-leaflet` + OpenStreetMap.

---

## 7️⃣ Vendor Site Features

| Feature | Page | API |
|---------|------|-----|
| Dashboard (tour performance) | `/vendor` | GET `/admin/v1/vendors/me/tours/stats` |
| Tour CRUD | `/vendor/tours/new`, `/vendor/tours/:id/edit` | POST/PUT `/admin/v1/vendors/me/tours` |
| Media upload | `TourEditPage` → POST `/admin/v1/vendors/me/tours/:id/media` (multipart) |
| Availability | `/vendor/tours/:id/availability` | GET/POST `/admin/v1/vendors/me/tours/:id/availability` |
| Booking inbox | `/vendor/bookings` | GET `/admin/v1/vendors/me/bookings` |
| Reviews | `/vendor/reviews` | GET `/admin/v1/vendors/me/tours/:id/reviews` |
| Profile edit | `/vendor/profile` | GET/PUT `/admin/v1/vendors/me/profile` |

> *All vendor endpoints are protected by `role=vendor`.*

---

## 8️⃣ Admin Site Features

| Feature | Page | API |
|---------|------|-----|
| Dashboard (sales, traffic) | `/admin` | GET `/admin/dashboard/stats` |
| Tour management | `/admin/tours` | CRUD on `/admin/v1/tours` |
| Vendor approval | `/admin/vendors` | GET/PUT on `/admin/v1/vendors/:id` |
| Booking management | `/admin/bookings` | CRUD on `/admin/v1/bookings` |
| User roles | `/admin/users` | CRUD on `/admin/v1/users` |
| Reports (CSV) | `/admin/reports` | GET `/admin/v1/reports?type=...` |
| Settings (email templates, payment keys) | `/admin/settings` | GET/PUT `/admin/v1/settings` |

> *All admin endpoints require `role=admin`.*

---

## 9️⃣ Payment Flow

1. **Booking creation** (`POST /bookings`) returns a `payment_url`.  
2. Front‑end redirects to Stripe Checkout or PayPal payment page.  
3. After payment, the provider sends a **webhook** to `/api/webhooks/stripe` or `/api/webhooks/paypal`.  
4. Webhook handler verifies signature, updates `PAYMENT` record, sets booking status to `confirmed`.  
5. Optionally send confirmation email via SendGrid / SES.

> *Stripe: use `checkout.sessions.create` with `success_url=/bookings/:id/success`.  
> *PayPal: use Checkout Buttons + webhook `payment.completed`.*

---

## 🔟 Testing Strategy

| Layer | Tool | Scope |
|-------|------|-------|
| Unit | Jest + React Testing Library (frontend) / Vitest (backend) | Component rendering, service logic |
| Integration | Supertest (API), Cypress/Playwright (end‑to‑end) | Full booking flow, admin CRUD |
| Contract | Postman / Insomnia collection + Newman | API spec compliance |
| Performance | k6 or Locust | Load test for `/tours` endpoint |
| Security | OWASP ZAP | Vulnerability scanning |

> *All tests run in CI (GitHub Actions).  Code coverage ≥ 85 %.*

---

## 🧩 CI/CD Pipeline (GitHub Actions)

| Stage | Action |
|-------|--------|
| **Build** | `npm run build` for each app; Dockerfile builds image |
| **Test** | Run unit & integration tests |
| **Lint** | ESLint, Prettier |
| **Push** | Push Docker images to GHCR or ECR |
| **Deploy** | Helm chart `helm upgrade --install` on Kubernetes cluster; auto‑scale based on CPU/Memory |
| **Smoke Test** | Call `/healthz` endpoints after deploy |

> *Secrets stored in GitHub Secrets: `DOCKER_REGISTRY`, `STRIPE_SECRET_KEY`, `PAYPAL_CLIENT_ID/SECRET`, `DB_URL`.*

---

## 🗺️ Deployment Architecture

| Layer | Environment | Container |
|-------|-------------|-----------|
| **API** | `api.vinetours.com` | Node.js (Nginx reverse proxy) |
| **Auth** | `auth.vinetours.com` | Auth0 or custom Express auth service |
| **Client** | `www.vinetours.com` | React SPA (static CDN) |
| **Vendor** | `vendor.vinetours.com` | Vendor SPA |
| **Admin** | `admin.vinetours.com` | Admin SPA |
| **DB** | Managed PostgreSQL (RDS / Cloud SQL) |
| **Payments** | Stripe/PayPal webhooks (public URL) |
| **Storage** | S3 / GCS for media uploads |

> *Use TLS everywhere (Let’s Encrypt).  Apply IAM roles & least‑privilege.*

---

## 🏗️ Folder Layout (repo root)

```
/
 ├─ backend/          # API service
 │   ├─ src/
 │   ├─ tests/
 │   └─ Dockerfile
 ├─ client/           # Tourist SPA
 │   ├─ src/
 │   └─ Dockerfile
 ├─ vendor/           # Vendor SPA
 ├─ admin/            # Admin SPA
 ├─ infra/
 │   └─ helm/
 │       └─ vinetours/
 ├─ .github/workflows/ # CI/CD
 ├─ docker-compose.yml
 └─ README.md
```

---

## 📄 User Stories & Acceptance Criteria

| Role | Story | Acceptance |
|------|-------|------------|
| **Customer** | Search tours by region and date. | 1️⃣ Results show tours sorted by price.<br>2️⃣ Pagination works (20 per page). |
| **Customer** | Book a tour. | 1️⃣ Booking form validates guest count ≤ capacity.<br>2️⃣ Payment link appears; after payment booking status is `confirmed`. |
| **Vendor** | Upload a new tour. | 1️⃣ Tour appears in vendor dashboard.<br>2️⃣ Requires admin approval before becoming `active`. |
| **Vendor** | Set availability. | 1️⃣ Block a date; booking form no longer shows that date.<br>2️⃣ Capacity per day is respected. |
| **Admin** | Approve a vendor. | 1️⃣ Vendor status changes to `approved`.<br>2️⃣ Vendor receives email notification. |
| **Admin** | View sales report. | 1️⃣ CSV download contains date, tour, revenue.<br>2️⃣ Data aggregated per region. |

---

## 🚀 Next Steps for the Coding Agent

1. **Repo scaffolding** – create monorepo with `backend`, `client`, `vendor`, `admin`.  
2. **Dockerfile** – Node 20 + Nginx for API, separate for each SPA.  
3. **Database migration** – use `prisma` or `typeorm` migrations to create tables.  
4. **Auth service** – implement JWT issuance + refresh.  
5. **API skeleton** – create controllers for tours, bookings, vendors, reviews.  
6. **Front‑end bootstrap** – set up Vite + React + Redux Toolkit; create `AuthContext`.  
7. **Map component** – integrate Google Maps with tour markers.  
8. **Payment integration** – Stripe Checkout flow, webhook endpoint.  
9. **Testing** – write unit tests for API endpoints; Cypress e2e flow.  
10. **CI/CD** – GitHub Actions workflow for build/test/push/deploy.  

---

## 📚 Resources & References

| Topic | Link |
|-------|------|
| PostgreSQL ER Diagram | https://www.lucidchart.com/ |
| OpenAPI Spec | https://swagger.io/specification/ |
| Stripe Checkout | https://stripe.com/docs/payments/checkout |
| PayPal IPN/Webhooks | https://developer.paypal.com/docs/api-basics/notifications/ipn/ |
| React Router v6 | https://reactrouter.com/docs/en/v6 |
| Redux Toolkit + RTK Query | https://redux-toolkit.js.org/rtk-query/overview |
| Vite + React | https://vitejs.dev/guide/#scaffolding-your-first-vite-project |
| Helm Charts | https://helm.sh/docs/intro/install/ |

---

## 📦 Example of a Complete `backend/src/openapi.yaml` (partial)

```yaml
openapi: 3.0.3
info:
  title: VineTours API
  version: 1.0.0
servers:
  - url: https://api.vinetours.com/v1
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
paths:
  /auth/login:
    post:
      summary: Login user and get JWT
      tags: [Auth]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email: {type: string, format: email}
                password: {type: string}
              required: [email,password]
      responses:
        '200':
          description: Successful login
          content:
            application/json:
              schema:
                type: object
                properties:
                  token: {type:string}
        '401':
          description: Invalid credentials
  /tours:
    get:
      summary: Search tours
      tags: [Tours]
      parameters:
        - in: query
          name: region_id
          schema: {type: integer}
        - in: query
          name: start_date
          schema: {type: string, format: date}
        - in: query
          name: price_min
          schema: {type: number}
        - in: query
          name: price_max
          schema: {type: number}
        - in: query
          name: page
          schema: {type: integer, default: 1}
        - in: query
          name: limit
          schema: {type: integer, default: 20}
      responses:
        '200':
          description: List of tours
          content:
            application/json:
              schema:
                type: object
                properties:
                  total:{type: integer}
                  page:{type: integer}
                  limit:{type: integer}
                  data:
                    type: array
                    items: {$ref:'#/components/schemas/Tour'}
  # ... more endpoints ...
```

> *Add `security: [{bearerAuth: []}]` to all protected endpoints.*

---

### 🎯 Key Deliverables for the Agent

1. **API layer** – fully typed controllers, services, and validation.
2. **Database migrations** – create all tables with proper constraints & indexes.
3. **Authentication** – JWT issuance, refresh, role checks (middleware).
4. **Client SPA** – search UI, map view, booking flow, user account.
5. **Vendor & Admin SPAs** – dashboards, CRUD UIs, data tables.
6. **Payments** – checkout integration + webhook handlers.
7. **Testing** – unit, integration, e2e; CI pipeline.
8. **Deployment scripts** – Dockerfiles, Helm chart, GitHub Actions.

Once those are in place, we can iterate on UX polish, performance tuning, and feature extensions (e.g., loyalty points, multi‑language support).

Let me know if you’d like to dive deeper into any specific component or need a starter template!
