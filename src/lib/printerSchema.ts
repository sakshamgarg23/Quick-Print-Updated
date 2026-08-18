import { z } from 'zod';

export const printerInputSchema = z.object({
  printerName: z.string().trim().min(1, 'Printer name is required'),
  printerEmail: z.string().trim().toLowerCase().email('Enter a valid email'),
  location: z.string().trim().optional(),
  description: z.string().trim().optional(),
  status: z.enum(['active', 'offline']).default('active'),
  priceBwSingle: z.number().min(0),
  priceBwDouble: z.number().min(0),
  priceColorSingle: z.number().min(0),
  priceColorDouble: z.number().min(0),
  supportsColor: z.boolean(),
  supportsDoubleSided: z.boolean(),
  supportedPageSizes: z.array(z.string()).min(1, 'Select at least one page size'),
});

export type PrinterInput = z.infer<typeof printerInputSchema>;
