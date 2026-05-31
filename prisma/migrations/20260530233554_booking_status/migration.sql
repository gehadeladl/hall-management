-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hallId" TEXT NOT NULL,
    "bookingDate" DATETIME NOT NULL,
    "groomName" TEXT NOT NULL,
    "brideName" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT,
    "depositAmount" REAL NOT NULL,
    "totalAmount" REAL NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "Booking_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "Hall" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Booking_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("bookingDate", "brideName", "createdAt", "createdById", "customerName", "depositAmount", "groomName", "hallId", "id", "notes", "phone", "totalAmount") SELECT "bookingDate", "brideName", "createdAt", "createdById", "customerName", "depositAmount", "groomName", "hallId", "id", "notes", "phone", "totalAmount" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE UNIQUE INDEX "Booking_hallId_bookingDate_key" ON "Booking"("hallId", "bookingDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
