"""CSV and PDF export for admin financial reports."""

import csv
import io
from datetime import datetime

from .admin_finance import (
    get_all_transactions_for_export,
    get_payouts_summary,
    get_revenue_summary,
    parse_date_range,
)


def build_csv_report(start_date_str=None, end_date_str=None):
    start_dt, end_dt = parse_date_range(start_date_str, end_date_str)
    summary = get_revenue_summary(start_dt, end_dt)
    payouts = get_payouts_summary(start_dt, end_dt)
    transactions = get_all_transactions_for_export(start_dt, end_dt)

    output = io.StringIO()
    output.write("\ufeff")
    writer = csv.writer(output)

    writer.writerow(["PromesaPay Financial Report"])
    writer.writerow(["Period", f"{start_dt.date()} to {end_dt.date()}"])
    writer.writerow(["Generated", datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")])
    writer.writerow([])

    writer.writerow(["Summary"])
    writer.writerow(["Total platform revenue (GHS)", summary["total_platform_revenue"]])
    writer.writerow(["Total gross volume (GHS)", summary["total_gross_volume"]])
    writer.writerow(["Total Paystack fees (GHS)", summary["total_paystack_fees"]])
    writer.writerow(["Total creator earnings (GHS)", summary["total_creator_earnings"]])
    writer.writerow(["Transaction count", summary["transaction_count"]])
    writer.writerow(["Completed payouts (GHS)", payouts["total_payouts_completed"]])
    writer.writerow(["Pending payouts (count)", payouts["pending_payout_count"]])
    writer.writerow([])

    writer.writerow(
        [
            "Date",
            "Reference",
            "Type",
            "Creator",
            "Gross (GHS)",
            "Paystack fee (GHS)",
            "Platform fee (GHS)",
            "Creator net (GHS)",
        ]
    )
    for row in transactions:
        writer.writerow(
            [
                row.get("created_at", ""),
                row.get("reference", ""),
                row.get("transaction_type", ""),
                row.get("creator_username") or row.get("recipient_id", ""),
                row.get("gross_amount", 0),
                row.get("paystack_fee", 0),
                row.get("platform_fee", 0),
                row.get("creator_earnings", 0),
            ]
        )

    filename = f"promesapay-report-{start_dt.date()}-to-{end_dt.date()}.csv"
    return output.getvalue(), filename


def build_pdf_report(start_date_str=None, end_date_str=None):
    start_dt, end_dt = parse_date_range(start_date_str, end_date_str)
    summary = get_revenue_summary(start_dt, end_dt)
    payouts = get_payouts_summary(start_dt, end_dt)
    transactions = get_all_transactions_for_export(start_dt, end_dt)

    try:
        from fpdf import FPDF
    except ImportError as e:
        raise RuntimeError("PDF export requires fpdf2. Install with: pip install fpdf2") from e

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "PromesaPay Financial Report", ln=True)
    pdf.set_font("Helvetica", size=10)
    pdf.cell(0, 6, f"Period: {start_dt.date()} to {end_dt.date()}", ln=True)
    pdf.cell(
        0,
        6,
        f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
        ln=True,
    )
    pdf.ln(4)

    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Summary", ln=True)
    pdf.set_font("Helvetica", size=10)
    lines = [
        ("Platform revenue (GHS)", summary["total_platform_revenue"]),
        ("Gross volume (GHS)", summary["total_gross_volume"]),
        ("Paystack fees (GHS)", summary["total_paystack_fees"]),
        ("Creator earnings (GHS)", summary["total_creator_earnings"]),
        ("Transactions", summary["transaction_count"]),
        ("Completed payouts (GHS)", payouts["total_payouts_completed"]),
        ("Pending payouts", payouts["pending_payout_count"]),
    ]
    for label, value in lines:
        pdf.cell(0, 6, f"{label}: {value}", ln=True)
    pdf.ln(4)

    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Transactions (latest 50)", ln=True)
    pdf.set_font("Helvetica", size=8)
    col_headers = ["Date", "Ref", "Type", "Gross", "PS Fee", "Plat", "Net"]
    widths = [28, 32, 18, 18, 18, 18, 18]
    for i, h in enumerate(col_headers):
        pdf.cell(widths[i], 6, h, border=1)
    pdf.ln()

    for row in transactions[:50]:
        pdf.cell(widths[0], 5, str(row.get("created_at", ""))[:10], border=1)
        pdf.cell(widths[1], 5, str(row.get("reference", ""))[:14], border=1)
        pdf.cell(widths[2], 5, str(row.get("transaction_type", ""))[:8], border=1)
        pdf.cell(widths[3], 5, str(row.get("gross_amount", 0)), border=1)
        pdf.cell(widths[4], 5, str(row.get("paystack_fee", 0)), border=1)
        pdf.cell(widths[5], 5, str(row.get("platform_fee", 0)), border=1)
        pdf.cell(widths[6], 5, str(row.get("creator_earnings", 0)), border=1)
        pdf.ln()

    raw = pdf.output()
    if isinstance(raw, str):
        raw = raw.encode("latin-1")
    filename = f"promesapay-report-{start_dt.date()}-to-{end_dt.date()}.pdf"
    return bytes(raw), filename
