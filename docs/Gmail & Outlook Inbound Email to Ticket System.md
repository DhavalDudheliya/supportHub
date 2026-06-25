# Complete Approach: Gmail & Outlook Inbound Email to Ticket System

---

## The Core Idea

Your CRM app becomes a silent, invisible email listener for every user who connects their account. The moment a user authenticates their Gmail or Outlook account through your app, your system registers itself with Google or Microsoft and starts receiving real-time notifications for every new email that arrives in that inbox. No forwarding rules, no manual configuration, no ongoing effort from the user. It just works — forever.

---

## Section 1 — User Onboarding: Connecting an Email Account

### The UI

When a user navigates to the email settings section of your CRM, they see exactly two options — a **Connect Gmail** button and a **Connect Outlook** button. There is no other option. The UI makes it clear that only these two providers are supported, so expectations are set from the start.

### What Happens When They Click Connect Gmail

Clicking the button redirects the user to Google's own OAuth consent screen — the standard, familiar "Sign in with Google" interface that billions of people recognize. The user selects which Google account they want to connect, reviews the permissions your app is requesting (specifically the ability to read their emails), and clicks Allow. Google then redirects them back to your app.

In that redirect, Google includes a short-lived authorization code. Your backend immediately exchanges this code with Google's servers for two tokens — an access token that lets your app call the Gmail API right now, and a refresh token that lets your app silently generate new access tokens indefinitely into the future without ever asking the user to log in again.

Both tokens are immediately encrypted using strong encryption before being written to your database. They are stored against that user's workspace record so your system always knows which tokens belong to which workspace.

### What Happens When They Click Connect Outlook

The flow is nearly identical. The user is redirected to Microsoft's OAuth consent screen, selects their Outlook or Microsoft 365 account, grants permission, and is redirected back. Your backend receives an authorization code, exchanges it for an access token and a refresh token, encrypts both, and stores them against that user's workspace.

From the user's perspective, both flows feel exactly the same — a familiar login screen, one click, and they are back in your app with their email connected.

### What Happens Immediately After Connection

The moment the tokens are stored, your backend performs one critical silent action — it registers a **real-time notification listener** on that user's mailbox. For Gmail this is called a Watch. For Outlook this is called a Subscription. This registration is what tells Google or Microsoft — "whenever a new email arrives in this inbox, immediately notify my server." The user never sees this happening. It completes in the background within seconds of them connecting their account.

---

## Section 2 — How Real-Time Notifications Work

### Gmail — Google Pub/Sub

Google delivers Gmail notifications through a service called **Google Pub/Sub**. Think of Pub/Sub as a messaging highway. You set up one single topic on this highway inside your Google Cloud project — this is a one-time setup done by you as the developer, not by your users. Every Gmail account connected to your app sends its notifications into this same single topic.

Google then pushes those notifications from the topic directly to a specific URL on your Express backend — your inbound email webhook endpoint. This push happens within seconds of an email arriving in the user's inbox.

The notification that arrives at your server is intentionally minimal. It contains only two pieces of information — the email address that received the new email, and a reference marker called a historyId that points to where in that mailbox's history the new activity occurred. It does not contain the actual email content. This is by design — it is just a signal saying "something new arrived here, go fetch it."

Your server receives this signal, identifies which workspace that email address belongs to by looking it up in your database, and then makes a direct call to the Gmail API using that workspace's stored access token to fetch the actual email content.

### Outlook — Microsoft Graph Webhooks

Microsoft's mechanism is conceptually identical but uses different terminology. When your app registers a Subscription on an Outlook mailbox, Microsoft sends a push notification directly to your webhook endpoint the moment a new email arrives. The notification similarly contains just enough information to identify the mailbox and the change, and your server then calls the Microsoft Graph API with the stored access token to fetch the full email content.

Both Gmail and Outlook notifications arrive at the same Express backend. From that point forward, both are handled by the exact same unified processing pipeline.

---

## Section 3 — The Email Processing Pipeline

Every inbound email notification — whether from Gmail or Outlook — flows through the same sequence of steps inside your backend.

### Step 1 — Immediate Acknowledgement

The very first thing your webhook endpoint does when it receives a notification is send back a success response to Google or Microsoft. This happens before any processing begins. This is important because both Google and Microsoft expect an extremely fast response from your server. If your server takes too long because it is busy processing the email, they will assume something went wrong and start retrying — which causes duplicate processing and headaches. By responding instantly and doing the actual work separately, you avoid this entirely.

### Step 2 — Queuing the Job

Immediately after acknowledging the notification, your server places a background job into a **job queue**. This queue is a reliable list of pending tasks managed by a tool called BullMQ, which runs on top of Redis. The job contains just enough information to identify which account received an email and where to find it. The actual email fetching and ticket creation happens inside this queue, not inside the webhook handler.

The queue gives you several important guarantees — if your server crashes midway through processing, the job is not lost and will be retried automatically. If a flood of emails arrives simultaneously, they are processed in an orderly sequence rather than overwhelming your database with concurrent writes. The queue is the safety net for the entire system.

### Step 3 — Fetching the Full Email

A background worker picks up the job from the queue and makes an API call to either Gmail or Microsoft Graph — depending on the provider — using the workspace's stored and decrypted access token to retrieve the complete email. This includes the sender's name and email address, the subject line, the full body in both plain text and HTML, any attachments, and the email's technical headers which contain important threading information.

### Step 4 — Deduplication Check

