# Phase 2: Predictive Maintenance - Migration Steps

## ✅ COMPLETED
- [x] Extended Vehicle model with 30+ operational data fields
- [x] Created 6 new maintenance-related models
- [x] Added performance indexes for queries

## ⚠️ REQUIRES MANUAL ACTION

### Step 1: Run Database Migration

```bash
# Navigate to project directory
cd C:\Users\EVAD\.claude\projects\I-Ticket

# Run migration
npx prisma migrate dev --name add_predictive_maintenance_system
```

This will:
- Add 30+ columns to Vehicle table (all nullable/defaulted - no data loss)
- Create 6 new tables: MaintenanceSchedule, WorkOrder, WorkOrderPart, VehicleInspection, FuelEntry, OdometerLog
- Add performance indexes for maintenance queries
- Update Prisma Client types

**Expected Output:**
```
Applying migration `20260110XXXXXX_add_predictive_maintenance_system`
✔ Generated Prisma Client
```

### Step 2: Verify Migration

```bash
# Check migration status
npx prisma migrate status

# Should show: "Database schema is up to date!"
```

---

## 📊 Schema Changes Summary

### Vehicle Model - New Fields

**Operational Data:**
- `currentOdometer` - Current mileage in km
- `odometerLastUpdated` - Last odometer update timestamp
- `engineHours` - Total engine runtime hours
- `fuelCapacity` - Tank capacity in liters
- `fuelType` - DIESEL, PETROL, CNG, ELECTRIC

**Performance Metrics:**
- `utilizationRate` - % of time vehicle is on trips
- `avgSpeedKmh` - Average speed from GPS
- `idleTimePercentage` - % of engine time idling
- `fuelEfficiencyL100km` - Liters per 100 km

**Cost Tracking:**
- `costPerKm` - Total cost per km (calculated)
- `revenuePerKm` - Revenue per km from bookings
- `fuelCostMTD/YTD` - Fuel costs month/year-to-date
- `maintenanceCostMTD/YTD` - Maintenance costs month/year-to-date

**AI Predictions:**
- `maintenanceRiskScore` - 0-100 AI risk score
- `predictedFailureDate` - When AI predicts next failure
- `predictedFailureType` - Engine, Brake, Transmission, etc.
- `lastPredictionUpdate` - When AI last ran

**Inspection Tracking:**
- `lastInspectionDate` - Last safety inspection
- `inspectionDueDate` - Next inspection due
- `defectCount` - Open defects count
- `criticalDefectCount` - Critical defects requiring immediate attention

### New Models

**MaintenanceSchedule:**
- Automated preventive maintenance scheduling
- Mileage-based OR time-based triggers
- Auto-creates work orders when due
- Tracks last completion and next due date/mileage

**WorkOrder:**
- Complete work order management
- Status tracking (OPEN → IN_PROGRESS → COMPLETED)
- Cost tracking (labor + parts)
- Assignment to mechanics or external shops
- Links to maintenance schedules

**WorkOrderPart:**
- Parts used in work orders
- Quantity, price, supplier tracking
- Auto-deducts from inventory (future feature)

**VehicleInspection:**
- Digital inspection checklists
- Pass/Fail/Pass-with-defects status
- JSON-based flexible checklist results
- Links to work orders for defect resolution

**FuelEntry:**
- Fuel consumption tracking
- Calculates fuel efficiency (L/100km)
- Cost tracking with receipts
- Station and payment method tracking

**OdometerLog:**
- Accurate odometer tracking
- Multiple sources (manual, GPS, fuel entries, work orders)
- Historical odometer readings for analytics

---

## 🔍 Performance Indexes Added

New indexes for fast queries:
- `Vehicle.maintenanceRiskScore` - Find high-risk vehicles
- `Vehicle.inspectionDueDate` - Compliance alerts
- `Vehicle.predictedFailureDate` - Proactive maintenance
- `Vehicle.currentOdometer` - Mileage-based scheduling
- `MaintenanceSchedule.[vehicleId, nextDueDate]` - Due schedules
- `WorkOrder.[status, priority]` - Active work orders
- `FuelEntry.[vehicleId, createdAt]` - Fuel analytics
- And 10+ more...

---

## 📝 Migration Safety

**Data Safety:**
- ✅ All new Vehicle fields are **nullable or have defaults**
- ✅ **No data loss** will occur
- ✅ Existing vehicles will have NULL values (can be populated later)
- ✅ New models are empty (no existing data affected)

**Rollback:**
```bash
# If issues occur, rollback is simple:
git checkout feature/phase1-gps-telematics

# Or revert migration:
npx prisma migrate reset
```

---

## 🚀 Next Steps (After Migration)

After successful migration, Phase 2 implementation continues with:

1. **AI Predictive Maintenance Algorithm** - Risk scoring engine
2. **Maintenance APIs** - CRUD for schedules, work orders, inspections
3. **Fuel Management APIs** - Fuel entry tracking and analytics
4. **Vehicle Health Dashboard** - UI for at-a-glance status
5. **Automated Cron Job** - Daily risk score updates and auto work orders

---

## 🧪 Testing the Migration

After migration, verify tables exist:

```sql
-- Check new tables
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('MaintenanceSchedule', 'WorkOrder', 'FuelEntry', 'VehicleInspection', 'OdometerLog', 'WorkOrderPart');

-- Check Vehicle table has new columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'Vehicle'
AND column_name IN ('currentOdometer', 'maintenanceRiskScore', 'fuelEfficiencyL100km');
```

---

**After running the migration, let me know and I'll continue with the AI algorithm implementation!**
