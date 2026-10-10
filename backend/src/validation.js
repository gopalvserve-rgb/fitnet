import { z } from 'zod';

// Strip ASCII control characters (keeps \n and \t) and trim.
const clean = (s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
const text = (max) => z.string().max(max * 2).transform(clean).pipe(z.string().max(max));

export const enquirySchema = z
  .object({
    name: text(80).pipe(z.string().min(2, 'Please enter your name')),
    email: z.string().trim().toLowerCase().max(254).email('Please enter a valid email'),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9 ()-]{7,20}$/, 'Please enter a valid phone number'),
    destination: z.enum(['jim-corbett', 'delhi-ncr', 'undecided']),
    wedding_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
      .refine((d) => !Number.isNaN(Date.parse(d)), 'Invalid date')
      .optional()
      .or(z.literal('').transform(() => undefined)),
    guests: z.coerce.number().int().min(1).max(5000).optional(),
    budget: z.enum(['under-20l', '20l-50l', '50l-1cr', 'above-1cr']).optional(),
    message: text(2000).optional(),
    // Honeypot: real users never see or fill this field.
    website: z.string().max(200).optional(),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().max(254).email(),
    password: z.string().min(1).max(200),
  })
  .strict();

export const statusSchema = z
  .object({ status: z.enum(['new', 'contacted', 'booked', 'closed']) })
  .strict();

export const idParam = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);
export const slugParam = z.string().regex(/^[a-z0-9-]{1,80}$/);

export function formatZodError(err) {
  return err.issues.map((i) => ({ field: i.path.join('.') || '(body)', message: i.message }));
}
