---

# Appendix F: UI/UX Sitemap & Wireframes

**Framework:** React + Shadcn UI + TanStack Query
**Design System:** Arc Zero Design Language (AZDL)
**Last Updated:** January 13, 2026

---

## 1. Global Navigation (App Shell)

**Layout:** Permanent Left Sidebar (Collapsible) + Top Header + Main Content Area

### 1.1 Sidebar Menu

**Hierarchy:**

1. **Dashboard** 
   - Icon: 📊 (Dashboard icon)
   - Route: `/`
   - Description: High-level executive summary

2. **Inventory**
   - Icon: 📦 (Database icon)
   - Route: `/cards`
   - Description: Master list of all Cards
   - Badge: Total count (e.g., "1,234")

3. **Reports**
   - Icon: 📈 (Chart icon)
   - Route: `/reports`
   - Submenu:
     - Landscape Heatmap (`/reports/landscape`)
     - Dependency Matrix (`/reports/matrix`)
     - Roadmap Timeline (`/reports/roadmap`)
     - Tech Radar (`/reports/tech-radar`)

4. **Intelligence**
   - Icon: 🤖 (Brain icon)
   - Route: `/intelligence`
   - Submenu:
     - 6R Migration Advisor (`/intelligence/6r`)
     - BIA Assessment (`/intelligence/bia`)
     - TCO Calculator (`/intelligence/tco`)

5. **Governance**
   - Icon: 🛡️ (Shield icon)
   - Route: `/governance`
   - Submenu:
     - Architecture Principles (`/governance/principles`)
     - Technology Standards (`/governance/tech-standards`)
     - Policies (`/governance/policies`)
     - Exceptions (`/governance/exceptions`)
     - Compliance (`/governance/compliance`)

6. **Strategic Planning**
   - Icon: 🎯 (Target icon)
   - Route: `/strategy`
   - Submenu:
     - Target State (`/strategy/target-state`)
     - Initiatives (`/strategy/initiatives`)
     - Transformation Roadmap (`/strategy/roadmap`)
     - Gap Analysis (`/strategy/gap-analysis`)

7. **Risk & Compliance**
   - Icon: ⚠️ (Warning icon)
   - Route: `/risk`
   - Submenu:
     - Risk Register (`/risk/register`)
     - Risk Heat Map (`/risk/heat-map`)
     - Compliance Dashboard (`/risk/compliance`)

8. **ARB (Architecture Review Board)**
   - Icon: ✅ (Checkmark icon)
   - Route: `/arb`
   - Role Required: `Architect` or `Admin`
   - Submenu:
     - Pending Reviews (`/arb/pending`)
     - My Requests (`/arb/my-requests`)
     - Meetings (`/arb/meetings`)
     - Decisions (`/arb/decisions`)

9. **Data Exchange**
   - Icon: ⬇️⬆️ (Import/Export icon)
   - Route: `/exchange`
   - Submenu:
     - Import Wizard (`/exchange/import`)
     - Pustaka Sync (`/exchange/pustaka`)
     - Export Data (`/exchange/export`)

10. **Settings (Admin)**
   - Icon: ⚙️ (Gear icon)
   - Route: `/settings`
   - Role Required: `Admin`
   - Submenu:
     - Metamodel Editor (`/settings/metamodel`)
     - Scoring Profiles (`/settings/scoring`)
     - User Management (`/settings/users`)
     - System Configuration (`/settings/system`)

---

### 1.2 Top Header

**Left Section:**
- **Logo:** Arc Zero wordmark (clickable → Dashboard)
- **Breadcrumbs:** Current page path (e.g., "Reports > Landscape Heatmap")

**Center Section:**
- **Global Search:** `Cmd+K` / `Ctrl+K` command palette
  - Placeholder: "Search cards, reports, or type a command..."
  - Keyboard shortcut badge visible

**Right Section:**
- **Context Selector:** "Current Organization" dropdown (if multi-tenant)
- **Notifications:** Bell icon with badge count
- **User Profile:** Avatar dropdown
  - My Profile
  - Settings
  - Help & Documentation
  - Logout

---

### 1.3 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` / `Ctrl+K` | Open global search |
| `G` then `D` | Go to Dashboard |
| `G` then `I` | Go to Inventory |
| `G` then `R` | Go to Reports |
| `G` then `G` | Go to Governance |
| `G` then `S` | Go to Strategic Planning |
| `G` then `K` | Go to Risk |
| `G` then `A` | Go to ARB (if Architect/Admin) |
| `N` | New Card (opens modal) |
| `?` | Show keyboard shortcuts help |
| `Esc` | Close modal/drawer |

---

## 2. Screen Specifications

### 2.1 Dashboard (Home)

**Goal:** "Morning Coffee" view for Enterprise Architects.

**Layout:** Grid of widgets (2x2 on desktop, stacked on tablet/mobile)

---

#### Widget A: Portfolio Health (Top Left)

**Visualization:** Donut chart (D3.js)

