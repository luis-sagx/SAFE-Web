export interface EmailHashRow {
  id: string;
  email: string;
  emailHash: string | null;
}

export interface EmailHashChange {
  id: string;
  previousHash: string | null;
  expectedHash: string;
}

export interface EmailHashAnalysis {
  summary: {
    total: number;
    inconsistent: number;
    repairable: number;
    blocked: number;
    duplicateGroupSizes: number[];
  };
  changes: EmailHashChange[];
  duplicateAccountIds: Set<string>;
}

export function analyzeEmailHashReconciliation(
  rows: readonly EmailHashRow[],
  decryptEmail: (value: string) => string,
  hashNormalizedEmail: (value: string) => string,
): EmailHashAnalysis {
  const groups = new Map<string, string[]>();
  const changes: EmailHashChange[] = [];

  for (const row of rows) {
    const normalizedEmail = decryptEmail(row.email).trim().toLowerCase();
    const expectedHash = hashNormalizedEmail(normalizedEmail);
    const group = groups.get(expectedHash) ?? [];
    group.push(row.id);
    groups.set(expectedHash, group);

    if (row.emailHash !== expectedHash) {
      changes.push({
        id: row.id,
        previousHash: row.emailHash,
        expectedHash,
      });
    }
  }

  const duplicateAccountIds = new Set<string>();
  const duplicateGroupSizes: number[] = [];
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    duplicateGroupSizes.push(group.length);
    for (const id of group) duplicateAccountIds.add(id);
  }
  duplicateGroupSizes.sort((a, b) => a - b);
  const blocked = changes.filter((change) =>
    duplicateAccountIds.has(change.id),
  ).length;

  return {
    summary: {
      total: rows.length,
      inconsistent: changes.length,
      repairable: changes.length - blocked,
      blocked,
      duplicateGroupSizes,
    },
    changes,
    duplicateAccountIds,
  };
}

export function planEmailHashReconciliation(
  rows: readonly EmailHashRow[],
  decryptEmail: (value: string) => string,
  hashNormalizedEmail: (value: string) => string,
): EmailHashChange[] {
  const analysis = analyzeEmailHashReconciliation(
    rows,
    decryptEmail,
    hashNormalizedEmail,
  );
  const occupied = new Set(
    rows
      .filter((row) => analysis.duplicateAccountIds.has(row.id))
      .map((row) => row.emailHash)
      .filter((hash): hash is string => hash !== null),
  );
  const changes = analysis.changes.filter(
    (change) => !analysis.duplicateAccountIds.has(change.id),
  );
  if (changes.some((change) => occupied.has(change.expectedHash))) {
    throw new Error(
      'Una huella de destino está ocupada por una cuenta excluida.',
    );
  }
  return changes;
}
