# ERPNext Lite Operations

`erpnext_lite_ops` is a Frappe/ERPNext custom app that creates a simplified, desktop-first operations UI for multi-company users.

It keeps ERPNext's standard doctypes and business logic underneath while replacing the daily entry point with a lighter custom desk page, a persistent company switcher, and reduced form clutter for the main sales and purchasing workflows.

## What this app includes

- A custom desk page at `/app/lite-operations`
- An app entry on the v15 Apps screen
- A persistent company switcher for Lite Operations users
- Company-scoped list and document access for:
  - Quotation
  - Sales Order
  - Sales Invoice
  - Purchase Order
  - Purchase Invoice
- Simplified form behavior for:
  - Item
  - Customer
  - Supplier
  - Quotation
  - Sales Order
  - Sales Invoice
  - Purchase Order
  - Purchase Invoice
- Context-aware quick creation for:
  - Contact
  - Address
  - Item Price

## Assumptions

- Target platform: Frappe/ERPNext v15
- Users work in Desk, not Website mode
- Multi-company access is controlled with `User Permission` records on `Company`
- The user role for the simplified experience is `Lite Operations User`

## Install

1. Put this app inside your bench `apps` directory.
2. Install it on the site:

```bash
bench --site yoursite install-app erpnext_lite_ops
bench --site yoursite migrate
bench build
```

3. Assign the `Lite Operations User` role to the target users.
4. Create `User Permission` records for each allowed `Company`.
5. Mark one allowed company as `Is Default` for each user.
6. Optionally set the default app for those users to `Operaciones Lite`.

## Recommended permission model

The install hooks try to create a usable permission baseline for `Lite Operations User`.

Review it in Role Permission Manager and adjust for your business before going live, especially:

- submit/cancel rights on Sales Order, Sales Invoice, Purchase Order, and Purchase Invoice
- create/write rights on Item, Customer, Supplier, Contact, Address, and Item Price
- whether Company should stay read-only

## Suggested user setup

- Keep only the app entry `Operaciones Lite` visible for these users.
- Avoid broad accounting roles in V1.
- Use company `User Permission` records instead of giving access to all companies globally.

## Current V1 scope

- Items
- Customers
- Suppliers
- Quotations
- Sales Orders
- Sales Invoices
- Purchase Orders
- Purchase Invoices
- Support records via contextual actions:
  - Contacts
  - Addresses
  - Item Prices
  - Price Lists
  - Tax Templates
  - Payment Terms

## Out of scope in this scaffold

- Delivery Notes
- Purchase Receipts
- Warehouse operations
- Stock Entry operations
- Batch-specific receiving and stock movement flows
- Payments and broader accounting UI