**Data:**
- **Center Number:** Overall health score (0-100)
- **Segments:**
  - Green: Perfect Fit (Functional 4, Technical 4)
  - Yellow: Appropriate (Functional 3, Technical 3)
  - Orange: Needs Attention (Any dimension < 3)
  - Red: Critical (Any dimension < 2)

**Interaction:**
- Click segment → Navigate to Inventory filtered by that segment
- Hover → Show count and percentage

---

#### Widget B: Data Quality (Top Right)

**Visualization:** Radial gauge chart

**Data:**
- **Gauge Value:** Average `quality_score` across all Cards (0-100)
- **Color Coding:**
  - 90-100: Green (Excellent)
  - 75-89: Yellow (Good)
  - 60-74: Orange (Fair)
  - 0-59: Red (Poor)

**Interaction:**
- Click → Navigate to Inventory sorted by quality_score ascending (show worst first)

---

#### Widget C: Criticality Watch (Bottom Left)

**Visualization:** Data table with inline status badges

**Data:**
- List of Tier 1 (Mission Critical) applications with Health < 3
- Columns: Application Name, Technical Fit, Functional Fit, Owner

**Interaction:**
- Click row → Navigate to Card Detail page
- Badge colors match health scoring (Red for <2, Orange for 2)

---

#### Widget D: Recent Activity (Bottom Right)

**Visualization:** Activity feed (timeline)

**Data:**
- Last 10 changes across all Cards
- Format: "John Doe updated Salesforce CRM 2 hours ago"

**Interaction:**
- Click entry → Navigate to Card History tab
- "View All" link → Navigate to Audit Log page

---

### 2.2 Inventory (The "Excel Killer")

**Goal:** Fast filtering and bulk editing of all Cards.

**Layout:** Sidebar (Filters) + Main (Data Table)

---

#### Left Sidebar: Faceted Filters

**Filter Groups:**

1. **Card Type** (Multi-select)
   - ☐ Application (987)
   - ☐ Business Capability (45)
   - ☐ IT Component (1,234)

2. **Lifecycle Phase** (Multi-select)
   - ☐ Planning (12)
   - ☐ Active (856)
   - ☐ Phase Out (45)
   - ☐ End of Life (20)

3. **Tags** (Multi-select autocomplete)
   - Search box to find tags
   - Shows top 10 most used tags

4. **Custom Filters** (Dynamic - based on metamodel)
   - Hosting Type (for Applications)
   - Strategic Importance (for Capabilities)

**Actions:**
- **Clear All** button
- **Save Filter** button (Save current filter as a preset)

---

#### Main Area: Data Table (Shadcn DataTable)

**Features:**
- **Server-Side Pagination:** 50/100/200 items per page
- **Column Sorting:** Click header to sort
- **Row Selection:** Checkbox column for bulk actions
- **Responsive:** Horizontal scroll on smaller screens

**Default Columns:**
| Column | Type | Sortable | Filterable |
|--------|------|----------|------------|
| Name | Text | ✅ | ✅ (Search) |
| Type | Badge | ✅ | ✅ (Filter) |
| Lifecycle | Timeline badge | ✅ | ✅ |
| Quality Score | Progress bar | ✅ | ✅ (Range slider) |
| Tags | Tag pills | ❌ | ✅ |

**Dynamic Columns:**
- Users can toggle JSONB fields as visible columns
- Example: Show "Hosting Type" column for Applications
- Saved per user in local storage

**Bulk Actions (Bottom Toolbar):**
- When rows are selected:
  - **Edit Tags** (Add/Remove tags to selected cards)
  - **Archive** (Soft delete)
  - **Recalculate Quality** (Trigger score refresh)
  - **Export to Excel** (Download selected rows)

---

### 2.3 The Card Detail View (The Core UI)

**Goal:** Single source of truth for an entity.

**Layout:** Fixed Header + Tabbed Content Area

---

#### Header Region

**Left Section:**
- **Icon:** Card type icon (App, Capability, Component)
- **Title:** Card name (e.g., "Salesforce CRM")
- **Subtitle:** Card type (e.g., "Application")

**Center Section:**
- **Badges:**
  - Lifecycle Status (e.g., "Active" - green badge)
  - Criticality (e.g., "Tier 1" - red badge)
  - Custom badges from JSONB (e.g., "Cloud" tag)

**Right Section:**
- **Action Buttons:**
  - `Edit` (Opens edit modal or inline editing)
  - `Archive` (Soft delete with confirmation)
  - `View in Graph` (Navigate to graph view centered on this node)
  - `More Actions` dropdown:
    - Duplicate Card
    - Export as PDF
    - View History

---

#### Tab 1: Overview (Properties)

**Section 1: Essentials**
- **Name:** (Editable inline or in modal)
- **Description:** (Rich text editor - Markdown supported)
- **Owner:** (User picker - autocomplete)
- **Tags:** (Tag input with autocomplete)

