// Interface for objects that may contain a CreDtTm field (like GrpHdr)
interface CreationTimeSource {
  CreDtTm?: string;
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
      const date = new Date(batchRecord.CreDtTm);
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
      const date = new Date(batchMetadata.timestamp);
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
