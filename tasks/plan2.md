# Invocore

## Automated Invoicing & Payment Collection SaaS

**Document Version:** 1.0
**Product Stage:** MVP → Production SaaS
**Primary Market:** Small service businesses, agencies, freelancers, consultants, software/design/marketing teams

---

# 1. Product Overview

Invocore is a multi-tenant SaaS platform that helps service businesses manage clients, services, invoices, payments, and receivables from one system.

The product's primary objective is not simply to generate invoices.

The objective is to reduce the manual work involved in the entire invoice lifecycle:

```text
Client
  ↓
Invoice
  ↓
PDF generation
  ↓
Invoice delivery
  ↓
Payment collection
  ↓
Payment reconciliation
  ↓
Overdue detection
  ↓
Automated reminders
```

Invocore should allow a business to create an invoice once and let the system handle as much of the subsequent workflow as possible.

---

# 2. Problem Statement

Small service businesses frequently manage invoicing through a fragmented workflow involving spreadsheets, documents, email, payment gateways, and manual reminders.

Typical workflow:

```text
Create invoice manually
        ↓
Generate PDF
        ↓
Email client
        ↓
Remember payment deadline
        ↓
Check bank/payment gateway
        ↓
Update invoice status
        ↓
Follow up with client
        ↓
Send reminder
        ↓
Repeat
```

The problem is not merely invoice creation.

The larger problem is **accounts receivable administration**:

* Who owes the business money?
* How much?
* When is payment due?
* Which invoices are overdue?
* Was a partial payment made?
* Was the invoice actually delivered?
* Has the client viewed it?
* Has a reminder already been sent?
* Does the business need to follow up manually?

Invocore aims to automate this workflow.

---

# 3. Target Customer

## Primary ICP

Invocore should initially target small service-based businesses rather than attempting to serve every business type.

Examples:

* Software development agencies
* Design agencies
* Marketing agencies
* Freelancers
* Consultants
* IT service providers
* Small professional-service firms

Typical characteristics:

* 1–20 employees
* 10–500 active clients
* Recurring or project-based billing
* Multiple invoices per month
* Existing manual payment follow-up
* Need for team-based access

---

# 4. Product Positioning

### Proposed positioning

> **Invocore helps service businesses automate invoicing, payment collection, and overdue follow-ups.**

### Product promise

Instead of:

> "Create professional invoices."

The product should communicate:

> **"Create the invoice once. Invocore handles the follow-up."**

This distinction is important because basic invoice generation is already widely available.

---

# 5. Core Product Workflow

## Standard invoice

```text
Create invoice
      ↓
Save draft
      ↓
Issue invoice
      ↓
Generate PDF
      ↓
Send to client
      ↓
Client opens invoice
      ↓
Client pays
      ↓
Payment webhook
      ↓
Payment recorded
      ↓
Invoice marked PAID
```

## Unpaid invoice

```text
Invoice sent
      ↓
Due date approaching
      ↓
Automatic reminder
      ↓
Due date
      ↓
Still unpaid
      ↓
OVERDUE
      ↓
Automatic follow-up
      ↓
Payment received
      ↓
PAID
```

---

# 6. Existing Features

## Authentication

* Registration
* Login
* Logout
* Refresh-token rotation
* Password hashing
* JWT authentication
* Organization creation during registration

## Organizations

* Organization listing
* Active workspace switching
* Tenant membership validation
* Organization-scoped data

## RBAC

Roles:

```text
OWNER
ADMIN
ACCOUNTANT
VIEWER
```

Route-level permission checks.

---

# 7. Client Management

Users can:

* Create clients
* View clients
* Edit clients
* Delete clients
* Search by name/email
* Paginate client lists

Client data:

* Name
* Email
* Phone
* Tax ID
* Address
* Country
* Notes

All client records are organization-scoped.

---

# 8. Product & Service Catalog

Users can:

* Create products/services
* Edit products/services
* Delete products/services
* Search catalog
* Reuse catalog items in invoices
* Add custom invoice line items