**Section 2: Lifecycle Timeline**
- **Visualization:** Horizontal timeline (similar to Gantt)
- **Fields:**
  - Plan: 2019-06-01
  - Phase In: 2020-01-01
  - Active: 2020-03-15 ← Current
  - Phase Out: (Not set)
  - EOL: (Not set)
- **Interaction:** Click date to edit (date picker)

**Section 3: Attributes (JSONB - Dynamic)**
- **Rendering:** Form fields generated from `metamodel_rules`
- **Examples:**
  - Hosting Type: Dropdown (SaaS, PaaS, IaaS, On-Premise)
  - Cost Center: Text input with validation (Regex: `^CC-[A-Z]{2,4}-\d{2}$`)
  - Estimated Cost: Currency input (USD $)
- **Validation:** Real-time (shown as user types)

---

#### Tab 2: Landscape (Relations)

**Layout:** Split view (Left: List, Right: Mini-Graph)

**Left Panel: Relationship Lists**

**Section: Upstream (What relies on me?)**
- List of Cards that depend on this Card
- Example for "Database Server":
  - ➤ Salesforce CRM (Application)
  - ➤ HR Portal (Application)
  - ➤ Analytics Dashboard (Application)

**Section: Downstream (What do I rely on?)**
- List of Cards this Card depends on
- Example for "Salesforce CRM":
  - ↓ PostgreSQL Database (IT Component)
  - ↓ AWS EC2 Cluster (Platform)
  - ↓ Sales Capability (Business Capability)

**Section: Related (Other connections)**
- Owned By: Sales Department (Organization)
- Provides: Salesforce REST API (Interface)

**Right Panel: Mini-Graph View**
- **Visualization:** D3 Force-Directed Graph
- **Centered On:** Current Card (highlighted in center)
- **Depth:** 1 level (direct neighbors)
- **Interaction:**
  - Click node → Navigate to that Card's detail page
  - Hover → Show tooltip with Card type and name

---

#### Tab 3: Intelligence

**Section 1: BIA Calculator**

**Form:**
- **Inputs:**
  - Financial Impact: Slider (1-4)
  - Legal Impact: Slider (1-4)
  - Safety Impact: Slider (1-4)
  - Operational Impact: Slider (1-4)
- **Button:** "Calculate Criticality"

**Output (Read-Only):**
- **Criticality Tier:** Tier 1: Mission Critical
- **Reasoning:** "Safety impact (4.0) overrides low financial impact per MAX aggregation rule"
- **SLA Targets:**
  - Uptime: 99.99%
  - RTO: < 1 Hour
  - RPO: < 15 Minutes

---

**Section 2: TCO Waterfall**

**Visualization:** Sankey diagram (D3.js)

**Data Flow:**
- Left: IT Components (e.g., Database $10k, Server $5k)
- Middle: This Application (Salesforce CRM)
- Right: Business Capabilities (Sales $225k)

**Interaction:**
- Hover over flow → Show allocation percentage
- Click component → Navigate to that Card

---

**Section 3: 6R Migration Advisor**

**Display:**
- **Recommended Strategy:** REFACTOR (badge)
- **Confidence:** 85% (progress bar)
- **Reasoning:** "High Functional Fit (4/4) but Low Technical Fit (2/4) triggers cloud-native refactor rule."
- **Estimated Effort:** 12-24 months
- **Risks:** (Collapsible list)
  - Requires team upskilling in Kubernetes
  - Database migration complexity

**Alternative Strategies:** (Expandable accordion)
- REHOST (60% confidence) - "Faster but misses modernization benefits"

---

#### Tab 4: History (Audit Trail)

**Visualization:** Timeline with diff view

**Features:**
- **Filter:** By field, by user, by date range
- **Timeline:** Vertical timeline showing all changes
- **Diff View:** Side-by-side comparison of old vs. new values

**Example Entry:**
```
John Doe updated Salesforce CRM
2 hours ago

Changed:
- hosting_type: "On-Premise" → "SaaS"
- financials.estimated_annual_cost: $150,000 → $180,000
```

**Interaction:**
- Click entry → Expand to show full JSON diff
- **Revert** button (Admin only) → Restore to previous version

---

## 3. Reports Module

**Goal:** Strategic decision support via advanced visualizations.

---

### 3.1 Common Feature: The "Time Machine" Bar

**Position:** Top of every report page (sticky header)

**Components:**
- **Date Selector:** Date picker or slider
  - Default: "Today" (real-time data)
  - Historical: "Show me Jan 1, 2025"
  - Future: "Show me target state on Jun 30, 2027"
- **Play Button:** Animate through dates (time-lapse)
- **Preset Buttons:** "Today", "End of Last Quarter", "End of Year"

**Behavior:**
- When date changes → Re-query graph with `target_date` parameter
- Show loading skeleton while data fetches
- Animate transitions between states

---

### 3.2 Report A: Landscape Heatmap

**Visualization:** D3 Treemap (Hierarchical Rectangles)