Before doing anything else with the email, the worker checks whether this exact email has already been processed. Every email in existence has a globally unique identifier called a **Message-ID** embedded in its headers. Your system stores this identifier whenever it creates a ticket or adds a reply. If the same Message-ID shows up again — which can happen due to retries or duplicate notifications from Google or Microsoft — the worker immediately discards it and stops. This ensures the same email never creates two tickets.

### Step 5 — Thread Detection

The worker then determines whether this email is a brand new conversation or a reply to an existing one. Email clients automatically embed threading information in the headers of every reply — specifically references to the Message-IDs of previous emails in the conversation. Your system reads these headers and checks whether any of the referenced Message-IDs match tickets already existing in that workspace.

If a match is found, this email is a reply to an ongoing conversation and should be added to the existing ticket as a new message, not turned into a fresh ticket. If no match is found, this is a new conversation and a new ticket should be created. This threading logic is what keeps your ticket view clean and conversational rather than creating a new ticket for every single reply in a long email chain.

### Step 6 — Customer Identification

The worker extracts the sender's email address and looks it up in your database within that workspace. If this person has contacted the workspace before, they are matched to their existing customer record and no new record is needed. If this is the first time this email address has ever written in, a new customer record is automatically created using their email address and whatever display name their email client sent along. This all happens silently with no human involvement.

### Step 7 — Ticket or Reply Creation

If thread detection determined this is a new conversation, a new ticket is created in the workspace. The ticket gets the email subject as its title, the email body as its first message, the automatically identified or created customer attached to it, the source marked as email, and the status set to open. Any attachments are stored and linked to the ticket.

If thread detection determined this is a reply, a new message is simply appended to the existing ticket. The ticket itself is also updated — for example its status might move back to open if it had been marked as resolved, signaling that the customer has responded and needs attention again.

### Step 8 — Real-Time Dashboard Update

The moment a ticket is created or updated, your backend emits a real-time event through a WebSocket connection to any support agents currently viewing that workspace's dashboard in the Next.js frontend. The new ticket or new reply appears on their screen instantly without them needing to refresh the page. This makes the experience feel live and immediate for the support team.

---

## Section 4 — Keeping Everything Running Forever

### Token Refresh

Access tokens from both Google and Microsoft expire after approximately one hour. Your system handles this completely automatically. Before making any API call on behalf of a user, your backend checks whether the stored access token is still valid. If it is about to expire or has already expired, it silently uses the stored refresh token to request a fresh access token from Google or Microsoft, stores the new token encrypted in the database, and then proceeds with the API call. The user never experiences any interruption and is never asked to reconnect their account.

### Gmail Watch Renewal

The Gmail Watch registration — the instruction you gave Google to push notifications to your server — expires after exactly 7 days. If it is not renewed, Gmail stops sending notifications and new emails will no longer create tickets. To prevent this, a cron job runs every day and scans your database for any Gmail accounts whose watch is expiring within the next 48 hours. For each one it finds, it silently calls the Gmail API to register a fresh watch, extending the notification pipeline for another 7 days. This runs automatically in the background forever, with no user involvement and no manual maintenance required from your team once it is set up.

### Outlook Subscription Renewal

Microsoft Graph subscriptions similarly expire after a period of time. The same daily cron job handles Outlook renewals alongside Gmail watch renewals, following the same logic — find expiring subscriptions, renew them silently, update the expiry timestamps in the database.

---

## Section 5 — The User's Complete Experience

From the perspective of a user who connects their Gmail account, the entire experience is as follows. They visit the email settings page, click Connect Gmail, see Google's familiar login screen, click Allow, and are returned to your app. A confirmation message tells them their email is connected. That is the entirety of their involvement — ever.

From that moment forward, every email that arrives in their Gmail inbox is silently fetched by your system, processed, threaded, and converted into a support ticket in their workspace. Their support agents see new tickets appear on the dashboard in real time. Replies from customers are added to the correct existing ticket automatically. Customer records are created and maintained automatically. Tokens are refreshed automatically. Watches are renewed automatically.

The user never thinks about email infrastructure again.

---

## Section 6 — What You Build Once as the Developer

As the developer, there are a small number of one-time setup steps you perform before any user ever connects their account. You create a Google Cloud project, enable the Gmail API and the Pub/Sub API, create one Pub/Sub topic, and configure it to push notifications to your webhook URL. You register a Microsoft Azure application, enable the Microsoft Graph API, and configure your webhook URL there as well. You set up your BullMQ queue backed by a Redis instance. You write the cron job that renews watches and subscriptions daily. You set up the WebSocket infrastructure for real-time frontend updates.

Once these pieces are in place, the system scales automatically to every new user who connects their account — whether that is 10 users or 10,000 users — without any additional setup or maintenance.

---

## Complete Flow Summary

A customer sends an email to a connected user's inbox. Google or Microsoft detects the new email within seconds and pushes a lightweight notification to your Express webhook. Your server acknowledges instantly and drops a job into the BullMQ queue. A background worker picks up the job, fetches the full email using the stored OAuth token, checks for duplicates, detects whether it is a new conversation or a reply, identifies or creates the customer record, creates a new ticket or appends a reply to an existing one in PostgreSQL via Prisma, and emits a WebSocket event to the Next.js dashboard. The support agent sees the ticket appear in real time. The entire sequence from email arriving in the inbox to ticket appearing on the dashboard takes just a few seconds. Nothing in this chain costs money. Nothing requires the user to do anything after their initial one-click OAuth connection.
