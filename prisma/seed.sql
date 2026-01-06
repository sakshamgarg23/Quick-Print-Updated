INSERT INTO "User" (id, email, "passwordHash", "fullName", "isVerified")
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'test@example.com', '$2a$12$dummy', 'Test Owner', true);

INSERT INTO "Printer" (
  id, "ownerId", "printerName", "printerEmail", location, 
  "qrCodeUrl", "qrCodeData", status, "supportedPageSizes"
)
VALUES (
  '660e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440000',
  'Test Printer',
  'printer-test@yourdomain.com',
  'Building A, Floor 2',
  'https://example.com/qr.png',
  'http://localhost:3000/print/660e8400-e29b-41d4-a716-446655440000',
  'active',
  ARRAY['A4', 'Letter']
);