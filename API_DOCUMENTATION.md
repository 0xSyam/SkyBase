# Skybase Inventory Management API Documentation

## Overview

Skybase adalah sistem manajemen inventory untuk groundcrew aviation yang memungkinkan pengelolaan DOC (Document) dan ASE (Aviation Support Equipment) items, serta transfer ke aircraft.

## Base URL

```
http://localhost:8080/api
```

## Authentication

API menggunakan Laravel Sanctum untuk autentikasi. Setiap request (kecuali login/register) harus menyertakan Bearer token.

**Header:**

```
Authorization: Bearer {your-token}
Content-Type: application/json
```

## User Roles & Access Control

Sistem memiliki 3 role dengan akses yang berbeda:

| Role           | Description                                     | Key Permissions                                                            |
| -------------- | ----------------------------------------------- | -------------------------------------------------------------------------- |
| **Supervisor** | Manages flights, users, and oversees operations | Create flights, manage WH/GC users, view all reports                       |
| **Warehouse**  | Manages warehouse inventory and requests        | Manage warehouse stock, approve/reject requests                            |
| **Groundcrew** | Performs inspections and manages aircraft items | Transfer items to aircraft, conduct inspections, create warehouse requests |

### Test Credentials

Untuk testing, gunakan credentials berikut:

| Role       | Email                    | Password      |
| ---------- | ------------------------ | ------------- |
| Supervisor | `supervisor@skybase.com` | `password123` |
| Warehouse  | `warehouse@skybase.com`  | `password123` |
| Groundcrew | `groundcrew@skybase.com` | `password123` |

## Quick Start Guide

### 1. Login sebagai Groundcrew

```bash
curl -X POST "http://localhost:8080/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "groundcrew@skybase.com",
    "password": "password123"
  }'
```

**Response:** Simpan `token` untuk digunakan di request berikutnya.

### 2. Get Aircraft Inspection

```bash
curl -X GET "http://localhost:8080/api/inspections/aircraft/1/validation" \
  -H "Authorization: Bearer {your-token}" \
  -H "Accept: application/json"
```

### 3. Login sebagai Warehouse

```bash
curl -X POST "http://localhost:8080/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "warehouse@skybase.com",
    "password": "password123"
  }'
```

### 4. Login sebagai Supervisor

```bash
curl -X POST "http://localhost:8080/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "supervisor@skybase.com",
    "password": "password123"
  }'
```

**Supervisor can:** Manage users, create flights, view all reports

---

## 1. Authentication Endpoints

### 1.1 Login

**POST** `/auth/login`

**Request Body:**

```json
{
    "email": "user@skybase.com",
    "password": "password123"
}
```

**Response (Success):**

```json
{
    "status": "success",
    "message": "Login successful",
    "data": {
        "user": {
            "user_id": 1,
            "name": "User Name",
            "email": "user@skybase.com",
            "role": {
                "role_id": 1,
                "name": "supervisor"
            }
        },
        "token": "1|abc123def456..."
    }
}
```

#### Test Accounts untuk Setiap Role

**Supervisor Account:**

```json
{
    "email": "supervisor@skybase.com",
    "password": "password123"
}
```

**Warehouse Account:**

```json
{
    "email": "warehouse@skybase.com",
    "password": "password123"
}
```

**Groundcrew Account:**

```json
{
    "email": "groundcrew@skybase.com",
    "password": "password123"
}
```

**Response Structure sama untuk semua role**, hanya berbeda di field `role.name`:

-   Supervisor → `"name": "supervisor"`
-   Warehouse → `"name": "warehouse"`
-   Groundcrew → `"name": "groundcrew"`

**Example Response - Supervisor Login:**

```json
{
    "status": "success",
    "message": "Login successful",
    "data": {
        "user": {
            "user_id": 1,
            "name": "Flight Supervisor",
            "email": "supervisor@skybase.com",
            "role": {
                "role_id": 1,
                "name": "supervisor"
            }
        },
        "token": "1|aBcDeFgHiJkLmNoPqRsTuVwXyZ..."
    }
}
```

**Example Response - Warehouse Login:**

```json
{
    "status": "success",
    "message": "Login successful",
    "data": {
        "user": {
            "user_id": 2,
            "name": "Warehouse Manager",
            "email": "warehouse@skybase.com",
            "role": {
                "role_id": 2,
                "name": "warehouse"
            }
        },
        "token": "2|xYzWvUtSrQpOnMlKjIhGfEdCbA..."
    }
}
```

**Example Response - Groundcrew Login:**

```json
{
    "status": "success",
    "message": "Login successful",
    "data": {
        "user": {
            "user_id": 3,
            "name": "Ground Crew Lead",
            "email": "groundcrew@skybase.com",
            "role": {
                "role_id": 3,
                "name": "groundcrew"
            }
        },
        "token": "3|zAbCdEfGhIjKlMnOpQrStUvWxY..."
    }
}
```

**Error Response - Invalid Credentials:**

```json
{
    "status": "error",
    "message": "Invalid credentials"
}
```

**Error Response - Insufficient Privileges:**

```json
{
    "status": "error",
    "message": "Access denied. Insufficient privileges.",
    "required_roles": ["supervisor"],
    "user_role": "groundcrew"
}
```

### 1.2 Register

**POST** `/auth/register`

**Request Body:**

```json
{
    "name": "New User",
    "email": "newuser@skybase.com",
    "phone": "+6281234567890",
    "password": "password123",
    "password_confirmation": "password123",
    "role": "groundcrew"
}
```

**Field Descriptions:**

-   `name`: required, max 255 characters
-   `email`: required, valid email, must be unique
-   `phone`: optional, max 20 characters
-   `password`: required, min 6 characters
-   `password_confirmation`: required, must match password
-   `role`: required, must be one of: `supervisor`, `warehouse`, `groundcrew`

**Response (Success):**

```json
{
    "status": "success",
    "message": "User registered successfully",
    "data": {
        "user": {
            "user_id": 6,
            "name": "New User",
            "email": "newuser@skybase.com",
            "phone": "+6281234567890",
            "role": "groundcrew",
            "is_active": true
        },
        "token": "6|aBcDeFgHiJkLmNoPqRsTuVwXyZ...",
        "token_type": "Bearer"
    }
}
```

**Error Response - Validation Failed:**

```json
{
    "status": "error",
    "message": "Validation failed",
    "errors": {
        "email": ["The email has already been taken."],
        "role": ["The role field is required."]
    }
}
```

### 1.3 Get User Profile

**GET** `/auth/profile`

**Headers:** Authorization: Bearer {token}

**Response:**

```json
{
    "status": "success",
    "data": {
        "user_id": 3,
        "name": "Ground Crew User",
        "email": "groundcrew@skybase.com",
        "role": {
            "role_id": 3,
            "name": "groundcrew"
        }
    }
}
```

### 1.4 Logout

**POST** `/auth/logout`

**Headers:** Authorization: Bearer {token}

---

## Role-Based Endpoint Access

