import { sendEmail } from '../email/email.service';

const CONTACT_RECIPIENTS = ['admin@closingengage.com'];

export interface ContactMessageInput {
  fullName: string;
  email: string;
  company: string;
  subject: string;
  message: string;
}

export const submitContactMessage = async (input: ContactMessageInput) => {
  const safeSubject = input.subject.trim();
  const safeMessage = input.message.trim();

  await sendEmail({
    to: CONTACT_RECIPIENTS,
    replyTo: input.email,
    subject: `Website Contact: ${safeSubject}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Full Name:</strong> ${input.fullName}</p>
      <p><strong>Email:</strong> ${input.email}</p>
      <p><strong>Company:</strong> ${input.company}</p>
      <p><strong>Subject:</strong> ${safeSubject}</p>
      <p><strong>Message:</strong></p>
      <p>${safeMessage.replace(/\n/g, '<br />')}</p>
    `,
    text: [
      'New Contact Form Submission',
      `Full Name: ${input.fullName}`,
      `Email: ${input.email}`,
      `Company: ${input.company}`,
      `Subject: ${safeSubject}`,
      'Message:',
      safeMessage,
    ].join('\n'),
  });

  return {
    deliveredTo: CONTACT_RECIPIENTS,
  };
};
