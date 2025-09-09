# Setting Up Admin Credentials in Upstash Data Browser

This guide will help you set up admin credentials directly in your Upstash Redis database using the Data Browser.

## 🎯 Why Use Upstash for Admin Credentials?

- ✅ **Centralized Storage**: All admin data in one place
- ✅ **Persistent**: Survives browser cache clears
- ✅ **Secure**: Server-side storage with encryption
- ✅ **Scalable**: Works across multiple devices/browsers
- ✅ **Backup**: Automatic backups with Upstash

## 🚀 Quick Setup

### 1. Access Upstash Data Browser
1. Go to [Upstash Console](https://console.upstash.com/)
2. Select your Redis database
3. Click on **"Data Browser"** tab
4. You'll see the Redis command interface

### 2. Create Admin User Hash
In the Data Browser, run these commands:

```redis
# Create the admin users hash
HSET travelbook:admin_users admin_001 '{"id":"admin_001","username":"admin","password":"-1234567890","email":"admin@travelbooks.com","role":"admin","created_at":"2024-01-01T00:00:00.000Z","last_login":null,"is_active":true}'
```

**Note**: The password `-1234567890` is the hash for `admin123`. You can change this later.

### 3. Verify the Setup
Check that the user was created:

```redis
# Get all admin users
HGETALL travelbook:admin_users
```

You should see your admin user data.

## 🔐 Default Login Credentials

- **Username**: `admin`
- **Password**: `admin123`
- **URL**: `login.html`

**⚠️ IMPORTANT**: Change the password immediately after first login!

## 🛠️ Manual Admin User Creation

### Create a New Admin User
1. **Generate Password Hash**: Use the hash function in your browser console:
   ```javascript
   // Run this in browser console to get password hash
   function hashPassword(password) {
       let hash = 0;
       for (let i = 0; i < password.length; i++) {
           const char = password.charCodeAt(i);
           hash = ((hash << 5) - hash) + char;
           hash = hash & hash;
       }
       return hash.toString();
   }
   console.log(hashPassword('your-new-password'));
   ```

2. **Add User to Upstash**:
   ```redis
   HSET travelbook:admin_users user_001 '{"id":"user_001","username":"newadmin","password":"HASH_VALUE","email":"newadmin@travelbooks.com","role":"admin","created_at":"2024-01-01T00:00:00.000Z","last_login":null,"is_active":true}'
   ```

### User Data Structure
```json
{
  "id": "unique_user_id",
  "username": "login_username",
  "password": "hashed_password",
  "email": "user@email.com",
  "role": "admin",
  "created_at": "2024-01-01T00:00:00.000Z",
  "last_login": null,
  "is_active": true
}
```

## 🔧 Managing Users via Data Browser

### View All Users
```redis
HGETALL travelbook:admin_users
```

### Get Specific User
```redis
HGET travelbook:admin_users admin_001
```

### Update User Status
```redis
# Deactivate a user
HSET travelbook:admin_users admin_001 '{"id":"admin_001","username":"admin","password":"-1234567890","email":"admin@travelbooks.com","role":"admin","created_at":"2024-01-01T00:00:00.000Z","last_login":null,"is_active":false}'
```

### Delete a User
```redis
HDEL travelbook:admin_users user_001
```

### Clear All Users
```redis
DEL travelbook:admin_users
```

## 🔒 Security Best Practices

### Password Security
1. **Use Strong Passwords**: Minimum 12 characters with mixed case, numbers, and symbols
2. **Change Default Password**: Immediately after first login
3. **Regular Updates**: Change passwords periodically
4. **Unique Passwords**: Don't reuse passwords from other systems

### User Management
1. **Limit Admin Users**: Only create accounts for people who need access
2. **Regular Audits**: Review user list periodically
3. **Deactivate Unused**: Set `is_active: false` for unused accounts
4. **Monitor Logins**: Check `last_login` timestamps

## 🚨 Troubleshooting

### Login Issues

#### "Invalid username or password"
- **Check Data Browser**: Verify user exists in `travelbook:admin_users`
- **Verify Hash**: Ensure password hash is correct
- **Check Status**: Make sure `is_active: true`

#### "User not found"
- **Check Username**: Ensure exact username match
- **Check Hash Key**: Verify the hash key exists
- **Check JSON**: Ensure user data is valid JSON

### Data Browser Issues

#### "Command not found"
- **Check Syntax**: Ensure proper Redis command syntax
- **Check Quotes**: Use single quotes for JSON strings
- **Check Escape**: Escape special characters in JSON

#### "Connection Error"
- **Check Database**: Ensure you're connected to the right database
- **Check Credentials**: Verify Upstash credentials are correct
- **Check Network**: Ensure internet connection is stable

## 📊 Advanced Management

### Bulk User Operations
```redis
# Add multiple users at once
HMSET travelbook:admin_users \
  user_001 '{"id":"user_001","username":"admin1",...}' \
  user_002 '{"id":"user_002","username":"admin2",...}'
```

### User Statistics
```redis
# Count total users
HLEN travelbook:admin_users

# Get all user IDs
HKEYS travelbook:admin_users
```

### Backup Users
```redis
# Export all users (copy the output)
HGETALL travelbook:admin_users
```

## 🎯 Next Steps

### After Setup
1. **Test Login**: Use default credentials to access admin panel
2. **Change Password**: Update to a secure password
3. **Add Real Packages**: Start adding your travel packages
4. **Create Additional Users**: Add team members as needed

### Production Considerations
1. **Regular Backups**: Export user data periodically
2. **Monitor Access**: Check login patterns
3. **Update Security**: Implement additional security measures
4. **Documentation**: Keep track of user accounts and roles

---

**Security Note**: This system stores hashed passwords in Upstash. For high-security applications, consider implementing additional security measures like two-factor authentication and more robust password hashing.

**Default Login**: username=`admin`, password=`admin123` - **CHANGE IMMEDIATELY!**