Berikut adalah matrix akses endpoint berdasarkan role:

| Module                 | Endpoint Example                                | Supervisor | Warehouse | Groundcrew |
| ---------------------- | ----------------------------------------------- | ---------- | --------- | ---------- |
| **User Management**    | POST /users                                     | ✅         | ❌        | ❌         |
|                        | PUT /users/{id}/reset-password                  | ✅         | ❌        | ❌         |
| **Flights**            | POST /flights                                   | ✅         | ❌        | ❌         |
|                        | PUT /flights/{id}/reschedule                    | ✅         | ❌        | ❌         |
|                        | GET /flights                                    | ✅         | ❌        | ✅         |
| **Inspections**        | GET /inspections/aircraft/{id}/validation       | ❌         | ❌        | ✅         |
|                        | PUT /inspections/{id}/submit                    | ❌         | ❌        | ✅         |
| **Inventory Transfer** | POST /inventory/groundcrew/transfer-to-aircraft | ❌         | ❌        | ✅         |
|                        | GET /inventory/aircraft/{id}                    | ✅         | ✅        | ✅         |
| **Warehouse Requests** | POST /warehouse/requests                        | ❌         | ❌        | ✅         |
|                        | PUT /warehouse/requests/{id}/approve            | ❌         | ✅        | ❌         |
|                        | PUT /warehouse/requests/{id}/fulfill            | ❌         | ✅        | ❌         |
| **Notifications**      | GET /notifications                              | ✅         | ✅        | ✅         |
| **Reports**            | GET /reports/aircraft-status                    | ✅         | ✅        | ✅         |
| **Item Catalog**       | POST /items                                     | ✅         | ❌        | ❌         |
|                        | GET /items                                      | ✅         | ✅        | ✅         |

**Legend:**

-   ✅ = Full access
-   ❌ = No access (will return 403 Forbidden)

---

## 2. Item Catalog Endpoints

### 2.1 Get All Items

**GET** `/items`

**Response:**

```json
{
    "status": "success",
    "data": [
        {
            "item_id": 1,
            "name": "SIC",
            "category": "DOC",
            "description": "Standard Instrument Chart",
            "requirements": "revision_no"
        },
        {
            "item_id": 12,
            "name": "RESTRAIN KIT",
            "category": "ASE",
            "description": "Aircraft Restraint Kit",
            "requirements": "seal_number"
        }
    ]
}
```

### 2.2 Get Items by Category

**GET** `/items/category/{category}`

**Parameters:**

-   `category`: DOC atau ASE

**Example:** `GET /items/category/DOC`

### 2.3 Get Available Items for Inventory

**GET** `/inventory/items/{category?}`

**Parameters:**

-   `category` (optional): DOC atau ASE

---

## 3. Groundcrew Inventory Management

### 3.1 Get My Inventory

**GET** `/inventory/groundcrew`

**Headers:** Authorization: Bearer {groundcrew-token}

**Response:**

```json
{
    "status": "success",
    "data": {
        "doc_inventory": [
            {
                "gc_doc_id": 1,
                "gc_id": 3,
                "item_id": 1,
                "quantity": 5,
                "doc_number": "DOC-001",
                "revision_no": "Rev-A",
                "effective_date": "2025-01-01",
                "condition": "Good",
                "item": {
                    "item_id": 1,
                    "name": "SIC",
                    "category": "DOC"
                }
            }
        ],
        "ase_inventory": [
            {
                "gc_ase_id": 1,
                "gc_id": 3,
                "item_id": 12,
                "serial_number": "ASE001",
                "seal_number": "SEAL001",
                "expires_at": "2025-12-31",
                "condition": "Good",
                "item": {
                    "item_id": 12,
                    "name": "RESTRAIN KIT",
                    "category": "ASE"
                }
            }
        ]
    }
}
```

### 3.2 Add DOC Item to Inventory

**POST** `/inventory/groundcrew/doc`

**Headers:** Authorization: Bearer {groundcrew-token}

**Request Body:**

```json
{
    "item_id": 1,
    "quantity": 3,
    "doc_number": "DOC-002",
    "revision_no": "Rev-B",
    "effective_date": "2025-02-01",
    "condition": "Good"
}
```

**Response:**

```json
{
    "status": "success",
    "message": "DOC item added to inventory",
    "data": {
        "gc_doc_id": 2,
        "gc_id": 3,
        "item_id": 1,
        "quantity": 3,
        "doc_number": "DOC-002",
        "revision_no": "Rev-B",
        "effective_date": "2025-02-01",
        "condition": "Good",
        "item": {
            "item_id": 1,
            "name": "SIC",
            "category": "DOC"
        }
    }
}
```

### 3.3 Add ASE Item to Inventory

**POST** `/inventory/groundcrew/ase`

**Headers:** Authorization: Bearer {groundcrew-token}

**Request Body:**

```json
{
    "item_id": 12,
    "serial_number": "ASE002",
    "seal_number": "SEAL002",
    "expires_at": "2025-12-31",
    "condition": "Good"
}
```

**Response:**

```json
{
    "status": "success",
    "message": "ASE item added to inventory",
    "data": {
        "gc_ase_id": 2,
        "gc_id": 3,
        "item_id": 12,
        "serial_number": "ASE002",
        "seal_number": "SEAL002",
        "expires_at": "2025-12-31",
        "condition": "Good",
        "item": {
            "item_id": 12,
            "name": "RESTRAIN KIT",
            "category": "ASE"
        }
    }
}
```

---

## 4. Aircraft Transfer System

### 4.1 Transfer DOC Item to Aircraft

**POST** `/inventory/groundcrew/transfer-to-aircraft`

**Headers:** Authorization: Bearer {groundcrew-token}

**Request Body (DOC Transfer):**

```json
{
    "type": "doc",
    "inventory_id": 1,
    "aircraft_id": 1,
    "quantity": 2
}
```

**Response:**

```json
{
    "status": "success",
    "message": "DOC item transferred to aircraft",
    "data": {
        "aircraft_doc_id": 1,
        "aircraft_id": 1,
        "item_id": 1,
        "quantity": 2,
        "doc_number": "DOC-001",
        "revision_no": "Rev-A",
        "effective_date": "2025-01-01",
        "condition": "Good",
        "aircraft": {
            "aircraft_id": 1,
            "registration_code": "PK-ABC",
            "type": {
                "type_id": 1,
                "type_code": "B737",
                "description": "Boeing 737"
            }
        },
        "item": {
            "item_id": 1,
            "name": "SIC",
            "category": "DOC"
        }
    }
}
```

### 4.2 Transfer ASE Item to Aircraft

**POST** `/inventory/groundcrew/transfer-to-aircraft`

**Headers:** Authorization: Bearer {groundcrew-token}

**Request Body (ASE Transfer):**

```json
{
    "type": "ase",
    "inventory_id": 1,
    "aircraft_id": 1
}
```

**Response:**

