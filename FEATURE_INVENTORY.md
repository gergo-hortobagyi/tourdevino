## 1. Function Inventory

### Client Site Functions
| # | Feature | Description | Primary Page(s) |
|---|---------|-------------|-----------------|
| 1 | **Search & Browse Tours** | Keyword search, filters (region, price, rating, date, duration) | `/search` |
| 2 | **Map View** | Interactive map with tour markers, filter by region & radius | `/map` |
| 3 | **Tour Detail Page** | Full itinerary, photos/video, price, capacity, schedule, reviews | `/tours/:id` |
| 4 | **Booking Flow** | Date picker, guest count, special requests, payment (Stripe/PayPal) | `/tours/:id/book` |
| 5 | **User Account** | Registration, login, password reset, profile edit | `/login`, `/signup`, `/reset-password` |
| 6 | **Profile Management** | Personal details, saved payment methods, addresses | `/account/profile` |
| 7 | **Booking History** | List of past & upcoming bookings, cancellations | `/account/bookings` |
| 8 | **Reviews & Ratings** | Write review after a tour, display average rating | `/account/reviews` |
| 9 | **Social Sharing** | Share tour pages on social media (Facebook, Twitter) | `Share` button on `/tours/:id` |
|10 | **Static Pages** | About, FAQ, Terms & Conditions, Contact form | `/about`, `/faq`, `/terms`, `/contact` |

### Admin Site Functions
| # | Feature | Description | Primary Page(s) |
|---|---------|-------------|-----------------|
| 1 | **Dashboard Overview** | Sales, bookings, revenue metrics by date/region | `/admin` |
| 2 | **Tour Management** | CRUD tours, set status (active/inactive), inventory per date | `/admin/tours`, `/admin/tours/new`, `/admin/tours/:id/edit` |
| 3 | **Vendor Management** | Approve/reject vendors, edit profiles | `/admin/vendors`, `/admin/vendors/:id` |
| 4 | **Booking Management** | View all bookings, cancel, modify, issue refunds | `/admin/bookings`, `/admin/bookings/:id` |
| 5 | **User & Role Management** | Manage users, assign roles (admin, vendor), ban/unban | `/admin/users`, `/admin/users/:id` |
| 6 | **Analytics & Reports** | Traffic, conversion rates, revenue per region/tour | `/admin/reports` |
| 7 | **Content Management** | Edit static pages, FAQs, terms | `/admin/content` |
| 8 | **Settings & Configuration** | Email templates, payment gateway settings, system preferences | `/admin/settings` |

### Vendor Site Functions
| # | Feature | Description | Primary Page(s) |
|---|---------|-------------|-----------------|
| 1 | **Dashboard Overview** | Tour performance metrics, upcoming bookings | `/vendor` |
| 2 | **Tour Management** | Create new tour, edit details, upload media | `/vendor/tours`, `/vendor/tours/new`, `/vendor/tours/:id/edit` |
| 3 | **Inventory & Availability** | Set capacity per date/time, block dates | `/vendor/tours/:id/availability` |
| 4 | **Booking Management** | View bookings for own tours, accept/cancel, message customers | `/vendor/bookings`, `/vendor/bookings/:id` |
| 5 | **Review Management** | View & respond to reviews for own tours | `/vendor/reviews` |
| 6 | **Analytics per Tour** | Views, bookings, revenue breakdown by tour | `/vendor/tours/:id/analytics` |
| 7 | **Profile Management** | Vendor details, bank info for payouts | `/vendor/profile` |
| 8 | **Support & FAQ** | Contact support, view FAQs | `/vendor/support` |
| 9 | **Vendor Onboarding Application** | Submit/Resubmit vendor application for approval | API: `POST /api/vendor/applications` |

---

### Bottom‑Line

* **Client Site**: All user‑facing pages for searching, viewing and booking tours.  
* **Admin Site**: Internal dashboards for managing the entire catalogue, vendors, bookings and site settings.  
* **Vendor Site**: Dedicated portal for tour operators to upload tours, set inventory and manage their own bookings.

This function inventory + sitemap gives you a clear blueprint to start building the front‑end architecture, design navigation flows and wire up your domain API services. Happy coding!
