/**
 * Gmail Service
 *
 * Handles all Gmail API interactions:
 * - OAuth2 authorization URL generation and code exchange
 * - Gmail Watch registration (Pub/Sub push notifications)
 * - Email fetching via History API and individual message retrieval
 * - Access token refresh using refresh tokens
 */

import { google, gmail_v1 } from "googleapis";
import logger from "../../lib/logger.js";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

/** Gmail API scopes required for reading emails */
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

/**
 * Generate the Google OAuth consent URL.
 * The `state` parameter carries the workspaceId so we can associate
 * the callback with the correct workspace.
 */
export function getGmailAuthUrl(workspaceId: string): string {
  return oauth2Client.generateAuthUrl({
    access_type: "offline", // Request refresh token
    prompt: "consent", // Force consent to always get refresh token
    scope: SCOPES,
    state: workspaceId,
  });
}

/**
 * Exchange an authorization code for access and refresh tokens.
 */
export async function exchangeGmailCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  email: string;
}> {
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error("Failed to obtain tokens from Google");
  }

  // Get the user's email address
  const userAuth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  userAuth.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth: userAuth });
  const { data: userInfo } = await oauth2.userinfo.get();

  if (!userInfo.email) {
    throw new Error("Failed to obtain user email from Google");
  }

  const expiresAt = tokens.expiry_date
    ? new Date(tokens.expiry_date)
    : new Date(Date.now() + 3600 * 1000); // Default 1 hour

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt,
    email: userInfo.email,
  };
}

/**
 * Register a Gmail Watch on the user's inbox.
 * This tells Google to send push notifications to our Pub/Sub topic
 * whenever new email arrives.
 *
 * Watch expires after 7 days and must be renewed.
 */
export async function registerGmailWatch(
  accessToken: string,
  refreshToken: string,
): Promise<{ historyId: string; expiration: Date }> {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  auth.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const gmail = google.gmail({ version: "v1", auth });

  const topic = process.env.GOOGLE_PUBSUB_TOPIC;
  if (!topic) {
    throw new Error("GOOGLE_PUBSUB_TOPIC is not configured");
  }

  const res = await gmail.users.watch({
    userId: "me",
    requestBody: {
      topicName: topic,
      labelIds: ["INBOX"],
    },
  });

  if (!res.data.historyId || !res.data.expiration) {
    throw new Error("Gmail watch registration returned incomplete data");
  }

  return {
    historyId: res.data.historyId,
    expiration: new Date(parseInt(res.data.expiration)),
  };
}

/**
 * Stop an existing Gmail Watch.
 */
export async function stopGmailWatch(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  auth.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const gmail = google.gmail({ version: "v1", auth });
  await gmail.users.stop({ userId: "me" });
}

/** Parsed email content from Gmail */
export interface ParsedGmailMessage {
  messageId: string; // RFC 2822 Message-ID
  from: { name: string; email: string };
  subject: string;
  bodyPlain: string;
  bodyHtml: string;
  references: string | null; // References header
  inReplyTo: string | null; // In-Reply-To header
  date: Date;
}

/**
 * Fetch new messages since a given historyId.
 * Returns an array of Gmail message IDs that are new.
 */
export async function fetchNewMessageIds(
  accessToken: string,
  refreshToken: string,
  historyId: string,
): Promise<{ messageIds: string[]; latestHistoryId: string }> {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  auth.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const gmail = google.gmail({ version: "v1", auth });

  try {
    const res = await gmail.users.history.list({
      userId: "me",
      startHistoryId: historyId,
      historyTypes: ["messageAdded"],
      labelId: "INBOX",
    });

    const messageIds: string[] = [];
    if (res.data.history) {
      for (const entry of res.data.history) {
        if (entry.messagesAdded) {
          for (const msg of entry.messagesAdded) {
            if (msg.message?.id) {
              messageIds.push(msg.message.id);
            }
          }
        }
      }
    }

    return {
      messageIds: [...new Set(messageIds)], // Deduplicate
      latestHistoryId: res.data.historyId || historyId,
    };
  } catch (err: any) {
    // If historyId is too old, Gmail returns 404. We need a full sync.
    if (err.code === 404) {
      logger.warn(
        { historyId },
        "Gmail historyId expired — skipping incremental fetch",
      );
      return { messageIds: [], latestHistoryId: historyId };
    }
    throw err;
  }
}

/**
 * Fetch a single Gmail message by its ID and parse it into a structured format.
 */
export async function fetchGmailMessage(
  accessToken: string,
  refreshToken: string,
  gmailMessageId: string,
): Promise<ParsedGmailMessage> {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  auth.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const gmail = google.gmail({ version: "v1", auth });

  const res = await gmail.users.messages.get({
    userId: "me",
    id: gmailMessageId,
    format: "full",
  });

  const headers = res.data.payload?.headers || [];
  const getHeader = (name: string): string =>
    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ||
    "";

  // Parse sender
  const fromRaw = getHeader("From");
  const fromMatch = fromRaw.match(/^(.+?)\s*<(.+?)>$/);
  const from = fromMatch
    ? { name: fromMatch[1]!.replace(/"/g, "").trim(), email: fromMatch[2]! }
    : { name: fromRaw, email: fromRaw };

  // Extract body
  const { plain, html } = extractBody(res.data.payload!);

  return {
    messageId: getHeader("Message-ID") || getHeader("Message-Id"),
    from,
    subject: getHeader("Subject"),
    bodyPlain: plain,
    bodyHtml: html,
    references: getHeader("References") || null,
    inReplyTo: getHeader("In-Reply-To") || null,
    date: new Date(getHeader("Date") || Date.now()),
  };
}

/**
 * Recursively extract plain text and HTML body from a Gmail message payload.
 */
function extractBody(payload: gmail_v1.Schema$MessagePart): {
  plain: string;
  html: string;
} {
  let plain = "";
  let html = "";

  if (payload.mimeType === "text/plain" && payload.body?.data) {
    plain = Buffer.from(payload.body.data, "base64url").toString("utf8");
  } else if (payload.mimeType === "text/html" && payload.body?.data) {
    html = Buffer.from(payload.body.data, "base64url").toString("utf8");
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      const nested = extractBody(part);
      if (nested.plain) plain = nested.plain;
      if (nested.html) html = nested.html;
    }
  }

  return { plain, html };
}

/**
 * Refresh a Gmail access token using the refresh token.
 */
export async function refreshGmailToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresAt: Date;
}> {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  auth.setCredentials({ refresh_token: refreshToken });

  const { token } = await auth.getAccessToken();

  if (!token) {
    throw new Error("Failed to refresh Gmail access token");
  }

  return {
    accessToken: token,
    expiresAt: auth.credentials.expiry_date
      ? new Date(auth.credentials.expiry_date)
      : new Date(Date.now() + 3600 * 1000),
  };
}