**Data Hierarchy:**
- Level 1: Business Capability (e.g., "Sales")
- Level 2: Sub-Capability (e.g., "Lead Management")
- Level 3: Application (e.g., "Salesforce CRM")

**Controls (Top Toolbar):**
- **Color By:** Dropdown
  - Technical Fit (Red/Yellow/Green)
  - Functional Fit
  - Business Criticality
  - Lifecycle Phase
  - Custom JSONB field
- **Zoom Controls:** +/- buttons
- **Reset View:** Button to reset zoom

**Interaction:**
- **Click Rect:** Drill down into that capability
- **Breadcrumb Trail:** "Enterprise > Sales > Lead Management" (Click to zoom out)
- **Hover:** Tooltip showing Card name, type, and selected metric value

**Legend:** (Bottom Right)
- Color scale explanation (e.g., "Red = Poor, Green = Excellent")

---

### 3.3 Report B: Dependency Matrix

**Visualization:** Interactive X/Y Grid (Heatmap)

**Axes:**
- **X-Axis:** Business Capabilities
- **Y-Axis:** Applications
- **Cell Value:** Count of `SUPPORTS` relationships

**Controls:**
- **Filter:** Show only cells with value > 0
- **Sort:** Alphabetical or by density

**Interaction:**
- **Click Cell:** Open modal listing all relationships in that intersection
- **Hover:** Tooltip showing count

**Export:** Button to export as CSV

---

### 3.4 Report C: Roadmap (Gantt Chart)

**Visualization:** Timeline Chart (similar to Microsoft Project)

**Data:**
- **Rows:** Cards grouped by Business Capability
- **Bars:** Lifecycle phases (Plan → Phase In → Active → Phase Out → EOL)
- **Color Coding:** By Criticality or Card Type

**Controls:**
- **Group By:** Dropdown (Business Capability, Organization, Card Type)
- **Filter:** Show only specific phases (e.g., "Active")
- **Time Range:** Zoom to specific date range (e.g., "2026-2027")

**Interaction:**
- **Click Bar:** Navigate to Card detail
- **Drag Bar:** Edit lifecycle dates (if user has permission)
- **Hover:** Tooltip showing exact dates

**Time Machine Integration:**
- Slider shows the "Current Date" line moving through the timeline
- Cards appear/disappear based on `valid_from/valid_to` on relationships

---

## 4. Governance & Strategy Screens

New in v2.0: Screens for architecture governance, strategic planning, and compliance management.

---

### 4.1 Architecture Principles List

**Route:** `/governance/principles`

**Layout:** Data table with summary cards

**Header Section:**
- **Summary Cards:** (Top row)
  - Total Principles: 15
  - Average Adherence: 78% (gauge chart)
  - Violations: 12 (red badge, clickable to filter)

**Table Columns:**
| Column | Description |
|--------|-------------|
| Name | Principle name (clickable → detail) |
| Category | Badge: Strategic, Business, Technical, Data |
| Statement | Truncated preview (first 100 chars) |
| Owner | User who owns this principle |
| Adherence Rate | Progress bar (0-100%) |
| Actions | Edit, Delete buttons |

**Actions:**
- **New Principle** button (top right)
- **Filter by Category** dropdown
- **Export to PDF** button

---

### 4.2 Principle Detail View

**Route:** `/governance/principles/{id}`

**Layout:** Tabbed view

**Header:**
- Name, Category badge, Owner avatar
- **Adherence Gauge:** Donut chart showing % compliant cards

**Tabs:**
1. **Overview**
   - Statement (rich text)
   - Rationale (markdown)
   - Implications (bullet list)
   - Owner info

2. **Adherence**
   - **Compliance Rate:** 78% (gauge)
   - **Compliant Cards:** 45 (green, clickable list)
   - **Non-Compliant Cards:** 12 (red, clickable list)
   - **Exempt Cards:** 3 (yellow, with exception links)

3. **History**
   - Audit trail of changes to this principle

---

### 4.3 Technology Standards (Technology Radar)

**Route:** `/governance/tech-standards`

**Layout:** Interactive radar visualization + table

**Top Section:** Technology Radar
- **Visualization:** Concentric circles (Adopt, Trial, Assess, Hold, Banned)
- **Quadrants:** Languages, Frameworks, Databases, Infrastructure
- **Interactivity:**
  - Hover technology → Tooltip with details
  - Click technology → Open detail panel (right sidebar)
  - Filter by category dropdown

**Bottom Section:** Standards Table
| Column | Description |
|--------|-------------|
| Name | Technology name |
| Category | Database, Language, Framework, etc. |
| Status | Badge: Adopt, Trial, Assess, Hold, Sunset, Banned |
| Sunset Date | Date picker (if sunset status) |
| Replacement | Link to replacement standard (if any) |

**Actions:**
- **New Standard** button
- **Technology Debt Report** button
- **Export Radar** (PNG/PDF)

---

