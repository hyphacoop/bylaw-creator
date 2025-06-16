// src/services/pdfService.ts
import { jsPDF } from "jspdf";
import { logEvent, LogLevel } from '../utils/logger';

export const downloadPDF = (bylawText: string, coopName: string): void => {
  try {
    logEvent('Starting PDF generation', LogLevel.INFO, { coopName });
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text(`BYLAWS OF ${coopName.toUpperCase()}`, 105, 20, { align: "center" });
    
    // Add content
    doc.setFontSize(11);
    const currentFontName = doc.getFont().fontName;
    
    // Split text into paragraphs, respecting article headers and sections
    const paragraphs = bylawText.split('\n\n');
    let y = 40;
    
    paragraphs.forEach(paragraph => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      
      const trimmedParagraph = paragraph.trim();
      
      // Format headers differently
      if (trimmedParagraph.startsWith('ARTICLE') || 
          trimmedParagraph.match(/^[A-Z\s]+:/) ||
          trimmedParagraph.startsWith('#')) {
        // Add spacing before heading
        y += 5;
        doc.setFontSize(13);
        doc.setFont(currentFontName, 'bold');
        
        const lines = doc.splitTextToSize(trimmedParagraph, 180);
        doc.text(lines, 15, y);
        
        y += 7 * lines.length;
        doc.setFontSize(11);
        doc.setFont(currentFontName, 'normal');
      } 
      // Format numbered sections
      else if (trimmedParagraph.match(/^\d+\.\d+/)) {
        doc.setFont(currentFontName, 'bold');
        const lines = doc.splitTextToSize(trimmedParagraph, 180);
        doc.text(lines, 15, y);
        y += 6 * lines.length;
        doc.setFont(currentFontName, 'normal');
      } 
      // Regular paragraphs
      else if (trimmedParagraph.length > 0) {
        const lines = doc.splitTextToSize(trimmedParagraph, 180);
        doc.text(lines, 15, y);
        y += 6 * lines.length;
      }
    });
    
    // Save the PDF
    const filename = `${coopName.replace(/\s+/g, '_')}_Bylaws.pdf`;
    doc.save(filename);
    
    logEvent('PDF downloaded successfully', LogLevel.INFO, { 
      coopName, 
      filename 
    });
  } catch (error: any) {
    logEvent('PDF generation failed', LogLevel.ERROR, { 
      error: error?.message,
      stack: error?.stack 
    });
    alert('There was an error generating the PDF. Please try again.');
  }
}; 