```json
{
    "status": "success",
    "message": "ASE item transferred to aircraft",
    "data": {
        "aircraft_ase_id": 1,
        "aircraft_id": 1,
        "item_id": 12,
        "serial_number": "ASE001",
        "seal_number": "SEAL001",
        "expires_at": "2025-12-31",
        "condition": "Good",
        "aircraft": {
            "aircraft_id": 1,
            "registration_code": "PK-ABC"
        },
        "item": {
            "item_id": 12,
            "name": "RESTRAIN KIT",
            "category": "ASE"
        }
    }
}
```

---

## 5. Aircraft Inventory

### 5.1 Get Aircraft Inventory

**GET** `/inventory/aircraft/{aircraftId}`

**Headers:** Authorization: Bearer {token}

**Example:** `GET /inventory/aircraft/1`

**Response:**

```json
{
    "status": "success",
    "data": {
        "aircraft": {
            "aircraft_id": 1,
            "registration_code": "PK-ABC",
            "notes": null,
            "type": {
                "type_id": 1,
                "type_code": "B737",
                "description": "Boeing 737"
            }
        },
        "doc_inventory": [
            {
                "aircraft_doc_id": 1,
                "aircraft_id": 1,
                "item_id": 1,
                "quantity": 3,
                "doc_number": "DOC-001",
                "revision_no": "Rev-A",
                "effective_date": "2025-01-01",
                "condition": "Good",
                "item": {
                    "item_id": 1,
                    "name": "SIC",
                    "category": "DOC"
                }
            }
        ],
        "ase_inventory": [
            {
                "aircraft_ase_id": 1,
                "aircraft_id": 1,
                "item_id": 12,
                "serial_number": "ASE001",
                "seal_number": "SEAL001",
                "expires_at": "2025-12-31",
                "condition": "Good",
                "item": {
                    "item_id": 12,
                    "name": "RESTRAIN KIT",
                    "category": "ASE"
                }
            }
        ]
    }
}
```

---

## 6. Warehouse Request System

### 6.1 Create Warehouse Request (Groundcrew)

**POST** `/warehouse-requests`

**Headers:** Authorization: Bearer {groundcrew-token}

**Request Body:**

```json
{
    "flight_id": 1,
    "priority": "normal",
    "notes": "Request for flight preparation",
    "items": [
        {
            "item_id": 1,
            "qty": 5,
            "notes": "Need latest revision"
        },
        {
            "item_id": 12,
            "qty": 2,
            "notes": "Check seal integrity"
        }
    ]
}
```

### 6.2 Get My Requests (Groundcrew)

**GET** `/warehouse-requests/my-requests`

**Headers:** Authorization: Bearer {groundcrew-token}

### 6.3 Get All Requests (Warehouse/Supervisor)

**GET** `/warehouse-requests`

**Headers:** Authorization: Bearer {warehouse-token}

### 6.4 Approve Request (Warehouse)

**PUT** `/warehouse-requests/{id}/approve`

**Headers:** Authorization: Bearer {warehouse-token}

### 6.5 Reject Request (Warehouse)

**PUT** `/warehouse-requests/{id}/reject`

**Headers:** Authorization: Bearer {warehouse-token}

**Request Body:**

```json
{
    "rejection_reason": "Items not available in warehouse"
}
```

**Response:**

```json
{
    "status": "success",
    "message": "Request rejected successfully",
    "data": {
        "wh_req_id": 1,
        "flight_id": 1,
        "requested_by_gc_id": 3,
        "status": "REJECTED",
        "rejection_reason": "Items not available in warehouse",
        "created_at": "2025-10-23T19:25:00.000000Z",
        "updated_at": "2025-10-23T19:30:00.000000Z"
    }
}
```

---

## 7. Flight Management

### 7.1 Get All Flights

**GET** `/flights`

**Headers:** Authorization: Bearer {token}

**Roles:** Supervisor, Groundcrew

**Query Parameters:**

-   `status` (optional): Filter by flight status (`SCHEDULED`, `READY`, `DELAY`, `COMPLETED`, `CANCELLED`)
-   `date` (optional): Filter by departure date (YYYY-MM-DD)

**Example:** `GET /flights?status=SCHEDULED&date=2025-11-12`

**Response:**

```json
{
    "status": "success",
    "data": {
        "flights": [
            {
                "flight_id": 1,
                "aircraft": {
                    "aircraft_id": 1,
                    "registration_code": "PK-ABC",
                    "type": "B737"
                },
                "route_to": "CGK-DPS",
                "sched_dep": "2025-11-12T10:00:00.000000Z",
                "sched_arr": "2025-11-12T12:30:00.000000Z",
                "status": "SCHEDULED",
                "rescheduled_at": null,
                "supervisor": {
                    "user_id": 1,
                    "name": "Flight Supervisor"
                },
                "created_at": "2025-11-10T08:00:00.000000Z"
            }
        ]
    }
}
```

### 7.2 Create Flight Schedule

**POST** `/flights`

**Headers:** Authorization: Bearer {supervisor-token}

**Roles:** Supervisor only

**Request Body:**

```json
{
    "aircraft_id": 1,
    "route_to": "CGK-DPS",
    "sched_dep": "2025-11-12T10:00:00",
    "sched_arr": "2025-11-12T12:30:00",
    "status": "SCHEDULED"
}
```

**Alternative (using registration_code):**

```json
{
    "registration_code": "PK-ABC",
    "route_to": "CGK-DPS",
    "sched_dep": "2025-11-12T10:00:00",
    "sched_arr": "2025-11-12T12:30:00",
    "status": "SCHEDULED"
}
```

**Field Descriptions:**

-   `aircraft_id`: Optional if `registration_code` is provided
-   `registration_code`: Optional if `aircraft_id` is provided (one must be provided)
-   `route_to`: Required, flight route (e.g., "CGK-DPS")
-   `sched_dep`: Required, scheduled departure datetime
-   `sched_arr`: Optional, scheduled arrival datetime (must be after departure)
-   `status`: Optional, flight status (default: SCHEDULED)

**Response:**

```json
{
    "status": "success",
    "message": "Flight created",
    "data": {
        "flight_id": 2
    }
}
```

**Error Response - Aircraft Not Found:**

```json
{
    "status": "error",
    "message": "Aircraft not found by registration_code"
}
```

### 7.3 Reschedule Flight

**PUT** `/flights/{flightId}/reschedule`

**Headers:** Authorization: Bearer {supervisor-token}

**Roles:** Supervisor only

**Example:** `PUT /flights/1/reschedule`

**Request Body:**

```json
{
    "sched_dep": "2025-11-12T14:00:00",
    "sched_arr": "2025-11-12T16:30:00",
    "status": "DELAY"
}
```

**Field Descriptions:**

-   `sched_dep`: Required, new scheduled departure datetime
-   `sched_arr`: Optional, new scheduled arrival datetime (must be after departure)
-   `status`: Optional, new flight status (default: SCHEDULED)

**Response:**