### 4.4 Policies & Exceptions Dashboard

**Route:** `/governance/policies`

**Layout:** 3-column dashboard

**Column 1: Policy List**
- Filterable by severity (Critical, High, Medium, Low)
- Filterable by enforcement (Blocking, Warning)
- Each policy shows:
  - Name, severity badge, enforcement mode
  - Violation count (red badge if > 0)
  - Click → detail view

**Column 2: Active Exceptions**
- Grouped by status: Pending (5), Approved (12), Expiring Soon (3)
- Each exception shows:
  - Policy name
  - Card name
  - Justification (truncated)
  - Expires in (countdown)
  - Approve/Reject buttons (for pending)

**Column 3: Violations Summary**
- **Critical Violations:** 3 (red)
- **High Violations:** 8 (orange)
- **Total Open Violations:** 45
- **Trend Chart:** Line chart showing violations over time

---

### 4.5 Initiatives Portfolio

**Route:** `/strategy/initiatives`

**Layout:** Kanban-style board (by status) or Table view toggle

**Kanban Columns:**
- Planning
- In Progress (grouped by health: On Track / At Risk / Behind Schedule)
- On Hold
- Completed

**Card Content:**
- Initiative name
- Type badge: Migration, Modernization, Consolidation, etc.
- Budget: $1.2M / $5M (progress bar)
- Timeline: Jan 2026 - Dec 2027
- Owner avatar
- Affected cards count: 45
- Health indicator: Green / Yellow / Red

**Actions:**
- **New Initiative** button
- **View Toggle:** Kanban / Table / Timeline
- **Filter by Strategic Theme**
- **Export Roadmap** button

---

### 4.6 Initiative Detail

**Route:** `/strategy/initiatives/{id}`

**Layout:** Tabbed view

**Header:**
- Name, Type badge, Status badge, Health indicator
- **Budget Progress:** $1.2M spent of $5M total (24%)
- **Timeline:** Gantt chart bar

**Tabs:**
1. **Overview**
   - Description
   - Strategic theme
   - Budget breakdown (table)
   - Key milestones (timeline)

2. **Impact Map** (Graph visualization)
   - **Center:** This initiative
   - **Surrounding:** Affected cards (applications, components, capabilities)
   - **Color coding:** Current state (red) vs Target state (green)
   - **Interaction:** Click node → Navigate to card

3. **Dependencies**
   - **Prerequisites:** Initiatives that must complete first
   - **Dependents:** Initiatives waiting on this one

4. **Risks & Mitigations**
   - **Risks threatening this initiative:** List with risk scores
   - **Mitigation plans:** Linked initiatives

---

### 4.7 Risk Register

**Route:** `/risk/register`

**Layout:** Data table with filters

**Filter Bar:**
- Risk Type dropdown: Security, Compliance, Operational, Financial, Strategic
- Status dropdown: Open, Mitigated, Accepted, Transferred, Closed
- Minimum Risk Score slider: 0-25

**Table Columns:**
| Column | Description |
|--------|-------------|
| Risk Score | Color-coded: 20-25 (red), 15-19 (orange), 10-14 (yellow), <10 (green) |
| Name | Risk name (clickable → detail) |
| Type | Badge |
| Likelihood | 1-5 (star rating) |
| Impact | 1-5 (star rating) |
| Owner | Avatar |
| Status | Badge |
| Actions | Mitigate, Accept, Transfer buttons |

**Views:**
- **Table View:** Default (described above)
- **Heat Map View:** 5x5 matrix (Likelihood × Impact)
- **Top 10 View:** Ranked by risk score

---

### 4.8 Compliance Dashboard

**Route:** `/risk/compliance`

**Layout:** Framework-centric dashboard

**Left Sidebar:** Frameworks
- GDPR
- SOX
- HIPAA
- PCI-DSS
- ISO 27001

**Main Content Area:**
- **Framework Header:** Selected framework (e.g., "GDPR")
- **Summary Cards:**
  - Applicable Cards: 150
  - Compliant: 120 (80%)
  - Non-Compliant: 25 (red, clickable list)
  - Exempt: 5

- **Required Controls:** Check list
  - ☑ Data encryption at rest (120/150 compliant)
  - ☑ Data encryption in transit (140/150 compliant)
  - ☑ Right to erasure (100/150 compliant)
  - ☐ Data portability (85/150 compliant) ← Click to view non-compliant cards

- **Timeline:** Last audit date, next audit date (countdown)

---

### 4.9 ARB Review Queue

**Route:** `/arb/pending`

**Role Required:** Architect or Admin

**Layout:** Inbox-style queue

**Queue Sections:**
- **Pending Review** (10 items)
- **Approved This Week** (5 items)
- **Rejected This Week** (2 items)

**Each Review Card:**
- Card name and type
- Request type: Technology Selection, Exception Request, New Application
- Requester avatar and name
- Submitted time: "2 hours ago"
- Priority badge: High, Medium, Low
- **Actions:** Review, Delegate buttons

