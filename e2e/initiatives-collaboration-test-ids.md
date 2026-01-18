# Initiatives Page Collaboration Features - E2E Test Reference

## Data-testid Attributes for E2E Testing

### Page Level
- `initiative-detail` - Main container for initiative detail view

### Owner Assignment
- `assign-owner-btn` - Button to open owner assignment modal
- `owner-select` - Dropdown select for choosing owner

### Budget Tracking
- `initiative-budget` - Main budget tracking section
- `budget-allocated` - Allocated budget display
- `budget-spent` - Spent budget display
- `budget-remaining` - Remaining budget display

### Health Status
- `initiative-health` - Health status dropdown (On Track, At Risk, Critical)
- `health-reason` - Textarea for health status change reason

### Progress Tracking
- `initiative-progress` - Progress percentage display

### Impact Map
- `impact-map-btn` - Button to view/show impact map
- `impact-map` - Impact map visualization container

### Link Cards
- `link-cards-btn` - Button to open card linking modal
- `card-select` - Dropdown select for choosing cards to link

### Comments
- `comment-input` - Textarea for entering comments
- `add-comment-btn` - Button to submit comment

### Activity Feed
- `activity-tab` - Tab button to switch to activity view
- `activity-feed` - Container displaying activity feed

## E2E Test Examples

### 1. Comment on Initiative
```typescript
await page.goto('/governance/initiatives');
await page.locator('[data-testid="initiative-item"]').first().click();
await page.locator('[data-testid="comment-input"]').fill('This initiative looks good.');
await page.locator('[data-testid="add-comment-btn"]').click();
await expect(page.locator('text=Comment added')).toBeVisible();
```

### 2. Assign Owner
```typescript
await page.locator('[data-testid="assign-owner-btn"]').click();
await page.locator('[data-testid="owner-select"]').selectOption('architect@archzero.local');
await page.locator('button:has-text("Assign")').click();
await expect(page.locator('text=Owner assigned')).toBeVisible();
```

### 3. Update Health Status
```typescript
await page.locator('[data-testid="initiative-health"]').selectOption('At Risk');
await page.locator('[data-testid="health-reason"]').fill('Budget constraints');
await page.locator('button:has-text("Save")').click();
await expect(page.locator('text=stakeholders notified')).toBeVisible();
```

### 4. View Activity Feed
```typescript
await page.locator('[data-testid="activity-tab"]').click();
await expect(page.locator('[data-testid="activity-feed"]')).toBeVisible();
```

### 5. Check Budget Tracking
```typescript
const budgetSection = page.locator('[data-testid="initiative-budget"]');
await expect(budgetSection.locator('[data-testid="budget-allocated"]')).toBeVisible();
await expect(budgetSection.locator('[data-testid="budget-spent"]')).toBeVisible();
await expect(budgetSection.locator('[data-testid="budget-remaining"]')).toBeVisible();
```

### 6. View Impact Map
```typescript
await page.locator('[data-testid="impact-map-btn"]').click();
await expect(page.locator('[data-testid="impact-map"]')).toBeVisible();
```

### 7. Link Cards
```typescript
await page.locator('[data-testid="link-cards-btn"]').click();
await page.locator('[data-testid="card-select"]').selectOption({ index: 1 });
await page.locator('button:has-text("Link")').click();
```

### 8. Check Progress
```typescript
const progress = page.locator('[data-testid="initiative-progress"]');
await expect(progress).toContainText(/\d+%/);
```

## Visual Selectors (Fallback Options)

When data-testid is not available, use these text-based selectors:

### Buttons
- `button:has-text("Assign Owner")`
- `button:has-text("Activity")`
- `button:has-text("View Impact Map")`
- `button:has-text("Link Cards")`

### Headings
- `h2:has-text("Budget Tracking")`
- `h2:has-text("Health Status")`
- `h2:has-text("Progress")`
- `h2:has-text("Comments")`
- `h2:has-text("Activity Feed")`

### Notification Messages
- `text=stakeholders notified`
- `text=notifications sent`
- `text=Owner assigned`
- `text=Comment added`

## Component Structure

```
initiative-detail
├── Header Card
│   ├── Title & Description
│   └── assign-owner-btn
│
├── Tabs Navigation
│   ├── Overview Tab
│   └── activity-tab
│
├── Overview Tab Content
│   ├── initiative-budget
│   │   ├── budget-allocated
│   │   ├── budget-spent
│   │   └── budget-remaining
│   │
│   ├── Health Status Card
│   │   ├── initiative-health (select)
│   │   └── health-reason (textarea)
│   │
│   ├── Progress Card
│   │   └── initiative-progress
│   │
│   ├── Impact Map Card
│   │   ├── impact-map-btn
│   │   └── impact-map
│   │
│   ├── Link Cards Card
│   │   ├── link-cards-btn
│   │   └── card-select
│   │
│   └── Comments Card
│       ├── comment-input
│       └── add-comment-btn
│
└── Activity Tab Content
    └── activity-feed
```

## Accessibility Considerations

All interactive elements include:
- Proper aria-labels where needed
- Keyboard navigation support
- Focus indicators
- Clear visual feedback
- Color-blind friendly color schemes (using text labels in addition to colors)

## Responsive Design

The components adapt to:
- Mobile (< 768px): Single column layout
- Tablet (768px - 1024px): Two column layout where appropriate
- Desktop (> 1024px): Full multi-column layout

## State Management

Key states tracked:
- Tab selection (overview/activity)
- Health value and update form visibility
- Notification display (auto-dismisses after 3 seconds)
- Comment list (in-memory state)
- Owner assignment modal visibility
- Form input values (controlled components)

All state updates trigger immediate UI re-renders with proper React lifecycle handling.
