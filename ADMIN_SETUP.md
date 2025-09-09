# Admin Login System Setup Guide

This guide will help you set up the secure admin login system for your TravelBook travel agency website.

## 🔐 Default Login Credentials

**IMPORTANT**: Change these credentials immediately after first login!

- **Username**: `admin`
- **Password**: `admin123`
- **URL**: `login.html`

## 🚀 Quick Start

### 1. Access Admin Panel
1. Open `login.html` in your browser
2. Use the default credentials above
3. You'll be redirected to the admin panel

### 2. Change Default Password
1. After logging in, click "Users" in the admin navigation
2. Click "Change My Password"
3. Enter current password: `admin123`
4. Enter your new secure password
5. Confirm the new password

### 3. Add Real Packages
1. In the admin panel, click "Add New Package"
2. Fill in your real travel package details
3. Save to add to your website

## 🛡️ Security Features

### Authentication System
- ✅ **Secure Login**: Username/password authentication
- ✅ **Session Management**: 24-hour session duration
- ✅ **Account Lockout**: 5 failed attempts = 15-minute lockout
- ✅ **Password Hashing**: Passwords are hashed before storage
- ✅ **Remember Me**: Optional extended session

### User Management
- ✅ **Multiple Users**: Create additional admin accounts
- ✅ **Role-Based Access**: Admin and Editor roles
- ✅ **User Status**: Activate/deactivate users
- ✅ **Password Changes**: Secure password updates
- ✅ **Login History**: Track user activity

### Data Protection
- ✅ **Local Storage**: All data stored locally in browser
- ✅ **Session Expiry**: Automatic logout after inactivity
- ✅ **Secure Logout**: Complete session cleanup
- ✅ **Access Control**: Protected admin routes

## 📁 File Structure

```
travelbook/
├── login.html              # Admin login page
├── admin.html              # Package management (protected)
├── users.html              # User management (protected)
├── assets/js/
│   ├── auth.js             # Authentication system
│   ├── login.js            # Login page functionality
│   ├── admin.js            # Admin panel functionality
│   ├── users.js            # User management functionality
│   ├── upstash-config.js   # Database configuration
│   └── package-manager.js  # Package CRUD operations
└── assets/css/
    └── style.css           # Custom styles
```

## 🔧 Admin Panel Features

### Package Management (`admin.html`)
- **Dashboard**: Package statistics and overview
- **Add Packages**: Create new travel packages
- **Edit Packages**: Modify existing packages
- **Delete Packages**: Remove packages permanently
- **Toggle Status**: Show/hide packages on website
- **Export Data**: Download packages as JSON
- **Sample Data**: Initialize with demo packages

### User Management (`users.html`)
- **View Users**: List all admin users
- **Add Users**: Create new admin accounts
- **Change Passwords**: Update user passwords
- **Toggle Status**: Activate/deactivate users
- **User Roles**: Admin and Editor permissions

## 👥 User Roles

### Admin Role
- Full access to all features
- Can manage packages
- Can manage users
- Can change passwords
- Can export data

### Editor Role
- Can manage packages
- Cannot manage users
- Cannot export data
- Limited admin functions

## 🔒 Security Best Practices

### Password Requirements
- Minimum 6 characters (recommended: 12+)
- Use uppercase and lowercase letters
- Include numbers and special characters
- Avoid common words or patterns
- Don't reuse passwords from other sites

### Account Security
- Change default password immediately
- Use unique passwords for each user
- Regularly update passwords
- Monitor login activity
- Deactivate unused accounts

### System Security
- Keep browser updated
- Use HTTPS in production
- Regular backups of package data
- Monitor for suspicious activity
- Implement additional security as needed

## 🚨 Troubleshooting

### Login Issues

#### "Invalid username or password"
- **Cause**: Wrong credentials or account locked
- **Solution**: 
  1. Check username and password
  2. Wait 15 minutes if account is locked
  3. Use default credentials if first time

#### "Account is temporarily locked"
- **Cause**: Too many failed login attempts
- **Solution**: Wait 15 minutes before trying again

#### "Session expired"
- **Cause**: Session timeout or browser restart
- **Solution**: Login again with your credentials

### Admin Panel Issues

#### "Access denied" or redirect to login
- **Cause**: Not logged in or session expired
- **Solution**: Login through `login.html`

#### Packages not loading
- **Cause**: Upstash not configured or connection issues
- **Solution**: 
  1. Check Upstash configuration
  2. Verify internet connection
  3. Check browser console for errors

#### User management not working
- **Cause**: JavaScript errors or missing files
- **Solution**:
  1. Check browser console for errors
  2. Ensure all files are loaded
  3. Try refreshing the page

## 🔄 Data Management

### Backup Your Data
1. **Export Packages**: Use "Export Packages" button in admin panel
2. **Save User Data**: User data is stored in browser localStorage
3. **Regular Backups**: Export data regularly for safety

### Restore Data
1. **Import Packages**: Use the exported JSON file
2. **User Data**: Will be restored when users login again
3. **Sample Data**: Use "Initialize Sample Packages" for testing

## 🌐 Production Deployment

### Security Considerations
1. **HTTPS**: Always use HTTPS in production
2. **Strong Passwords**: Enforce strong password policies
3. **Regular Updates**: Keep system updated
4. **Monitoring**: Monitor for security issues
5. **Backups**: Regular data backups

### Additional Security (Optional)
1. **Two-Factor Authentication**: Add 2FA for extra security
2. **IP Restrictions**: Limit admin access by IP
3. **Rate Limiting**: Implement request rate limiting
4. **Audit Logs**: Track all admin actions
5. **Database Encryption**: Encrypt sensitive data

## 📞 Support

### Getting Help
1. **Check Console**: Look for JavaScript errors in browser console
2. **Verify Files**: Ensure all files are present and accessible
3. **Test Credentials**: Try default login credentials
4. **Clear Cache**: Clear browser cache and try again

### Common Solutions
- **Refresh Page**: Often fixes temporary issues
- **Clear localStorage**: Reset all stored data
- **Check Network**: Ensure internet connection is working
- **Update Browser**: Use latest browser version

## 🎯 Next Steps

### After Setup
1. **Change Default Password**: Use strong, unique password
2. **Add Real Packages**: Replace sample data with your packages
3. **Create Additional Users**: Add team members as needed
4. **Test All Features**: Ensure everything works correctly
5. **Backup Data**: Export your packages for safety

### Advanced Features
- **Custom Branding**: Modify colors and logos
- **Additional Fields**: Add more package information
- **Booking System**: Integrate with payment processors
- **Email Notifications**: Send booking confirmations
- **Analytics**: Track package views and bookings

---

**Security Note**: This system uses client-side authentication for simplicity. For high-security applications, consider implementing server-side authentication with proper encryption and security measures.

**Default Login**: username=`admin`, password=`admin123` - **CHANGE IMMEDIATELY!**
