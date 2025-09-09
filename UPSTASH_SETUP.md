# Upstash Setup Guide for TravelBook

This guide will help you set up Upstash Redis database for your TravelBook travel agency website.

## 🚀 Quick Setup

### 1. Create Upstash Account
1. Go to [Upstash Console](https://console.upstash.com/)
2. Sign up for a free account
3. Create a new Redis database

### 2. Get Your Credentials
1. In your Upstash dashboard, select your database
2. Go to the "Details" tab
3. Copy the following:
   - **REST URL**: `https://your-endpoint.upstash.io`
   - **REST Token**: `your-upstash-token`

### 3. Configure Your Website
1. Open `assets/js/upstash-config.js`
2. Replace the placeholder values:

```javascript
const UPSTASH_CONFIG = {
    // Replace with your actual Upstash Redis REST API URL
    url: 'https://your-actual-endpoint.upstash.io',
    
    // Replace with your actual Upstash Redis REST API Token
    token: 'your-actual-upstash-token',
    
    // ... rest of the config stays the same
};
```

### 4. Test Your Setup
1. Open your website in a browser
2. Open the browser's Developer Tools (F12)
3. Go to the Console tab
4. Look for "Upstash integration initialized successfully!" message
5. If you see connection errors, double-check your credentials

## 📊 Admin Panel

### Access Admin Panel
1. Navigate to `admin.html` in your browser
2. You'll see the package management interface
3. Click "Initialize Sample Packages" to add demo data

### Admin Features
- ✅ **View Statistics**: Total, active, and inactive packages
- ✅ **Add Packages**: Create new travel packages
- ✅ **Edit Packages**: Modify existing packages
- ✅ **Toggle Status**: Activate/deactivate packages
- ✅ **Delete Packages**: Remove packages permanently
- ✅ **Export Data**: Download packages as JSON
- ✅ **Sample Data**: Initialize with demo packages

## 🔧 Package Management

### Adding a New Package
1. Click "Add New Package" button
2. Fill in the required fields:
   - **Title**: Package name (e.g., "European Adventure")
   - **Description**: Detailed description
   - **Price**: Package cost in USD
   - **Image URL**: Link to package image
   - **Destination**: Travel destination
3. Optional fields:
   - **Duration**: Trip length (e.g., "7 days")
   - **Rating**: Customer rating (1-5)
   - **Badge**: Special label (e.g., "Best Seller")
   - **Badge Color**: Color for the badge
4. Click "Save Package"

### Package Fields Explained
- **Title**: Display name of the package
- **Description**: Marketing description shown to customers
- **Price**: Cost per person in the specified currency
- **Currency**: USD, EUR, GBP, or CAD
- **Image URL**: Must be a direct link to an image file
- **Destination**: Country or region name
- **Duration**: How long the trip lasts
- **Rating**: Customer satisfaction rating (0-5)
- **Badge**: Special promotional label
- **Badge Color**: Visual styling for the badge
- **Active**: Whether the package is visible to customers

## 🖼️ Image Requirements

### Recommended Image Specifications
- **Format**: JPG, PNG, or WebP
- **Size**: 1200x800 pixels or similar aspect ratio
- **File Size**: Under 2MB for fast loading
- **Source**: Use reliable image hosting (Unsplash, your own server, etc.)

### Free Image Sources
- [Unsplash](https://unsplash.com/) - High-quality travel photos
- [Pexels](https://www.pexels.com/) - Free stock photos
- [Pixabay](https://pixabay.com/) - Free images and videos

## 🔒 Security Notes

### Important Security Considerations
1. **Never commit your Upstash credentials to version control**
2. **Use environment variables in production**
3. **Consider implementing authentication for the admin panel**
4. **Regularly backup your package data**

### Production Deployment
For production deployment, consider:
1. Moving credentials to environment variables
2. Adding authentication to the admin panel
3. Implementing rate limiting
4. Setting up monitoring and alerts

## 🚨 Troubleshooting

### Common Issues

#### "Upstash not configured" Error
- **Cause**: Credentials not set in `upstash-config.js`
- **Solution**: Update the URL and token with your actual Upstash credentials

#### "Upstash connection failed" Error
- **Cause**: Invalid credentials or network issues
- **Solution**: 
  1. Verify your credentials are correct
  2. Check your internet connection
  3. Ensure your Upstash database is active

#### Packages Not Loading
- **Cause**: No packages in database or connection issues
- **Solution**:
  1. Check browser console for errors
  2. Try initializing sample packages
  3. Verify Upstash database is accessible

#### Admin Panel Not Working
- **Cause**: JavaScript errors or missing files
- **Solution**:
  1. Check browser console for errors
  2. Ensure all JavaScript files are loaded
  3. Verify file paths are correct

### Getting Help
1. Check the browser console for error messages
2. Verify your Upstash credentials
3. Test with sample packages first
4. Check the Upstash documentation for API issues

## 📈 Upstash Limits

### Free Tier Limits
- **10,000 requests per day**
- **256MB storage**
- **Global edge locations**

### Monitoring Usage
1. Check your Upstash dashboard for usage statistics
2. Monitor request counts and storage usage
3. Upgrade to paid plan if needed

## 🎯 Next Steps

### After Setup
1. **Add Your Real Packages**: Replace sample data with your actual travel packages
2. **Customize Design**: Modify colors, fonts, and layout to match your brand
3. **Add More Features**: Consider adding booking forms, customer reviews, etc.
4. **Deploy**: Host your website on GitHub Pages, Netlify, or your preferred platform

### Advanced Features
- **Search Functionality**: Add package search and filtering
- **Booking System**: Integrate with payment processors
- **Customer Reviews**: Allow customers to rate and review packages
- **Email Notifications**: Send booking confirmations
- **Analytics**: Track package views and bookings

---

**Need Help?** Check the browser console for error messages and ensure your Upstash credentials are correctly configured in `assets/js/upstash-config.js`.
