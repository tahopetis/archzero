---

# Product Requirements Document (PRD)

**Product Name:** Arc Zero
**Version:** 1.0 (MVP)
**Date:** January 11, 2026
**Status:** Approved for Development

## 1. Executive Summary

**Arc Zero** is a modern Enterprise Architecture (EA) platform designed to bridge the gap between rigid legacy tools and flexible custom solutions.

Unlike competitors that force a single methodology, Arc Zero adopts a **"Opinionated Core, Flexible Periphery"** philosophy. It enforces a strict, industry-standard metamodel (based on LeanIX v4) to provide immediate "Day 1 Value" via pre-built reports, while utilizing a hybrid database architecture to allow infinite, schema-less customization for advanced enterprise needs.

**Target Audience:** Enterprise Architects, CTOs, and IT Strategy Teams.
**Core Value Prop:** "The structure you need for reporting, with the flexibility you need for reality."

---

## 2. Technical Architecture

The platform is built on a **Polyglot Persistence** stack, optimizing specific databases for specific data types.

| Component | Technology | Purpose |
| --- | --- | --- |
| **Frontend** | **React + Shadcn UI** | Modular, accessible UI. Uses **TanStack Query** for state and **D3.js / ReactFlow** for complex visualizations. |
| **Backend** | **Rust (Axum)** | High-performance, memory-safe API layer. Handles complex logic (BIA, Cost Rollups) and data orchestration. |
| **Core Database** | **PostgreSQL** | **The Source of Truth.** Stores the "Cards" (Entities) using a hybrid schema (SQL Columns for standard fields + JSONB for custom attributes). |
| **Graph Database** | **Neo4j** | **The Topology Engine.** Stores relationships (Edges) to perform deep impact analysis and recursive hierarchy queries. |
| **Caching** | **Redis** | High-speed caching for expensive aggregations (e.g., Landscape Heatmaps). |

---

## 3. Core Concept: "The Card"

The **Card** is the atomic unit of Arc Zero. It replaces the traditional "Fact Sheet."

### 3.1 The Hybrid Data Structure

Every Card is split into two strict tiers to balance performance and flexibility.

1. **Tier 1: The Core (Structured SQL)**
* *Definition:* Rigid columns indexed for speed and used in standard reports.
* *Fields:* `UUID`, `Name`, `Type` (e.g., Application), `Lifecycle_Phase` (Dates), `Quality_Score`.
* *Validation:* Enforced by Database Constraints.


2. **Tier 2: The Extension (Flexible JSONB)**
* *Definition:* A schema-less payload for domain-specific data.
* *Fields:* `cost_center`, `hosting_provider`, `custom_tags`, `financial_estimates`.
* *Validation:* Enforced by the App Layer via **Metamodel Rules**.



---

## 4. Functional Requirements

### 4.1 Data Management & Governance

* **FR-CORE-01 (Dual-Write Consistency):** The system must ensure that every Relationship creation updates the Neo4j Graph (for query speed) AND the Postgres Audit Log (for durability).
* **FR-CORE-02 (Metamodel Rules Engine):** Admins can define validation rules (Regex, Required Fields, Allowed Enums) that apply to the JSONB payload. The Rust backend must reject payloads that violate these rules.
* **FR-CORE-03 (Audit Trail):** Every change to a Card (SQL or JSONB) must be versioned, allowing users to view a "History" diff.

### 4.2 Visualization Modules (The "Day 1 Value")

* **FR-VIZ-01 (Landscape Heatmap):** A recursive Treemap visualization showing nested hierarchies (e.g., *Business Capability > Sub-Capability > Application*). Must support "Color By" (e.g., Color by Health).
* **FR-VIZ-02 (Interactive Matrix):** An X/Y Grid report (e.g., *User Location* vs. *Business Unit*) showing intersection density.
* **FR-VIZ-03 (Time Machine Roadmap):** A Gantt chart visualizing the `Lifecycle` dates. Must include a "Time Slider" to filter the view to show the architecture State at specific dates (e.g., "Show me Jan 2025").

---

## 5. Logic Modules (Configurable Engines)

### 5.1 Business Impact Analysis (BIA) Engine

* **Requirement:** A configurable scoring engine to determine `Criticality`.
* **Flexibility:** Supports multiple "Scoring Profiles" (e.g., *Safety First* vs. *Financial weighted*).
* **Logic:**
* Allows **Max/High-Water Mark** aggregation (Standard).
* Allows **Weighted Average** aggregation.
* **Topology Booster:** Automatically escalates Criticality Tier if the App has High Interdependency (Fan-In > Threshold) in the Graph.



### 5.2 The 6R Decision Engine (Migration & Modernization)

* **Requirement:** An automated advisory system that suggests a strategy (`Retire`, `Rehost`, `Refactor`, etc.).
* **Strategy Packs:** System ships with two default profiles:
1. **Cloud First:** Suggests AWS/Azure migration paths.
2. **On-Premise Only:** Suggests Virtualization and Containerization (Modernization) paths.


* **Logic:** Uses a cascading "Rule Tree" stored in JSON to evaluate Technical Fit vs. Business Value.

### 5.3 Estimated TCO Engine (Budget Roll-up)

* **Requirement:** A recursive cost calculator.
* **Logic:** "Reverse Waterfall." Costs from Infrastructure nodes (`IT Component`) flow UP to `Applications` and then to `Business Capabilities`.
* **Allocation:** Supports "Even Split" (Default) and "Manual Percentage" (Defined on the Relationship Edge).
* **Integration:** Designed to sync with **Pustaka** (ITAM) for base cost data.

---

## 6. Integration & API

* **FR-API-01 (Unified Upsert):** A single `PATCH /cards/{id}` endpoint that handles updates to both SQL columns and JSONB attributes simultaneously.
* **FR-API-02 (Excel Ingestion):** A user-friendly Wizard to bulk upload Cards. Must support "Dynamic Column Mapping" (creating new JSONB fields on the fly from unknown Excel columns).
* **FR-API-03 (Pustaka Connector):** A native, one-way sync to pull `Cost` and `EOL_Date` from the Pustaka ITAM system.

---

## 7. Roadmap & Phases

* **Phase 1 (Foundation):** Core Database (PG+Neo4j), Card CRUD, Metamodel Validation, List View.
* **Phase 2 (Relationships):** Graph Logic, Matrix Report, BIA Engine (Basic).
* **Phase 3 (Visuals):** Landscape Heatmap, Roadmap (Time Machine), TCO Engine.
* **Phase 4 (Intelligence):** 6R Decision Engine, Advanced Excel Import, Pustaka Sync.

---
