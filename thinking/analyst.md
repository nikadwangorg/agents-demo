# Analyst Handoff: OKR Management App

## 1. 需求分析与核心逻辑 (Requirement Analysis)
### 用户故事 (User Stories)
- **As a User**, I want to create an **Objective**, so that I can define a high-level goal.
- **As a User**, I want to add **Key Results** to an Objective, so that I can measure success quantitatively.
- **As a User**, I want to update the `currentValue` of a Key Result, so that I can track progress.
- **As a User**, I want to view a dashboard of all Objectives with their calculated progress, so that I know where I stand.
- **As a User**, I want to delete an Objective, so that I can remove obsolete goals.

### 核心实体 (Domain Entities)
- **Objective**:
  - `id`: string (UUID)
  - `title`: string
  - `description`: string (optional)
  - `createdAt`: Date
  - `keyResults`: KeyResult[] (relation)
- **KeyResult**:
  - `id`: string (UUID)
  - `objectiveId`: string (foreign key)
  - `title`: string
  - `targetValue`: number
  - `currentValue`: number (default 0)
  - `unit`: string (e.g., "percent", "currency", "count")

### 关键业务流程 (Key Processes)
1.  **Create OKR**: User submits Objective details -> System validates -> System creates Objective.
2.  **Add KR**: User submits KR details for an Objective -> System validates Objective exists -> System creates KR.
3.  **Update Progress**: User submits new `currentValue` for KR -> System updates KR -> System (optionally) recalculates Objective progress on read.
4.  **View Dashboard**: System fetches all Objectives -> System fetches linked KRs -> System calculates progress per Objective (Average of KR progress) -> Returns aggregated data.

## 2. 验收标准 (Acceptance Criteria)
1.  **Create Objective**: Successfully creates an objective with valid title. Fails if title is empty.
2.  **Add Key Result**: Successfully adds a KR to a valid Objective ID. Fails if Objective ID does not exist.
3.  **Update Key Result**: Successfully updates `currentValue`.
4.  **Progress Calculation**: Objective progress is the average of its Key Results' progress ((current / target) * 100).
5.  **List OKRs**: Returns a list containing Objectives, nested Key Results, and calculated progress.
6.  **Delete Objective**: Deleting an Objective removes it and all associated Key Results.
7.  **Data Persistence**: Data should persist across server restarts (implied requirement for a useful app, suggest file-based or SQLite).
8.  **Error Handling**: Returns standard JSON error format for invalid inputs or missing resources.

## 3. 用例清单 (Use Cases)
### Happy Path
1.  **Create Goal**: `POST /objectives` with `{ "title": "Launch MVP" }` -> Returns 201 & ID.
2.  **Add Metric**: `POST /objectives/{id}/key-results` with `{ "title": "Get 100 users", "targetValue": 100 }` -> Returns 201.
3.  **Track**: `PATCH /key-results/{krId}` with `{ "currentValue": 50 }` -> Returns 200.
4.  **View**: `GET /objectives` -> Returns list showing "Launch MVP" is 50% complete.

### Edge Cases
1.  **Invalid Objective**: `POST /objectives` with `{}` (missing title) -> Returns 400 `INVALID_INPUT`.
2.  **Orphan KR**: Try to add KR to non-existent Objective ID -> Returns 404 `RESOURCE_NOT_FOUND`.
3.  **Negative Target**: Try to create KR with `targetValue: -10` -> Returns 400 `INVALID_INPUT`.
4.  **Delete Non-existent**: `DELETE /objectives/{fakeId}` -> Returns 404 `RESOURCE_NOT_FOUND`.

## 4. 错误与状态码约定 (Error & Status Codes)
**Unified Error Structure:**
```json
{
  "code": "string",
  "message": "string"
}
```

**Codes:**
- `200 OK`: Success (Read/Update).
- `201 Created`: Resource created.
- `204 No Content`: Resource deleted.
- `400 INVALID_INPUT`: Validation failed (Zod error).
- `404 RESOURCE_NOT_FOUND`: ID not found.
- `500 INTERNAL_ERROR`: Unexpected server error.

## 5. 接口初稿 (API Draft)

| Method | Path | Request Body | Response Body | Status |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/objectives` | `{ title: string, description?: string }` | `Objective` | 201 |
| `GET` | `/objectives` | - | `Objective[]` (w/ KRs & progress) | 200 |
| `GET` | `/objectives/:id` | - | `Objective` | 200 |
| `DELETE`| `/objectives/:id` | - | - | 204 |
| `POST` | `/objectives/:id/key-results` | `{ title: string, targetValue: number, unit: string }` | `KeyResult` | 201 |
| `PATCH` | `/key-results/:id` | `{ currentValue: number }` | `KeyResult` | 200 |
| `DELETE`| `/key-results/:id` | - | - | 204 |

## 6. 关键约束与边界条件 (Constraints)
- **Tech Stack**: TypeScript, Node.js 22.
- **Architecture**: RESTful API.
- **Validation**: Strict input validation using **Zod**.
- **Persistence**: Use a simple **JSON file-based database** (e.g., `lowdb` or custom JSON handler) or **SQLite** to ensure data persists but keeps setup minimal. Avoid heavy DBs like Postgres for this MVP unless requested.
- **Calculation**: Progress is calculated dynamically on read, not stored (to avoid sync issues).
- **Concurrency**: No specific high-concurrency requirements; single instance sufficient.