```json
{
    "status": "success",
    "message": "Flight rescheduled",
    "data": {
        "flight_id": 1,
        "sched_dep": "2025-11-12T14:00:00.000000Z",
        "sched_arr": "2025-11-12T16:30:00.000000Z",
        "status": "DELAY",
        "rescheduled_at": "2025-11-12T10:15:00.000000Z"
    }
}
```

### 7.4 Create Aircraft

**POST** `/aircraft`

**Headers:** Authorization: Bearer {supervisor-token}

**Roles:** Supervisor only

**Request Body:**

```json
{
    "type_code": "B737",
    "registration_code": "PK-XYZ",
    "notes": "New aircraft added to fleet"
}
```

**Field Descriptions:**

-   `type_code`: Required, aircraft type code (e.g., "B737", "A320")
-   `registration_code`: Required, unique registration code (e.g., "PK-XYZ")
-   `notes`: Optional, additional notes about the aircraft

**Response:**

```json
{
    "status": "success",
    "message": "Aircraft created",
    "data": {
        "aircraft_id": 2,
        "type_code": "B737",
        "registration_code": "PK-XYZ"
    }
}
```

**Error Response - Duplicate Registration:**

```json
{
    "status": "error",
    "errors": {
        "registration_code": ["The registration code has already been taken."]
    }
}
```

### Flight Statuses

| Status      | Description                     | Can Inspect? |
| ----------- | ------------------------------- | ------------ |
| `SCHEDULED` | Flight is scheduled and pending | ✅ Yes       |
| `READY`     | Aircraft ready for departure    | ✅ Yes       |
| `DELAY`     | Flight delayed                  | ✅ Yes       |
| `COMPLETED` | Flight completed                | ❌ No        |
| `CANCELLED` | Flight cancelled                | ❌ No        |

### Use Cases

1. **Schedule New Flight**: Supervisor creates flight schedule for upcoming routes
2. **Reschedule Flight**: Supervisor adjusts departure/arrival times due to delays
3. **View Flights**: Groundcrew checks upcoming flights for inspection planning
4. **Add Aircraft**: Supervisor adds new aircraft to the fleet
5. **Flight Monitoring**: Track flight status changes and notifications

---

## 8. Inspection Management System

**Overview:** Sistem inspection menggunakan **Simple Checklist** approach. Inspection otomatis dibuat saat groundcrew mengakses aircraft validation page.

### 8.1 Get Aircraft Validation Page (Auto-Create Inspection)

**GET** `/inspections/aircraft/{aircraftId}/validation`

**Headers:** Authorization: Bearer {groundcrew-token}

**Roles:** Groundcrew only

**Example:** `GET /inspections/aircraft/1/validation`

**Description:**

-   Endpoint ini akan **otomatis membuat inspection baru** jika belum ada inspection aktif untuk aircraft tersebut
-   Mengembalikan daftar item untuk di-check dengan progress tracking
-   Digunakan untuk memulai proses inspection

**Response:**

```json
{
    "status": "success",
    "data": {
        "inspection_id": 6,
        "aircraft": {
            "aircraft_id": 1,
            "jenis_pesawat": "B738 NG",
            "kode_pesawat": "PK-GFD"
        },
        "flight": {
            "flight_id": 5,
            "route_to": "CGK-SUB"
        },
        "progress": {
            "total_items": 4,
            "checked_items": 0,
            "completion_percentage": 0,
            "items_need_replacement": 0
        },
        "items": [
            {
                "inspection_item_id": 14,
                "nama_dokumen": "SIC",
                "nomor": "SIC-002",
                "revisi": "Rev-06",
                "efektif": "13 November 2025",
                "jumlah": 1,
                "is_checked": false,
                "needs_replacement": false,
                "checked_at": null
            },
            {
                "inspection_item_id": 16,
                "nama_dokumen": "RESTRAIN KIT",
                "nomor": "RK-2024-NEW",
                "revisi": null,
                "efektif": "13 November 2025",
                "jumlah": 1,
                "is_checked": false,
                "needs_replacement": false,
                "checked_at": null
            }
        ]
    }
}
```

### 8.2 Toggle Item Check Status

**PUT** `/inspections/items/{inspectionItemId}/toggle`

**Headers:** Authorization: Bearer {groundcrew-token}

**Roles:** Groundcrew only

**Example:** `PUT /inspections/items/14/toggle`

**Description:**

-   Toggle status item antara checked (✅) dan unchecked (❌)
-   Otomatis update `checked_at` timestamp
-   Inspection auto-complete saat semua item sudah di-check

**Response:**

```json
{
    "status": "success",
    "message": "Item status updated successfully",
    "data": {
        "inspection_item_id": 14,
        "is_checked": true,
        "needs_replacement": false,
        "checked_at": "2025-11-12T09:30:00.000000Z",
        "inspection_completed": false
    }
}
```

### 8.3 Replace Item in Aircraft Inventory

**PUT** `/inspections/items/{inspectionItemId}/replace`

**Headers:** Authorization: Bearer {groundcrew-token}

**Roles:** Groundcrew only

**Example:** `PUT /inspections/items/14/replace`

**Description:**

-   Replace item langsung di aircraft inventory
-   Otomatis mark item sebagai checked setelah replacement
-   Update aircraft inventory dengan data baru

**Request Body (DOC Item):**

```json
{
    "replacement_doc_number": "SIC-003",
    "replacement_revision": "Rev-07",
    "replacement_effective_date": "2025-12-01",
    "notes": "Replaced with newer revision"
}
```

**Request Body (ASE Item):**

```json
{
    "replacement_serial": "RK-2025-001",
    "replacement_expires_at": "2026-11-13",
    "notes": "Replaced expired item"
}
```

**Response:**

```json
{
    "status": "success",
    "message": "Item replaced successfully",
    "data": {
        "inspection_item_id": 14,
        "is_checked": true,
        "needs_replacement": false,
        "checked_at": "2025-11-12T09:35:00.000000Z",
        "inspection_completed": false
    }
}
```

### 8.4 Submit/Complete Inspection

**PUT** `/inspections/{inspectionId}/submit`

**Headers:** Authorization: Bearer {groundcrew-token}

**Roles:** Groundcrew only

**Example:** `PUT /inspections/6/submit`

**Description:**

-   Submit inspection setelah semua item di-check
-   Set aircraft status berdasarkan hasil inspection
-   Generate notification untuk supervisor

**Request Body:**

```json
{
    "notes": "All items validated and ready for flight"
}
```

**Response:**

```json
{
    "status": "success",
    "message": "Inspection completed successfully",
    "data": {
        "inspection_id": 6,
        "overall_status": "PASS",
        "aircraft_status": "READY",
        "completed_at": "2025-11-12T09:45:00.000000Z",
        "completion_percentage": 100.0,
        "items_checked": 4,
        "items_need_replacement": 0
    }
}
```

### 8.5 Get Available Flights for Inspection

**GET** `/inspections/available-flights`

**Headers:** Authorization: Bearer {groundcrew-token}

**Roles:** Groundcrew only

**Description:** Mendapatkan list flight yang bisa di-inspect (status SCHEDULED, READY, atau DELAY)

