const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generatePDF(entries) {
    let browser;
    try {
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        const html = await generateHTML(entries);

        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            margin: {
                top: '0mm',
                bottom: '0mm',
                left: '0mm',
                right: '0mm'
            }
        });

        await browser.close();
        return pdfBuffer;
    } catch (error) {
        if (browser) {
            await browser.close();
        }
        throw error;
    }
}

async function generateHTML(entries) {
    let logoDataUrl = '';

    try {
        const logoPath = path.join(__dirname, '../public/Picture1.png');
        if (fs.existsSync(logoPath)) {
            const logoBase64 = fs.readFileSync(logoPath, 'base64');
            logoDataUrl = `data:image/png;base64,${logoBase64}`;
        }
    } catch (error) {
        console.error('Error loading logo:', error.message);
    }

    let entriesHTML = '';

    entries.forEach((entry, index) => {
        entriesHTML += `
        <div class="entry-page">
          <!-- Header Section -->
          <div class="header-container">
            <div class="header-logo">
              ${logoDataUrl ? `<img src="${logoDataUrl}" />` : '<div style="color: #1f4e79; font-weight: bold; font-size: 18pt;">MIT CSN</div>'}
            </div>
            <div class="header-text">
              <div class="gs-mandal">G. S. Mandal's</div>
              <div class="inst-name">MAHARASHTRA INSTITUTE OF TECHNOLOGY</div>
              <div class="inst-location">Chhatrapati Sambhajinagar</div>
              <div class="inst-status">(An Autonomous Institute)</div>
              <div class="cell-name">Training and Placement Cell</div>
              <div class="academic-year">Academic Year 2025-26 Part-II</div>
            </div>
          </div>
          <div class="header-underline"></div>

          <!-- Main Table -->
          <table class="main-table">
            <tr class="title-row">
              <td class="diary-title">Internship Daily Diary</td>
              <td class="date-field">Date - ${entry.date || '__ / __ / ____'}</td>
            </tr>
            
            ${renderSection('Tasks Assigned', entry.tasksAssigned)}
            ${renderSection('Activities Carried Out', entry.activitiesCarriedOut)}
            ${renderSection('Technical Learning', entry.technicalLearning)}
            ${renderSection('Communication made in the organization', entry.communication)}
            ${renderSection('Outcome and Reflection', entry.outcomeReflection)}
          </table>
        </div>
        ${index < entries.length - 1 ? '<div class="page-break"></div>' : ''}
        `;
    });

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Daily Diary</title>
      <style>
        @page {
          size: A4;
          margin: 0;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: "Times New Roman", Times, serif;
          background-color: #fff;
          color: #000;
          width: 210mm;
          height: 297mm;
        }

        .entry-page {
          width: 210mm;
          height: 297mm;
          padding: 15mm 15mm;
          background: white;
          position: relative;
        }

        .page-break {
          page-break-after: always;
        }

        /* Header Styling */
        .header-container {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2px;
          padding: 0 5px;
        }

        .header-logo {
          width: 180px; /* Larger logo */
          margin-right: 15px;
          display: flex;
          align-items: center;
        }

        .header-logo img {
          width: 100%;
          height: auto;
          display: block;
        }

        .header-text {
          display: flex;
          flex-direction: column;
          justify-content: center;
          line-height: 1.15;
          text-align: center;
        }

        .gs-mandal {
          font-size: 9pt;
          color: #000;
        }

        .inst-name {
          font-size: 15pt;
          font-weight: bold;
          color: #1f4e79;
          margin: 1px 0;
        }

        .inst-location {
          font-size: 11.5pt;
          font-weight: bold;
          color: #1f4e79;
        }

        .inst-status {
          font-size: 9pt;
          font-style: italic;
          color: #ff8c00; /* Orange tone */
          margin-bottom: 2px;
        }

        .cell-name {
          font-size: 13pt;
          font-weight: bold;
          color: #000;
        }

        .academic-year {
          font-size: 11pt;
          color: #000;
        }

        .header-underline {
          border-top: 0.8pt solid #000;
          margin: 5px 0 12px 0;
          width: 100%;
        }

        /* Table Styling */
        .main-table {
          width: 100%;
          border: 1pt solid #000;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .main-table td {
          border: 0.5pt solid #000;
        }

        .title-row td {
          padding: 6px 10px;
          font-size: 11pt;
          font-weight: bold;
          height: 35px;
          vertical-align: middle;
        }

        .diary-title {
          width: 30%;
          text-align: left;
        }

        .date-field {
          width: 70%;
          text-align: right;
        }

        .section-label {
          width: 30%;
          font-weight: bold;
          font-size: 11pt;
          text-align: left;
          vertical-align: middle;
          padding-left: 10px;
        }

        .section-content {
          width: 70%;
          padding: 0 !important;
          vertical-align: top;
          height: 126px; /* Exactly 6 lines of 21px */
        }

        /* 6 Lines implementation */
        .lines-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .line {
          height: 21px;
          width: 100%;
          border-bottom: 0.5pt solid #000;
          padding: 2px 8px;
          font-size: 11pt;
          overflow: hidden;
          white-space: nowrap;
          display: flex;
          align-items: center;
        }

        .line:last-child {
          border-bottom: none;
        }

        @media print {
          body {
            -webkit-print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      ${entriesHTML}
    </body>
    </html>
    `;
}

function renderSection(label, content) {
    const lines = [];
    const words = content ? content.split(' ') : [];
    let currentLine = '';
    
    words.forEach(word => {
        if ((currentLine + word).length > 60) {
            lines.push(currentLine);
            currentLine = word + ' ';
        } else {
            currentLine += word + ' ';
        }
    });
    if (currentLine) lines.push(currentLine);

    let linesHTML = '';
    for (let i = 0; i < 6; i++) {
        linesHTML += `<div class="line">${escapeHTML(lines[i] || '')}</div>`;
    }

    return `
    <tr>
      <td class="section-label">${label}</td>
      <td class="section-content">
        <div class="lines-container">
          ${linesHTML}
        </div>
      </td>
    </tr>
    `;
}

function escapeHTML(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

module.exports = { generatePDF };
