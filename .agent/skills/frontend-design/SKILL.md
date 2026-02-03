---
name: frontend-design
description: Create distinctive, production-grade mobile interfaces for React Native health applications. Use this skill when designing UI components, screens, or visual elements for the Follo app. Generates creative, polished, accessible designs that avoid generic AI aesthetics.
---

# Frontend Design Skill for Health Apps

This skill guides creation of distinctive, production-grade mobile interfaces for React Native health applications. Implement real working code with exceptional attention to aesthetic details, accessibility, and health-app-specific UX patterns.

## Design Thinking

Before coding, understand the context and commit to a **clear aesthetic direction**:

### Purpose Analysis
- **Who uses this?** Patients, caregivers, elderly users (45-65 primary), health optimizers (25-35)
- **Context of use?** Often in stressful situations (medication reminders, emergency access)
- **Accessibility needs?** High contrast, large touch targets, screen reader support mandatory

### Tone Selection
Choose an appropriate health app aesthetic:
- **Calm & Reassuring** - Soft palettes, rounded shapes, gentle animations
- **Clinical Precision** - Clean whites, structured grids, data-focused
- **Warm & Personal** - Natural colors, organic shapes, photo-centric
- **Modern Minimal** - Dark themes, sleek typography, subtle accents

### Differentiation
What makes Follo's UI memorable:
- **Privacy-first visual cues** (offline indicators, local-only badges)
- **Empathetic micro-interactions** (gentle confirmations, encouraging feedback)
- **Health-context awareness** (time-of-day theming, medication type colors)

## Mobile-First Guidelines

### Typography
```css
/* Health App Typography Scale */
--font-display: 'Gabarito', sans-serif;    /* Medication names, headers */
--font-body: 'Inter', system-ui;           /* Body text, descriptions */
--font-data: 'JetBrains Mono', monospace;  /* Dosages, times, numbers */

/* Sizes optimized for readability */
--text-xl: 24px;    /* Primary headers */
--text-lg: 18px;    /* Section titles */
--text-md: 16px;    /* Body text (minimum for health apps) */
--text-sm: 14px;    /* Secondary info */
--text-xs: 12px;    /* Timestamps only */
```

### Color System
```css
/* Health Action Colors */
--color-medication: #4A90D9;      /* Blue - safe, clinical */
--color-supplement: #7CB342;      /* Green - natural, wellness */
--color-appointment: #9575CD;     /* Purple - professional */
--color-activity: #FF8A65;        /* Coral - energy, movement */

/* Status Colors */
--color-success: #4CAF50;         /* Taken, completed */
--color-warning: #FFC107;         /* Refill soon, upcoming */
--color-error: #F44336;           /* Missed, critical */
--color-neutral: #9E9E9E;         /* Skipped, inactive */

/* Notification Modes */
--color-home-mode: #4CAF50;       /* Green - calm */
--color-heavy-sleeper: #2196F3;   /* Blue - alert */
```

### Touch Targets & Spacing
```css
/* Minimum touch targets (WCAG AAA) */
--touch-target-min: 48px;
--touch-target-comfortable: 56px;

/* Spacing scale */
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
```

## Component Patterns

### Health Cards
Medication, appointment, and activity cards should:
- Show photo/icon prominently (64x64 minimum)
- Display primary action clearly (status indicator)
- Include secondary info without clutter
- Support swipe gestures for quick actions

### Timeline Views
- Clear time-based grouping (Morning, Afternoon, Evening)
- Visual hierarchy: current → upcoming → past
- Status indicators visible at a glance
- Empty states that encourage, not scold

### Forms & Input
- Large input fields (56px height minimum)
- Inline validation with helpful messages
- Photo capture integration for medications
- Voice input support for accessibility

## Animation Guidelines

### Health-Appropriate Motion
```typescript
// Gentle, reassuring animations
const gentleSpring = {
  type: 'spring',
  damping: 20,
  stiffness: 100,
};

// Quick feedback for actions
const quickFeedback = {
  duration: 150,
  easing: 'ease-out',
};

// Status transitions
const statusChange = {
  duration: 300,
  easing: 'ease-in-out',
};
```

### Animation Principles
- **Subtle over dramatic** - Users may be unwell; avoid jarring motion
- **Confirm actions clearly** - Checkmarks, status changes must be obvious
- **Reduce motion option** - Respect `prefers-reduced-motion`
- **Loading states** - Skeleton screens over spinners

## Accessibility Requirements (WCAG AA Minimum)

### Visual
- Contrast ratio: 4.5:1 minimum for text
- Focus indicators visible and clear
- Color not sole conveyor of meaning
- Text resizable to 200% without loss

### Motor
- Touch targets: 48x48px minimum
- Sufficient spacing between targets
- Gesture alternatives available
- No time-limited interactions

### Cognitive
- Clear, consistent navigation
- Meaningful error messages
- Undo capability for destructive actions
- Progress indicators for multi-step flows

## Anti-Patterns to Avoid

❌ **Generic gradient buttons** with purple/blue gradients
❌ **Tiny text** below 14px for any readable content
❌ **Icon-only buttons** without labels or tooltips
❌ **Alarming colors** for non-critical actions
❌ **Dense data tables** without hierarchy
❌ **Skeleton screens** that last more than 2 seconds
❌ **Modal overload** - avoid stacking modals
❌ **Auto-dismissing notifications** for important confirmations

## Widget Design (Android Home Screen)

### Constraints
- RemoteViews limitations (no custom fonts in older Android)
- Fixed layout grids
- Limited interaction patterns

### Widget Best Practices
- Dark gradient backgrounds for readability
- High-contrast text (white on dark)
- Large touch targets for action buttons
- Status-at-a-glance design
- Medication photo visible (circular crop)
- Time prominently displayed
