const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { formatCurrency, formatDate } = require('../utils/helpers');

class PDFService {
  constructor() {
    this.ensureDirectoryExists();
  }

  ensureDirectoryExists() {
    const outputDir = path.join(process.cwd(), 'temp', 'pdfs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  /**
   * Generate pay stub PDF
   * @param {Object} payStubData - Pay stub data
   * @param {Object} userData - User data
   * @param {Object} companyData - Company data
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generatePayStubPDF(payStubData, userData, companyData) {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      
      return new Promise((resolve, reject) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        doc.on('error', reject);

        // Header
        this.addHeader(doc, companyData);
        
        // Title
        doc.fontSize(20)
           .fillColor('#2c3e50')
           .text('PAY STUB', 50, 120, { align: 'center' });

        // Employee Information
        doc.fontSize(12)
           .fillColor('#000000')
           .text(`Employee: ${userData.firstName} ${userData.lastName}`, 50, 160)
           .text(`Employee ID: ${userData.id}`, 50, 180)
           .text(`Pay Period: ${formatDate(payStubData.payPeriodStart)} - ${formatDate(payStubData.payPeriodEnd)}`, 50, 200)
           .text(`Pay Date: ${formatDate(payStubData.payDate)}`, 50, 220);

        // Earnings Section
        this.addEarningsSection(doc, payStubData, 260);

        // Deductions Section  
        this.addDeductionsSection(doc, payStubData, 360);

        // Summary Section
        this.addSummarySection(doc, payStubData, 460);

        // Footer
        this.addFooter(doc);

        doc.end();
      });
    } catch (error) {
      logger.error('Error generating pay stub PDF:', error);
      throw new Error('Failed to generate pay stub PDF');
    }
  }

