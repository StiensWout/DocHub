# WorkOS Integration - Next Steps

**Last Updated**: 2025-01-30  
**Status**: Phase 1 Complete, Email Verification Complete

---

## ✅ Completed

### Phase 1: Core Authentication Setup
- ✅ WorkOS SDK integration
- ✅ Environment variables configured
- ✅ Server and client utilities created
- ✅ Session management implemented

### Phase 2: Email/Password Authentication
- ✅ Sign-up page with form validation
- ✅ Sign-in page with form validation
- ✅ API routes for sign-up and sign-in
- ✅ Email verification with 6-digit codes
- ✅ Inline code verification on sign-up page
- ✅ Session cookies and security

### Bug Fixes
- ✅ Fixed email verification method (use `authenticateWithEmailVerification` with `code` parameter)
- ✅ Fixed runtime error when navigating between auth pages
- ✅ Fixed hydration errors on main page

---

## 🚧 Next Steps - Priority Order

### 1. **Configure Social OAuth Providers** (High Priority)
**Status**: UI Ready, Needs WorkOS Dashboard Configuration

The OAuth buttons are already implemented on the sign-in page, but they need to be configured in the WorkOS Dashboard.

**Steps**:
1. Go to WorkOS Dashboard → User Management → Social Providers
2. Configure Google OAuth:
   - Enable Google provider
   - Add OAuth client ID and secret from Google Cloud Console
   - Set redirect URI: `http://localhost:3000/auth/callback` (dev) and production URL
3. Configure GitHub OAuth:
   - Enable GitHub provider
   - Add OAuth client ID and secret from GitHub Settings
   - Set redirect URI: `http://localhost:3000/auth/callback` (dev) and production URL
4. Test social login flows

**Estimated Time**: 1-2 hours

**Files Already Created**:
- `app/auth/signin/page.tsx` - OAuth buttons ready
- `app/api/auth/callback/route.ts` - OAuth callback handler ready

---

### 2. **Implement Magic Link Authentication** (Medium Priority)
**Status**: Not Started

Magic Link allows users to sign in without a password by clicking a link sent to their email.

**Implementation Steps**:
1. Create magic link sign-in page (`app/auth/magic-link/page.tsx`):
   - Email input field
   - "Send Magic Link" button
   - Success message after sending
   - Link to regular sign-in page

2. Create magic link API route (`app/api/auth/magic-link/route.ts`):
   ```typescript
   POST /api/auth/magic-link
   Body: { email: string }
   ```
   - Use `workos.userManagement.sendMagicAuthCode()` to send magic link
   - Return success/error response

3. Handle magic link callback:
   - Magic links typically redirect to a callback URL with a token
   - Use `workos.userManagement.authenticateWithMagicAuth()` to verify token
   - Create session and redirect to home

4. Update sign-in page:
   - Add "Sign in with Magic Link" button/link

**API Methods Needed**:
- `workos.userManagement.sendMagicAuthCode()`
- `workos.userManagement.authenticateWithMagicAuth()`

**Reference**: [Magic Auth Documentation](https://workos.com/docs/authkit/magic-auth)

**Estimated Time**: 3-4 hours

---

### 3. **Implement Password Reset Flow** (Medium Priority)
**Status**: Not Started

Allow users to reset forgotten passwords via email.

**Implementation Steps**:
1. Create forgot password page (`app/auth/forgot-password/page.tsx`):
   - Email input field
   - "Send Reset Link" button
   - Success/error messages

2. Create password reset page (`app/auth/reset-password/page.tsx`):
   - Token from URL parameter
   - New password input (with confirmation)
   - Submit button

3. Create API routes:
   - `POST /api/auth/forgot-password`:
     - Use `workos.userManagement.sendPasswordResetEmail()` or similar
     - Send password reset email
   
   - `POST /api/auth/reset-password`:
     - Verify reset token
     - Update password using WorkOS API
     - Return success/error

4. Update sign-in page:
   - Add "Forgot Password?" link

**API Methods Needed**:
- `workos.userManagement.sendPasswordResetEmail()`
- `workos.userManagement.resetPassword()` or similar

**Reference**: Check WorkOS documentation for password reset methods

**Estimated Time**: 3-4 hours

---

### 4. **Test & Polish** (High Priority)
**Status**: Partially Complete

**Testing Checklist**:
- [x] Test email/password sign-up
- [x] Test email verification
- [x] Test email/password sign-in
- [ ] Test social OAuth (after configuration)
- [ ] Test magic link (after implementation)
- [ ] Test password reset (after implementation)
- [ ] Test session persistence across page reloads
- [ ] Test sign-out functionality
- [ ] Test protected route access
- [ ] Test unauthorized access attempts
- [ ] Test error handling for invalid credentials
- [ ] Test error handling for expired verification codes
- [ ] Test edge cases (empty fields, special characters, etc.)

**UI/UX Improvements**:
- [ ] Add loading spinners for all async operations
- [ ] Improve error message display
- [ ] Add password strength indicator
- [ ] Add "Remember me" option (if supported)
- [ ] Add form validation feedback
- [ ] Mobile responsiveness check
- [ ] Accessibility audit

**Estimated Time**: 4-6 hours

---

### 5. **Organization Management** (Future - Low Priority)
**Status**: Not Started

Integrate WorkOS Organizations with existing teams system.

**Considerations**:
- Option A: Keep existing teams, sync with WorkOS Organizations
- Option B: Migrate fully to WorkOS Organizations
- Need to decide on approach before implementation

**Estimated Time**: 8-12 hours (depending on approach)

---

### 6. **Permissions & Roles** (Future - Low Priority)
**Status**: Not Started

Use WorkOS Roles & Permissions to manage user access.

**Considerations**:
- Map existing permission structure to WorkOS roles
- Implement permission checks in middleware
- Update UI to show/hide features based on permissions

**Estimated Time**: 8-12 hours

---

## 📝 Notes

### Environment Variables Required
Make sure these are set in `.env.local`:
- `WORKOS_API_KEY` - Server-side API key (starts with `sk_`)
- `WORKOS_CLIENT_ID` - Public client ID (starts with `client_`)
- `NEXT_PUBLIC_WORKOS_CLIENT_ID` - Same as `WORKOS_CLIENT_ID`
- `NEXT_PUBLIC_WORKOS_REDIRECT_URI` - OAuth callback URL
- `WORKOS_COOKIE_PASSWORD` - For session encryption (32+ character random string)

### WorkOS Dashboard Configuration
- Enable Email/Password authentication
- Enable Magic Link (when implementing)
- Configure social OAuth providers
- Set up email templates (optional customization)
- Configure password requirements

### Known Issues
- None currently

### Documentation References
- [WorkOS AuthKit Documentation](https://workos.com/docs/authkit/index)
- [Email + Password](https://workos.com/docs/authkit/email-password)
- [Magic Auth](https://workos.com/docs/authkit/magic-auth)
- [Social Login](https://workos.com/docs/authkit/social-login)
- [Node.js SDK](https://workos.com/docs/sdks/node)

---

## 🎯 Recommended Order

1. **First**: Configure Social OAuth Providers (quick win, UI already ready)
2. **Second**: Test & Polish existing features (ensure quality)
3. **Third**: Implement Magic Link (popular feature)
4. **Fourth**: Implement Password Reset (important for user experience)
5. **Future**: Organization Management & Permissions (when needed)

