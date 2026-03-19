import type { AssessmentResult } from '../types/assessment';
import { FRAMEWORK_MAP } from '../data/frameworks';
import { MATURITY_LABELS } from './scoring';
import { BUSINESS_TYPE_LABELS, REGION_LABELS } from '../types/filters';

export function exportJSON(result: AssessmentResult): void {
  const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `compliance-assessment-${result.id.slice(0, 8)}-${new Date(result.completedAt).toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCSV(result: AssessmentResult): void {
  const rows: string[][] = [];

  // Header
  rows.push([
    'Framework', 'Control ID', 'Control Title', 'Category', 'Severity',
    'Answer', 'Status', 'Priority', 'Notes', 'Remediation Steps'
  ]);

  // Gap rows
  for (const gap of result.gaps) {
    const fw = FRAMEWORK_MAP[gap.frameworkId];
    rows.push([
      fw?.shortName ?? gap.frameworkId,
      gap.controlId,
      `"${gap.controlTitle.replace(/"/g, '""')}"`,
      `"${gap.category.replace(/"/g, '""')}"`,
      gap.severity,
      gap.answer,
      gap.status,
      gap.priority,
      '',
      `"${gap.remediationSteps.join('; ').replace(/"/g, '""')}"`
    ]);
  }

  // Also include compliant controls
  const gapIds = new Set(result.gaps.map(g => g.controlId));
  for (const answer of result.answers) {
    if (answer.answer === 'yes' || answer.answer === 'na') {
      const fw = FRAMEWORK_MAP[answer.frameworkId];
      // Find control title
      let controlTitle = answer.controlId;
      let category = '';
      if (fw) {
        for (const domain of fw.domains) {
          const ctrl = domain.controls.find(c => c.id === answer.controlId);
          if (ctrl) {
            controlTitle = ctrl.title;
            category = ctrl.category;
            break;
          }
        }
      }
      if (!gapIds.has(answer.controlId)) {
        rows.push([
          fw?.shortName ?? answer.frameworkId,
          answer.controlId,
          `"${controlTitle.replace(/"/g, '""')}"`,
          `"${category.replace(/"/g, '""')}"`,
          '',
          answer.answer,
          answer.answer === 'yes' ? 'compliant' : 'not-applicable',
          '',
          `"${(answer.notes ?? '').replace(/"/g, '""')}"`,
          ''
        ]);
      }
    }
  }

  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `compliance-assessment-${result.id.slice(0, 8)}-${new Date(result.completedAt).toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportPDF(result: AssessmentResult): Promise<void> {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = margin;

  const addPage = () => {
    doc.addPage();
    y = margin;
  };

  const checkY = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) addPage();
  };

  // ---- Cover Page ----
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 297, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPLIANCE ASSESSMENT', pageW / 2, 60, { align: 'center' });
  doc.text('REPORT', pageW / 2, 75, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(result.profile.organizationName, pageW / 2, 100, { align: 'center' });
  doc.text(new Date(result.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), pageW / 2, 110, { align: 'center' });

  doc.setFontSize(40);
  doc.setFont('helvetica', 'bold');
  const scoreColor = result.overallScore >= 80 ? [34, 197, 94] : result.overallScore >= 60 ? [234, 179, 8] : [239, 68, 68];
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.text(`${result.overallScore}%`, pageW / 2, 145, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(200, 200, 200);
  doc.text('Overall Compliance Score', pageW / 2, 155, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Assessor: ${result.profile.assessorName}`, pageW / 2, 200, { align: 'center' });
  doc.text(`Frameworks: ${result.profile.selectedFrameworks.map(f => FRAMEWORK_MAP[f]?.shortName ?? f).join(', ')}`, pageW / 2, 210, { align: 'center' });
  doc.text(`Business Type: ${BUSINESS_TYPE_LABELS[result.profile.businessType]}`, pageW / 2, 220, { align: 'center' });
  doc.text(`Region: ${REGION_LABELS[result.profile.businessRegion]}`, pageW / 2, 230, { align: 'center' });

  // ---- Executive Summary Page ----
  doc.addPage();
  doc.setFillColor(255, 255, 255);
  y = margin;

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', margin, y);
  y += 12;

  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + contentW, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  const summaryLines = [
    `This report presents the results of a cybersecurity compliance assessment conducted for ${result.profile.organizationName}.`,
    `The assessment was performed on ${new Date(result.completedAt).toLocaleDateString()} by ${result.profile.assessorName}.`,
    '',
    `The organization operates as a ${BUSINESS_TYPE_LABELS[result.profile.businessType]} business in the ${REGION_LABELS[result.profile.businessRegion]} region.`,
    `The assessment covered ${result.profile.selectedFrameworks.length} compliance framework(s) with a total of ${result.answers.length} controls evaluated.`,
    '',
    `OVERALL COMPLIANCE SCORE: ${result.overallScore}%`,
    `Total Gaps Identified: ${result.gaps.length}`,
    `Critical/Immediate Gaps: ${result.gaps.filter(g => g.priority === 'immediate').length}`,
    `Short-term Gaps: ${result.gaps.filter(g => g.priority === 'short-term').length}`,
  ];

  for (const line of summaryLines) {
    checkY(6);
    if (line === '') {
      y += 4;
    } else {
      doc.setFont('helvetica', line.startsWith('OVERALL') || line.startsWith('Total') || line.startsWith('Critical') || line.startsWith('Short') ? 'bold' : 'normal');
      doc.text(line, margin, y);
      y += 6;
    }
  }
  y += 10;

  // ---- Framework Scores ----
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  checkY(20);
  doc.text('Framework Compliance Scores', margin, y);
  y += 8;

  doc.setDrawColor(99, 102, 241);
  doc.line(margin, y, margin + contentW, y);
  y += 8;

  for (const score of result.frameworkScores) {
    checkY(25);
    const fw = FRAMEWORK_MAP[score.frameworkId];
    const barW = contentW * 0.6;
    const filledW = (score.scorePercent / 100) * barW;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`${fw?.shortName ?? score.frameworkId}`, margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`${score.scorePercent}% - Maturity Level ${score.maturityLevel}: ${MATURITY_LABELS[score.maturityLevel]}`, margin, y + 5);

    // Progress bar
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(margin, y + 8, barW, 5, 2, 2, 'F');

    const barColor = score.scorePercent >= 80 ? [34, 197, 94] : score.scorePercent >= 60 ? [234, 179, 8] : [239, 68, 68];
    doc.setFillColor(barColor[0], barColor[1], barColor[2]);
    if (filledW > 0) doc.roundedRect(margin, y + 8, filledW, 5, 2, 2, 'F');

    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Compliant: ${score.compliantCount}  Partial: ${score.partialCount}  Non-Compliant: ${score.nonCompliantCount}  N/A: ${score.naCount}`, margin, y + 18);

    y += 24;
  }

  // ---- Gap Analysis ----
  if (result.gaps.length > 0) {
    addPage();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Gap Analysis', margin, y);
    y += 8;
    doc.setDrawColor(99, 102, 241);
    doc.line(margin, y, margin + contentW, y);
    y += 8;

    for (const gap of result.gaps.slice(0, 30)) {
      checkY(20);

      const severityColors: Record<string, [number, number, number]> = {
        critical: [239, 68, 68],
        high: [249, 115, 22],
        medium: [234, 179, 8],
        low: [34, 197, 94],
      };
      const sc = severityColors[gap.severity] ?? [100, 116, 139];

      doc.setFillColor(sc[0], sc[1], sc[2]);
      doc.roundedRect(margin, y - 3, 18, 5, 1, 1, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(gap.severity.toUpperCase(), margin + 1, y + 1);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(gap.controlTitle, margin + 22, y);
      y += 5;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const fw = FRAMEWORK_MAP[gap.frameworkId];
      doc.text(`${fw?.shortName ?? gap.frameworkId} | ${gap.controlId} | Priority: ${gap.priority}`, margin, y);
      y += 8;
    }

    if (result.gaps.length > 30) {
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`... and ${result.gaps.length - 30} more gaps. See full JSON/CSV export for complete details.`, margin, y);
    }
  }

  doc.save(`compliance-report-${result.profile.organizationName.replace(/\s+/g, '-')}-${new Date(result.completedAt).toISOString().split('T')[0]}.pdf`);
}