  /**
   * Generate payroll report PDF
   * @param {Object} reportData - Report data
   * @param {Object} companyData - Company data
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generatePayrollReportPDF(reportData, companyData) {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      
      return new Promise((resolve, reject) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        doc.on('error', reject);

        // Header
        this.addHeader(doc, companyData);
        
        // Title
        doc.fontSize(18)
           .fillColor('#2c3e50')
           .text('PAYROLL REPORT', 50, 120, { align: 'center' });

        // Report Period
        doc.fontSize(12)
           .fillColor('#000000')
           .text(`Report Period: ${formatDate(reportData.startDate)} - ${formatDate(reportData.endDate)}`, 50, 160)
           .text(`Generated: ${formatDate(new Date())}`, 50, 180);

        // Summary Table
        this.addReportSummaryTable(doc, reportData, 220);

        // Employee Details
        this.addEmployeeDetailsTable(doc, reportData.employees, 320);

        // Footer
        this.addFooter(doc);

        doc.end();
      });
    } catch (error) {
      logger.error('Error generating payroll report PDF:', error);
      throw new Error('Failed to generate payroll report PDF');
    }
  }

  /**
   * Generate time tracking report PDF
   * @param {Object} reportData - Time tracking data
   * @param {Object} companyData - Company data
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generateTimeTrackingReportPDF(reportData, companyData) {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      
      return new Promise((resolve, reject) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        doc.on('error', reject);

        // Header
        this.addHeader(doc, companyData);
        
        // Title
        doc.fontSize(18)
           .fillColor('#2c3e50')
           .text('TIME TRACKING REPORT', 50, 120, { align: 'center' });

        // Report Details
        doc.fontSize(12)
           .fillColor('#000000')
           .text(`Report Period: ${formatDate(reportData.startDate)} - ${formatDate(reportData.endDate)}`, 50, 160)
           .text(`Employee: ${reportData.employee.firstName} ${reportData.employee.lastName}`, 50, 180)
           .text(`Total Hours: ${reportData.totalHours}`, 50, 200);

        // Time Entries Table
        this.addTimeEntriesTable(doc, reportData.timeEntries, 240);

        // Footer
        this.addFooter(doc);

        doc.end();
      });
    } catch (error) {
      logger.error('Error generating time tracking report PDF:', error);
      throw new Error('Failed to generate time tracking report PDF');
    }
  }

  addHeader(doc, companyData) {
    doc.fontSize(16)
       .fillColor('#2c3e50')
       .text(companyData.name || 'HighPay Company', 50, 50)
       .fontSize(10)
       .fillColor('#666666')
       .text(companyData.address || 'Company Address', 50, 75)
       .text(companyData.phone || 'Phone: (555) 123-4567', 50, 90);
  }

  addEarningsSection(doc, payStubData, yPosition) {
    doc.fontSize(14)
       .fillColor('#2c3e50')
       .text('EARNINGS', 50, yPosition);

    const earnings = payStubData.earnings || {};
    let y = yPosition + 25;

    Object.entries(earnings).forEach(([key, value]) => {
      doc.fontSize(10)
         .fillColor('#000000')
         .text(key.replace(/([A-Z])/g, ' $1').toUpperCase(), 50, y)
         .text(formatCurrency(value), 400, y, { align: 'right' });
      y += 15;
    });

    // Gross Pay
    doc.fontSize(12)
       .fillColor('#2c3e50')
       .text('GROSS PAY:', 50, y + 10)
       .text(formatCurrency(payStubData.grossPay), 400, y + 10, { align: 'right' });
  }

  addDeductionsSection(doc, payStubData, yPosition) {
    doc.fontSize(14)
       .fillColor('#2c3e50')
       .text('DEDUCTIONS', 50, yPosition);

    const deductions = payStubData.deductions || {};
    let y = yPosition + 25;

    Object.entries(deductions).forEach(([key, value]) => {
      doc.fontSize(10)
         .fillColor('#000000')
         .text(key.replace(/([A-Z])/g, ' $1').toUpperCase(), 50, y)
         .text(formatCurrency(value), 400, y, { align: 'right' });
      y += 15;
    });

    // Total Deductions
    const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + val, 0);
    doc.fontSize(12)
       .fillColor('#2c3e50')
       .text('TOTAL DEDUCTIONS:', 50, y + 10)
       .text(formatCurrency(totalDeductions), 400, y + 10, { align: 'right' });
  }

  addSummarySection(doc, payStubData, yPosition) {
    doc.fontSize(14)
       .fillColor('#2c3e50')
       .text('SUMMARY', 50, yPosition);

    doc.fontSize(12)
       .fillColor('#000000')
       .text('Gross Pay:', 50, yPosition + 25)
       .text(formatCurrency(payStubData.grossPay), 400, yPosition + 25, { align: 'right' })
       .text('Total Deductions:', 50, yPosition + 45)
       .text(formatCurrency(payStubData.totalDeductions || 0), 400, yPosition + 45, { align: 'right' });

    // Net Pay (highlighted)
    doc.fontSize(14)
       .fillColor('#27ae60')
       .text('NET PAY:', 50, yPosition + 70)
       .text(formatCurrency(payStubData.netPay), 400, yPosition + 70, { align: 'right' });
  }

  addReportSummaryTable(doc, reportData, yPosition) {
    doc.fontSize(12)
       .fillColor('#2c3e50')
       .text('SUMMARY', 50, yPosition);

    doc.fontSize(10)
       .fillColor('#000000')
       .text('Total Employees:', 50, yPosition + 25)
       .text(reportData.totalEmployees.toString(), 400, yPosition + 25, { align: 'right' })
       .text('Total Gross Pay:', 50, yPosition + 40)
       .text(formatCurrency(reportData.totalGrossPay), 400, yPosition + 40, { align: 'right' })
       .text('Total Net Pay:', 50, yPosition + 55)
       .text(formatCurrency(reportData.totalNetPay), 400, yPosition + 55, { align: 'right' });
  }

  addEmployeeDetailsTable(doc, employees, yPosition) {
    doc.fontSize(12)
       .fillColor('#2c3e50')
       .text('EMPLOYEE DETAILS', 50, yPosition);

    let y = yPosition + 25;
    employees.forEach(employee => {
      doc.fontSize(9)
         .fillColor('#000000')
         .text(employee.name, 50, y)
         .text(formatCurrency(employee.grossPay), 250, y)
         .text(formatCurrency(employee.netPay), 400, y, { align: 'right' });
      y += 15;
    });
  }

  addTimeEntriesTable(doc, timeEntries, yPosition) {
    doc.fontSize(10)
       .fillColor('#2c3e50')
       .text('DATE', 50, yPosition)
       .text('CLOCK IN', 150, yPosition)
       .text('CLOCK OUT', 250, yPosition)
       .text('HOURS', 400, yPosition, { align: 'right' });

    let y = yPosition + 20;
    timeEntries.forEach(entry => {
      doc.fontSize(9)
         .fillColor('#000000')
         .text(formatDate(entry.date), 50, y)
         .text(entry.clockIn || 'N/A', 150, y)
         .text(entry.clockOut || 'N/A', 250, y)
         .text(entry.hours.toString(), 400, y, { align: 'right' });
      y += 15;
    });
  }

  addFooter(doc) {
    const pageHeight = doc.page.height;
    doc.fontSize(8)
       .fillColor('#666666')
       .text('This document was generated automatically by HighPay System', 50, pageHeight - 50)
       .text(`Generated on: ${formatDate(new Date())}`, 50, pageHeight - 35);
  }
}

module.exports = new PDFService();