Catalog fields:

* Name
* Description
* Unit price
* Currency
* Tax rate
* Active status

---

# 9. Invoice Management

Current functionality:

* Create draft invoices
* Edit draft invoices
* View invoices
* Delete drafts
* Multiple line items
* Subtotal calculation
* Tax calculation
* Total calculation
* Balance due
* Issue date
* Due date
* Notes
* Payment terms
* Search
* Status filtering
* Pagination
* Invoice status badges

---

# 10. Financial Data Integrity

Money must never be represented using floating-point arithmetic.

Instead:

```text
₹100.50
```

is stored as:

```text
10050
```

where the integer represents the smallest supported currency unit.

This avoids common floating-point precision problems in financial calculations.

---

# 11. Invoice Lifecycle

Initial lifecycle:

```text
DRAFT
  ↓
ISSUED
  ↓
SENT
```

Additional lifecycle states should eventually include:

```text
DRAFT
ISSUED
SENT
PARTIALLY_PAID
PAID
OVERDUE
CANCELLED
```

State transitions must be explicitly controlled by the API.

---

# 12. Invoice Numbering

Invoices use organization/year scoped numbering:

```text
INV-2026-00001
INV-2026-00002
INV-2026-00003
```

Number generation must be concurrency-safe.

Two simultaneous invoice creations must never receive the same invoice number.

---

# 13. Optimistic Locking

Invoices contain a version field.

Example:

```text
Invoice version = 5
```

Client A reads version 5.

Client B reads version 5.

Client A updates:

```text
5 → 6
```

Client B attempts to update using version 5.

The API rejects the stale update instead of silently overwriting Client A's changes.

---

# 14. PDF Generation

PDF generation is asynchronous.

Architecture:

```text
API
 ↓
BullMQ
 ↓
Redis
 ↓
Worker
 ↓
Generate PDF
 ↓
Store document
 ↓
Update document status
 ↓
SSE
 ↓
Frontend
```

Requirements:

* Background processing
* Retry support
* Persistent document status
* Failure handling
* Document storage
* Client status updates

---

# 15. Payment Management — P0

This is the next major feature.

Users must be able to record:

* Full payment
* Partial payment
* Multiple payments
* Payment date
* Payment method
* Transaction/reference ID
* Notes

Example:

```text
Invoice total:      ₹50,000
Payment 1:          ₹20,000
Payment 2:          ₹15,000
----------------------------
Paid:               ₹35,000
Balance:            ₹15,000
```

Invoice status:

```text
UNPAID
PARTIALLY_PAID
PAID
```

---

# 16. Online Payment Collection — P0

Invoices should eventually contain:

```text
[ Pay Invoice ]
```

The client opens a hosted payment page.

Example:

```text
INV-2026-00031

Acme Digital
Website Development

Total: ₹50,000
Due: 30 September 2026

[ Pay ₹50,000 ]
```

Payment provider integration should use server-side webhook verification.

Expected flow:

```text
Client
 ↓
Payment Gateway
 ↓
Webhook
 ↓
Verify signature
 ↓
Check idempotency
 ↓
Record payment
 ↓
Update invoice
```

Never mark an invoice as paid solely because the frontend reports successful payment.

---

# 17. Automatic Overdue Detection — P0

A scheduled worker should periodically identify invoices where:

```text
dueDate < current time
AND
remaining balance > 0
AND
invoice is not cancelled
```

Then:

```text
SENT
  ↓
OVERDUE
```

The transition must be idempotent.

Running the worker twice must not create duplicate state changes or duplicate notifications.

---

# 18. Automated Payment Reminders — P0

Businesses should configure reminder rules.

Example:

```text
7 days before due date
        ↓
Reminder

Due date
        ↓
Reminder

3 days after due date
        ↓
Overdue reminder

7 days after due date
        ↓
Follow-up
```

Configuration:

