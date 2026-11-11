import { captureHashToken } from "@/lib/tokens/hash-token";

// Runs before the app is interactive. Keep this first: any analytics or error reporting
// added below must never see a URL that still carries an emailed `#token=…`.
captureHashToken();
