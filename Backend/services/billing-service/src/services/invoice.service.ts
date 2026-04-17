import { pool } from "../db/pool";
import PDFDocument from "pdf-lib";
import * as fs from "fs";
import * as path from "path";

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface CreateInvoiceParams {
  userId: string;
  subscriptionId?: string;
  lineItems: InvoiceLineItem[];
  dueDate?: Date;
  notes?: string;
}

/**
 * Invoice and Receipt Service
 */
class InvoiceService {
  /**
   * Create invoice
   */
  async createInvoice(params: CreateInvoiceParams): Promise<any> {
    const { userId, subscriptionId, lineItems, dueDate, notes } = params;

    try {
      // Get user details
      const userResult = await pool.query(
        "SELECT email, name FROM users WHERE id = $1",
        [userId],
      );

      if (userResult.rows.length === 0) {
        throw new Error("User not found");
      }

      const user = userResult.rows[0];

      // Calculate totals
      const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
      const taxRate = parseFloat(process.env.TAX_RATE || "0");
      const tax = subtotal * taxRate;
      const total = subtotal + tax;

      // Generate invoice number
      const invoiceNumberResult = await pool.query(
        "SELECT generate_invoice_number() as number",
      );
      const invoiceNumber = invoiceNumberResult.rows[0].number;

      // Insert invoice
      const result = await pool.query(
        `INSERT INTO invoices (
          user_id, subscription_id, invoice_number, status, subtotal, tax, total,
          currency, issue_date, due_date, line_items, customer_name, customer_email, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          userId,
          subscriptionId,
          invoiceNumber,
          "draft",
          subtotal,
          tax,
          total,
          process.env.DEFAULT_CURRENCY || "USD",
          new Date(),
          dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          JSON.stringify(lineItems),
          user.name,
          user.email,
          notes,
        ],
      );

      return result.rows[0];
    } catch (error) {
      console.error("Failed to create invoice:", error);
      throw error;
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<any> {
    const result = await pool.query("SELECT * FROM invoices WHERE id = $1", [
      invoiceId,
    ]);

    if (result.rows.length === 0) {
      throw new Error("Invoice not found");
    }

    return result.rows[0];
  }

  /**
   * Get invoice by number
   */
  async getInvoiceByNumber(invoiceNumber: string): Promise<any> {
    const result = await pool.query(
      "SELECT * FROM invoices WHERE invoice_number = $1",
      [invoiceNumber],
    );

    if (result.rows.length === 0) {
      throw new Error("Invoice not found");
    }

    return result.rows[0];
  }

  /**
   * Get user invoices
   */
  async getUserInvoices(userId: string, status?: string): Promise<any[]> {
    let query = "SELECT * FROM invoices WHERE user_id = $1";
    const params: any[] = [userId];

    if (status) {
      query += " AND status = $2";
      params.push(status);
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Finalize invoice (make it payable)
   */
  async finalizeInvoice(invoiceId: string): Promise<any> {
    const result = await pool.query(
      `UPDATE invoices
       SET status = 'open', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [invoiceId],
    );

    return result.rows[0];
  }

  /**
   * Mark invoice as paid
   */
  async markInvoiceAsPaid(
    invoiceId: string,
    transactionId?: string,
    gateway?: string,
  ): Promise<any> {
    const invoice = await this.getInvoice(invoiceId);

    const result = await pool.query(
      `UPDATE invoices
       SET status = 'paid',
           paid_amount = $1,
           paid_at = NOW(),
           gateway = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [invoice.total, gateway, invoiceId],
    );

    // Create transaction record if not already created
    if (transactionId) {
      await pool.query(
        `UPDATE transactions
         SET invoice_id = $1
         WHERE id = $2`,
        [invoiceId, transactionId],
      );
    }

    return result.rows[0];
  }

  /**
   * Void invoice
   */
  async voidInvoice(invoiceId: string): Promise<any> {
    const result = await pool.query(
      `UPDATE invoices
       SET status = 'void', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [invoiceId],
    );

    return result.rows[0];
  }

  /**
   * Generate PDF invoice
   */
  async generateInvoicePDF(invoiceId: string): Promise<string> {
    const invoice = await this.getInvoice(invoiceId);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: "A4", margin: 50 });
        const filename = `invoice-${invoice.invoice_number}.pdf`;
        const filepath = path.join("/tmp", filename);

        doc.pipe(fs.createWriteStream(filepath));

        // Header
        doc.fontSize(20).text(process.env.COMPANY_NAME || "TechLearn", 50, 50);

        doc
          .fontSize(10)
          .text(process.env.COMPANY_ADDRESS || "", 50, 80)
          .text(process.env.COMPANY_EMAIL || "", 50, 95)
          .text(process.env.COMPANY_PHONE || "", 50, 110);

        // Invoice title
        doc.fontSize(20).text("INVOICE", 400, 50);

        doc
          .fontSize(10)
          .text(`Invoice #: ${invoice.invoice_number}`, 400, 80)
          .text(
            `Date: ${new Date(invoice.issue_date).toLocaleDateString()}`,
            400,
            95,
          )
          .text(
            `Due: ${new Date(invoice.due_date).toLocaleDateString()}`,
            400,
            110,
          );

        // Customer details
        doc.fontSize(12).text("Bill To:", 50, 150);

        doc
          .fontSize(10)
          .text(invoice.customer_name, 50, 170)
          .text(invoice.customer_email, 50, 185);

