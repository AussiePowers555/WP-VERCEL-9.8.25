# 📁 Postgres (Neon) Database Setup

The motorbike rental management system now uses **Postgres (Neon)** as the single source of truth.

## 🎯 **What Changed**

### **Before (localStorage)**
- ❌ Data stored in browser memory
- ❌ Lost when clearing browser data  
- ❌ Device/browser specific
- ❌ Not truly persistent

### **After (Postgres Database)**
- ✅ Data stored in Neon Postgres via `DATABASE_URL`
- ✅ Managed backups and branching
- ✅ Scalable and multi-user safe
- ✅ Professional managed database

## 📍 **Database Connection**

Set `DATABASE_URL` in `.env.local`:
```
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DB?sslmode=require
```

## 🗄️ **Database Tables**

| Table | Description | Key Data |
|-------|-------------|----------|
| **cases** | All motorbike rental cases | Case numbers, client details, assignments |
| **contacts** | Lawyers, rental companies, clients | Names, emails, types |
| **workspaces** | User workspace assignments | Workspace filters, contact links |
| **user_accounts** | Authentication accounts | Login credentials, roles, permissions |

## 🔐 **Pre-configured Accounts**

### **Developer Accounts**
- **Email**: `whitepointer2016@gmail.com`  
- **Email**: `michaelalanwilson@gmail.com`  
- **Password**: `Tr@ders84`
- **Auto-login**: ✅ Enabled

### **David's Workspace**
- **Contact**: David (Rental Company)
- **Workspace**: "David - Not At Fault Workspace"
- **Access**: Cases assigned to David only

## 🚀 **API Endpoints**

The system now uses REST API endpoints for database operations:

```
GET    /api/cases          - Get all cases
POST   /api/cases          - Create new case
PUT    /api/cases/[id]     - Update case
DELETE /api/cases/[id]     - Delete case

GET    /api/contacts       - Get all contacts
POST   /api/contacts       - Create new contact

GET    /api/workspaces     - Get all workspaces  
POST   /api/workspaces     - Create new workspace
PUT    /api/workspaces/[id] - Update workspace
DELETE /api/workspaces/[id] - Delete workspace

GET    /api/users          - Get all user accounts
POST   /api/users          - Create new user account
```

## 💾 **Backup & Restore**

### **Backup Database**
Use Neon backups or `pg_dump`.

### **Restore Database**  
Use Neon restore from backup/branch.

## 🛠️ **Development**

### **View Database Contents**
Use `psql` or Neon dashboard.

### **Reset Database**
Reset schema by dropping/recreating tables or using migration scripts.

## 🔧 **Technical Details**

- **Database Engine**: Postgres (Neon)
- **Auto-initialization**: Creates tables and seeds data on first run
- **Security**: Use environment variables for credentials

## 📊 **Sample Data Included**

- ✅ 4 Initial contacts (David, lawyers, rental companies)
- ✅ 1 Sample case with full details
- ✅ 1 Workspace for David
- ✅ 2 Developer accounts pre-configured

## 🚨 **Important Notes**

1. **Database file is gitignored** - won't be committed to version control
2. **First run creates and seeds database** automatically
3. **All data persists** between app restarts
4. **Backup regularly** for important data
5. **Developer accounts auto-login** for convenience

The system is now ready for professional development with persistent, reliable data storage! 🎉