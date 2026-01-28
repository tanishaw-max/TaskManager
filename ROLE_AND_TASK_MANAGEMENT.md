# Role-Based Access Control & Task Management Guide

## Overview
This application now supports:
1. **Role Selection During Registration** - Choose user, manager, or super-admin roles
2. **Role-Based Task Management** - Different permissions based on roles
3. **Task Status Tracking** - Automatic updates and status history

---

## 🔐 Role Selection During Registration

### Available Roles

1. **User (Default)**
   - Can create and manage only their own tasks
   - No registration key required
   - Default role for security

2. **Manager**
   - Can create tasks for themselves and assign to employees (users)
   - Can view and manage tasks assigned to their team
   - Cannot manage other managers or super-admins
   - **Registration Key Required:** `manager_key_2024`

3. **Super Admin**
   - Full access to all tasks and users
   - Can create tasks and assign to any user
   - Can manage all users (create, update, delete)
   - **Registration Key Required:** `super_admin_key_2024`

### How to Register with Different Roles

1. **As a Regular User:**
   - Select "User" role
   - No registration key needed
   - Fill in all other fields and submit

2. **As a Manager:**
   - Select "Manager" role
   - Enter registration key: `manager_key_2024`
   - Fill in all other fields and submit

3. **As a Super Admin:**
   - Select "Super Admin" role
   - Enter registration key: `super_admin_key_2024`
   - Fill in all other fields and submit

### Changing Registration Keys

You can set custom registration keys in your `.env` file:
```env
REGISTRATION_KEY_MANAGER=your_custom_manager_key
REGISTRATION_KEY_SUPER_ADMIN=your_custom_super_admin_key
```

---

## 📋 Task Management by Role

### Task Permissions

| Action | User | Manager | Super Admin |
|-------|------|---------|-------------|
| Create own tasks | ✅ | ✅ | ✅ |
| Assign tasks to others | ❌ | ✅ (employees only) | ✅ (anyone) |
| View own tasks | ✅ | ✅ | ✅ |
| View team tasks | ❌ | ✅ | ✅ |
| View all tasks | ❌ | ❌ | ✅ |
| Update own tasks | ✅ | ✅ | ✅ |
| Update team tasks | ❌ | ✅ | ✅ |
| Update any task | ❌ | ❌ | ✅ |
| Delete own tasks | ✅ | ✅ | ✅ |
| Delete team tasks | ❌ | ✅ | ✅ |
| Delete any task | ❌ | ❌ | ✅ |

### Task Assignment Rules

- **Users:** Can only create tasks for themselves
- **Managers:** Can assign tasks to:
  - Themselves
  - Employees (users with "user" role)
  - Cannot assign to other managers or super-admins
- **Super Admins:** Can assign tasks to anyone

---

## 📊 Task Status Tracking

### Status Types

1. **Pending** ⏳ - Task is created but not started
2. **In Progress** 🔄 - Task is currently being worked on
3. **Completed** ✅ - Task is finished

### Automatic Updates

- Tasks automatically refresh every **5 seconds** on the frontend
- Status changes are tracked in the **Status History**
- Each status change records:
  - Who changed it
  - When it was changed
  - The status change note

### Status History

Every task maintains a complete history of status changes:
- Shows all status transitions
- Displays who made each change
- Shows timestamps for each change
- Includes notes about the change

### Viewing Status History

On the Tasks page, each task card shows:
- Current status with emoji indicator
- Complete status history timeline
- Who made each change and when
- Any notes associated with status changes

---

## 🚀 Usage Examples

### Example 1: Creating a User Account
1. Go to `/register`
2. Fill in username, email, password, phone, address
3. Select "User" role (default)
4. Submit (no key needed)

### Example 2: Creating a Manager Account
1. Go to `/register`
2. Fill in all required fields
3. Select "Manager" role
4. Enter registration key: `manager_key_2024`
5. Submit

### Example 3: Assigning a Task (Manager)
1. Login as a manager
2. Go to Tasks page
3. Fill in task title and description
4. Select an employee from "Assign to" dropdown
5. Create task

### Example 4: Tracking Task Progress
1. View tasks on Tasks page
2. See current status (⏳ Pending, 🔄 In Progress, ✅ Completed)
3. Change status using the dropdown
4. View status history below each task
5. Tasks auto-refresh every 5 seconds to show latest updates

---

## 🔧 Technical Details

### Backend Changes

1. **Task Model** - Added `statusHistory` array to track all status changes
2. **Auth Routes** - Updated registration to accept `roleTitle` and `registrationKey`
3. **Task Routes** - Enhanced to:
   - Track status changes in history
   - Populate status history with user info
   - Initialize history on task creation

### Frontend Changes

1. **RegisterPage** - Added role selection and registration key field
2. **TasksPage** - Added:
   - Auto-refresh every 5 seconds
   - Status history display
   - Enhanced status indicators with emojis
   - Better task metadata display

---

## 🛡️ Security Notes

1. **Registration Keys** - Default keys are for development. Change them in production!
2. **Role Assignment** - Only super-admins can create other super-admins/managers via API
3. **Task Access** - Users can only see/modify their own tasks (unless manager/super-admin)
4. **Status History** - Cannot be modified, only appended to (immutable audit trail)

---

## 📝 Environment Variables

Add these to your `.env` file for custom registration keys:

```env
REGISTRATION_KEY_MANAGER=your_secure_manager_key
REGISTRATION_KEY_SUPER_ADMIN=your_secure_super_admin_key
```

If not set, defaults are:
- Manager: `manager_key_2024`
- Super Admin: `super_admin_key_2024`

---

## 🎯 Best Practices

1. **Role Assignment:**
   - Start with "user" role for most accounts
   - Only create managers when needed for team management
   - Limit super-admin accounts (consider limiting to one)

2. **Task Management:**
   - Use status updates to track progress
   - Check status history to see task lifecycle
   - Managers should regularly review team tasks

3. **Status Updates:**
   - Update status as work progresses
   - Use meaningful status change notes
   - Complete tasks when finished

---

## ❓ Troubleshooting

**Q: Can't register as manager/super-admin?**
- Check that you entered the correct registration key
- Default keys: `manager_key_2024` or `super_admin_key_2024`

**Q: Tasks not updating automatically?**
- Check browser console for errors
- Verify backend is running
- Auto-refresh happens every 5 seconds

**Q: Can't see all tasks?**
- Check your role - only super-admins see all tasks
- Managers see their tasks + employee tasks
- Users see only their own tasks

**Q: Can't assign tasks to someone?**
- Managers can only assign to employees (user role)
- Super-admins can assign to anyone
- Users cannot assign to others

---

## 📚 API Endpoints

### Registration
```
POST /api/auth/register
Body: {
  username, email, password, phone, address,
  roleTitle: "user" | "manager" | "super-admin",
  registrationKey: "..." (required for manager/super-admin)
}
```

### Create Task
```
POST /api/tasks
Body: {
  taskTitle, description,
  userId: "..." (optional, defaults to current user)
}
```

### Update Task Status
```
PUT /api/tasks/:id
Body: {
  status: "pending" | "in-progress" | "completed",
  note: "..." (optional)
}
```

---

Enjoy your enhanced role-based task management system! 🎉