        // Line items table
        const tableTop = 230;
        const itemX = 50;
        const descriptionX = 200;
        const quantityX = 350;
        const priceX = 420;
        const amountX = 490;

        // Table header
        doc
          .fontSize(10)
          .text("Item", itemX, tableTop)
          .text("Description", descriptionX, tableTop)
          .text("Qty", quantityX, tableTop)
          .text("Price", priceX, tableTop)
          .text("Amount", amountX, tableTop);

        doc
          .moveTo(50, tableTop + 15)
          .lineTo(550, tableTop + 15)
          .stroke();

        // Line items
        const lineItems = JSON.parse(invoice.line_items);
        let y = tableTop + 25;

        lineItems.forEach((item: InvoiceLineItem, i: number) => {
          doc
            .fontSize(10)
            .text(i + 1, itemX, y)
            .text(item.description, descriptionX, y, { width: 140 })
            .text(item.quantity, quantityX, y)
            .text(`$${item.unitPrice.toFixed(2)}`, priceX, y)
            .text(`$${item.amount.toFixed(2)}`, amountX, y);

          y += 25;
        });

        // Totals
        const totalsY = y + 20;

        doc
          .fontSize(10)
          .text("Subtotal:", 400, totalsY)
          .text(`$${parseFloat(invoice.subtotal).toFixed(2)}`, 490, totalsY);

        if (parseFloat(invoice.tax) > 0) {
          doc
            .text("Tax:", 400, totalsY + 20)
            .text(`$${parseFloat(invoice.tax).toFixed(2)}`, 490, totalsY + 20);
        }

        doc
          .fontSize(12)
          .text(
            "Total:",
            400,
            totalsY + (parseFloat(invoice.tax) > 0 ? 40 : 20),
          )
          .text(
            `$${parseFloat(invoice.total).toFixed(2)}`,
            490,
            totalsY + (parseFloat(invoice.tax) > 0 ? 40 : 20),
          );

        // Payment status
        if (invoice.status === "paid") {
          doc
            .fontSize(16)
            .fillColor("green")
            .text("PAID", 250, totalsY + 60);
        }

        // Notes
        if (invoice.notes) {
          doc
            .fontSize(10)
            .fillColor("black")
            .text("Notes:", 50, totalsY + 100)
            .text(invoice.notes, 50, totalsY + 115, { width: 500 });
        }

        // Footer
        doc
          .fontSize(8)
          .text("Thank you for your business!", 50, 700, {
            align: "center",
            width: 500,
          });

        doc.end();

        doc.on("finish", () => {
          resolve(filepath);
        });

        doc.on("error", (error: Error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Create invoice for subscription renewal
   */
  async createSubscriptionInvoice(subscriptionId: string): Promise<any> {
    const subscriptionResult = await pool.query(
      "SELECT * FROM subscriptions WHERE id = $1",
      [subscriptionId],
    );

    if (subscriptionResult.rows.length === 0) {
      throw new Error("Subscription not found");
    }

    const subscription = subscriptionResult.rows[0];

    // Get plan details
    const planResult = await pool.query(
      "SELECT name FROM subscription_plans WHERE id = $1",
      [subscription.plan_id],
    );

    const plan = planResult.rows[0];

    // Create line item
    const lineItems = [
      {
        description: `${plan.name} - ${subscription.billing_cycle} subscription`,
        quantity: 1,
        unitPrice: parseFloat(subscription.amount),
        amount: parseFloat(subscription.amount),
      },
    ];

    return await this.createInvoice({
      userId: subscription.user_id,
      subscriptionId: subscriptionId,
      lineItems,
      dueDate: subscription.current_period_end,
    });
  }

  /**
   * Send invoice email
   */
  async sendInvoiceEmail(invoiceId: string): Promise<void> {
    const invoice = await this.getInvoice(invoiceId);

    // Generate PDF
    const pdfPath = await this.generateInvoicePDF(invoiceId);

    // Send email (integrate with email service)
    console.log(
      `Sending invoice ${invoice.invoice_number} to ${invoice.customer_email}`,
    );
    console.log(`PDF: ${pdfPath}`);

    // Update PDF URL
    await pool.query("UPDATE invoices SET pdf_url = $1 WHERE id = $2", [
      pdfPath,
      invoiceId,
    ]);

    // TODO: Integrate with email service
    // await emailService.send({
    //   to: invoice.customer_email,
    //   subject: `Invoice ${invoice.invoice_number}`,
    //   template: 'invoice',
    //   attachments: [{ filename: `invoice-${invoice.invoice_number}.pdf`, path: pdfPath }]
    // });
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM invoices
       WHERE status = 'open'
         AND due_date < NOW()
       ORDER BY due_date ASC`,
    );

    return result.rows;
  }

  /**
   * Get revenue summary
   */
  async getRevenueSummary(startDate: Date, endDate: Date): Promise<any> {
    const result = await pool.query(
      `SELECT
         COUNT(*) as total_invoices,
         SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_invoices,
         SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_invoices,
         SUM(CASE WHEN status = 'void' THEN 1 ELSE 0 END) as void_invoices,
         SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as total_revenue,
         SUM(CASE WHEN status = 'open' THEN total ELSE 0 END) as outstanding_amount
       FROM invoices
       WHERE created_at >= $1 AND created_at <= $2`,
      [startDate, endDate],
    );

    return result.rows[0];
  }
}

export const invoiceService = new InvoiceService();
