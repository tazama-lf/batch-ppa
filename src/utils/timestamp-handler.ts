// Interface for objects that may contain a CreDtTm field (like GrpHdr)
interface CreationTimeSource {
  CreDtTm?: string;
}

/**
 * Validates and normalizes timestamp strings to ensure timezone-aware parsing
 * @param timestamp - The timestamp string to validate and normalize
 * @returns Normalized timestamp string with explicit timezone information
 * @throws Error if timestamp format is invalid
 */
function normalizeTimestamp(timestamp: string): string {
  // Check if timestamp already has explicit timezone info
  // Valid patterns: Z, +HH, -HH, +HH:MM, -HH:MM, +HHMM, -HHMM
  const hasTimezone = /[Zz]$|[+-]\d{2}:?\d{2}?$/.test(timestamp);

  if (hasTimezone) {
    return timestamp;
  }

  // No timezone info found - normalize by appending 'Z' to treat as UTC
  // This ensures consistent behavior regardless of server timezone
  return `${timestamp}Z`;
}

/**
 * Determines the creation timestamp for batch-processed accounts
 *
 * Priority order:
 * 1. Transaction-level timestamp from batch record
 * 2. Batch file timestamp
 * 3. Current processing time (fallback)
 */
export function determineAccountCreationTimestamp(batchRecord: CreationTimeSource, batchMetadata?: { timestamp?: string }): string {
  // Option 1: Extract from batch record if available
  if (batchRecord.CreDtTm) {
    try {
      const normalizedTimestamp = normalizeTimestamp(batchRecord.CreDtTm);
      const date = new Date(normalizedTimestamp);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch (error) {
      // Invalid timestamp, continue to next option
    }
  }

  // Option 2: Use batch file timestamp
  if (batchMetadata?.timestamp) {
    try {
      const normalizedTimestamp = normalizeTimestamp(batchMetadata.timestamp);
      const date = new Date(normalizedTimestamp);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch (error) {
      // Invalid timestamp, continue to next option
    }
  }

  // Option 3: Use current processing time as fallback
  return new Date().toISOString();
}