* Enable/disable reminders
* Days before/after due date
* Email template
* Recipient
* Maximum reminders
* Stop reminders when paid

The reminder engine should not send duplicate reminders.

---

# 19. Email Invoice Delivery — P0

When an invoice is sent:

```text
Invoice
 ↓
PDF
 ↓
Email
 ↓
Delivery status
```

Track:

```text
PENDING
SENT
FAILED
```

Future enhancement:

```text
DELIVERED
OPENED
```

Email sending should happen asynchronously rather than blocking the invoice API request.

---

# 20. Recurring Invoices — P1

Users can define recurring billing rules.

Example:

```text
Client: ABC Agency
Amount: ₹30,000
Frequency: Monthly
Start: 01 Oct 2026
```

System:

```text
Schedule
 ↓
Create invoice
 ↓
Generate PDF
 ↓
Send email
 ↓
Track payment
```

Supported frequencies:

* Weekly
* Monthly
* Quarterly
* Yearly
* Custom interval

---

# 21. Client Portal — P1

Each client should eventually have a secure portal.

Client can:

* View invoices
* Download invoices
* Pay invoices
* View payment history
* View outstanding balance
* View receipts
* Update permitted contact information

Example:

```text
Client Portal

Outstanding
₹85,000

Overdue
₹20,000

Recent invoices
INV-1024
INV-1023
INV-1022
```

---

# 22. Public Invoice Page — P1

Each invoice can have a secure public/limited-access URL.

Example:

```text
invocore.com/invoice/<secure-token>
```

The page should show:

* Business details
* Client details
* Invoice number
* Line items
* Taxes
* Total
* Amount paid
* Balance
* Due date
* Payment button
* PDF download

Sensitive organization data must not be exposed through predictable URLs.

---

# 23. Dashboard

Dashboard should focus on receivables rather than vanity metrics.

### Primary KPIs

```text
Outstanding
Overdue
Paid this month
Revenue this month
```

### Example

```text
Outstanding       ₹4,82,000
Overdue           ₹1,20,000
Paid this month   ₹3,45,000
Invoices pending       18
```

### Future analytics

* Revenue trend
* Accounts receivable aging
* Top clients
* Overdue clients
* Payment collection rate
* Average payment time
* Recurring revenue

---

# 24. Accounts Receivable Aging

Eventually provide:

```text
Current        ₹2,50,000
1–30 days      ₹80,000
31–60 days     ₹30,000
61–90 days     ₹20,000
90+ days       ₹15,000
```

This is more useful to a business than generic charts.

---

# 25. Team Management

Complete the existing RBAC system with:

* Invite team members
* Invitation expiry
* Resend invitation
* Accept invitation
* Change role
* Remove member
* View members
* Permission matrix

Example:

| Action         | Owner | Admin | Accountant | Viewer |
| -------------- | ----: | ----: | ---------: | -----: |
| Create invoice |     ✓ |     ✓ |          ✓ |        |
| Edit invoice   |     ✓ |     ✓ |          ✓ |        |
| Delete invoice |     ✓ |     ✓ |            |        |
| Record payment |     ✓ |     ✓ |          ✓ |        |
| Manage team    |     ✓ |     ✓ |            |        |
| View invoices  |     ✓ |     ✓ |          ✓ |      ✓ |

Exact permissions should be finalized before implementation.

---

# 26. Audit Log

Record important business events:

```text
Invoice created
Invoice issued
Invoice edited
Invoice cancelled
Payment recorded
Payment refunded
Client created
Team member invited
Role changed
```

Example:

```text
24 Sep 2026  17:04

Farhan
Recorded payment

Invoice:
INV-2026-00124

Amount:
₹25,000
```

For sensitive changes, capture:

* Actor
* Organization
* Entity
* Entity ID
* Action
* Timestamp
* Relevant before/after values

---

# 27. Storage

Development:

```text
Local filesystem
```

Production:

```text
S3 / compatible object storage
```

Production requirements:

