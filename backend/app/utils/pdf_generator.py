"""PDF receipt generation utility."""

from datetime import datetime
from io import BytesIO
from ..config import settings


def generate_receipt_pdf(receipt):
    """Generate a PDF receipt from a receipt document.
    
    Args:
        receipt: Receipt document from MongoDB
        
    Returns:
        BytesIO object containing PDF data
    """
    # fpdf2 pulls in fontTools (~10–20s first import on Windows); load only when needed
    from fpdf import FPDF

    pdf = FPDF()
    pdf.add_page()
    
    # Set font sizes
    pdf.set_font("Arial", "B", 16)
    
    # Header - PromesaPay Logo/Title
    pdf.cell(0, 10, "PROMESAPAY", ln=True, align="C")
    pdf.set_font("Arial", "", 10)
    pdf.cell(0, 5, "Crowdfunding & Creator Support Platform", ln=True, align="C")
    
    # Horizontal line
    pdf.ln(5)
    pdf.set_draw_color(200, 200, 200)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(5)
    
    # Receipt title
    pdf.set_font("Arial", "B", 14)
    pdf.cell(0, 10, "RECEIPT", ln=True, align="C")
    
    # Receipt number and date
    pdf.set_font("Arial", "", 9)
    receipt_num = receipt.get("receipt_number", "N/A")
    receipt_date = receipt.get("created_at", datetime.utcnow())
    if isinstance(receipt_date, str):
        try:
            receipt_date = datetime.fromisoformat(receipt_date.replace('Z', '+00:00'))
        except:
            receipt_date = datetime.utcnow()
    
    pdf.cell(0, 5, f"Receipt #: {receipt_num}", ln=True)
    pdf.cell(0, 5, f"Date: {receipt_date.strftime('%B %d, %Y at %I:%M %p')}", ln=True)
    
    pdf.ln(5)
    
    # Transaction details section
    pdf.set_font("Arial", "B", 11)
    pdf.cell(0, 8, "TRANSACTION DETAILS", ln=True)
    
    pdf.set_font("Arial", "", 10)
    pdf.set_draw_color(220, 220, 220)
    
    # Transaction info
    transaction_type = receipt.get("transaction_type", "Unknown").title()
    pdf.cell(60, 6, "Transaction Type:")
    pdf.cell(0, 6, transaction_type, ln=True)
    
    transaction_id = str(receipt.get("transaction_id", "N/A"))
    pdf.cell(60, 6, "Transaction ID:")
    pdf.cell(0, 6, transaction_id, ln=True)
    
    amount = receipt.get("amount", 0)
    pdf.cell(60, 6, "Amount:")
    pdf.cell(0, 6, f"GH₵ {amount:,.2f}", ln=True)
    
    status = receipt.get("status", "unknown").title()
    status_color = {
        "Success": (34, 197, 94),      # Green
        "Failed": (239, 68, 68),        # Red
        "Pending": (251, 146, 60),      # Orange
    }.get(status, (107, 114, 128))      # Gray
    
    pdf.set_text_color(*status_color)
    pdf.cell(60, 6, "Status:")
    pdf.cell(0, 6, status, ln=True)
    pdf.set_text_color(0, 0, 0)
    
    pdf.ln(3)
    
    # Parties section
    pdf.set_font("Arial", "B", 11)
    pdf.cell(0, 8, "PARTIES INVOLVED", ln=True)
    
    pdf.set_font("Arial", "", 10)
    
    # Payer info
    payer_name = receipt.get("payer_name", "Anonymous")
    payer_email = receipt.get("payer_email", "")
    pdf.cell(60, 6, "From (Supporter):")
    pdf.cell(0, 6, payer_name, ln=True)
    if payer_email:
        pdf.cell(60, 6, "")
        pdf.cell(0, 6, payer_email, ln=True)
    
    # Recipient info
    recipient_name = receipt.get("recipient_name", "Unknown")
    recipient_username = receipt.get("recipient_username", "")
    pdf.cell(60, 6, "To (Recipient):")
    pdf.cell(0, 6, recipient_name, ln=True)
    if recipient_username:
        pdf.cell(60, 6, "")
        pdf.cell(0, 6, f"@{recipient_username}", ln=True)
    
    pdf.ln(3)
    
    # Message section (if exists)
    message = receipt.get("message", "").strip()
    if message:
        pdf.set_font("Arial", "B", 11)
        pdf.cell(0, 8, "MESSAGE FROM SUPPORTER", ln=True)
        pdf.set_font("Arial", "", 9)
        
        # Create a text box for the message
        pdf.multi_cell(0, 5, f'"{message}"')
        pdf.ln(2)
    
    # Footer
    pdf.set_font("Arial", "", 8)
    pdf.set_text_color(150, 150, 150)
    pdf.ln(5)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(3)
    pdf.cell(0, 5, "This is a receipt for your transaction on PromesaPay.", ln=True, align="C")
    pdf.cell(0, 5, "For support, visit support.promesapay.com", ln=True, align="C")
    pdf.cell(0, 5, f"Generated on {datetime.utcnow().strftime('%B %d, %Y at %I:%M %p UTC')}", ln=True, align="C")
    
    # Return PDF as bytes
    pdf_output = BytesIO()
    pdf.output(pdf_output)
    pdf_output.seek(0)
    return pdf_output


def generate_receipt_filename(receipt_number):
    """Generate a clean filename for receipt PDF.
    
    Args:
        receipt_number: Receipt number from the document
        
    Returns:
        Filename string
    """
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    return f"receipt_{receipt_number}_{timestamp}.pdf"