**Review Modal:**
- Shows full request details
- Card impact assessment (auto-generated)
- **Decision Buttons:**
  - Approve (with conditions textarea)
  - Reject (with reason textarea, required)
  - Request More Info

---

## 5. Data Exchange (Import Wizard)

**Goal:** User-friendly bulk data upload from Excel/CSV.

**Flow:** 4-Step Wizard

---

### Step 1: Upload File

**UI:**
- **Dropzone:** Drag-and-drop area
  - Accepted formats: `.xlsx`, `.csv`
  - Max size: 10 MB
- **Card Type Selector:** Dropdown (Application, Business Capability, etc.)
- **Button:** "Next: Map Columns"

---

### Step 2: Column Mapping

**Layout:** Two-column table

**Left Column:** Excel Headers (from uploaded file)
- Example: "App Name", "Owner", "Cost"

**Right Column:** Arc Zero Fields (dropdown per row)
- Options: "name", "attributes.owner", "attributes.financials.estimated_annual_cost"
- **Auto-Match Button:** Uses fuzzy matching to suggest mappings
- **Confidence Badge:** (99%, 85%, etc.)

**Preview Panel (Bottom):**
- Shows first 3 rows with mapped data
- Highlights validation errors in red

**Button:** "Next: Validate Data"

---

### Step 3: Validation

**UI:**
- **Summary Stats:**
  - Total Rows: 150
  - Valid Rows: 145 (Green)
  - Errors: 5 (Red)
- **Error Table:**
  - Columns: Row #, Field, Value, Error Message
  - Example: "Row 45, Hosting Type, 'Hybrid', Invalid enum value. Allowed: SaaS, PaaS, IaaS, On-Premise"
- **Checkbox:** "Skip rows with errors" (default: checked)

**Button:** "Import 145 Cards"

---

### Step 4: Processing

**UI:**
- **Progress Bar:** 0-100%
- **Status Text:** "Importing card 45 of 145..."
- **Log Panel:** Real-time feed of success/error messages

**Completion:**
- **Success Message:** "145 cards imported successfully. 5 errors skipped."
- **Button:** "View Imported Cards" (navigates to Inventory with filter)
- **Button:** "Download Error Report" (CSV of failed rows)

---

## 5. Accessibility (A11y) Requirements

**Compliance:** WCAG 2.1 Level AA

### 5.1 Keyboard Navigation

**Requirements:**
- All interactive elements MUST be keyboard accessible
- `Tab` to navigate between elements
- `Enter` or `Space` to activate buttons/links
- `Esc` to close modals/dropdowns
- Arrow keys for navigating lists and grids

**Example: Dropdown Menu**
- `Tab` to focus dropdown trigger
- `Enter` to open menu
- `↑/↓` to navigate options
- `Enter` to select
- `Esc` to close

---

### 5.2 Screen Reader Support

**Requirements:**
- All images MUST have `alt` text
- All interactive icons MUST have ARIA labels
- Complex visualizations MUST have text alternatives (e.g., data tables)
- Live regions for async updates (e.g., "Search results updated")

**Example: Heatmap**
```jsx
<div
  role="img"
  aria-label="Landscape Heatmap showing 45 business capabilities colored by technical fit"
>
  {/* Visual treemap */}
</div>

{/* Accessible alternative */}
<table className="sr-only" aria-describedby="heatmap-description">
  <caption id="heatmap-description">
    Data table representation of the landscape heatmap
  </caption>
  <thead>
    <tr>
      <th>Capability</th>
      <th>Technical Fit</th>
    </tr>
  </thead>
  <tbody>
    {/* ... rows */}
  </tbody>
</table>
```

---

### 5.3 Color Contrast

**Requirements:**
- Text MUST meet 4.5:1 contrast ratio (WCAG AA)
- Large text (18pt+) MUST meet 3:1 contrast ratio
- Interactive elements MUST have visible focus indicators

**Color Palette (Arc Zero Design Language):**

| Usage | Color | Contrast Ratio | Pass/Fail |
|-------|-------|----------------|-----------|
| Primary Text | #1F2937 on #FFFFFF | 16.1:1 | ✅ Pass AAA |
| Secondary Text | #6B7280 on #FFFFFF | 4.6:1 | ✅ Pass AA |
| Button Primary | #FFFFFF on #3B82F6 | 4.5:1 | ✅ Pass AA |
| Error Text | #DC2626 on #FFFFFF | 5.9:1 | ✅ Pass AA |

**Colorblind-Friendly Heatmaps:**
- Use diverging color schemes (Blue-Orange) instead of Red-Green
- Include patterns (stripes, dots) in addition to color
- Provide text labels where possible

---

### 5.4 Focus Management

