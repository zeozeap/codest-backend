import { Router, Request, Response } from "express";
import { Resend } from "resend";
import { Contact } from "../models/contact.model";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";

const router = Router();

const resend = new Resend(process.env.RESEND_API_KEY);

router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, subject, message } = req.body;

    const contact = new Contact({
      name,
      email,
      subject,
      message,
    });

    await contact.save();

    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "Codest <noreply@codest.in>",
        to: [process.env.ADMIN_EMAIL || "admin@codest.in"],
        subject: `New Contact: ${subject}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: 'Inter', sans-serif; background: #0a0a1a; color: #f1f5f9; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16162a 100%); border-radius: 16px; padding: 32px; border: 1px solid rgba(0, 210, 255, 0.2); }
              h2 { color: #00d2ff; margin-bottom: 24px; }
              .field { margin-bottom: 16px; }
              .label { color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
              .value { color: #f1f5f9; font-size: 16px; margin-top: 4px; }
              .message-box { background: rgba(0, 210, 255, 0.05); border: 1px solid rgba(0, 210, 255, 0.1); border-radius: 8px; padding: 16px; margin-top: 8px; }
              .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid rgba(0, 210, 255, 0.1); color: #64748b; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>New Contact Message</h2>
              <div class="field">
                <div class="label">From</div>
                <div class="value">${name}</div>
              </div>
              <div class="field">
                <div class="label">Email</div>
                <div class="value">${email}</div>
              </div>
              <div class="field">
                <div class="label">Subject</div>
                <div class="value">${subject}</div>
              </div>
              <div class="field">
                <div class="label">Message</div>
                <div class="message-box">${message.replace(/\n/g, "<br>")}</div>
              </div>
              <div class="footer">
                This message was sent from the Codest contact form.
              </div>
            </div>
          </body>
          </html>
        `,
      });

      await resend.emails.send({
        from: process.env.EMAIL_FROM || "Codest <noreply@codest.in>",
        to: [email],
        subject: `We received your message - ${subject}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: 'Inter', sans-serif; background: #0a0a1a; color: #f1f5f9; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16162a 100%); border-radius: 16px; padding: 32px; border: 1px solid rgba(0, 210, 255, 0.2); }
              h2 { color: #00d2ff; margin-bottom: 16px; }
              p { color: #94a3b8; line-height: 1.6; }
              .highlight { color: #f1f5f9; }
              .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid rgba(0, 210, 255, 0.1); color: #64748b; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Thank you for reaching out!</h2>
              <p>Hi <span class="highlight">${name}</span>,</p>
              <p>We have received your message regarding "<span class="highlight">${subject}</span>" and will get back to you as soon as possible.</p>
              <p>In the meantime, feel free to explore our portfolio at <a href="https://codest.in" style="color: #00d2ff;">codest.in</a>.</p>
              <p>Best regards,<br><span class="highlight">The Codest Team</span></p>
              <div class="footer">
                This is an automated response. Please do not reply to this email.
              </div>
            </div>
          </body>
          </html>
        `,
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }

    res.status(201).json({ message: "Message sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

router.get(
  "/",
  authMiddleware,
  async (_: AuthRequest, res: Response): Promise<void> => {
    try {
      const contacts = await Contact.find().sort({ createdAt: -1 });
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  }
);

router.get(
  "/unread-count",
  authMiddleware,
  async (_: AuthRequest, res: Response): Promise<void> => {
    try {
      const count = await Contact.countDocuments({ isRead: false });
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  }
);

router.patch(
  "/:id/read",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const contact = await Contact.findByIdAndUpdate(
        req.params.id,
        { isRead: true },
        { new: true }
      );
      if (!contact) {
        res.status(404).json({ message: "Contact not found" });
        return;
      }
      res.json(contact);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  }
);

router.delete(
  "/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const contact = await Contact.findByIdAndDelete(req.params.id);
      if (!contact) {
        res.status(404).json({ message: "Contact not found" });
        return;
      }
      res.json({ message: "Contact deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  }
);

router.post(
  "/:id/reply",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { reply } = req.body;
      const contact = await Contact.findById(req.params.id);
      
      if (!contact) {
        res.status(404).json({ message: "Contact not found" });
        return;
      }

      // Send reply email using Resend
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "Codest <noreply@codest.in>",
        to: [contact.email],
        subject: `Re: ${contact.subject}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: 'Inter', sans-serif; background: #0a0a1a; color: #f1f5f9; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16162a 100%); border-radius: 16px; padding: 32px; border: 1px solid rgba(0, 210, 255, 0.2); }
              .message-box { background: rgba(0, 210, 255, 0.05); border: 1px solid rgba(0, 210, 255, 0.1); border-radius: 8px; padding: 16px; margin: 16px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2 style="color: #00d2ff;">Reply to your message</h2>
              <p>Hi ${contact.name},</p>
              <div class="message-box">${reply.replace(/\n/g, "<br>")}</div>
              <p>Best regards,<br>The Codest Team</p>
            </div>
          </body>
          </html>
        `,
      });

      // Update contact with reply
      contact.reply = reply;
      await contact.save();

      res.json({ message: "Reply sent successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  }
);

export default router;
