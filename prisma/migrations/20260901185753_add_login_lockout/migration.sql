-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "departmentId" TEXT,
    "title" TEXT,
    "maxLoad" INTEGER NOT NULL DEFAULT 15,
    "matricNumber" TEXT,
    "staffId" TEXT,
    "activationToken" TEXT,
    "pendingSupervisorId" TEXT,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "meetingReminders" BOOLEAN NOT NULL DEFAULT true,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("activationToken", "createdAt", "departmentId", "email", "id", "matricNumber", "maxLoad", "meetingReminders", "name", "notificationsEnabled", "passwordHash", "pendingSupervisorId", "role", "staffId", "status", "title") SELECT "activationToken", "createdAt", "departmentId", "email", "id", "matricNumber", "maxLoad", "meetingReminders", "name", "notificationsEnabled", "passwordHash", "pendingSupervisorId", "role", "staffId", "status", "title" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_matricNumber_key" ON "User"("matricNumber");
CREATE UNIQUE INDEX "User_staffId_key" ON "User"("staffId");
CREATE UNIQUE INDEX "User_activationToken_key" ON "User"("activationToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
