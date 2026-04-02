/**
 * Outlook Service
 *
 * Handles all Microsoft Graph API interactions:
 * - OAuth2 authorization URL generation and code exchange
 * - Microsoft Graph webhook subscription management
 * - Email fetching via Graph API
 * - Access token refresh using MSAL
 */

import { ConfidentialClientApplication, Configuration } from "@azure/msal-node";
import { Client } from "@microsoft/microsoft-graph-client";
import logger from "../../lib/logger.js";

/** MSAL configuration for Microsoft OAuth */
function getMsalConfig(): Configuration {
  return {
    auth: {
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || "common"}`,
    },
  };
}

/** Microsoft Graph scopes for reading mail */
const SCOPES = ["https://graph.microsoft.com/Mail.Read", "offline_access"];

/**
 * Generate the Microsoft OAuth consent URL.
 * The `state` parameter carries the workspaceId.
 */
export async function getOutlookAuthUrl(workspaceId: string): Promise<string> {
  const msalClient = new ConfidentialClientApplication(getMsalConfig());

  const authUrl = await msalClient.getAuthCodeUrl({
    scopes: SCOPES,
    redirectUri: process.env.MICROSOFT_REDIRECT_URI!,
    state: workspaceId,
    prompt: "consent",
  });

  return authUrl;
}

/**
 * Exchange an authorization code for access and refresh tokens.
 */
export async function exchangeOutlookCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  email: string;
}> {
  const msalClient = new ConfidentialClientApplication(getMsalConfig());

  const result = await msalClient.acquireTokenByCode({
    code,
    scopes: SCOPES,
    redirectUri: process.env.MICROSOFT_REDIRECT_URI!,
  });

  if (!result || !result.accessToken) {
    throw new Error("Failed to obtain tokens from Microsoft");
  }

  // Get the user's email from the Graph API
  const graphClient = Client.init({
    authProvider: (done) => done(null, result.accessToken),
  });
  const me = await graphClient
    .api("/me")
    .select("mail,userPrincipalName")
    .get();
  const email = me.mail || me.userPrincipalName;

  // MSAL doesn't directly expose the refresh token — we store the access token
  // and use MSAL's cache for refresh. For our use case, we extract from the cache.
  const tokenCache = msalClient.getTokenCache().serialize();
  const cacheData = JSON.parse(tokenCache);
  const refreshTokens = cacheData.RefreshToken || {};
  const refreshTokenKey = Object.keys(refreshTokens)[0];
  const refreshToken = refreshTokenKey
    ? refreshTokens[refreshTokenKey].secret
    : "";

  return {
    accessToken: result.accessToken,
    refreshToken,
    expiresAt: result.expiresOn || new Date(Date.now() + 3600 * 1000),
    email,
  };
}

/**
 * Create a Microsoft Graph webhook subscription for new mail.
 * Notifications will be pushed to our webhook endpoint.
 *
 * Subscriptions expire after max 3 days (4230 minutes) for mail resources.
 */
export async function createOutlookSubscription(
  accessToken: string,
): Promise<{ subscriptionId: string; expiry: Date }> {
  const graphClient = Client.init({
    authProvider: (done) => done(null, accessToken),
  });

  // Subscription expires in 2 days (within the 3-day max)
  const expirationDateTime = new Date(
    Date.now() + 2 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const webhookUrl = `${process.env.APP_URL}/api/v1/email/webhook/outlook`;

  const subscription = await graphClient.api("/subscriptions").post({
    changeType: "created",
    notificationUrl: webhookUrl,
    resource: "me/mailFolders('Inbox')/messages",
    expirationDateTime,
    clientState: process.env.MICROSOFT_CLIENT_ID, // Verification token
  });

  return {
    subscriptionId: subscription.id,
    expiry: new Date(subscription.expirationDateTime),
  };
}

/**
 * Renew an existing Microsoft Graph subscription.
 */
export async function renewOutlookSubscription(
  accessToken: string,
  subscriptionId: string,
): Promise<Date> {
  const graphClient = Client.init({
    authProvider: (done) => done(null, accessToken),
  });

  const expirationDateTime = new Date(
    Date.now() + 2 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const result = await graphClient
    .api(`/subscriptions/${subscriptionId}`)
    .patch({ expirationDateTime });

  return new Date(result.expirationDateTime);
}

/**
 * Delete a Microsoft Graph subscription.
 */
export async function deleteOutlookSubscription(
  accessToken: string,
  subscriptionId: string,
): Promise<void> {
  const graphClient = Client.init({
    authProvider: (done) => done(null, accessToken),
  });

  await graphClient.api(`/subscriptions/${subscriptionId}`).delete();
}

/** Parsed email content from Outlook */
export interface ParsedOutlookMessage {
  messageId: string; // Internet Message-ID
  from: { name: string; email: string };
  subject: string;
  bodyPlain: string;
  bodyHtml: string;
  references: string | null;
  inReplyTo: string | null;
  date: Date;
}

/**
 * Fetch a single mail message from Microsoft Graph.
 */
export async function fetchOutlookMessage(
  accessToken: string,
  messageId: string,
): Promise<ParsedOutlookMessage> {
  const graphClient = Client.init({
    authProvider: (done) => done(null, accessToken),
  });

  const message = await graphClient
    .api(`/me/messages/${messageId}`)
    .select(
      "internetMessageId,from,subject,body,bodyPreview,internetMessageHeaders,receivedDateTime",
    )
    .get();

  // Extract threading headers from internetMessageHeaders
  const headers: Array<{ name: string; value: string }> =
    message.internetMessageHeaders || [];

  const getHeader = (name: string): string | null => {
    const h = headers.find(
      (h: { name: string }) => h.name.toLowerCase() === name.toLowerCase(),
    );
    return h ? h.value : null;
  };

  return {
    messageId: message.internetMessageId || "",
    from: {
      name: message.from?.emailAddress?.name || "",
      email: message.from?.emailAddress?.address || "",
    },
    subject: message.subject || "",
    bodyPlain: message.bodyPreview || "",
    bodyHtml:
      message.body?.contentType === "html" ? message.body.content || "" : "",
    references: getHeader("References"),
    inReplyTo: getHeader("In-Reply-To"),
    date: new Date(message.receivedDateTime),
  };
}

/**
 * Fetch recent inbox messages (used when a notification doesn't provide a messageId).
 * Returns the most recent unread message IDs.
 */
export async function fetchRecentInboxMessageIds(
  accessToken: string,
  count: number = 5,
): Promise<string[]> {
  const graphClient = Client.init({
    authProvider: (done) => done(null, accessToken),
  });

  const result = await graphClient
    .api("/me/mailFolders/Inbox/messages")
    .top(count)
    .orderby("receivedDateTime desc")
    .select("id")
    .get();

  return (result.value || []).map((m: { id: string }) => m.id);
}

/**
 * Refresh an Outlook access token using the refresh token.
 */
export async function refreshOutlookToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}> {
  const msalClient = new ConfidentialClientApplication(getMsalConfig());

  const result = await msalClient.acquireTokenByRefreshToken({
    refreshToken,
    scopes: SCOPES,
  });

  if (!result || !result.accessToken) {
    throw new Error("Failed to refresh Outlook access token");
  }

  // Extract new refresh token from cache
  const tokenCache = msalClient.getTokenCache().serialize();
  const cacheData = JSON.parse(tokenCache);
  const refreshTokens = cacheData.RefreshToken || {};
  const refreshTokenKey = Object.keys(refreshTokens)[0];
  const newRefreshToken = refreshTokenKey
    ? refreshTokens[refreshTokenKey].secret
    : refreshToken;

  return {
    accessToken: result.accessToken,
    refreshToken: newRefreshToken,
    expiresAt: result.expiresOn || new Date(Date.now() + 3600 * 1000),
  };
}
