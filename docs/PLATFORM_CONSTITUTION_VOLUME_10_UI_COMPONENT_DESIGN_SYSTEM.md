# DOWNTOWN PERKS PLATFORM CONSTITUTION

# VOLUME 10

# UI COMPONENT SYSTEM, DESIGN SYSTEM & EXPERIENCE CONSTITUTION

**Version:** 1.0

**Purpose**

This document defines the complete visual language and component architecture for the Downtown Perks Platform.

Every application—including Marketing, Resident, Partner, Admin, and Super Admin—must inherit from this system.

No application may introduce an independent UI language.

The platform should feel like **one operating system**, regardless of the module.

---

# 1. DESIGN PHILOSOPHY

The interface should communicate:

* clarity
* confidence
* trust
* speed
* operational intelligence

The platform is **not** a dashboard product.

It is an operational workspace.

Everything exists to help users make decisions.

---

# 2. VISUAL PRINCIPLES

Every screen should feel:

Elegant

↓

Calm

↓

Structured

↓

Predictable

↓

Actionable

Never noisy.

Never decorative.

Never cluttered.

---

# 3. DESIGN LANGUAGE

Use only the Downtown Perks design language.

Typography

↓

Spacing

↓

Hierarchy

↓

Motion

↓

Color

↓

Elevation

↓

Iconography

↓

Interaction

Everything inherits shared tokens.

---

# 4. APPLICATION SHELL

Every application uses

```text
AppShell

↓

Primary Navigation

↓

Workspace Header

↓

Breadcrumbs

↓

Toolbar

↓

Workspace

↓

Inspector

↓

Notifications

↓

Footer
```

Never redesign AppShell.

---

# 5. PAGE STRUCTURE

Every page follows

```text
Page Header

↓

Summary KPIs

↓

Primary Actions

↓

Toolbar

↓

Workspace

↓

Inspector

↓

Timeline

↓

Related Records

↓

Footer Actions
```

No custom page layouts.

---

# 6. GRID SYSTEM

Desktop

12 columns

1320px content

Tablet

8 columns

Mobile

4 columns

Spacing tokens only.

---

# 7. TYPOGRAPHY

Families

Instrument Serif

Inter

Scale

Display

Hero

H1

H2

H3

Body

Caption

Overline

No third font family.

---

# 8. COLOR SYSTEM

Foundation

Background

Surface

Border

Primary Navy

Gold Accent

Success

Warning

Error

Information

Semantic colors only.

Never use arbitrary colors.

---

# 9. SPACING SYSTEM

Tokens only.

```text
4

8

12

16

20

24

32

40

48

64

80

96

120
```

No magic numbers.

---

# 10. RADIUS

Use shared tokens.

Small

Medium

Large

XL

Cards

Drawers

Buttons

Inputs

Consistent throughout.

---

# 11. ELEVATION

Three levels only.

Base

Raised

Overlay

No excessive shadows.

---

# 12. ICONOGRAPHY

Single icon library.

Consistent stroke.

Consistent size.

No mixed icon styles.

---

# 13. BUTTON SYSTEM

Variants

Primary

Secondary

Outline

Ghost

Danger

Icon

Loading

Disabled

Every button has:

Hover

Focus

Active

Disabled

Loading

---

# 14. CARD SYSTEM

Every card inherits

Header

↓

Body

↓

Actions

↓

Footer

Supports

Loading

Error

Empty

Interactive

---

# 15. KPI CARDS

Standard layout

Icon

↓

Metric

↓

Trend

↓

Comparison

↓

Action

No decorative charts.

---

# 16. TABLE SYSTEM

Supports

Search

Sort

Pagination

Bulk actions

Column chooser

Responsive cards

Sticky header

Selection

Export

---

# 17. FORM SYSTEM

Shared controls

Input

Textarea

Select

Combobox

Checkbox

Radio

Switch

Date

File Upload

Rich Text

Validation

Autosave

---

# 18. DRAWER SYSTEM

