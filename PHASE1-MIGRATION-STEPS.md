# Phase 1: GPS Telematics - Migration Steps

## ✅ COMPLETED
- [x] Updated Prisma schema with GPS coordinates (schema.prisma lines 267-270)
- [x] Created safe git backup (commit: 4435272)
- [x] Created feature branch: `feature/phase1-gps-telematics`

## ⚠️ REQUIRES MANUAL ACTION

### Step 1: Run Database Migration

The Prisma schema has been updated with GPS coordinates. You need to run the migration in your terminal:

```bash
# Navigate to project directory
cd C:\Users\EVAD\.claude\projects\I-Ticket

# Run migration (this will create and apply the migration)
npx prisma migrate dev --name add_gps_coordinates_to_cities
```

This will:
- Add `latitude`, `longitude`, and `timezone` columns to the `City` table
- Create an index on `[latitude, longitude]` for performance
- Update Prisma Client types

**Expected Output:**
```
Applying migration `20260110XXXXXX_add_gps_coordinates_to_cities`
The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20260110XXXXXX_add_gps_coordinates_to_cities/
    └─ migration.sql

✔ Generated Prisma Client
```

### Step 2: Seed Major Ethiopian Cities (Optional but Recommended)

After migration, you can seed GPS coordinates for major cities:

```bash
# Create seed script
node -e "require('./scripts/seed-city-coordinates.js')"
```

Or manually update via SQL:
```sql
-- Addis Ababa
UPDATE "City" SET latitude = 9.0220, longitude = 38.7468, timezone = 'Africa/Addis_Ababa' WHERE name = 'Addis Ababa';

-- Dire Dawa
UPDATE "City" SET latitude = 9.6010, longitude = 41.8661, timezone = 'Africa/Addis_Ababa' WHERE name = 'Dire Dawa';

-- Bahir Dar
UPDATE "City" SET latitude = 11.5940, longitude = 37.3903, timezone = 'Africa/Addis_Ababa' WHERE name = 'Bahir Dar';

-- Hawassa
UPDATE "City" SET latitude = 7.0620, longitude = 38.4760, timezone = 'Africa/Addis_Ababa' WHERE name = 'Hawassa';

-- Mekelle
UPDATE "City" SET latitude = 13.4967, longitude = 39.4753, timezone = 'Africa/Addis_Ababa' WHERE name = 'Mekelle';

-- Gondar
UPDATE "City" SET latitude = 12.6000, longitude = 37.4667, timezone = 'Africa/Addis_Ababa' WHERE name = 'Gondar';

-- Jimma
UPDATE "City" SET latitude = 7.6773, longitude = 36.8344, timezone = 'Africa/Addis_Ababa' WHERE name = 'Jimma';

-- Adama (Nazret)
UPDATE "City" SET latitude = 8.5400, longitude = 39.2700, timezone = 'Africa/Addis_Ababa' WHERE name = 'Adama' OR name = 'Nazret';

-- Dessie
UPDATE "City" SET latitude = 11.1300, longitude = 39.6333, timezone = 'Africa/Addis_Ababa' WHERE name = 'Dessie';

-- Jijiga
UPDATE "City" SET latitude = 9.3500, longitude = 42.8000, timezone = 'Africa/Addis_Ababa' WHERE name = 'Jijiga';
```

## 🚀 NEXT STEPS (Claude Code is handling these)

After you run the migration:
1. Install GPX dependencies (`fast-xml-parser`, `@types/geojson`)
2. Create GPX generator utility (`src/lib/osmand/gpx-generator.ts`)
3. Build trip GPX export API (`src/app/api/trips/[tripId]/export-gpx/route.ts`)
4. Create OsmAnd UI components
5. Add "Download Route" and "Open in OsmAnd" buttons to booking pages

## 📝 NOTES

- **Breaking changes**: None (all new fields are optional)
- **Rollback**: `git checkout master` to return to safe state
- **Data safety**: Migration is additive only (no data loss)

---

**After running the migration, let me know and I'll continue with the implementation!**
