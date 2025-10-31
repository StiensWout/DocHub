# Testing API in Postman

## Step 1: Get Your Session Cookie

### In Browser:
1. Log in to your app at `http://localhost:3000`
2. Open Developer Tools (F12)
3. Go to **Application** tab → **Cookies** → `http://localhost:3000`
4. Find `wos-session` cookie and copy the **Value**

OR run this in browser console:
```javascript
document.cookie.split('; ').find(row => row.startsWith('wos-session='))
```

## Step 2: Setup Postman Request

### Option A: Use Cookie Header
1. Create new request: `POST http://localhost:3000/api/users/sync?full=true`
2. Go to **Headers** tab
3. Add header:
   - Key: `Cookie`
   - Value: `wos-session=YOUR_COOKIE_VALUE_HERE`

### Option B: Use Postman Cookie Manager
1. Click **Cookies** link (under Send button)
2. Add cookie:
   - Domain: `localhost`
   - Cookie Name: `wos-session`
   - Cookie Value: (paste your cookie value)
3. Save

## Step 3: Test Endpoints

### Test Authentication
```
GET http://localhost:3000/api/debug/admin-status
```

### Sync All Users (Admin Only)
```
POST http://localhost:3000/api/users/sync?full=true
```

### Sync Single User
```
POST http://localhost:3000/api/users/sync?userId=prof_xxxxx
```

### Get User Settings
```
GET http://localhost:3000/api/users/settings?userId=prof_xxxxx
```

### Update User Settings
```
POST http://localhost:3000/api/users/settings
Body (JSON):
{
  "userId": "prof_xxxxx",
  "settings": {
    "theme": "dark",
    "notifications": true
  }
}
```

## Troubleshooting

**401 Unauthorized**: Cookie is missing or invalid
- Make sure you're logged in the browser
- Check cookie hasn't expired
- Copy the entire cookie value (it's usually long)

**403 Forbidden**: Not an admin
- Check your admin status: `GET /api/debug/admin-status`
- Make sure you're in the "admin" organization in WorkOS

**Cookie expired**: Log in again in browser and get new cookie

