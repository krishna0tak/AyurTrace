# AyurTrace Authentication System

This document explains how to set up and use the integrated Supabase authentication system for AyurTrace.

## Features

- **Integrated Auth UI**: Single page with login/signup tabs (`auth.html`)
- **Supabase Authentication**: Secure authentication using Supabase Auth
- **Role-based Access**: Support for 5 user roles (Farmer, Collector, Auditor, Manufacturer, Distributor)
- **Profile Management**: User profiles stored in custom users table
- **Session Management**: Persistent login sessions with automatic logout

## Setup Instructions

### 1. Supabase Configuration

1. Create a new Supabase project at https://supabase.com
2. Go to your project's SQL Editor
3. Run the SQL schema from `supabase-schema.sql` to create the necessary tables and policies
4. Update `config.js` with your Supabase URL and anon key:

```javascript
window.config = {
    SUPABASE_URL: 'your-supabase-url',
    SUPABASE_ANON_KEY: 'your-supabase-anon-key'
};
```

### 2. Authentication Settings

In your Supabase project settings:

1. Go to Authentication > Settings
2. Set Site URL to your domain (e.g., `http://localhost:8080` for local development)
3. Add redirect URLs if needed
4. Disable email confirmations for testing (optional)

### 3. File Structure

```
ui/
├── index.html              # Main landing page with auth state
├── auth.html              # Integrated login/signup page
├── login.html             # Legacy login page
├── register.html          # Legacy register page
├── config.js              # Supabase configuration
├── supabase-auth.js       # Authentication functions
├── theme.css              # Styling
└── supabase-schema.sql    # Database schema
```

## Usage

### Authentication Flow

1. **Landing Page** (`index.html`):
   - Shows "Login / Signup" button if not authenticated
   - Shows user name and logout button if authenticated
   - Automatically checks authentication state

2. **Authentication Page** (`auth.html`):
   - Tab-based interface for login and signup
   - Real-time form validation
   - Automatic redirect after successful authentication

3. **Role-based Redirects**:
   - Farmer → `farmer.html`
   - Collector → `collector.html`
   - Auditor → `auditor.html`
   - Manufacturer → `manufacturer_dash.html`
   - Distributor → `distributor.html`

### API Functions

Available in `supabase-auth.js`:

```javascript
// Sign up a new user
const { user, error } = await signUp(actorId, password, role, fullName, phone, address);

// Sign in existing user
const user = await signIn(actorId, password, role);

// Get current authenticated user
const user = await getCurrentUser();

// Check if user is authenticated
const isAuth = await isAuthenticated();

// Sign out current user
await signOut();
```

### User Data Structure

```javascript
{
    id: "uuid",
    actorId: "FARM001",
    email: "farm001@ayurtrace.com",
    role: 1,
    name: "John Farmer"
}
```

## Testing

1. Open `auth.html` in your browser
2. Create a new account using the signup tab
3. Login with the created credentials
4. Verify redirect to appropriate dashboard
5. Check that `index.html` shows user info when logged in

## Security Notes

- Passwords are securely hashed by Supabase Auth
- User emails are automatically generated as `{actorId}@ayurtrace.com`
- Row Level Security (RLS) is enabled on the users table
- Sessions are managed by Supabase with automatic token refresh

## Troubleshooting

### Common Issues

1. **"Invalid login credentials"**
   - Check Supabase URL and key in `config.js`
   - Verify user exists in auth.users table
   - Ensure role matches in users table

2. **Database errors**
   - Run the SQL schema from `supabase-schema.sql`
   - Check RLS policies are enabled
   - Verify table permissions

3. **Redirect issues**
   - Check that dashboard HTML files exist
   - Verify role numbers (1-5) are correct
   - Ensure file paths are correct

### Debug Mode

Add this to any page to debug authentication:

```javascript
getCurrentUser().then(user => {
    console.log('Current user:', user);
});
```

## Migration from Old System

If migrating from the old `users_plain` table system:

1. Export existing user data
2. Create new accounts using the signup function
3. Update any hardcoded references to localStorage keys
4. Test all authentication flows

## Development

For local development:
1. Use a local web server (not file:// protocol)
2. Update Supabase site URL to your local server
3. Use browser dev tools to monitor authentication state
4. Check Supabase logs for any database issues
