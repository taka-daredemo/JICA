# JICA Project Management System - Development Guide for Cursor

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Screen Wireframes & Specifications](#screen-wireframes--specifications)
3. [Database Design](#database-design)
4. [API Design](#api-design)
5. [Technology Stack Recommendations](#technology-stack-recommendations)
6. [Development Roadmap](#development-roadmap)

---

## 🎯 Project Overview

### Project Details
- **Project Name**: フィリピン国セブ市山岳零細農家に対する農業指導による収益向上プロジェクト
- **Organization**: 特定非営利活動法人 DAREDEMO HERO
- **Duration**: 2025年10月 ～ 2028年9月（3年間）
- **Objective**: バランガイTAPTAPの指導により、零細農家の年間農業収入を平均10%以上向上

### Target Users
1. **Administrator** (管理者) - Full system access
2. **Agricultural Sector Members** (農業セクターメンバー) - 10名
3. **Partner Organizations** (協力団体)
4. **JICA Staff** (JICA担当者)

### Core Requirements
The system must enable:
1. ✅ **Task Management** - Today's tasks, deadlines, assignments, recurring tasks
2. ✅ **Budget Management** - Budget vs. actual tracking, payment plans, receipt management
3. ✅ **Team Management** - Member management, role/permission control, workload visualization
4. ✅ **Multi-language Support** - English/Japanese switching
5. ✅ **Report Generation** - Data for JICA reporting
6. ✅ **Google Drive Integration** - Receipt storage, document links

---

## 📱 Screen Wireframes & Specifications

### Phase 1: Core Features (Completed Wireframes)

#### 1. Dashboard (Task-Focused)
**File**: `wireframe_new_dashboard.png`

**Purpose**: Main entry point showing task status, alerts, budget summary, and upcoming activities

**Key Features**:
- **This Month's Task Status Cards**:
  - Completed: 12/20 (60%)
  - In Progress: 5
  - Overdue: 3
  - Upcoming Deadlines: Today (2), This Week (7)
  - Budget Execution: 64%

- **Alerts & Notifications Section** (Red border):
  - Overdue tasks
  - Due today tasks
  - Budget alerts

- **This Month's Task List**:
  - Priority order
  - Columns: Task Name | Assignee | Due Date | Status | Priority
  - Status badges with color coding
  - Overdue tasks highlighted with red background

- **Next Month Preview & Action Items** (Blue border):
  - Upcoming events
  - Action items needed now

- **Budget Status Summary**:
  - Spent: $45,000 / $70,000
  - Execution Rate: 64%

**UI Components**:
- Header with [EN]/[JP] language toggle
- Sidebar navigation
- Card-based layout
- Table with status badges
- Alert boxes

---

#### 2. Task Management - Calendar View
**File**: `wireframe_task_management.png`

**Purpose**: Visual calendar view of tasks with monthly overview

**Key Features**:
- **View Tabs**: Calendar View (active) | List View | Gantt Chart
- **Filters**: Month, Assignee, Status, Priority
- **Search Box**
- **Add Task Button** (top right)

- **Calendar Grid**:
  - Month view with week rows
  - Daily cells with task cards
  - Color-coded by priority:
    - Red: Overdue/Critical
    - Orange: High Priority
    - Blue: Medium Priority
    - Green: Low Priority
  - Today highlighted in yellow
  - Multiple tasks per day displayed as cards

- **Legend**: Priority color indicators

**UI Components**:
- Tab navigation
- Dropdown filters
- Calendar grid with interactive cells
- Task cards with color coding

---

#### 3. Task Management - List View
**File**: `wireframe_task_list_view.png`

**Purpose**: Table view for detailed task management with bulk actions

**Key Features**:
- **View Tabs**: Calendar View | List View (active) | Gantt Chart
- **Filters**: Month, Assignee, Status, Priority
- **Bulk Actions**: Mark Complete | Assign To | Change Priority | Delete

- **Task Table**:
  - Columns: ☐ | Task Name | Assignee | Due Date | Status | Priority | Repeat | Actions
  - Recurring tasks marked with "↻" icon
  - Repeat column shows: One-time | Daily | Weekly | Monthly
  - Sortable columns (Due Date with ↓ arrow)
  - Row actions: 👁 (view) | ✎ (edit) | 🗑 (delete)
  - Alternate row shading
  - Overdue tasks with red background

- **Pagination**: Showing 1-10 of 45 tasks

**Data Fields**:
```javascript
{
  id: string,
  name: string,
  assignee: string,
  dueDate: Date,
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Overdue',
  priority: 'Critical' | 'High' | 'Medium' | 'Low',
  isRecurring: boolean,
  repeatPattern: 'One-time' | 'Daily' | 'Weekly' | 'Monthly'
}
```

---

#### 4. Task Management - Gantt Chart View
**File**: `wireframe_task_gantt_view.png`

**Purpose**: Timeline visualization for project planning and resource allocation

**Key Features**:
- **View Tabs**: Calendar View | List View | Gantt Chart (active)
- **Timeline Controls**: Week | Month (active) | Quarter
- **Date Range Selector**: Nov 1, 2025 - Nov 30, 2025

- **Gantt Chart**:
  - Task list column (left): Task Name / Assignee
  - Timeline grid (right): Weekly columns
  - Horizontal bars showing task duration
  - Color-coded by priority
  - Progress indicator (darker shade = completed portion)
  - "Today" marker (red vertical line)
  - Priority labels on bars

- **Legend**: Color coding for Critical, High, Medium, Low, Progress

**UI Components**:
- Dual-column layout (tasks + timeline)
- Zoom controls
- Date range selector
- Horizontal bars with progress fill

---

#### 5. Task Detail Screen
**File**: `wireframe_task_detail.png`

**Purpose**: Edit task details, set recurring patterns, manage attachments, and team collaboration

**Key Features**:

**Left Column - Task Information**:
- **Basic Information**:
  - Task Name (text input)
  - Description (textarea)
  - Assignee (dropdown)
  - Due Date (datetime picker)

- **Recurring Task Settings** (Blue border):
  - Repeat Pattern: One-time | Daily | Weekly | Monthly | Custom (radio buttons)
  - Repeat every: [1] week(s)
  - Days of week: M | T | W | T | F | S | S (toggle buttons)
  - Ends: Never | After [X] times | On date [date] (radio buttons)

- **Status & Priority**:
  - Status dropdown: Not Started | In Progress | Completed | Overdue
  - Priority dropdown: Critical | High | Medium | Low

- **Attachments**:
  - File list with name, size
  - Upload button
  - View/Delete icons

**Right Column - Comments & Activity**:
- **Comments Section**:
  - Comment input box with @mention support
  - Post button
  - Comment thread with:
    - Author name, timestamp
    - Comment text
    - Reply | Edit | Delete actions

**Action Buttons**:
- Save (green)
- Delete (red outline)

**Data Model**:
```javascript
{
  id: string,
  name: string,
  description: string,
  assignee: userId,
  dueDate: DateTime,
  isRecurring: boolean,
  recurrence: {
    pattern: 'daily' | 'weekly' | 'monthly' | 'custom',
    interval: number,
    daysOfWeek: number[], // 0-6 for Sun-Sat
    endCondition: 'never' | 'after' | 'onDate',
    endValue: number | Date
  },
  status: string,
  priority: string,
  attachments: [{
    id: string,
    filename: string,
    size: number,
    url: string
  }],
  comments: [{
    id: string,
    authorId: string,
    text: string,
    createdAt: DateTime
  }]
}
```

---

#### 6. Budget Management Dashboard
**File**: `wireframe_budget_dashboard.png`

**Purpose**: Overview of budget execution, payment plans, and financial alerts

**Key Features**:

- **Budget Overview Cards** (4 cards):
  - Total Budget: $120,000 (3 Year Project)
  - Spent to Date: $45,680 (38.1% - red alert)
  - Remaining Budget: $74,320 (61.9% - green)
  - Pending Payments: $8,500 (12 scheduled)

- **Budget Alerts** (Red border):
  - Training expenses: 92% spent
  - Overdue payments
  - Upcoming payments this month

- **Budget by Category** (Left panel):
  - 7 categories with progress bars:
    - Training & Seminars: 13,800/15,000 (92.0%) - RED
    - Equipment & Supplies: 18,500/25,000 (74.0%) - ORANGE
    - Staff Salaries: 10,000/40,000 (25.0%) - GREEN
    - Transportation: 2,500/12,000 (20.8%) - GREEN
    - Market Survey: 500/8,000 (6.2%) - GREEN
    - Monitoring & Evaluation: 380/10,000 (3.8%) - GREEN
    - Administrative Costs: 0/10,000 (0.0%) - GRAY

- **Payment Plan Overview** (Right panel):
  - Table: Description | Amount | Due Date | Status
  - Status colors: Overdue (red) | Pending (orange) | Scheduled (blue) | Paid (green)
  - "→" icon for paid items
  - 📄 icon for items with receipts
  - Flow indicator at bottom: Payment Plan → Payment History → Receipt (Google Drive)

**Period Selector**: Oct 2025 - Sep 2026
**Export Report Button**

---

#### 7. Payment Plans & History
**File**: `wireframe_payment_plan.png`

**Purpose**: Manage payment plans and track payment history with receipt links

**Key Features**:

- **Payment Flow Diagram** (Top, blue border):
  - Step 1: Payment Plan Created (blue box)
  - Step 2: Payment Executed (green box)
  - Step 3: Receipt Uploaded (G-Drive) (orange box)
  - Connected with arrows

- **Tabs**: All Payments | Scheduled | Pending | Paid (active) | Overdue

- **Filters**: Category, Period, Amount

- **Payment History Table** (Paid status):
  - Columns: ☐ | Payment Plan | Category | Amount | Due Date | Paid Date | Receipt | Status | Actions
  - Flow indicator: "→→→" for completed payments
  - Receipt button: "📄 View Receipt" (blue link to Google Drive)
  - Status badge: "Paid" (green)
  - Actions: 👁 (view) | ✎ (edit)

- **Receipt Storage Info** (Bottom):
  - 💡 All receipts stored in Google Drive folder
  - Link: drive.google.com/drive/folders/JICA_Project_Receipts

**Data Model**:
```javascript
{
  id: string,
  planName: string,
  category: string,
  amount: number,
  dueDate: Date,
  paidDate: Date | null,
  status: 'Scheduled' | 'Pending' | 'Paid' | 'Overdue',
  receiptUrl: string | null, // Google Drive link
  receiptFilename: string | null
}
```

---

#### 8. Expense Entry / Payment Record
**File**: `wireframe_expense_entry.png`

**Purpose**: Record payments and upload receipts with Google Drive integration

**Key Features**:

**Left Column - Payment Information**:
- **Link to Payment Plan**: Dropdown to select existing plan
- **Selected Plan Info** (Blue box):
  - Plan name, planned amount, due date

- **Description/Purpose**: Textarea
- **Amount (USD)**: Number input
- **Category**: Dropdown (Training, Equipment, Salary, etc.)
- **Payment Date**: Date picker
- **Payment Method**: Dropdown (Bank Transfer, Cash, Check, etc.)
- **Paid To / Vendor**: Text input

- **Receipt/Invoice Upload** (Yellow border):
  - Two options:
    - 📤 Upload from Computer (blue button)
    - 🔗 Link from Google Drive (green button)
  - Uploaded file display:
    - Filename, size
    - Google Drive path: gdrive://.../JICA_Project/Receipts/
    - 👁 (preview) | 🗑 (delete) icons

**Right Column - Preview & Notes**:
- **Receipt Preview**: PDF preview area with thumbnail
- **Additional Notes**: Textarea for comments

**Action Buttons**:
- Save & Submit (green)
- Cancel (red outline)

---

#### 9. Team Members List
**File**: `wireframe_team_members_list.png`

**Purpose**: Overview of all team members with workload visualization

**Key Features**:

- **Team Stats Cards** (4 cards):
  - Total Members: 15
  - Active Tasks: 43
  - Avg Workload: 2.9 tasks/person
  - Overloaded (>5): 2 members (red alert)

- **Filters**: Role, Status, Workload
- **Search Box**
- **Add Member Button** (blue, top right)

- **Member Cards Grid** (3 columns):
  Each card shows:
  - Avatar icon (👩👨👤)
  - Name
  - Role: Agricultural Sector | Administrator | JICA Staff | Partner Organization
  - Email
  - Active Tasks badge with color coding:
    - Red: 6-8 tasks (Overload)
    - Orange: 5 tasks (High)
    - Green: 1-4 tasks (Normal/Low)
  - Workload indicator: "Load: Overloaded/High/Normal/Low"
  - Action buttons: 👁 (view) | ✎ (edit) | 🗑 (delete)

- **Pagination**: 1-9 of 15 members

**Data Model**:
```javascript
{
  id: string,
  name: string,
  email: string,
  role: 'Administrator' | 'Agricultural Sector' | 'JICA Staff' | 'Partner Organization',
  status: 'Active' | 'Inactive',
  activeTasks: number,
  workload: 'Overloaded' | 'High' | 'Normal' | 'Low',
  avatar: string
}
```

---

#### 10. Member Detail & Permissions
**File**: `wireframe_member_detail.png`

**Purpose**: Edit member details and configure granular permissions

**Key Features**:

**Left Column - Basic Info & Permissions**:
- **Basic Information**:
  - Avatar (large)
  - Full Name (text input)
  - Email (text input)
  - Role (dropdown)

- **🔐 Permissions & Access Control** (Blue border):
  - Table with modules and 4 permission levels:
    - Full Access (●)
    - Edit (○)
    - View Only (○)
    - No Access (○)
  
  - Modules:
    - Dashboard
    - Tasks Management
    - Budget Management
    - Farmer Database
    - Training & Seminars
    - Reports Generation
    - Team Management
    - System Settings

  - Radio button selection for each module

**Right Column - Tasks & Activity**:
- **Assigned Tasks (6)**:
  - Stats: Completed: 2 | In Progress: 3 | Overdue: 1
  - Task list with due dates and status badges

- **Recent Activity**:
  - Timeline format with colored dots
  - Activity description and timestamp
  - Examples:
    - Completed task (green dot)
    - Updated task (blue dot)
    - Added comment (gray dot)
    - Created task (gray dot)
    - Uploaded receipt (green dot)

**Action Buttons**:
- Save (green)
- Deactivate (red outline)

**Permissions Data Model**:
```javascript
{
  userId: string,
  permissions: {
    dashboard: 'full' | 'edit' | 'view' | 'none',
    tasks: 'full' | 'edit' | 'view' | 'none',
    budget: 'full' | 'edit' | 'view' | 'none',
    farmers: 'full' | 'edit' | 'view' | 'none',
    training: 'full' | 'edit' | 'view' | 'none',
    reports: 'full' | 'edit' | 'view' | 'none',
    team: 'full' | 'edit' | 'view' | 'none',
    settings: 'full' | 'edit' | 'view' | 'none'
  }
}
```

---

#### 11. Task Allocation & Workload Analysis
**File**: `wireframe_task_allocation_dashboard.png`

**Purpose**: Visualize team workload distribution and identify bottlenecks

**Key Features**:

**Left Panel - Member Workload Distribution**:
- Horizontal bar chart showing task count per member
- Color-coded bars:
  - Red: Overloaded (>5 tasks)
  - Orange: High (4-5 tasks)
  - Green: Normal (<4 tasks)
- Members sorted by task count (descending)
- Task count displayed at bar end

**Right Panel - Analytics**:
- **Team Composition by Role**:
  - Role legend with member counts:
    - Agricultural Sector: 8 members (blue)
    - Administrator: 2 members (red)
    - JICA Staff: 2 members (orange)
    - Partner Org: 3 members (green)

- **Task Status Overview** (4 cards):
  - Completed: 12 (green)
  - In Progress: 18 (blue)
  - Not Started: 10 (orange)
  - Overdue: 3 (red)

- **Upcoming Deadlines (This Week)**:
  - Task name, assignee (@mention), due date with color coding

- **💡 Workload Insights** (Orange border):
  - AI-generated recommendations:
    - "Admin User is overloaded (8 tasks). Consider redistribution."
    - "4 members have high workload (5+ tasks)."
    - "IT Support has capacity for additional tasks (1 task)."

**Export Report Button** (top right)

---

### Phase 2: Farmer Management System (Existing Wireframes)

#### 12. Farmers List
**File**: `wireframe_02_farmers_list.png`

**Features**:
- Search & filter (Year group, Status, Location)
- Summary cards (Total, Year 1, Year 2, Year 3, Model Farms)
- Table with: ID | Name | Location | Year Group | Income Change | Status
- Pagination

---

#### 13. Farmer Detail Profile
**File**: `wireframe_03_farmer_detail.png`

**Features**:
- Basic info (Name, ID, Location, Contact, Land size)
- Tab navigation: Overview | Training | Income | Monitoring
- Agricultural info (Crops, techniques)
- Income summary (Baseline vs Current)
- Status badges (Year group, Progress level)
- Activity timeline

---

#### 14. Training Management
**File**: `wireframe_04_training.png`

**Features**:
- Statistics cards (Total sessions, Participants, Avg attendance, Completion rate)
- Upcoming training cards (Date, Topic, Location, Registered, Capacity)
- Tabs: Upcoming | Completed | Calendar
- Add Training button

---

#### 15. Training Attendance
**File**: `wireframe_05_attendance.png`

**Features**:
- Session information (Topic, Date, Location, Facilitator)
- Attendance statistics (Registered, Present, Absent, Attendance rate)
- Attendance table: Name | Farmer ID | Status (Present/Absent/Excused)
- Bulk actions: Mark All Present | Export List
- Save Attendance button

---

#### 16. Income Data & Analysis
**File**: `wireframe_06_income.png`

**Features**:
- Summary cards (Avg increase, Above target, Below target, No change)
- Income trend graph area (Line chart placeholder)
- Income distribution visualization
- Detailed records table: Farmer | Baseline | Current | Change | Target (10%) | Status
- Filter by year group

---

## 🗄️ Database Design

### Core Tables

#### 1. users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('Administrator', 'Agricultural Sector', 'JICA Staff', 'Partner Organization')),
  status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. user_permissions
```sql
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  module VARCHAR(50) NOT NULL,
  permission_level VARCHAR(20) NOT NULL CHECK (permission_level IN ('full', 'edit', 'view', 'none')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, module)
);
```

#### 3. tasks
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES users(id),
  due_date TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'In Progress', 'Completed', 'Overdue')),
  priority VARCHAR(50) DEFAULT 'Medium' CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern VARCHAR(20), -- 'daily', 'weekly', 'monthly', 'custom'
  recurrence_interval INTEGER,
  recurrence_days_of_week INTEGER[], -- Array of 0-6 for Sun-Sat
  recurrence_end_condition VARCHAR(20), -- 'never', 'after', 'onDate'
  recurrence_end_value TEXT, -- Number of occurrences or end date
  parent_task_id UUID REFERENCES tasks(id), -- For recurring instances
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. task_attachments
```sql
CREATE TABLE task_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 5. task_comments
```sql
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id),
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 6. budget_categories
```sql
CREATE TABLE budget_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  total_budget DECIMAL(12,2) NOT NULL,
  fiscal_year INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 7. payment_plans
```sql
CREATE TABLE payment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_name VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES budget_categories(id),
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  description TEXT,
  vendor VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Pending', 'Paid', 'Overdue')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 8. payments
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID REFERENCES payment_plans(id),
  amount DECIMAL(12,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50),
  vendor VARCHAR(255),
  description TEXT,
  receipt_filename VARCHAR(255),
  receipt_url TEXT, -- Google Drive link
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 9. farmers
```sql
CREATE TABLE farmers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  land_size_hectares DECIMAL(8,2),
  year_group INTEGER CHECK (year_group IN (1, 2, 3)),
  status VARCHAR(50) DEFAULT 'Active',
  baseline_income DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 10. training_sessions
```sql
CREATE TABLE training_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  location VARCHAR(255),
  facilitator_id UUID REFERENCES users(id),
  capacity INTEGER,
  status VARCHAR(50) DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Completed', 'Cancelled')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 11. training_attendance
```sql
CREATE TABLE training_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'Registered' CHECK (status IN ('Registered', 'Present', 'Absent', 'Excused')),
  recorded_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(session_id, farmer_id)
);
```

#### 12. farmer_income_records
```sql
CREATE TABLE farmer_income_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  income_amount DECIMAL(12,2) NOT NULL,
  record_type VARCHAR(50) CHECK (record_type IN ('Baseline', 'Annual', 'Sale')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 13. activity_logs
```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(50), -- 'task', 'payment', 'farmer', etc.
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Database Relationships

```
users (1) ─── (n) tasks (assignee)
users (1) ─── (n) tasks (creator)
users (1) ─── (n) user_permissions
tasks (1) ─── (n) task_attachments
tasks (1) ─── (n) task_comments
tasks (1) ─── (n) tasks (parent_task for recurring)
budget_categories (1) ─── (n) payment_plans
payment_plans (1) ─── (n) payments
farmers (1) ─── (n) training_attendance
farmers (1) ─── (n) farmer_income_records
training_sessions (1) ─── (n) training_attendance
users (1) ─── (n) training_sessions (facilitator)
users (1) ─── (n) activity_logs
```

---

## 🔌 API Design

### Authentication Endpoints

```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
```

### User Management

```
GET    /api/users
GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
GET    /api/users/:id/permissions
PUT    /api/users/:id/permissions
GET    /api/users/:id/tasks
GET    /api/users/:id/activity
```

### Task Management

```
GET    /api/tasks                    # List with filters
GET    /api/tasks/:id
POST   /api/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id
GET    /api/tasks/calendar?month=2025-11
GET    /api/tasks/overdue
POST   /api/tasks/:id/comments
GET    /api/tasks/:id/comments
POST   /api/tasks/:id/attachments
DELETE /api/tasks/:id/attachments/:attachmentId
PUT    /api/tasks/:id/status
POST   /api/tasks/:id/assign
```

### Budget Management

```
GET    /api/budget/overview
GET    /api/budget/categories
GET    /api/budget/categories/:id
POST   /api/budget/categories
PUT    /api/budget/categories/:id
GET    /api/budget/alerts

GET    /api/payments/plans
GET    /api/payments/plans/:id
POST   /api/payments/plans
PUT    /api/payments/plans/:id
DELETE /api/payments/plans/:id

GET    /api/payments
GET    /api/payments/:id
POST   /api/payments
PUT    /api/payments/:id
DELETE /api/payments/:id
POST   /api/payments/:id/receipt      # Upload receipt
```

### Team Management

```
GET    /api/team/members
GET    /api/team/workload
GET    /api/team/stats
```

### Farmer Management

```
GET    /api/farmers
GET    /api/farmers/:id
POST   /api/farmers
PUT    /api/farmers/:id
DELETE /api/farmers/:id
GET    /api/farmers/:id/income
POST   /api/farmers/:id/income
```

### Training Management

```
GET    /api/training/sessions
GET    /api/training/sessions/:id
POST   /api/training/sessions
PUT    /api/training/sessions/:id
DELETE /api/training/sessions/:id
GET    /api/training/sessions/:id/attendance
PUT    /api/training/sessions/:id/attendance
POST   /api/training/sessions/:id/register
```

### Dashboard & Reports

```
GET    /api/dashboard/summary
GET    /api/dashboard/alerts
GET    /api/reports/generate?type=monthly&format=pdf
GET    /api/reports/export?entity=tasks&format=csv
```

---

## 💻 Technology Stack Recommendations

### Frontend

**Option A: Next.js (Recommended)**
```
Framework: Next.js 14+ (App Router)
UI Library: React 18+
Styling: Tailwind CSS + shadcn/ui components
State Management: Zustand or React Context
Forms: React Hook Form + Zod validation
Date Handling: date-fns
Charts: Recharts or Chart.js
Calendar: FullCalendar or react-big-calendar
Table: TanStack Table (React Table v8)
HTTP Client: Axios or fetch
```

**Pros**:
- Server-side rendering for SEO
- API routes built-in
- Great TypeScript support
- Large ecosystem
- Excellent documentation

**Option B: Vite + React**
```
Build Tool: Vite
Framework: React 18+
Router: React Router v6
(Same libraries as Option A for UI, state, etc.)
```

**Pros**:
- Faster development build
- Simpler configuration
- Lighter weight

### Backend

**Option A: Node.js + Express (Recommended)**
```
Runtime: Node.js 20+
Framework: Express.js
Language: TypeScript
ORM: Prisma (or TypeORM)
Database: PostgreSQL 15+
Authentication: JWT + bcrypt
File Upload: Multer
Google Drive API: googleapis npm package
Validation: Zod or Joi
Documentation: Swagger/OpenAPI
```

**Option B: Python + FastAPI**
```
Language: Python 3.11+
Framework: FastAPI
ORM: SQLAlchemy
Database: PostgreSQL 15+
Authentication: JWT + passlib
File Upload: python-multipart
Google Drive: google-api-python-client
Validation: Pydantic
```

### Database

**PostgreSQL 15+** (Recommended)
- Excellent JSON support (JSONB for permissions, activity logs)
- Array data types (for recurrence days)
- Strong relational integrity
- Great performance

### File Storage

**Google Drive API Integration**
- Store receipts, documents, photos
- Generate shareable links
- Organize in project folders
- Authentication via OAuth 2.0

### Deployment

**Option A: Vercel (Frontend) + Railway (Backend + DB)**
- Vercel: Next.js optimized, auto-scaling
- Railway: PostgreSQL + Node.js backend, simple deployment

**Option B: AWS**
- EC2: Backend server
- RDS PostgreSQL: Database
- S3: Alternative file storage (if not using Google Drive exclusively)
- CloudFront: CDN

**Option C: Docker + VPS**
- Docker Compose for full stack
- Nginx reverse proxy
- SSL with Let's Encrypt
- DigitalOcean or Hetzner VPS

### Development Tools

```
Package Manager: pnpm (faster than npm)
Code Editor: Cursor (AI-assisted coding)
Version Control: Git + GitHub
Code Quality: ESLint + Prettier
Testing: Jest + React Testing Library
API Testing: Postman or REST Client
```

---

## 🗺️ Development Roadmap

### Phase 1: Foundation (Week 1-2)
1. ✅ Set up project structure
   - Initialize Next.js project with TypeScript
   - Configure Tailwind CSS + shadcn/ui
   - Set up ESLint, Prettier
   - Initialize Git repository

2. ✅ Database setup
   - Create PostgreSQL database
   - Set up Prisma ORM
   - Create schema based on database design above
   - Run migrations
   - Seed initial data (admin user, categories)

3. ✅ Authentication system
   - User registration/login API
   - JWT token generation
   - Protected routes middleware
   - Login/logout UI screens

### Phase 2: Core Features (Week 3-5)

#### Task Management (Week 3)
1. Task CRUD APIs
2. Task list view (table)
3. Task detail/edit form
4. Recurring task logic
5. Task assignment
6. Comments and attachments

#### Budget Management (Week 4)
1. Budget category setup
2. Payment plan CRUD
3. Payment recording
4. Receipt upload (Google Drive integration)
5. Budget dashboard with charts
6. Payment history view

#### Team Management (Week 5)
1. User management CRUD
2. Permission system implementation
3. Team members list
4. Member detail/edit screen
5. Workload visualization
6. Role-based access control middleware

### Phase 3: Dashboard & Views (Week 6)
1. Main dashboard (task-focused)
2. Calendar view for tasks
3. Gantt chart view
4. Budget alerts
5. Workload analysis charts

### Phase 4: Farmer Management (Week 7-8)
1. Farmer CRUD
2. Training session management
3. Attendance tracking
4. Income data recording
5. Income analysis views

### Phase 5: Reports & Integration (Week 9)
1. Report generation (PDF/Excel)
2. Data export functionality
3. Google Drive full integration
4. Multi-language support (i18n)
5. Email notifications

### Phase 6: Testing & Refinement (Week 10)
1. Unit tests for critical functions
2. Integration tests for APIs
3. UI/UX refinements
4. Performance optimization
5. Security audit
6. Documentation

### Phase 7: Deployment (Week 11-12)
1. Production database setup
2. Backend deployment
3. Frontend deployment
4. Domain configuration
5. SSL setup
6. User training and handoff

---

## 📁 Wireframe Files Reference

All wireframe images are located in `/JICA_Project/` directory:

### Task Management
- `wireframe_new_dashboard.png` - Main Dashboard (Task-focused)
- `wireframe_task_management.png` - Calendar View
- `wireframe_task_list_view.png` - List View
- `wireframe_task_gantt_view.png` - Gantt Chart View
- `wireframe_task_detail.png` - Task Detail/Edit

### Budget Management
- `wireframe_budget_dashboard.png` - Budget Overview
- `wireframe_payment_plan.png` - Payment Plans & History
- `wireframe_expense_entry.png` - Expense Entry/Payment Record

### Team Management
- `wireframe_team_members_list.png` - Team Members List
- `wireframe_member_detail.png` - Member Detail & Permissions
- `wireframe_task_allocation_dashboard.png` - Workload Analysis

### Farmer Management
- `wireframe_02_farmers_list.png` - Farmers List
- `wireframe_03_farmer_detail.png` - Farmer Detail Profile
- `wireframe_04_training.png` - Training Management
- `wireframe_05_attendance.png` - Training Attendance
- `wireframe_06_income.png` - Income Data & Analysis

---

## 🎨 UI/UX Guidelines

### Color Palette
```css
/* Primary Colors */
--primary-blue: #2563eb;
--secondary-gray: #64748b;
--success-green: #10b981;
--warning-orange: #f59e0b;
--danger-red: #ef4444;
--purple: #8b5cf6;

/* Background Colors */
--bg-light: #f8fafc;
--bg-white: #ffffff;
--border-gray: #e2e8f0;

/* Text Colors */
--text-primary: #1e293b;
--text-secondary: #64748b;
```

### Typography
```css
/* Font Family */
font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
```

### Spacing
```css
/* Use 8px base unit system */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
```

### Component Patterns

**Cards**:
- Border radius: 8px
- Border: 1.5px solid var(--border-gray)
- Padding: 1.5rem
- Box shadow on hover

**Buttons**:
- Primary: Blue background, white text
- Secondary: White background, blue border
- Danger: Red border, white background
- Border radius: 6px
- Padding: 0.5rem 1rem

**Status Badges**:
- Border radius: 4px
- Padding: 4px 8px
- Font size: 12px
- Color-coded borders and text

**Tables**:
- Alternate row shading
- Hover effect on rows
- Sticky header
- Border between rows: 1px solid var(--border-gray)

---

## 🔒 Security Considerations

1. **Authentication**:
   - JWT tokens with expiration
   - Refresh token rotation
   - Password hashing with bcrypt (10+ rounds)
   - Rate limiting on login attempts

2. **Authorization**:
   - Role-based access control (RBAC)
   - Module-level permissions
   - Ownership checks for data modification

3. **Data Validation**:
   - Input sanitization
   - SQL injection prevention (use ORM)
   - XSS prevention
   - CSRF tokens for state-changing operations

4. **File Uploads**:
   - File type validation
   - File size limits
   - Virus scanning (if budget allows)
   - Store in Google Drive, not local server

5. **API Security**:
   - HTTPS only
   - CORS configuration
   - Rate limiting
   - API key for external integrations

---

## 📝 Next Steps for Cursor Development

1. **Start with Authentication**:
   ```bash
   npx create-next-app@latest jica-project --typescript --tailwind --app
   cd jica-project
   npm install prisma @prisma/client bcryptjs jsonwebtoken
   npx prisma init
   ```

2. **Copy database schema**:
   - Use the SQL schema from "Database Design" section
   - Or convert to Prisma schema format

3. **Set up environment variables**:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/jica_db"
   JWT_SECRET="your-secret-key"
   GOOGLE_DRIVE_CLIENT_ID="..."
   GOOGLE_DRIVE_CLIENT_SECRET="..."
   ```

4. **Install UI components**:
   ```bash
   npx shadcn-ui@latest init
   npx shadcn-ui@latest add button card input table
   ```

5. **Create first feature** (Login page):
   - Use `wireframe_new_dashboard.png` as reference for layout
   - Implement authentication flow
   - Test with Postman

6. **Iterate through features**:
   - Follow the development roadmap
   - Reference wireframes for each screen
   - Test each feature before moving to next

---

## 📞 Support & Questions

For technical questions during development:
1. Refer to this document first
2. Check wireframe images for UI details
3. Review database schema for data relationships
4. Consult API design for endpoint structure

Good luck with development! 🚀