**Response:**

```json
{
    "status": "success",
    "data": [
        {
            "flight_id": 1,
            "aircraft": {
                "aircraft_id": 1,
                "registration_code": "PK-ABC",
                "type": "B737"
            },
            "route_to": "CGK-DPS",
            "sched_dep": "2025-10-30T10:00:00.000000Z",
            "sched_arr": "2025-10-30T12:30:00.000000Z",
            "status": "SCHEDULED",
            "has_inspection": false
        }
    ]
}
```

### 8.6 Get My Inspection History

**GET** `/inspections/my-inspections`

**Headers:** Authorization: Bearer {groundcrew-token}

**Roles:** Groundcrew only

**Description:** Mendapatkan history inspection yang telah dilakukan oleh groundcrew yang sedang login

**Response:**

```json
{
    "status": "success",
    "data": [
        {
            "inspection_id": 1,
            "flight": {
                "flight_id": 1,
                "route_to": "CGK-DPS",
                "sched_dep": "2025-10-30T10:00:00.000000Z",
                "aircraft": {
                    "registration_code": "PK-ABC",
                    "type": "B737"
                }
            },
            "status": "PASS",
            "started_at": "2025-10-30T08:00:00.000000Z",
            "completed_at": "2025-10-30T08:45:00.000000Z",
            "overall_status": "PASS",
            "duration_minutes": 45,
            "items_count": 18,
            "items_passed": 17,
            "items_failed": 1
        }
    ]
}
```

### 8.7 Get Inspection Summary Statistics

**GET** `/inspections/summary`

**Headers:** Authorization: Bearer {groundcrew-token}

**Roles:** Groundcrew only

**Description:** Mendapatkan statistik summary inspection dari groundcrew yang sedang login

**Response:**

```json
{
    "status": "success",
    "data": {
        "total_inspections": 25,
        "completed_inspections": 23,
        "in_progress_inspections": 2,
        "passed_inspections": 20,
        "failed_inspections": 3,
        "avg_inspection_time": 42.5
    }
}
```

### Inspection Workflow (Simple Checklist)

**Flow Lengkap:**

1. **Access Validation Page** - `GET /inspections/aircraft/{aircraftId}/validation`

    - System auto-create inspection jika belum ada
    - Groundcrew dapat list item untuk di-check

2. **Check Items** - `PUT /inspections/items/{itemId}/toggle`

    - Toggle status item (checked/unchecked)
    - Repeat untuk semua item

3. **Replace Items (jika perlu)** - `PUT /inspections/items/{itemId}/replace`

    - Replace item yang rusak/expired
    - Item otomatis marked as checked

4. **Submit Inspection** - `PUT /inspections/{inspectionId}/submit`
    - Submit setelah semua item checked
    - Aircraft status updated

**Key Features:**

-   ✅ **Auto-creation**: Inspection dibuat otomatis saat akses validation page
-   ✅ **Auto-completion**: Inspection complete saat semua item checked
-   ✅ **Real-time progress**: Progress tracking per inspection
-   ✅ **Direct replacement**: Replace item langsung di aircraft inventory
-   ✅ **Simple status**: Hanya checked (✅) atau unchecked (❌)

**Note:** Sistem inspection menggunakan **Simple Checklist** approach. Inspection akan **otomatis dibuat** saat groundcrew mengakses aircraft validation page (`GET /inspections/aircraft/{id}/validation`). Tidak perlu manual start inspection.

---

## Error Responses

### 400 Bad Request

```json]
{
    "status": "error",
    "message": "Item must be DOC category"
}
```

### 401 Unauthorized

```json
{
    "message": "Unauthenticated."
}
```

### 403 Forbidden

```json
{
    "error": "Unauthorized"
}
```

### 404 Not Found

```json
{
    "message": "No query results for model [App\\Models\\Aircraft] 999"
}
```

### 422 Validation Error

```json
{
    "message": "The item id field is required.",
    "errors": {
        "item_id": ["The item id field is required."]
    }
}
```

### 500 Internal Server Error

```json
{
    "status": "error",
    "message": "Failed to transfer item",
    "error": "Insufficient quantity in inventory"
}
```

---

## Sample Test Data

### Users & Roles

-   **Supervisor:** supervisor@skybase.com / password123
-   **Warehouse:** warehouse@skybase.com / password123
-   **Groundcrew:** groundcrew@skybase.com / password123

### Aircraft

-   Aircraft ID: 1, Registration: PK-ABC, Type: Boeing 737

### Item Catalog (DOC Items)

-   ID 1: SIC (Standard Instrument Chart)
-   ID 2: QRH (Quick Reference Handbook)
-   ID 3: MEL (Minimum Equipment List)
-   ID 4: CDL (Configuration Deviation List)
-   ID 5: AFM (Aircraft Flight Manual)
-   ID 6: FCOM (Flight Crew Operating Manual)
-   ID 7: QRC (Quick Reference Cards)
-   ID 8: CHECKLIST (Normal/Emergency Checklists)
-   ID 9: PERFORMANCE (Performance Tables)
-   ID 10: NAVIGATION CHARTS (Charts & Plates)
-   ID 11: WEIGHT BALANCE (Weight & Balance Manual)

### Item Catalog (ASE Items)

-   ID 12: RESTRAIN KIT (Aircraft Restraint Kit)
-   ID 13: GROUND POWER UNIT (GPU)
-   ID 14: AIRCRAFT JACK (Hydraulic Jack)
-   ID 15: TIRE PRESSURE GAUGE (Digital Gauge)
-   ID 16: SAFETY CONES (Traffic Cones)
-   ID 17: CHOCKS (Wheel Chocks)
-   ID 18: FIRE EXTINGUISHER (Halon/CO2)

---

## Postman Collection Import

Anda dapat mengimport collection ini ke Postman:

1. Buka Postman
2. Click "Import"
3. Paste URL atau upload file JSON
4. Set environment variables:
    - `{{domain}}` = `http://localhost:8080/api`
    - `{{token}}` = Bearer token dari login response
    - `{{aircraftId}}` = 1

## Testing Workflow

1. **Login** sebagai groundcrew
2. **Add DOC/ASE items** ke inventory
3. **Transfer items** ke aircraft
4. **Check aircraft inventory** untuk memverifikasi transfer
5. **Create warehouse request** jika perlu item tambahan
6. **Login sebagai warehouse** untuk approve/reject requests

---

# Inspection System (Checklist-based)

## Overview

The inspection system provides a simple checklist-based approach for validating aircraft items. This system allows groundcrew to:

1. **Simple Checklist** - Check ✅ (good) or uncheck ❌ (needs replacement) for each item
2. **Direct Inventory Updates** - Replace items directly in aircraft inventory during inspection
3. **Auto-completion** - Inspection completes automatically when all items are checked

## Endpoints

### 1. Get Aircraft Validation Page

**Endpoint:** `GET /inspections/aircraft/{aircraftId}/validation`

**Method:** GET

