# Task 8 - Services & Automations Views

## Summary
Created the Services management and Automations panel views for Glossy CRM.

## Files Created
- `src/components/crm/services/ServicesView.tsx` - Full CRUD service management with category grouping, search/filter, CLP formatting, active toggle
- `src/components/crm/automations/AutomationsView.tsx` - Automation management with smart recommendations, type-specific config forms, dynamic UI

## Files Modified
- `src/app/page.tsx` - Integrated ServicesView and AutomationsView

## Key Design Decisions
- Services grouped by category with distinct color coding (rose, violet, emerald, amber, sky)
- Category quick-select pills in create/edit dialogs for fast selection
- Automations have dynamic config fields that change based on selected type
- Smart Recommendations panel computes from client data and provides one-click "Activar" buttons
- All delete actions use AlertDialog for confirmation
- Hover-to-reveal action buttons for clean card design
- CLP price formatting with Intl.NumberFormat