* Private buckets
* Signed URLs
* No direct public access
* File metadata
* Access control
* Lifecycle policies

MinIO can be used for local S3-compatible development.

---

# 28. Architecture

```text
                    ┌─────────────────┐
                    │    Next.js      │
                    │    Frontend     │
                    └────────┬────────┘
                             │
                         HTTP/SSE
                             │
                    ┌────────▼────────┐
                    │   Core API      │
                    │    Express      │
                    └─────┬─────┬─────┘
                          │     │
                ┌─────────┘     └─────────┐
                ↓                         ↓
        ┌──────────────┐          ┌──────────────┐
        │ PostgreSQL   │          │    Redis     │
        │   + Prisma   │          │              │
        └──────────────┘          └──────┬───────┘
                                         │
                                      BullMQ
                                         │
                                  ┌──────▼───────┐
                                  │    Worker    │
                                  │    Service   │
                                  └──────┬───────┘
                                         │
                           ┌─────────────┼────────────┐
                           ↓             ↓            ↓
                         PDF          Email       Scheduled Jobs
```

---

# 29. Multi-Tenancy

Every organization-scoped entity must contain an organization relationship.

Conceptually:

```text
User
 ↓
OrganizationMembership
 ↓
Organization
 ↓
Clients / Products / Invoices / Payments
```

Every request must establish:

```text
authenticated user
        ↓
organization membership
        ↓
active organization
        ↓
authorized resource
```

Never trust an organization ID supplied by the client without validating membership.

---

# 30. Reliability Requirements

Background jobs must be:

* Retryable
* Idempotent
* Observable
* Recoverable

Important idempotency cases:

### Payment webhook

Same webhook may arrive multiple times.

Result:

```text
First webhook → payment created
Second webhook → ignored
```

### Reminder job

Same scheduled job should not send duplicate reminders.

### Invoice generation

Repeated processing should not create inconsistent documents.

---

# 31. Security Requirements

Minimum requirements:

* Password hashing
* JWT authentication
* Refresh-token rotation
* Authorization checks
* Tenant isolation
* Input validation
* Rate limiting
* Secure HTTP headers
* Secure cookies where applicable
* Webhook signature verification
* Object-storage access control
* Audit logging
* No plaintext passwords
* No sensitive payment credentials stored by Invocore

---

# 32. Testing Strategy

Do not aim for "100% coverage" just because it sounds impressive.

Prioritize high-risk behavior.

### Critical tests

**Tenant isolation**

```text
Organization A user
       ↓
tries Organization B invoice
       ↓
403 / 404
```

**RBAC**

```text
VIEWER
 ↓
attempt delete invoice
 ↓
DENIED
```

**Concurrency**

```text
Two users update same invoice
       ↓
One succeeds
One receives conflict
```

**Invoice numbering**

```text
100 concurrent invoice requests
       ↓
100 unique invoice numbers
```

**Payment idempotency**

```text
Same webhook × 3
       ↓
Exactly one payment record
```

**Reminder idempotency**

```text
Worker executes twice
       ↓
One reminder
```

These tests provide much more product value than superficial UI tests.

---

# 33. MVP Scope

## Must Have

* Authentication
* Organizations
* RBAC
* Clients
* Products/services
* Invoice creation
* Invoice lifecycle
* PDF generation
* Email delivery
* Payment recording
* Partial payments
* Online payment
* Payment webhook
* Overdue detection
* Automated reminders
* Basic dashboard
* Audit logs

## Should Have

* Recurring invoices
* Client portal
* Public invoice page
* Team invitations
* S3/MinIO
* AR aging

## Later

* Quotes
* Credit notes
* Expense tracking
* Time tracking
* Advanced analytics
* Multi-currency enhancements
* Accounting integrations
* GST-specific advanced workflows

---

# 34. Explicitly Out of Scope for MVP

Do not build:

* Full accounting software
* Payroll
* Inventory management
* CRM
* Project management
* HR
* Banking
* AI chatbot
* Generic business ERP

