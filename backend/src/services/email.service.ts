import nodemailer from 'nodemailer';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: (process.env.SMTP_PASS || '').replace(/\s/g, ''),
  },
});

export const sendInvitationEmail = async (
  email: string,
  password: string,
  role: string
): Promise<void> => {
  const loginUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  const mailOptions = {
    from: `"The Cross Fellowship" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'You have been invited to The Cross Fellowship Admin Dashboard',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
        <img src="cid:logo" alt="The Cross Fellowship Logo" style="width: 100px; margin-bottom: 20px;">
        <h2 style="color: #2563eb;">Welcome to The Cross Fellowship</h2>
        <div style="text-align: left;">
          <p>You have been invited as a <strong>${role === 'super_admin' ? 'Super Admin' : 'Reviewer'}</strong> on The Cross Fellowship Admin Dashboard.</p>
          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${password}</p>
          </div>
          <p style="color: #ef4444;"><strong>⚠️ Please change your password after your first login.</strong></p>
          <p style="color: #6b7280; font-size: 12px;">If you did not expect this invitation, please ignore this email.</p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: 'logo.png',
        path: path.join(__dirname, '../assets/logo/logo.png'),
        cid: 'logo',
      },
    ],
  };

  try {
    console.log(`Attempting to send invitation email to ${email}...`);
    await transporter.sendMail(mailOptions);
    console.log(`Invitation email sent successfully to ${email}`);
  } catch (error) {
    console.error(`Failed to send invitation email to ${email}:`, error);
    throw error;
  }
};