**Headers:** Authorization: Bearer {groundcrew-token}

**Example:** `GET /inspections/aircraft/1/validation`

**Response:**

```json
{
    "status": "success",
    "data": {
        "inspection_id": 1,
        "aircraft": {
            "aircraft_id": 1,
            "jenis_pesawat": "B738",
            "kode_pesawat": "PK-GFD"
        },
        "flight": {
            "flight_id": 1,
            "route_to": "CGK"
        },
        "progress": {
            "total_items": 10,
            "checked_items": 3,
            "completion_percentage": 30.0,
            "items_need_replacement": 1
        },
        "items": [
            {
                "inspection_item_id": 1,
                "nama_dokumen": "SIC",
                "nomor": "1334",
                "revisi": "001",
                "efektif": "17 October 2025",
                "jumlah": 10,
                "is_checked": true,
                "needs_replacement": false,
                "checked_at": "2025-10-30T08:30:00.000000Z"
            }
        ]
    }
}
```

### 2. Toggle Item Check Status

**Endpoint:** `PUT /inspections/items/{inspectionItemId}/toggle`

**Method:** PUT

**Headers:** Authorization: Bearer {groundcrew-token}

**Example:** `PUT /inspections/items/1/toggle`

**Response:**

```json
{
    "status": "success",
    "message": "Item status updated successfully",
    "data": {
        "inspection_item_id": 1,
        "is_checked": true,
        "needs_replacement": false,
        "checked_at": "2025-10-30T08:30:00.000000Z",
        "inspection_completed": false
    }
}
```

### 3. Replace Item in Aircraft Inventory

**Endpoint:** `PUT /inspections/items/{inspectionItemId}/replace`

**Method:** PUT

**Headers:** Authorization: Bearer {groundcrew-token}

**Example:** `PUT /inspections/items/1/replace`

**Request Body:**

```json
{
    "replacement_serial": "SN-12345",
    "replacement_doc_number": "1335",
    "replacement_revision": "002",
    "replacement_effective_date": "2025-11-01",
    "replacement_expires_at": "2026-11-01",
    "notes": "Replaced with newer version"
}
```

**Response:**

```json
{
    "status": "success",
    "message": "Item replaced successfully",
    "data": {
        "inspection_item_id": 1,
        "is_checked": true,
        "needs_replacement": false,
        "checked_at": "2025-10-30T08:30:00.000000Z",
        "inspection_completed": false
    }
}
```

### 4. Submit/Complete Inspection

**Endpoint:** `PUT /inspections/{inspectionId}/submit`

**Method:** PUT

**Headers:** Authorization: Bearer {groundcrew-token}

**Example:** `PUT /inspections/1/submit`

**Request Body:**

```json
{
    "notes": "All items validated and ready for flight"
}
```

**Response:**

```json
{
    "status": "success",
    "message": "Inspection completed successfully",
    "data": {
        "inspection_id": 1,
        "overall_status": "PASS",
        "aircraft_status": "READY",
        "completed_at": "2025-10-30T08:45:00.000000Z",
        "completion_percentage": 100.0,
        "items_checked": 10,
        "items_need_replacement": 0
    }
}
```

## Inspection Workflow

1. **Access Aircraft Validation** - GET `/inspections/aircraft/{aircraftId}/validation`
2. **Check/Uncheck Items** - PUT `/inspections/items/{itemId}/toggle`
3. **Replace Items if Needed** - PUT `/inspections/items/{itemId}/replace`
4. **Submit Inspection** - PUT `/inspections/{inspectionId}/submit`

## Key Features

-   **Auto-creation**: Inspection is automatically created when accessing aircraft validation
-   **Auto-completion**: Inspection completes automatically when all items are checked
-   **Direct inventory updates**: Items are immediately updated in aircraft inventory when replaced
-   **Simple status**: Only two states - checked (✅) or unchecked (❌)
-   **Real-time progress**: Shows completion percentage and items needing replacement

---

# Notification System (Automated Event-Driven)

## Overview

The notification system automatically generates notifications based on:

1. **Time-based events** - Flight reminders (T-30 min), Item expiry warnings (H-3 days)
2. **Action-based events** - Inspection completed, Warehouse requests, Flight status changes

All notifications are **append-only** (no read/unread status) and stored for audit purposes.

## Notification Types

| Type         | Description                       | Triggered By               |
| ------------ | --------------------------------- | -------------------------- |
| `flight`     | Flight reminders & status changes | Scheduler + Flight updates |
| `expiry`     | Item expiry warnings              | Scheduler (daily 08:00)    |
| `inspection` | Inspection completion             | Inspection completed event |
| `request`    | Warehouse request events          | Request created/updated    |
| `system`     | System notifications              | Manual/admin actions       |

## Endpoints

### 1. Get My Notifications

**Endpoint:** `GET /notifications`

**Method:** GET

**Headers:** Authorization: Bearer {token}

**Query Parameters:**

-   `limit` (optional): Number of notifications to retrieve (default: 50)

**Example:** `GET /notifications?limit=20`

**Response:**

```json
{
    "status": "success",
    "data": {
        "notifications": [
            {
                "notification_id": 1,
                "type": "flight",
                "message": "Flight reminder: PK-GFD (1) will land in approximately 30 minutes at 12:35",
                "related_type": "flights",
                "related_id": 1,
                "is_broadcast": false,
                "created_at": "2025-11-06T12:05:00.000000Z",
                "time_ago": "5 minutes ago"
            },
            {
                "notification_id": 2,
                "type": "expiry",
                "message": "Item expiring soon: RESTRAIN KIT (SN: RK-2024-002) on aircraft PK-GFD will expire on 09 Nov 2025",
                "related_type": "aircraft_ase_inventory",
                "related_id": 1,
                "is_broadcast": false,
                "created_at": "2025-11-06T08:00:00.000000Z",
                "time_ago": "4 hours ago"
            }
        ],
        "total": 2
    }
}
```

### 2. Get Notifications by Type

**Endpoint:** `GET /notifications/type/{type}`

**Method:** GET

**Headers:** Authorization: Bearer {token}

**Parameters:**

-   `type`: flight, expiry, inspection, request, system
-   `limit` (optional): Number of notifications (default: 50)

**Example:** `GET /notifications/type/flight?limit=10`

**Response:**

```json
{
    "status": "success",
    "data": {
        "type": "flight",
        "notifications": [
            {
                "notification_id": 1,
                "type": "flight",
                "message": "Flight reminder: PK-GFD (1) will land in approximately 30 minutes at 12:35",
                "related_type": "flights",
                "related_id": 1,
                "is_broadcast": false,
                "created_at": "2025-11-06T12:05:00.000000Z",
                "time_ago": "5 minutes ago"
            }
        ],
        "total": 1
    }
}
```

### 3. Get Notifications for Specific Item (Alert Button)

**Endpoint:** `GET /notifications/item/{relatedType}/{relatedId}`

**Method:** GET

**Headers:** Authorization: Bearer {token}