These features would expand the product without strengthening the initial core proposition.

---

# 35. Monetization Hypothesis

Pricing should not be finalized before customer validation.

Potential structure:

### Free

* Limited invoices
* Basic client management
* Basic PDF generation

### Pro

* Unlimited invoices
* Automated reminders
* Payment collection
* Recurring invoices
* Client portal
* Advanced reports

### Team

* Multiple users
* Advanced permissions
* Audit logs
* Advanced workflows
* Higher limits

The exact prices should be validated against the target customer's willingness to pay and the cost of payment/email/storage infrastructure.

---

# 36. Key Product Metrics

Do not primarily measure:

> Number of invoices created.

Measure whether Invocore solves the business problem.

### Activation

```text
Organization created
        ↓
First client added
        ↓
First invoice created
        ↓
First invoice sent
```

### Payment metrics

* % invoices paid
* Average days to payment
* Overdue amount
* Payment collection rate
* Reminder → payment conversion

### Retention

* Organizations active after 30 days
* Monthly invoices per organization
* Monthly payment volume
* Recurring invoice usage

### Automation

* % invoices automatically delivered
* % overdue invoices automatically followed up
* % payments automatically reconciled
* Manual actions per invoice

---

# 37. Competitive Reality

Invocore must NOT claim that features such as recurring invoices, reminders, customer portals, payment collection, or dashboards are unique.

Zoho Invoice already provides these capabilities, including automated reminders, recurring invoices, customer portal, online payments, reports, and GST-oriented functionality in India.

Zoho also supports recording offline and partial payments.

Stripe Invoicing similarly provides hosted invoice pages, payment collection, automatic reminders and customer self-service.

Therefore Invocore's differentiation must come from:

1. A specific customer segment
2. A simpler workflow
3. Better automation for that segment
4. Better integrations
5. Better UX
6. A specific regional/business workflow
7. Or a combination of these

---

# 38. Product Thesis

The product should be built around this hypothesis:

> **Small service businesses don't primarily need another place to create invoices. They need a system that reduces the manual work between sending an invoice and getting paid.**

Therefore:

```text
Invoice creation
        ↓
Delivery
        ↓
Payment
        ↓
Reconciliation
        ↓
Overdue detection
        ↓
Follow-up
```

is the core product loop.

---

# 39. Success Definition

Invocore is successful if a business can say:

> "I created the invoice, and after that I didn't have to manually chase the payment."

That is a stronger product outcome than:

> "I can create nice invoices."

---

# 40. Recommended Build Order

### Phase 1

Finish current foundation.

```text
Clients
Products
Invoices
PDF
RBAC
Multi-tenancy
```

### Phase 2

Build the money lifecycle.

```text
Payments
Partial payments
Payment status
Payment history
```

### Phase 3

Build automation.

```text
Email
Overdue detection
Reminder engine
Scheduled jobs
```

### Phase 4

Build collection.

```text
Payment gateway
Webhooks
Idempotency
Hosted payment page
```

### Phase 5

Build retention features.

```text
Recurring invoices
Client portal
Team invitations
Audit logs
```

### Phase 6

Validate before expanding.

```text
10–20 target businesses
        ↓
Observe current workflow
        ↓
Identify repeated pain
        ↓
Measure willingness to pay
        ↓
Prioritize features
```

Do not build Phase 6 features merely because they appear in this document.

---

# Final Product Definition

**Invocore is a multi-tenant SaaS for service businesses that automates the invoice-to-payment workflow.**

The product starts with:

```text
Clients
+
Services
+
Invoices
```

and evolves into:

```text
Invoice
 ↓
PDF
 ↓
Email
 ↓
Payment
 ↓
Reconciliation
 ↓
Overdue detection
 ↓
Automatic reminders
 ↓
Paid
```

The core differentiation should come from **who Invocore serves and how much manual payment follow-up it removes**, not from simply having more invoice features.
