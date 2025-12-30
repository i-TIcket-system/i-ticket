import { z } from "zod";

// Phone number validation for Ethiopian format
const ethiopianPhone = z.string().regex(/^09\d{8}$/, "Invalid Ethiopian phone number (must be 09XXXXXXXX)");

// Trip validations
export const createTripSchema = z.object({
  origin: z.string().min(2, "Origin must be at least 2 characters"),
  destination: z.string().min(2, "Destination must be at least 2 characters"),
  route: z.string().optional().nullable(),
  intermediateStops: z.string().optional().nullable(),
  departureTime: z.string().datetime().refine((date) => new Date(date) > new Date(), {
    message: "Departure time must be in the future",
  }),
  estimatedDuration: z.number().int().positive("Duration must be positive"),
  price: z.number().positive("Price must be positive").max(100000, "Price seems too high"),
  busType: z.string().min(2, "Bus type is required"),
  totalSlots: z.number().int().positive("Total slots must be positive").max(100, "Too many slots"),
  hasWater: z.boolean().optional().default(false),
  hasFood: z.boolean().optional().default(false),
  driverId: z.string().optional().nullable(),
  conductorId: z.string().optional().nullable(),
  manualTicketerId: z.string().optional().nullable(),
  vehicleId: z.string().optional().nullable(),
});

export const updateTripSchema = createTripSchema.partial();

export const searchTripsSchema = z.object({
  origin: z.string().optional(),
  destination: z.string().optional(),
  date: z.string().optional(),
  page: z.string().optional().transform((val) => parseInt(val || "1", 10)),
  limit: z.string().optional().transform((val) => parseInt(val || "20", 10)),
});

// Booking validations
export const createBookingSchema = z.object({
  tripId: z.string().min(1, "Trip ID is required"),
  passengers: z.array(
    z.object({
      name: z.string().min(2, "Passenger name must be at least 2 characters"),
      nationalId: z.string().min(5, "National ID is required"),
      phone: ethiopianPhone,
      specialNeeds: z.string().optional(),
    })
  ).min(1, "At least one passenger is required").max(10, "Maximum 10 passengers per booking"),
});

// Payment validations
export const processPaymentSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  method: z.enum(["TELEBIRR", "DEMO"], { message: "Invalid payment method" }),
  phone: ethiopianPhone.optional(),
});

// User validations
export const registerUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: ethiopianPhone,
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  nationalId: z.string().optional(),
  nextOfKinName: z.string().optional(),
  nextOfKinPhone: ethiopianPhone.optional().or(z.literal("")),
});

export const loginSchema = z.object({
  phone: ethiopianPhone,
  password: z.string().min(1, "Password is required"),
});

// Ticket verification
export const verifyTicketSchema = z.object({
  code: z.string().min(6, "Ticket code must be at least 6 characters"),
});

// Password reset
export const requestPasswordResetSchema = z.object({
  phone: ethiopianPhone,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// Company validations
export const createCompanySchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  phones: z.array(ethiopianPhone).min(1, "At least one phone number is required"),
  logo: z.string().url("Invalid logo URL").optional(),
});

export const updateCompanySchema = createCompanySchema.partial();

// Vehicle validations
const currentYear = new Date().getFullYear();

// Ethiopian plate number format validation
// Common formats: "3-12345", "AA-12345", etc.
const ethiopianPlateNumber = z.string()
  .min(5, "Plate number too short")
  .max(15, "Plate number too long")
  .regex(/^[A-Z0-9]{1,3}-\d{4,6}$|^[A-Z0-9\s]{5,15}$/,
    "Invalid plate format (e.g., '3-12345' or 'AA 12345')")
  .transform(val => val.toUpperCase().trim());

// Side number can be flexible format
const sideNumber = z.string()
  .min(1, "Side number too short")
  .max(10, "Side number too long")
  .regex(/^[A-Z0-9\s-]+$/i, "Side number can only contain letters, numbers, spaces, and hyphens")
  .transform(val => val.toUpperCase().trim())
  .optional()
  .or(z.literal(""));

export const createVehicleSchema = z.object({
  plateNumber: ethiopianPlateNumber,
  sideNumber: sideNumber,
  make: z.string().min(2, "Make must be at least 2 characters").max(50, "Make too long"),
  model: z.string().min(2, "Model must be at least 2 characters").max(50, "Model too long"),
  year: z.number()
    .int("Year must be a whole number")
    .min(1990, "Year must be 1990 or later")
    .max(currentYear + 1, `Year cannot be later than ${currentYear + 1}`),
  busType: z.enum(["MINI", "STANDARD", "LUXURY"], {
    errorMap: () => ({ message: "Invalid bus type" })
  }),
  color: z.string().min(2, "Color too short").max(30, "Color too long").optional().or(z.literal("")),
  totalSeats: z.number()
    .int("Seats must be a whole number")
    .positive("Seats must be positive")
    .min(4, "Minimum 4 seats")
    .max(100, "Maximum 100 seats"),
  status: z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE"]).default("ACTIVE"),
  registrationExpiry: z.string().datetime().optional().nullable(),
  insuranceExpiry: z.string().datetime().optional().nullable(),
  lastServiceDate: z.string().datetime().optional().nullable(),
  nextServiceDate: z.string().datetime().optional().nullable(),
});

export const updateVehicleSchema = createVehicleSchema.partial().extend({
  // Plate number cannot be changed after creation (immutable)
  plateNumber: z.never().optional(),
});

// Helper function to validate and parse request body
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const errors = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      return { success: false, error: errors };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: "Invalid JSON in request body" };
  }
}

// Helper for query params
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  const params = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(params);

  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    return { success: false, error: errors };
  }

  return { success: true, data: result.data };
}
