/**
 * Normalise a MongoDB GapReport document into the shape GapReport.jsx expects.
 */
export function normalizeSavedReport(db) {
  if (!db) return null;
  return {
    reportId: db._id,
    summary: db.summary,
    gaps: db.gaps || [],
    alignment_report: db.alignmentReport || null,
    totalGapsFound: db.totalGapsFound,
    criticalGaps: db.criticalGaps,
    highGaps: db.highGaps,
    mediumGaps: db.mediumGaps,
  };
}
