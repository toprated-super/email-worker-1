# Email Worker

A Node.js application for sending emails via Gmail using OAuth2 authentication. This tool distributes emails across multiple sender accounts and sends them in batches with randomized delays to avoid spam detection.

## Features

- Multiple sender support with OAuth2 authentication
- Automatic receiver distribution across senders
- Concurrent email sending in batches
- Randomized delays between batches (4 hours ± 30 minutes)
- Multiple email content variations to avoid spam detection

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Gmail account(s) for sending emails
- Google Cloud Platform account

## Installation

1. Clone the repository:
```bash
git clone https://github.com/jagelous/email-worker.git
cd email-worker
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory (see Configuration section)

## Getting Google OAuth2 Credentials

To send emails via Gmail, you need to obtain OAuth2 credentials (Client ID, Client Secret, and Refresh Token) for each sender account. Follow these steps:

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click **"New Project"**
4. Enter a project name (e.g., "Email Worker")
5. Click **"Create"**
6. Wait for the project to be created and select it

### Step 2: Enable Gmail API

1. In the Google Cloud Console, go to **"APIs & Services"** > **"Library"**
2. Search for **"Gmail API"**
3. Click on **"Gmail API"**
4. Click **"Enable"**
5. Wait for the API to be enabled

### Step 3: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"**
4. If prompted, configure the OAuth consent screen first:
   - Choose **"External"** (unless you have a Google Workspace account)
   - Click **"Create"**
   - Fill in the required information:
     - **App name**: Your app name (e.g., "Email Worker")
     - **User support email**: Your email address
     - **Developer contact information**: Your email address
   - Click **"Save and Continue"**
   - On the **"Scopes"** page, click **"Save and Continue"**
   - On the **"Test users"** page, add your Gmail account(s) that will be used for sending
   - Click **"Save and Continue"**
   - Review and click **"Back to Dashboard"**

5. Now create the OAuth client ID:
   - **Application type**: Select **"Web application"**
   - **Name**: Enter a name (e.g., "Email Worker Client")
   - **Authorized redirect URIs**: Add `https://developers.google.com/oauthplayground`
   - Click **"Create"**
   - A popup will appear with your **Client ID** and **Client Secret**
   - **Copy both values** and save them securely (you'll need them for the `.env` file)

### Step 4: Get Refresh Token using OAuth 2.0 Playground

1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click the **gear icon** (⚙️) in the top right corner
3. Check **"Use your own OAuth credentials"**
4. Enter your **Client ID** and **Client Secret** from Step 3
5. Click **"Close"**

6. In the left panel, find **"Gmail API v1"** and expand it
7. Select the following scopes:
   - `https://mail.google.com/` (or `https://www.googleapis.com/auth/gmail.send`)
8. Click **"Authorize APIs"**
9. Sign in with the Gmail account you want to use for sending emails
10. Click **"Allow"** to grant permissions
11. You'll be redirected back to the playground
12. Click **"Exchange authorization code for tokens"**
13. You'll see a JSON response containing:
    - `access_token`: Temporary token (expires in 1 hour)
    - `refresh_token`: **This is what you need!** Copy this value
    - `expires_in`: Token expiration time

14. **Save the refresh_token** - you'll need it for the `.env` file

### Step 5: Repeat for Each Sender Account

Repeat Steps 3 and 4 for each Gmail account you want to use as a sender. Each account needs:
- Its own OAuth client ID and secret (you can reuse the same OAuth client or create separate ones)
- Its own refresh token

**Note**: If you're using the same OAuth client for multiple accounts, you can reuse the Client ID and Client Secret, but each account needs its own refresh token.

## Configuration

### 1. Create `.env` File

Create a `.env` file in the root directory with the following structure:

```env
# Sender 1 (a@gmail.com)
GOOGLE_CLIENT_ID_1=your-client-id-here
GOOGLE_CLIENT_SECRET_1=your-client-secret-here
GOOGLE_REFRESH_TOKEN_1=your-refresh-token-here

# Sender 2 (b@gmail.com)
GOOGLE_CLIENT_ID_2=your-client-id-here
GOOGLE_CLIENT_SECRET_2=your-client-secret-here
GOOGLE_REFRESH_TOKEN_2=your-refresh-token-here

# Sender 3 (c@gmail.com)
GOOGLE_CLIENT_ID_3=your-client-id-here
GOOGLE_CLIENT_SECRET_3=your-client-secret-here
GOOGLE_REFRESH_TOKEN_3=your-refresh-token-here

# Sender 4 (d@gmail.com)
GOOGLE_CLIENT_ID_4=your-client-id-here
GOOGLE_CLIENT_SECRET_4=your-client-secret-here
GOOGLE_REFRESH_TOKEN_4=your-refresh-token-here

# Sender 5 (e@gmail.com)
GOOGLE_CLIENT_ID_5=your-client-id-here
GOOGLE_CLIENT_SECRET_5=your-client-secret-here
GOOGLE_REFRESH_TOKEN_5=your-refresh-token-here

# Sender 6 (f@gmail.com)
GOOGLE_CLIENT_ID_6=your-client-id-here
GOOGLE_CLIENT_SECRET_6=your-client-secret-here
GOOGLE_REFRESH_TOKEN_6=your-refresh-token-here
```

Replace the placeholder values with your actual credentials.

### 2. Configure Senders

Edit `senders.txt` and add one Gmail address per line:

```
abc@gmail.com
cde@gmail.com
```

The order matters! The first email corresponds to `GOOGLE_CLIENT_ID_1`, the second to `GOOGLE_CLIENT_ID_2`, etc.

### 3. Configure Receivers

Edit `receivers.txt` and add one email address per line:

```
receiver1@example.com
receiver2@example.com
receiver3@example.com
...
```

## How It Works

### Email Distribution

Receivers are distributed to senders using a round-robin approach:
- Receiver 1, 7, 13, 19... → Sender 1
- Receiver 2, 8, 14, 20... → Sender 2
- Receiver 3, 9, 15, 21... → Sender 3
- And so on...

### Batch Sending

- Emails are sent in batches of 6 (one per sender)
- All 6 emails in a batch are sent concurrently
- After each batch, the script waits 4 hours ± 30 minutes (randomized) before sending the next batch

### Content Variations

Each email uses one of 5 different content variations to avoid spam detection, while maintaining the same message and intent.

## Usage

Run the email sending process:

```bash
npm start
```

Or directly:

```bash
node index.js
```

The script will:
1. Load senders and receivers from their respective files
2. Display the email distribution
3. Send emails in batches with randomized delays
4. Show progress and completion status

## Troubleshooting

### "Missing OAuth credentials" Error

- Make sure your `.env` file exists and contains all required credentials
- Verify that the sender index in `senders.txt` matches the environment variable numbers (1, 2, 3, etc.)
- Check that there are no extra spaces or quotes around the credential values

### "Invalid refresh token" Error

- The refresh token may have been revoked
- Generate a new refresh token using OAuth 2.0 Playground (Step 4)
- Make sure you're using the correct Gmail account

### "Access denied" or "Insufficient permissions" Error

- Make sure you've enabled Gmail API in Google Cloud Console
- Verify that you've selected the correct scopes (`https://mail.google.com/` or `https://www.googleapis.com/auth/gmail.send`)
- Check that the Gmail account is added as a test user in the OAuth consent screen

### Rate Limiting

- Gmail has sending limits (typically 500 emails per day for regular accounts)
- The script includes delays to avoid hitting rate limits
- If you hit rate limits, wait 24 hours before resuming

## Security Notes

- **Never commit** your `.env` file to version control
- Keep your OAuth credentials secure
- The `.env` file is already in `.gitignore`
- Refresh tokens don't expire unless revoked, but keep them secure

## License

ISC