**Use Case:** Show alert icon/tooltip next to item name in inventory list

**Parameters:**

-   `relatedType`: Table name (e.g., `aircraft_ase_inventory`, `flights`, `wh_requests`)
-   `relatedId`: Entity ID from that table

**Example:** `GET /notifications/item/aircraft_ase_inventory/1`

**Response:**

```json
{
    "status": "success",
    "data": [
        {
            "notification_id": 11,
            "type": "expiry",
            "message": "Item expiring soon: RESTRAIN KIT (SN: RK-2024-NEW) on aircraft PK-GFD will expire on 13 Nov 2025",
            "related_type": "aircraft_ase_inventory",
            "related_id": 1,
            "is_broadcast": false,
            "created_at": "2025-11-10T14:53:11.000000Z",
            "time_ago": "1 minute ago"
        }
    ],
    "related_type": "aircraft_ase_inventory",
    "related_id": 1,
    "count": 1,
    "has_alerts": true
}
```

**Frontend Usage Example:**

```javascript
// When rendering inventory list
items.forEach(item => {
    const response = await fetch(`/api/notifications/item/aircraft_ase_inventory/${item.ase_inv_id}`);
    const data = await response.json();

    if (data.has_alerts) {
        // Show alert icon next to item name
        showAlertIcon(item, data.data); // Pass notifications for tooltip
    }
});
```

## Automated Triggers

### Flight Reminders (T-30 minutes)

-   **Schedule:** Every 5 minutes
-   **Command:** `php artisan notifications:check-flights`
-   **Triggers:** When flight will land in approximately 30 minutes
-   **Recipients:** All groundcrew users

### Expiry Warnings (H-3 days)

-   **Schedule:** Daily at 08:00
-   **Command:** `php artisan notifications:check-expiry`
-   **Triggers:**
    -   Aircraft ASE items with `expires_at` in 3 days
    -   Aircraft DOC items with `effective_date` in 3 days
    -   Groundcrew ASE items with `expires_at` in 3 days
    -   Groundcrew DOC items with `effective_date` in 3 days
-   **Recipients:**
    -   Aircraft items → All groundcrew + All warehouse
    -   GC items → Item owner (specific groundcrew) + All warehouse

### Event-Based Notifications

-   **Inspection Completed** → Notifies supervisors
-   **Warehouse Request Created** → Notifies warehouse staff
-   **Warehouse Request Status Changed** → Notifies requesting groundcrew
-   **Flight Delayed/Cancelled** → Notifies all groundcrew

## Notification Structure

All notifications include:

-   `notification_id`: Unique identifier
-   `type`: Category of notification (flight, expiry, inspection, request, system)
-   `message`: Human-readable message
-   `related_type`: Source table name (e.g., `aircraft_ase_inventory`, `flights`)
-   `related_id`: **Source entity ID (IMPORTANT for alert buttons!)**
-   `is_broadcast`: Whether notification is for all users
-   `created_at`: Timestamp
-   `time_ago`: Human-friendly time difference

### Related ID Mapping

| Notification Type       | related_type             | related_id      | Use Case                             |
| ----------------------- | ------------------------ | --------------- | ------------------------------------ |
| Expiry Warning (ASE)    | `aircraft_ase_inventory` | `ase_inv_id`    | Alert icon next to aircraft ASE item |
| Expiry Warning (DOC)    | `aircraft_doc_inventory` | `doc_inv_id`    | Alert icon next to aircraft DOC item |
| Expiry Warning (GC ASE) | `gc_ase_inventory`       | `gc_ase_id`     | Alert icon next to GC ASE item       |
| Expiry Warning (GC DOC) | `gc_doc_inventory`       | `gc_doc_id`     | Alert icon next to GC DOC item       |
| Expiry Warning          | `aircraft_doc_inventory` | `doc_inv_id`    | Alert icon next to DOC item          |
| Flight Reminder         | `flights`                | `flight_id`     | Flight detail link                   |
| Inspection Completed    | `inspections`            | `inspection_id` | Inspection detail link               |
| Warehouse Request       | `wh_requests`            | `request_id`    | Request detail link                  |

**Frontend Implementation:**

-   Use `related_id` to show alert icon/badge next to specific item in inventory list
-   On hover, display notification message in tooltip
-   Clicking alert can navigate to detailed view using `related_id`

---

# Reporting System (Aircraft Inventory & Validation)

## Overview

The reporting system provides comprehensive reports on aircraft inventory status, inspection performance, and item conditions over time. Reports can be filtered by date range, aircraft, and item category.

## Endpoints

### 1. Get Aircraft Status Report

**Endpoint:** `GET /reports/aircraft-status`

**Method:** GET

**Headers:** Authorization: Bearer {token}

**Query Parameters:**

| Parameter     | Type    | Required | Description              | Example                |
| ------------- | ------- | -------- | ------------------------ | ---------------------- |
| `aircraft_id` | integer | Yes      | Aircraft ID to report on | 1                      |
| `from_date`   | date    | Yes      | Start date (YYYY-MM-DD)  | 2025-10-01             |
| `to_date`     | date    | Yes      | End date (YYYY-MM-DD)    | 2025-11-06             |
| `group_by`    | string  | No       | Grouping interval        | daily, weekly, monthly |
| `type`        | string  | No       | Item category filter     | ALL, ASE, DOC          |

**Example:** `GET /reports/aircraft-status?aircraft_id=1&from_date=2025-10-01&to_date=2025-11-06&group_by=weekly&type=ALL`

**Response:**

```json
{
    "status": "success",
    "data": {
        "aircraft": {
            "aircraft_id": 1,
            "registration_code": "PK-GFD",
            "type": "B738 NG"
        },
        "period": {
            "from": "2025-10-01",
            "to": "2025-11-06",
            "interval": "weekly"
        },
        "current_inventory": {
            "total_items": 4,
            "valid_items": 4,
            "expired_items": 0,
            "expiring_soon": 1,
            "by_category": {
                "ASE": {
                    "total": 2,
                    "valid": 2,
                    "expired": 0,
                    "expiring_soon": 1
                },
                "DOC": {
                    "total": 2,
                    "valid": 2,
                    "expired": 0,
                    "expiring_soon": 0
                }
            }
        },
        "summary": {
            "inventory_health": {
                "total_items": 4,
                "valid_items": 4,
                "expired_items": 0,
                "expiring_soon": 1,
                "health_percentage": 100
            },
            "inspection_performance": {
                "total_inspections": 5,
                "passed_inspections": 4,
                "failed_inspections": 1,
                "pass_rate": 80
            }
        },
        "timeline": {
            "Week 40 (Sep 30 - Oct 06)": {
                "inspections": [],
                "count": 0,
                "summary": {
                    "total_inspections": 0,
                    "passed": 0,
                    "failed": 0,
                    "total_items_checked": 0,
                    "total_items_replaced": 0
                }
            },
            "Week 41 (Oct 07 - Oct 13)": {
                "inspections": [
                    {
                        "inspection_id": 1,
                        "date": "2025-10-10",
                        "status": "PASS",
                        "items_checked": 18,
                        "items_replaced": 0,
                        "ground_crew": "John Doe"
                    }
                ],
                "count": 1,
                "summary": {
                    "total_inspections": 1,
                    "passed": 1,
                    "failed": 0,
                    "total_items_checked": 18,
                    "total_items_replaced": 0
                }
            }
        }
    }
}
```

