const puppeteer = require('puppeteer');
const pdf = require('html-pdf');
const fs = require('fs');
const path = require('path');

class PDFService {
  async generateCaseStudyPDF(caseStudyData) {
    console.log('Starting PDF generation...');
    
    // Try Puppeteer first, fallback to html-pdf if it fails
    try {
      return await this.generateWithPuppeteer(caseStudyData);
    } catch (puppeteerError) {
      console.log('Puppeteer failed, trying html-pdf fallback:', puppeteerError.message);
      return await this.generateWithHtmlPdf(caseStudyData);
    }
  }

  async generateWithPuppeteer(caseStudyData) {
    let browser;
    
    try {
      console.log('Trying Puppeteer PDF generation...');
      
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security'
        ],
        timeout: 30000
      });
      
      const page = await browser.newPage();
      page.setDefaultTimeout(30000);
      
      const html = this.generateHTMLTemplate(caseStudyData);
      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
      });
      
      console.log('Puppeteer PDF generated successfully');
      return pdfBuffer;
      
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (e) {
          console.error('Error closing browser:', e);
        }
      }
    }
  }

  async generateWithHtmlPdf(caseStudyData) {
    return new Promise((resolve, reject) => {
      console.log('Trying html-pdf generation...');
      
      const html = this.generateHTMLTemplate(caseStudyData);
      
      const options = {
        format: 'A4',
        border: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        timeout: 30000
      };

      pdf.create(html, options).toBuffer((err, buffer) => {
        if (err) {
          console.error('html-pdf generation failed:', err);
          reject(new Error(`PDF generation failed: ${err.message}`));
        } else {
          console.log('html-pdf generated successfully');
          resolve(buffer);
        }
      });
    });
  }

  generateHTMLTemplate(data) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Case Study: ${data.title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Calibri:wght@400;700&display=swap');
        
        body {
          font-family: 'Calibri', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', sans-serif;
          font-size: 10pt;
          line-height: 1.4;
          color: #000000;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        * {
          font-family: 'Calibri', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', sans-serif;
          color: #000000;
        }
        
        .header {
          text-align: center;
          border-bottom: 2px solid #000000;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        
        .title {
          font-size: 16pt;
          font-weight: bold;
          color: #000000;
          margin-bottom: 8px;
          font-family: 'Calibri', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', sans-serif;
        }
        
        .subtitle {
          font-size: 10pt;
          color: #000000;
          font-family: 'Calibri', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', sans-serif;
        }
        
        .section {
          margin-bottom: 20px;
        }
        
        .section-title {
          font-size: 12pt;
          font-weight: bold;
          color: #000000;
          border-left: 3px solid #000000;
          padding-left: 10px;
          margin-bottom: 10px;
          font-family: 'Calibri', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', sans-serif;
        }
        
        .content {
          margin-left: 15px;
          text-align: justify;
          font-size: 10pt;
          color: #000000;
          font-family: 'Calibri', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', sans-serif;
        }
        
        .highlight {
          background-color: #f5f5f5;
          padding: 10px;
          border-left: 3px solid #000000;
          margin: 10px 0;
          font-size: 10pt;
          color: #000000;
          font-family: 'Calibri', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', sans-serif;
        }
        
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 10pt;
          color: #000000;
          border-top: 1px solid #000000;
          padding-top: 15px;
          font-family: 'Calibri', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', sans-serif;
        }
        
        ul {
          margin-left: 15px;
          font-size: 10pt;
          color: #000000;
          font-family: 'Calibri', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', sans-serif;
        }
        
        li {
          margin-bottom: 6px;
          font-size: 10pt;
          color: #000000;
          font-family: 'Calibri', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', sans-serif;
        }
        
        p {
          font-size: 10pt;
          color: #000000;
          font-family: 'Calibri', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', sans-serif;
          margin-bottom: 8px;
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin: 15px 0;
        }
        
        .metric-item {
          background-color: #f5f5f5;
          padding: 8px;
          border-radius: 4px;
          font-size: 10pt;
          color: #000000;
          font-family: 'Calibri', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', sans-serif;
        }
        
        .metric-label {
          font-weight: bold;
          font-size: 10pt;
          color: #000000;
          font-family: 'Calibri', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', sans-serif;
        }
        
        .metric-value {
          font-size: 10pt;
          color: #000000;
          font-family: 'Calibri', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', sans-serif;
        }
        
        .workstream-section {
          margin-bottom: 15px;
          padding: 10px;
          background-color: #f5f5f5;
          border-left: 3px solid #000000;
          border-radius: 4px;
        }
        
        .workstream-title {
          font-size: 11pt;
          font-weight: bold;
          color: #000000;
          font-family: 'Calibri', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', sans-serif;
          margin: 0 0 8px 0;
        }
        
        .workstream-description {
          font-size: 10pt;
          color: #000000;
          font-family: 'Calibri', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', sans-serif;
          margin: 0;
          line-height: 1.4;
        }
        
        .workstream-diagrams {
          margin-top: 10px;
          padding: 8px;
          background-color: #f9f9f9;
          border-radius: 3px;
          border-left: 2px solid #007bff;
        }
        
        .workstream-diagrams strong {
          font-size: 10pt;
          font-weight: bold;
          color: #000000;
          font-family: 'Calibri', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', sans-serif;
        }
        
        .workstream-diagrams ul {
          margin: 5px 0 5px 15px;
          padding: 0;
        }
        
        .workstream-diagrams li {
          font-size: 9pt;
          color: #000000;
          font-family: 'Calibri', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', sans-serif;
          margin-bottom: 3px;
        }
        
        .workstream-diagrams em {
          font-size: 9pt;
          color: #666666;
          font-family: 'Calibri', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', sans-serif;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">${data.title}</div>
        <div class="subtitle">Case Study Report</div>
        <div class="subtitle">Generated on: ${new Date().toLocaleDateString()}</div>
      </div>

      ${data.overview ? `
      <div class="section">
        <div class="section-title">Overview</div>
        <div class="content">
          ${data.overview}
        </div>
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">Challenge</div>
        <div class="content">
          ${data.challenge}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Solution</div>
        <div class="content">
          ${data.solution}
        </div>
        ${data.architectureDiagrams && data.architectureDiagrams.length > 0 ? `
        <div class="content">
          <strong>Architecture Diagrams:</strong>
          <ul>
            ${data.architectureDiagrams.map(diagram => `<li>${diagram.name || 'Architecture Diagram'}</li>`).join('')}
          </ul>
          <p><em>Note: Diagram files are included separately with this case study.</em></p>
        </div>
        ` : ''}
      </div>

      ${data.implementationWorkstreams && data.implementationWorkstreams.length > 0 && data.implementationWorkstreams.some(w => w.name || w.description) ? `
      <div class="section">
        <div class="section-title">Implementation Workstreams</div>
        <div class="content">
          ${data.implementationWorkstreams.filter(w => w.name || w.description).map((workstream, index) => `
            <div class="workstream-section">
              <h4 class="workstream-title">${workstream.name || `Workstream ${index + 1}`}</h4>
              ${workstream.description ? `<p class="workstream-description">${workstream.description}</p>` : ''}
              ${workstream.diagrams && workstream.diagrams.length > 0 ? `
                <div class="workstream-diagrams">
                  <strong>Diagrams:</strong>
                  <ul>
                    ${workstream.diagrams.map(diagram => `<li>${diagram.name} (${diagram.type})</li>`).join('')}
                  </ul>
                  <p><em>Note: Diagram files are included separately with this case study.</em></p>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">Results</div>
        <div class="content">
          ${data.results}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Executive Summary</div>
        <div class="content">
          ${data.executiveSummary || 'This case study presents a comprehensive analysis based on the provided questionnaire responses.'}
        </div>
      </div>
        <div class="section-title">Background</div>
        <div class="content">
          <strong>Project Duration:</strong> ${data.duration || 'N/A'}<br>
          <strong>Team Size:</strong> ${data.teamSize || 'N/A'}<br>
          <strong>Point of Contact(s):</strong> ${data.pointOfContact || 'N/A'}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Challenge</div>
        <div class="content">
          ${data.challenge || 'The primary challenge faced was identified through comprehensive analysis of the business requirements and constraints.'}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Solution</div>
        <div class="content">
          ${data.solution || 'A strategic solution was developed to address the identified challenges through systematic approach and implementation.'}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Implementation</div>
        <div class="content">
          <strong>Key Steps:</strong>
          <ul>
            ${data.implementationSteps ? data.implementationSteps.map(step => `<li>${step}</li>`).join('') : '<li>Requirements analysis and planning</li><li>Solution design and architecture</li><li>Development and testing</li><li>Deployment and monitoring</li>'}
          </ul>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Results</div>
        <div class="highlight">
          ${data.results || 'The implementation resulted in significant improvements in efficiency, cost reduction, and overall business performance.'}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Key Metrics</div>
        <div class="content">
          <div class="metrics-grid">
            ${data.performanceImprovement ? `<div class="metric-item"><span class="metric-label">Performance Improvement:</span> <span class="metric-value">${data.performanceImprovement}</span></div>` : ''}
            ${data.costReduction ? `<div class="metric-item"><span class="metric-label">Cost Reduction:</span> <span class="metric-value">${data.costReduction}</span></div>` : ''}
            ${data.timeSavings ? `<div class="metric-item"><span class="metric-label">Time Savings:</span> <span class="metric-value">${data.timeSavings}</span></div>` : ''}
            ${data.userSatisfaction ? `<div class="metric-item"><span class="metric-label">User Satisfaction:</span> <span class="metric-value">${data.userSatisfaction}</span></div>` : ''}
          </div>
          ${data.customMetrics && data.customMetrics.length > 0 && data.customMetrics.some(m => m.name && m.value) ? `
          <div style="margin-top: 15px;">
            <strong>Additional Metrics:</strong>
            <ul>
              ${data.customMetrics.filter(m => m.name && m.value).map(metric => `<li><strong>${metric.name}:</strong> ${metric.value}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Lessons Learned</div>
        <div class="content">
          ${data.lessonsLearned || 'This project provided valuable insights into best practices, potential pitfalls, and strategies for future implementations.'}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Conclusion</div>
        <div class="content">
          ${data.conclusion || 'The successful completion of this project demonstrates the effectiveness of the chosen approach and provides a foundation for future similar initiatives.'}
        </div>
      </div>

      <div class="footer">
        <p>This case study was generated automatically based on questionnaire responses.</p>
        <p>For more information, please contact the project team.</p>
      </div>
    </body>
    </html>
    `;
  }
}

module.exports = new PDFService();
