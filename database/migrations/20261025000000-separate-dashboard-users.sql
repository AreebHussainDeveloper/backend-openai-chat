BEGIN;

CREATE TYPE "dashboard_users_role_enum" AS ENUM ('ADMIN', 'STAFF');

CREATE TABLE "dashboard_users" (
  "id" SERIAL NOT NULL,
  "email" character varying(255) NOT NULL,
  "fullName" character varying(100) NOT NULL,
  "password" character varying NOT NULL,
  "role" "dashboard_users_role_enum" NOT NULL DEFAULT 'STAFF',
  "resetTokenHash" character varying,
  "resetTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
  "refreshTokenHash" character varying,
  "refreshTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "deletedAt" TIMESTAMP WITH TIME ZONE,
  CONSTRAINT "PK_a34bdf209c625b674f61a9a60dc" PRIMARY KEY ("id"),
  CONSTRAINT "UQ_b4a03b68226a75355db8a2a4037" UNIQUE ("email")
);

INSERT INTO "dashboard_users" (
  "id",
  "email",
  "fullName",
  "password",
  "role",
  "resetTokenHash",
  "resetTokenExpiresAt",
  "refreshTokenHash",
  "refreshTokenExpiresAt",
  "createdAt",
  "updatedAt",
  "deletedAt"
)
SELECT
  "id",
  "email",
  "fullName",
  "password",
  "role"::text::"dashboard_users_role_enum",
  "resetTokenHash",
  "resetTokenExpiresAt",
  "refreshTokenHash",
  "refreshTokenExpiresAt",
  "createdAt",
  "updatedAt",
  "deletedAt"
FROM "users"
WHERE "role"::text IN ('ADMIN', 'STAFF');

DELETE FROM "users"
WHERE "role"::text IN ('ADMIN', 'STAFF');

SELECT setval(
  pg_get_serial_sequence('"dashboard_users"', 'id'),
  COALESCE(MAX("id"), 1),
  MAX("id") IS NOT NULL
)
FROM "dashboard_users";

ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TYPE "users_role_enum" RENAME TO "users_role_enum_old";
CREATE TYPE "users_role_enum" AS ENUM ('CUSTOMER');

ALTER TABLE "users"
  ALTER COLUMN "role" TYPE "users_role_enum"
  USING (
    CASE "role"::text
      WHEN 'USER' THEN 'CUSTOMER'
      ELSE "role"::text
    END
  )::"users_role_enum";

ALTER TABLE "users"
  ALTER COLUMN "role" SET DEFAULT 'CUSTOMER'::"users_role_enum";

DROP TYPE "users_role_enum_old";

COMMIT;
