/**
 * lib/utils.ts
 *
 * Core shared utility functions for HackFeed.
 */

/**
 * Sanitizes an outbound external URL to guarantee that it is absolute (starts with https:// or http://).
 * Prevents Next.js / browser relative path redirect bugs (e.g. unstop.com -> /opportunities/unstop.com).
 */
export function sanitizeExternalUrl(url: string | null | undefined): string {
  if (!url || typeof url !== "string") return "#"
  const trimmed = url.trim()
  if (!trimmed) return "#"

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed
  }

  // Handle protocol-relative URLs
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`
  }

  return `https://${trimmed}`
}

/**
 * Formats prize or stipend values for compact display.
 */
export function formatReward(reward: string | null | undefined): string | null {
  if (!reward) return null
  return reward.trim()
}
