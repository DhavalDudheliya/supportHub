# External Service Setup Guide

## 1. Google Cloud (Gmail API)

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Name it something like "SupportHub" → Create
4. Select the new project from the dropdown

### Step 2: Enable APIs

1. Go to **APIs & Services → Library**
2. Search for and enable:
   - **Gmail API**
   - **Cloud Pub/Sub API**

### Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services → Credentials**
2. Click **"+ CREATE CREDENTIALS" → "OAuth client ID"**
3. If prompted, configure the **OAuth consent screen** first:
   - User Type: **External** (or Internal if using Google Workspace)
   - App name: "SupportHub"
   - User support email: your email
   - Scopes: Add `https://www.googleapis.com/auth/gmail.readonly` and `https://www.googleapis.com/auth/userinfo.email`
   - Add a test user (your Gmail account email)
4. Back in Credentials, create OAuth client:
   - Application type: **Web application**
   - Name: "SupportHub API"
   - Authorized redirect URIs: `http://localhost:5000/api/v1/email/gmail/callback`
5. Copy the **Client ID** and **Client Secret** → paste into `.env`

### Step 4: Set Up Pub/Sub Topic

1. Go to [Cloud Pub/Sub](https://console.cloud.google.com/cloudpubsub)
2. Click **"CREATE TOPIC"**
3. Topic ID: `gmail-notifications`
4. Full topic name will be: `projects/<your-project-id>/topics/gmail-notifications`
5. Copy this full name → paste into `.env` as `GOOGLE_PUBSUB_TOPIC`

### Step 5: Grant Gmail Publish Permission

1. Go to your Pub/Sub topic → **Permissions** tab
2. Click **"ADD PRINCIPAL"**
3. New principal: `gmail-api-push@system.gserviceaccount.com`
4. Role: **Pub/Sub Publisher**
5. Save

### Step 6: Create a Push Subscription

1. In the Pub/Sub topic, go to **Subscriptions** tab
2. Click **"CREATE SUBSCRIPTION"**
3. Delivery type: **Push**
4. Endpoint URL: Your public webhook URL
   - For local development, use a tunnel like [ngrok](https://ngrok.com): `ngrok http 5000`
   - Push endpoint: `https://<your-ngrok-url>/api/v1/email/webhook/gmail`
5. Acknowledgement deadline: 30 seconds

### Step 7: Update `.env`

```env
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-<your-secret>
GOOGLE_REDIRECT_URI=http://localhost:5000/api/v1/email/gmail/callback
GOOGLE_PUBSUB_TOPIC=projects/<your-project-id>/topics/gmail-notifications
```

---

## 2. Microsoft Azure (Outlook / Microsoft Graph)

### Step 1: Register an Azure Application

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory → App registrations**
   (or search "App registrations" in the top bar)
3. Click **"+ New registration"**
4. Name: "SupportHub"
5. Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
6. Redirect URI:
   - Platform: **Web**
   - URI: `http://localhost:5000/api/v1/email/outlook/callback`
7. Click **Register**
8. Copy the **Application (client) ID** → paste into `.env` as `MICROSOFT_CLIENT_ID`

### Step 2: Create a Client Secret

1. In your app registration, go to **Certificates & secrets**
2. Click **"+ New client secret"**
3. Description: "SupportHub API" → Add
4. Copy the **Value** immediately (it won't be shown again)
5. Paste into `.env` as `MICROSOFT_CLIENT_SECRET`

### Step 3: Configure API Permissions

1. Go to **API permissions**
2. Click **"+ Add a permission"**
3. Select **Microsoft Graph → Delegated permissions**
4. Search and add:
   - `Mail.Read`
   - `offline_access`
   - `User.Read`
5. Click **"Grant admin consent"** if you have admin access

### Step 4: Update `.env`

```env
MICROSOFT_CLIENT_ID=<your-client-id>
MICROSOFT_CLIENT_SECRET=<your-client-secret>
MICROSOFT_REDIRECT_URI=http://localhost:5000/api/v1/email/outlook/callback
MICROSOFT_TENANT_ID=common
```

---

## 3. Generate Encryption Key

Run this in your terminal to generate a 32-byte hex key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output → paste into `.env` as `ENCRYPTION_KEY`.

---

## 4. Local Development with ngrok

For testing webhooks locally, you need a public URL that tunnels to localhost.

```bash
# Install ngrok (follow instructions at https://ngrok.com/download for your OS)
# Examples:
# macOS: brew install ngrok/ngrok/ngrok
# Linux: curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list && sudo apt update && sudo apt install ngrok
# Windows: choco install ngrok

# Start tunnel
ngrok http 5000
```

Take the HTTPS forwarding URL (e.g., `https://abc123.ngrok.io`) and use it:

- **Gmail Pub/Sub**: Update the push subscription endpoint
- **Outlook Graph**: The subscription webhook URL will be `${APP_URL}/api/v1/email/webhook/outlook`
  - Update `APP_URL` in `.env` to the ngrok URL when testing

---

## 5. Start Redis (Docker)

```bash
# From the project root
docker compose up -d
```

Verify Redis is running:

```bash
docker compose ps
```
