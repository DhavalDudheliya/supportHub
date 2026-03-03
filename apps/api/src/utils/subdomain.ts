/**
 * Subdomain Generation Utility
 *
 * Converts a company name into a subdomain-safe identifier.
 * Example: "Acme Corp!" → "acmecorp"
 *
 * Rules: lowercase, alphanumeric only, no hyphens, max 63 chars (DNS label limit).
 */

/**
 * Convert a company name to a valid DNS subdomain label.
 *
 * @param companyName - The raw company name from registration
 * @returns Subdomain-safe string
 *
 * @example
 * generateSubdomain("Acme Corp")     // "acmecorp"
 * generateSubdomain("My  Company!")  // "mycompany"
 * generateSubdomain("  HELLO World ") // "helloworld"
 */
export function generateSubdomain(companyName: string): string {
  return companyName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "") // Remove everything except letters & digits
    .slice(0, 63); // DNS label max length
}