Right drawer

Desktop

Bottom sheet

Mobile

Sections

Overview

Activity

Relationships

Files

Settings

---

# 19. MODAL SYSTEM

Confirmation

Form

Wizard

Alert

Fullscreen

Review

Every modal traps focus.

---

# 20. TIMELINE SYSTEM

Shared timeline component.

Supports

Activity

Audit

History

Workflow

Comments

Approvals

---

# 21. SEARCH SYSTEM

Global search

Scoped search

Autocomplete

Saved searches

Recent searches

Keyboard shortcut

AI-assisted search

---

# 22. FILTER SYSTEM

Quick filters

Advanced filters

Saved views

Date filters

Tag filters

Status filters

Owner filters

---

# 23. NAVIGATION

Sidebar

Workspace navigation

Tabs

Breadcrumbs

Context menu

Overflow

Keyboard support

---

# 24. INSPECTOR PANEL

Standard inspector.

Contains

Overview

Activity

Files

History

Settings

Related records

No duplicated implementations.

---

# 25. EMPTY STATES

Every module defines

No data

No search results

No permissions

Offline

Archived

First-time setup

Each includes a meaningful CTA.

---

# 26. LOADING STATES

Skeletons

Progress indicators

Optimistic updates

No layout shift.

---

# 27. ERROR STATES

Actionable messaging.

Retry

Support link

Correlation ID

No generic failures.

---

# 28. NOTIFICATIONS

Toast

Banner

Inbox

Inline

Priority levels

Success

Info

Warning

Error

---

# 29. MOTION SYSTEM

Durations

150ms

200ms

250ms

300ms

Motion supports hierarchy.

Never decorative.

---

# 30. ACCESSIBILITY

WCAG AA

Keyboard navigation

ARIA

Focus rings

Contrast

Reduced motion

Screen readers

44px touch targets

---

# 31. RESPONSIVE SYSTEM

Desktop

↓

Tablet

↓

Mobile

No separate codebase.

Adaptive components only.

---

# 32. DESIGN TOKENS

Single source of truth.

Typography

Spacing

Colors

Radius

Elevation

Motion

Breakpoints

Icons

Tokens consumed by every application.

---

# 33. COMPONENT DOCUMENTATION

Every shared component includes

Purpose

Props

Variants

Accessibility

Responsive behavior

Usage examples

Tests

Migration notes

---

# 34. COMPONENT GOVERNANCE

No feature may create duplicate components.

Before building:

Search shared library.

If suitable component exists

↓

Reuse.

Otherwise

↓

Extend shared library.

---

# 35. VISUAL REGRESSION

Every shared component

Snapshot tested

Cross-browser

Responsive

Dark mode ready

RTL ready (future)

---

# 36. PLATFORM CONSISTENCY RULES

Every screen must feel like:

* the same application
* the same navigation
* the same interaction model
* the same typography
* the same motion
* the same spacing
* the same accessibility

Users should never wonder whether they have entered a different product.

---

# 37. DESIGN REVIEW CHECKLIST

Every screen must pass:

✓ Alignment

✓ Typography

✓ Spacing

✓ Responsive

✓ Accessibility

✓ Performance

✓ Shared components

✓ Visual consistency

✓ Interaction consistency

✓ Empty states

✓ Loading states

✓ Error states

✓ Keyboard navigation

---

# 38. FUTURE EXPANSION

The design system must support:

* White-label themes
* Brand customization
* Internationalization
* Dark mode
* Additional applications
* Native mobile clients
* Embedded partner portals

without redesigning components.

---

# DEFINITION OF DONE

The UI Platform is complete when:

* Every screen is composed from shared components.
* Every component consumes shared design tokens.
* Every interaction behaves consistently across applications.
* Every experience is accessible, responsive, and production-ready.
* No feature introduces a parallel design language.
* Marketing, Resident, Partner, Admin, and Super Admin all feel like different workspaces within the same Downtown Perks operating system.
