CREATE TABLE IF NOT EXISTS "bills" (
	"id" text PRIMARY KEY NOT NULL,
	"bill_name" text NOT NULL,
	"due_date" integer DEFAULT 16 NOT NULL,
	"household_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "households" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payments" (
	"id" text NOT NULL,
	"proof" text,
	"paid_at" date NOT NULL,
	"created_at" date DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth"."users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users_to_households" (
	"user_id" uuid NOT NULL,
	"household_id" text NOT NULL,
	anar
);
