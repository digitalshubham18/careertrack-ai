const PDFDocument = require('pdfkit');

const COLORS = { heading: '#12131A', accent: '#4F3CC9', muted: '#555555', line: '#DDDDDD' };

function addSectionHeading(doc, text) {
  doc.moveDown(0.6);
  doc.fontSize(12).fillColor(COLORS.accent).font('Helvetica-Bold').text(text.toUpperCase(), { characterSpacing: 0.5 });
  doc.moveTo(doc.x, doc.y + 2).lineTo(doc.page.width - doc.page.margins.right, doc.y + 2).strokeColor(COLORS.line).stroke();
  doc.moveDown(0.4);
  doc.fillColor(COLORS.heading).font('Helvetica');
}

/**
 * Renders a Resume Builder document's structured data as a clean,
 * single-column, ATS-friendly PDF (no tables/columns/graphics that
 * confuse resume parsers). Returns a Buffer.
 */
function generateResumePdf({ user, resume }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 56, right: 56 } });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // --- Header ---
    doc.fontSize(20).font('Helvetica-Bold').fillColor(COLORS.heading).text(user.name || 'Your Name');
    doc.moveDown(0.2);

    const contactParts = [user.email, user.phone, user.location].filter(Boolean);
    const linkParts = [user.linkedin, user.github, user.portfolio].filter(Boolean);
    doc.fontSize(9.5).font('Helvetica').fillColor(COLORS.muted);
    if (contactParts.length) doc.text(contactParts.join('  •  '));
    if (linkParts.length) doc.text(linkParts.join('  •  '));

    // --- Summary ---
    if (resume.summary) {
      addSectionHeading(doc, 'Summary');
      doc.fontSize(10).text(resume.summary, { align: 'left' });
    }

    // --- Skills ---
    if (resume.skills?.length) {
      addSectionHeading(doc, 'Skills');
      doc.fontSize(10).text(resume.skills.join('  •  '));
    }

    // --- Experience ---
    if (resume.experience?.length) {
      addSectionHeading(doc, 'Experience');
      resume.experience.forEach((exp, i) => {
        doc.fontSize(10.5).font('Helvetica-Bold').fillColor(COLORS.heading)
          .text(`${exp.title || 'Role'} — ${exp.company || 'Company'}`, { continued: false });
        if (exp.duration) {
          doc.fontSize(9).font('Helvetica-Oblique').fillColor(COLORS.muted).text(exp.duration);
        }
        if (exp.description) {
          doc.fontSize(10).font('Helvetica').fillColor(COLORS.heading).text(exp.description, { align: 'left' });
        }
        if (i < resume.experience.length - 1) doc.moveDown(0.4);
      });
    }

    // --- Projects ---
    if (resume.projects?.length) {
      addSectionHeading(doc, 'Projects');
      resume.projects.forEach((proj, i) => {
        doc.fontSize(10.5).font('Helvetica-Bold').fillColor(COLORS.heading).text(proj.name || 'Project');
        if (proj.technologies?.length) {
          doc.fontSize(9).font('Helvetica-Oblique').fillColor(COLORS.muted).text(proj.technologies.join(', '));
        }
        if (proj.description) {
          doc.fontSize(10).font('Helvetica').fillColor(COLORS.heading).text(proj.description);
        }
        if (i < resume.projects.length - 1) doc.moveDown(0.4);
      });
    }

    // --- Education ---
    if (resume.education?.length) {
      addSectionHeading(doc, 'Education');
      resume.education.forEach((edu) => {
        doc.fontSize(10.5).font('Helvetica-Bold').fillColor(COLORS.heading)
          .text(`${edu.degree || 'Degree'}${edu.field ? `, ${edu.field}` : ''}`);
        doc.fontSize(9.5).font('Helvetica').fillColor(COLORS.muted)
          .text([edu.institution, edu.year].filter(Boolean).join(' — '));
      });
    }

    // --- Certifications ---
    if (resume.certifications?.length) {
      addSectionHeading(doc, 'Certifications');
      resume.certifications.forEach((cert) => doc.fontSize(10).font('Helvetica').fillColor(COLORS.heading).text(`•  ${cert}`));
    }

    // --- Achievements ---
    if (resume.achievements?.length) {
      addSectionHeading(doc, 'Achievements');
      resume.achievements.forEach((item) => doc.fontSize(10).font('Helvetica').fillColor(COLORS.heading).text(`•  ${item}`));
    }

    doc.end();
  });
}

module.exports = { generateResumePdf };
