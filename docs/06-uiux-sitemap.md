---

# Appendix F: UI/UX Sitemap & Wireframes

**Framework:** React + Shadcn UI + TanStack Query

## 1. Global Navigation (App Shell)

**Layout:** Permanent Left Sidebar (Collapsible) + Top Header.

### 1.1 Sidebar Menu

1. **Dashboard:** High-level executive summary.
2. **Inventory:** The master list of all Cards.
3. **Reports:** The visualization hub (Landscape, Matrix, Roadmap).
4. **Intelligence:** 6R Analysis, BIA Assessments, TCO Estimator.
5. **Data Exchange:** Import Wizard, Pustaka Sync Status.
6. **Settings (Admin):** Metamodel Editor, User Management.

### 1.2 Top Header

* **Global Search:** `Cmd+K` command palette (Search Cards by name/tag).
* **Context Selector:** "Current Workspace" (if multi-tenant).
* **User Profile:** Settings, Logout.

---

## 2. Screen Specifications

### 2.1 Dashboard (Home)

**Goal:** "Morning Coffee" view for Architects.

* **Widget A: Portfolio Health:** Donut chart showing *Functional Fit* vs *Technical Fit* distribution.
* **Widget B: Data Quality:** Gauge chart showing overall `quality_score` (e.g., "85% Complete").
* **Widget C: Criticality Watch:** List of "Tier 1" apps with "Low Health" (The Danger Zone).
* **Widget D: Recent Activity:** Audit log feed (Who changed what).

### 2.2 Inventory (The "Excel Killer")

**Goal:** Fast filtering and bulk editing.

* **Component:** `Shadcn DataTable` (Server-side pagination).
* **Features:**
* **Facetted Filters:** Sidebar to filter by `Type` (App), `Lifecycle` (Active), `Tag` (Cloud).
* **Columns:** Dynamic. Users can toggle "Tier 2 JSONB fields" (e.g., *Hosting Type*) as visible columns.
* **Bulk Actions:** Select rows  "Edit Tags", "Archive", "Recalculate Quality".



### 2.3 The Card Detail View (The Core UI)

**Goal:** Single source of truth for an entity.
**Layout:** Header + Tabbed Content.

* **Header Region:**
* **Icon + Title:** e.g., "Salesforce CRM" (Application).
* **Badges:** Lifecycle Status ("Active"), Criticality ("Tier 1").
* **Action Bar:** `Edit`, `Archive`, `View in Graph`.


* **Tab 1: Overview (Properties)**
* **Section 1: Essentials:** Tier 1 SQL fields (Description, Owner).
* **Section 2: Lifecycle:** Timeline view of Plan/Active/EOL dates.
* **Section 3: Attributes (JSONB):**
* Rendered dynamically based on `metamodel_rules`.
* Example: A dropdown for `Hosting Type`, a currency input for `Cost`.




* **Tab 2: Landscape (Relations)**
* **Upstream:** "What relies on me?" (e.g., Capabilities).
* **Downstream:** "What do I rely on?" (e.g., Servers, APIs).
* **Visual:** Mini-Graph view (D3/ReactFlow) centered on this node.


* **Tab 3: Intelligence**
* **BIA Calculator:** Form to input Impact scores  outputs Criticality Tier.
* **TCO Waterfall:** Sankey diagram showing cost inheritance.
* **6R Advisor:** Read-only view of the "Recommended Strategy" (e.g., "REFACTOR").


* **Tab 4: History**
* Diff view of changes (JSONB diffs).



---

### 2.4 Reports Module

**Goal:** Strategic decision support.

* **Common Feature: The "Time Machine" Bar**
* A global slider/datepicker at the top of *every* report.
* **Default:** "Today".
* **Action:** Slide to "Jan 1, 2027"  The Graph Query filters edges by `valid_from/to`.


* **Report A: Landscape Heatmap**
* **UI:** D3 Treemap.
* **Hierarchy:** Capability L1  Capability L2  Application.
* **Controls:** "Color By" (Technical Fit, Health, Cost).


* **Report B: Interface Circle (The "Death Star")**
* **UI:** Chord Diagram.
* **Data:** Shows data flows between Applications.
* **Interaction:** Hover to highlight dependencies.


* **Report C: Roadmap (Gantt)**
* **UI:** Timeline Chart.
* **Group By:** Business Capability.
* **Bars:** Show `Plan`  `Phase Out` duration.



---

### 2.5 Data Exchange (Import Wizard)

**Flow:**

1. **Drop Zone:** Upload `.xlsx`.
2. **Mapping Screen:**
* Left Column: Excel Headers ("App Name", "Cost").
* Right Column: Arc Zero Fields ("name", "attributes.financials.estimated_cost").
* **Magic Button:** "Auto-Match" (Fuzzy string matching).


3. **Validation:** Show rows with errors (e.g., "Date format invalid").
4. **Commit:** Progress bar for Bulk Upsert API.

---

### 2.6 Admin / Settings

* **Metamodel Editor:**
* Select Card Type ("Application").
* List Tier 2 Attributes.
* "Add Field" button  Define Key (`gdpr_status`), Type (`Enum`), Options (`Yes/No`).


* **Scoring Profiles:**
* JSON Editor or Form to tweak BIA Weights and 6R Rules.



---

## 3. UX Micro-Interactions

* **Optimistic UI:** When editing a Card property, update the UI immediately while the `PATCH` request sends in background.
* **Skeleton Loading:** Use Shimmer effects for the Graph visualizations while the recursive query runs.
* **Cmd+K:** Pressing `Cmd+K` anywhere opens the global search modal (Spotlight style).