**Modal Behavior:**
- When modal opens → Focus first interactive element
- `Tab` is trapped within modal (doesn't focus background)
- `Esc` closes modal → Focus returns to trigger element

**Form Errors:**
- When validation fails → Focus first error field
- Error messages MUST be announced by screen readers

---

## 6. Responsive Design

### 6.1 Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| **Desktop** | > 1280px | Full sidebar, 2-3 column layouts |
| **Laptop** | 1024px - 1280px | Full sidebar, 2 column layouts |
| **Tablet** | 768px - 1024px | Collapsible sidebar, single column |
| **Mobile** | < 768px | Bottom nav, stacked layout, reports disabled |

---

### 6.2 Responsive Behaviors

#### Desktop (>1280px)
- **Sidebar:** Always visible, 240px width
- **Header:** Full breadcrumbs visible
- **Reports:** Full interactive visualizations
- **Data Table:** All columns visible

#### Tablet (768px - 1280px)
- **Sidebar:** Collapsible, icon-only by default
- **Header:** Hamburger menu button
- **Reports:** Single-column layout, smaller charts
- **Data Table:** Horizontal scroll, fewer default columns

#### Mobile (<768px)
- **Navigation:** Bottom navigation bar (Dashboard, Inventory, Search, Profile)
- **Sidebar:** Hidden, accessible via hamburger menu (full-screen overlay)
- **Reports:** **Disabled** - Show message: "Reports require desktop browser. Please use a larger screen."
- **Data Table:** Card-based layout (each row becomes a card)
- **Forms:** Full-width, stacked fields

---

### 6.3 Touch Optimization (Tablet/Mobile)

**Requirements:**
- Touch targets MUST be at least 44x44px (iOS standard)
- Buttons have adequate spacing (8px minimum)
- Swipe gestures:
  - Swipe left on card → Show actions (Edit, Archive)
  - Pull-to-refresh on lists

---

## 7. Loading & Error States

### 7.1 Loading Patterns

#### Pattern 1: Skeleton (Content Loading)

**Use for:** Lists, Cards, Graphs

**Implementation:**
```jsx
{isLoading ? (
  <CardSkeleton count={5} />
) : (
  <CardList data={cards} />
)}
```

**Design:**
- Gray animated shimmer effect
- Matches layout of actual content
- Shows for 200ms minimum (avoid flicker)

---

#### Pattern 2: Spinner (Action Loading)

**Use for:** Save buttons, form submissions, API calls

**Implementation:**
```jsx
<Button loading={isSaving} disabled={isSaving}>
  {isSaving ? "Saving..." : "Save Changes"}
</Button>
```

**Design:**
- Inline spinner icon (16px)
- Button text changes
- Button is disabled during loading

---

#### Pattern 3: Progress Bar (Long Operations)

**Use for:** Bulk import, TCO calculation, large graph queries

**Implementation:**
```jsx
<ProgressBar
  value={progress}
  max={100}
  label={`Processing ${current} of ${total}...`}
/>
```

---

### 7.2 Empty States

#### Empty Inventory

**Design:**
- Icon: Empty box illustration
- **Title:** "No cards found"
- **Description:** "Try adjusting your filters or create a new card"
- **Action:** `<Button>Create First Card</Button>`

---

#### No Relationships

**Design:**
- Icon: Disconnected nodes illustration
- **Title:** "No relationships yet"
- **Description:** "This card is not connected to any other cards"
- **Action:** `<Button>Add Relationship</Button>`

---

### 7.3 Error States

#### API Error

**Design:**
- Icon: Warning triangle (red)
- **Title:** "Failed to load data"
- **Description:** "We couldn't fetch the latest information. Please try again."
- **Action:** `<Button>Retry</Button>`

**Example:**
```jsx
{isError && (
  <ErrorState
    title="Failed to load cards"
    description={error.message}
    action={
      <Button onClick={refetch}>
        Retry
      </Button>
    }
  />
)}
```

---

#### Network Offline

**Design:**
- **Toast Notification:** (Bottom center)
- Icon: Wifi-off icon
- **Message:** "You are offline. Changes will sync when connection is restored."
- **Color:** Orange (warning)

---

## 8. Role-Based UI Variations

### 8.1 UI Changes by Role

| Screen | Viewer Role | Editor Role | Admin Role |
|--------|-------------|-------------|------------|
| **Card Detail** | Read-only view | Edit button visible | Edit + Archive buttons visible |
| **Inventory** | No bulk actions | Bulk edit tags | Full bulk actions (archive, delete) |
| **Metamodel Editor** | Hidden from nav | Hidden from nav | Full access |
| **Bulk Import** | Read-only preview | Full wizard access | Full wizard + advanced options |
| **Settings** | Hidden from nav | Partial (own profile only) | Full system configuration |

---

### 8.2 Permission Indicators

**Visual Cues:**
- **Disabled Buttons:** Grayed out with tooltip "Requires Editor role"
- **Hidden Menu Items:** Completely removed from navigation (not just disabled)
- **Read-Only Mode:** Banner at top of page: "You have read-only access to this page"

**Example:**
```jsx
{user.role === 'viewer' ? (
  <Tooltip content="Requires Editor role">
    <Button disabled>Edit Card</Button>
  </Tooltip>
) : (
  <Button onClick={handleEdit}>Edit Card</Button>
)}
```

---

## 9. UX Micro-Interactions

### 9.1 Optimistic UI Updates

**Scenario:** User edits a Card property.

**Behavior:**
1. UI updates **immediately** (show new value)
2. API request sent in background
3. If request fails → Revert to old value + Show error toast
4. If request succeeds → Silently confirm (no toast)

**Example:**
```jsx
const handleUpdate = async (newValue) => {
  // Optimistic update
  setCardName(newValue);

  try {
    await api.updateCard(cardId, { name: newValue });
    // Success - do nothing (already updated)
  } catch (error) {
    // Revert
    setCardName(oldValue);
    toast.error("Failed to update card");
  }
};
```

---

### 9.2 Smooth Transitions

**Animations:**
- **Page Navigation:** Fade in (200ms)
- **Modal Open/Close:** Scale + fade (150ms)
- **Card Hover:** Slight elevation (100ms)
- **Button Hover:** Background color transition (100ms)

**CSS Example:**
```css
.card {
  transition: transform 100ms ease, box-shadow 100ms ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

---

### 9.3 Interactive Feedback

**Hover States:**
- **Links:** Underline appears
- **Buttons:** Background color darkens 10%
- **Cards:** Subtle shadow + lift effect
- **Graph Nodes:** Highlight connected edges

**Click/Active States:**
- **Buttons:** Slight scale down (0.98x) + darker background
- **Checkboxes:** Smooth checkmark animation

---

### 9.4 Toast Notifications

**Types:**
- **Success:** Green background, checkmark icon, auto-dismiss after 3 seconds
- **Error:** Red background, X icon, requires manual dismiss
- **Warning:** Yellow background, warning icon, auto-dismiss after 5 seconds
- **Info:** Blue background, info icon, auto-dismiss after 4 seconds

**Positioning:** Bottom-right corner (stacked if multiple)

**Example:**
```jsx
toast.success("Card updated successfully");
toast.error("Failed to delete card. It has active relationships.", {
  action: <Button>View Details</Button>
});
```

---

## 10. Component Library (Shadcn UI Usage)

**Core Components:**

| Component | Usage | Customization |
|-----------|-------|---------------|
| `Button` | Primary actions | Variants: default, outline, ghost, destructive |
| `Dialog` | Modals | Custom widths: sm, md, lg, xl |
| `DropdownMenu` | Context menus | Icon + text options |
| `Table` | Data tables | Sortable headers, pagination |
| `Tabs` | Card detail tabs | Horizontal (default), vertical (large screens) |
| `Toast` | Notifications | Position: top-right, bottom-right |
| `Command` | Global search (Cmd+K) | Custom styling with keyboard shortcuts |

**Custom Components (Arc Zero Specific):**
- `CardBadge` - Lifecycle/Criticality badges with color coding
- `QualityScore` - Progress bar with score label
- `TimelineBar` - Lifecycle timeline visualization
- `GraphViewer` - D3/ReactFlow wrapper with consistent styling

---

## Appendix: Design Tokens

**Typography:**
```css
--font-family-base: 'Inter', sans-serif;
--font-family-mono: 'JetBrains Mono', monospace;

--font-size-xs: 0.75rem;   /* 12px */
--font-size-sm: 0.875rem;  /* 14px */
--font-size-base: 1rem;    /* 16px */
--font-size-lg: 1.125rem;  /* 18px */
--font-size-xl: 1.25rem;   /* 20px */
--font-size-2xl: 1.5rem;   /* 24px */
```

**Spacing:**
```css
--spacing-xs: 0.25rem;  /* 4px */
--spacing-sm: 0.5rem;   /* 8px */
--spacing-md: 1rem;     /* 16px */
--spacing-lg: 1.5rem;   /* 24px */
--spacing-xl: 2rem;     /* 32px */
```

**Colors:**
```css
--color-primary: #3B82F6;      /* Blue */
--color-success: #10B981;      /* Green */
--color-warning: #F59E0B;      /* Amber */
--color-error: #EF4444;        /* Red */
--color-gray-50: #F9FAFB;
--color-gray-900: #111827;
```

---

**Document Version History:**

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-11 | Initial release | Product Team |
| 1.0.1 | 2026-01-12 | Added accessibility, responsive design, loading states, role-based UI, design tokens | Documentation Team |
| 2.0 | 2026-01-13 | **MAJOR UPDATE**: Added Section 4 - Governance & Strategy Screens with 9 new screen specifications. Added 4 new navigation sections: Governance (5 submenu items), Strategic Planning (4 items), Risk & Compliance (3 items), ARB (4 items). Added keyboard shortcuts for new sections (G+G, G+S, G+K, G+A). Renumbered Data Exchange to Section 5 and all subsequent sections. | Documentation Team |