## Report Features

### Current Inventory Status

Shows real-time status of all items on the aircraft:

-   Total items count
-   Valid/expired breakdown
-   Items expiring soon (within 7 days)
-   Breakdown by category (ASE/DOC)

### Inventory Health Metrics

-   **Health Percentage**: `(valid_items / total_items) * 100`
-   Shows overall readiness of aircraft inventory

### Inspection Performance

-   Total inspections in period
-   Pass/fail breakdown
-   Pass rate percentage
-   Average inspection time

### Timeline Analysis

Groups inspections by interval (daily/weekly/monthly):

-   **Daily**: Each day in the period
-   **Weekly**: Groups by week (Mon-Sun)
-   **Monthly**: Groups by calendar month

Each timeline entry includes:

-   List of inspections performed
-   Summary statistics
-   Items checked and replaced counts

## Grouping Options

### Daily (`group_by=daily`)

```json
"timeline": {
    "2025-10-01": { ... },
    "2025-10-02": { ... },
    "2025-10-03": { ... }
}
```

### Weekly (`group_by=weekly`)

```json
"timeline": {
    "Week 40 (Sep 30 - Oct 06)": { ... },
    "Week 41 (Oct 07 - Oct 13)": { ... }
}
```

### Monthly (`group_by=monthly`)

```json
"timeline": {
    "October 2025": { ... },
    "November 2025": { ... }
}
```

## Type Filters

-   **ALL**: Shows all items (ASE + DOC)
-   **ASE**: Shows only Aviation Support Equipment
-   **DOC**: Shows only Document items

## Use Cases

1. **Pre-flight Audit**: Check aircraft readiness before scheduled flight
2. **Maintenance Planning**: Identify items needing replacement
3. **Performance Monitoring**: Track inspection pass rates over time
4. **Compliance Reporting**: Generate periodic audit reports
5. **Trend Analysis**: Analyze inspection patterns and item health trends

---

# User Management (Supervisor Only)

## Overview

Supervisor dapat mengelola akun Warehouse dan Groundcrew: create, view, reset password, toggle status, dan delete.

**Authorization:** Hanya role `supervisor` yang dapat mengakses semua endpoints ini.

## Endpoints

### 1. Get All Users (WH & GC)

**Endpoint:** `GET /users`

**Headers:** Authorization: Bearer {supervisor-token}

**Query Parameters:**

-   `role` (optional): Filter by role (`warehouse` atau `groundcrew`)

**Example:** `GET /users?role=groundcrew`

**Response:**

```json
{
    "status": "success",
    "data": [
        {
            "user_id": 3,
            "name": "Ground Crew Lead",
            "email": "groundcrew@skybase.com",
            "phone": "+6281234567892",
            "role": "groundcrew",
            "is_active": true,
            "created_at": "2025-10-23T10:07:32.000000Z"
        }
    ],
    "count": 1
}
```

### 2. Get User Details

**Endpoint:** `GET /users/{userId}`

**Headers:** Authorization: Bearer {supervisor-token}

**Response:**

```json
{
    "status": "success",
    "data": {
        "user_id": 3,
        "name": "Ground Crew Lead",
        "email": "groundcrew@skybase.com",
        "phone": "+6281234567892",
        "role": "groundcrew",
        "is_active": true,
        "created_at": "2025-10-23T10:07:32.000000Z",
        "updated_at": "2025-11-10T15:20:00.000000Z"
    }
}
```

### 3. Create New User

**Endpoint:** `POST /users`

**Headers:** Authorization: Bearer {supervisor-token}

**Request Body:**

```json
{
    "name": "New Warehouse Staff",
    "email": "newwarehouse@skybase.com",
    "phone": "+6281234567899",
    "password": "password123",
    "role": "warehouse"
}
```

**Validation:**

-   `name`: required, max 255 characters
-   `email`: required, valid email, unique
-   `phone`: optional, max 20 characters
-   `password`: required, min 6 characters
-   `role`: required, must be `warehouse` or `groundcrew`

**Response:**

```json
{
    "status": "success",
    "message": "User created successfully",
    "data": {
        "user_id": 6,
        "name": "New Warehouse Staff",
        "email": "newwarehouse@skybase.com",
        "role": "warehouse"
    }
}
```

### 4. Reset User Password

**Endpoint:** `PUT /users/{userId}/reset-password`

**Headers:** Authorization: Bearer {supervisor-token}

**Request Body:**

```json
{
    "new_password": "newpassword123"
}
```

**Validation:**

-   `new_password`: required, min 6 characters

**Response:**

```json
{
    "status": "success",
    "message": "Password reset successfully",
    "data": {
        "user_id": 3,
        "name": "Ground Crew Lead",
        "email": "groundcrew@skybase.com"
    }
}
```

### 5. Toggle User Status

**Endpoint:** `PUT /users/{userId}/toggle-status`

**Headers:** Authorization: Bearer {supervisor-token}

**Use Case:** Disable/enable user account without deleting

**Response:**

```json
{
    "status": "success",
    "message": "User status updated successfully",
    "data": {
        "user_id": 6,
        "name": "New Warehouse Staff",
        "is_active": false
    }
}
```

### 6. Delete User

**Endpoint:** `DELETE       `

**Headers:** Authorization: Bearer {supervisor-token}

**Response:**

```json
{
    "status": "success",
    "message": "User New Warehouse Staff (warehouse) deleted successfully"
}
```

## Security Features

-   ✅ Only supervisor can access all user management endpoints
-   ✅ Cannot manage supervisor accounts (only WH and GC)
-   ✅ Email uniqueness enforced
-   ✅ Password hashed with bcrypt
-   ✅ Soft disable via `is_active` toggle
-   ✅ Complete audit trail via timestamps

## Use Cases

1. **Onboarding**: Create new warehouse or groundcrew accounts
2. **Account Recovery**: Reset password when user forgets
3. **Access Control**: Disable account temporarily without deletion
4. **User Removal**: Permanently delete inactive/terminated users
5. **User Monitoring**: View all users and their status

---

## Notes

-   DOC items menggunakan `quantity` dan bisa di-transfer sebagian
-   ASE items bersifat unit dan di-transfer seluruhnya (serial number unique)
-   Setiap role memiliki akses endpoint yang berbeda
-   Transfer hanya bisa dilakukan oleh groundcrew
-   Warehouse request workflow: create → approve/reject → fulfill
-   Notifications are append-only (no read/unread status)
-   Reports are generated in real-time from current database state
-   User management is supervisor-only for warehouse and groundcrew accounts
-   Scheduler must be running for automated notifications (`php artisan schedule:work`)
