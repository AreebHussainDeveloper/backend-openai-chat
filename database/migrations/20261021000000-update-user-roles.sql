BEGIN;

ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;

ALTER TYPE "users_role_enum" RENAME TO "users_role_enum_old";

CREATE TYPE "users_role_enum" AS ENUM ('CUSTOMER', 'ADMIN', 'STAFF');

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
