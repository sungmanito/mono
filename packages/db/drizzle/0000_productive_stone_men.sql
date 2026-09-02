CREATE TABLE "bill_reminders" (
	"id" text PRIMARY KEY DEFAULT generate_ulid() NOT NULL,
	"bill_id" text NOT NULL,
	"household_id" text NOT NULL,
	"for_month_d" date NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bills" (
	"id" text PRIMARY KEY DEFAULT generate_ulid() NOT NULL,
	"bill_name" text NOT NULL,
	"due_date" integer DEFAULT 16 NOT NULL,
	"household_id" text NOT NULL,
	"notes" text,
	"amount" double precision DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "households" (
	"id" text PRIMARY KEY DEFAULT generate_ulid() NOT NULL,
	"name" text NOT NULL,
	"created_at" date DEFAULT now() NOT NULL,
	"owner_id" uuid,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "invites" (
	"id" text PRIMARY KEY DEFAULT generate_ulid() NOT NULL,
	"to_email" text NOT NULL,
	"to_id" uuid NOT NULL,
	"from_email" text NOT NULL,
	"from_id" uuid NOT NULL,
	"household_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp DEFAULT now() + interval '30 days' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_runs" (
	"id" text PRIMARY KEY DEFAULT generate_ulid() NOT NULL,
	"job_name" text NOT NULL,
	"ran_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created" integer DEFAULT 0 NOT NULL,
	"skipped" integer DEFAULT 0 NOT NULL,
	"duration_ms" integer DEFAULT 0 NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY DEFAULT generate_ulid() NOT NULL,
	"bill_id" text NOT NULL,
	"paid_at" timestamp with time zone,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"for_month_d" date NOT NULL,
	"notes" text,
	"proof_image_id" uuid,
	"amount" numeric(12, 6),
	"household_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users_to_households" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"household_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bill_reminders" ADD CONSTRAINT "bill_reminders_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_reminders" ADD CONSTRAINT "bill_reminders_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "households" ADD CONSTRAINT "households_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_to_id_users_id_fk" FOREIGN KEY ("to_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_from_id_users_id_fk" FOREIGN KEY ("from_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_proof_image_id_objects_id_fk" FOREIGN KEY ("proof_image_id") REFERENCES "storage"."objects"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_households" ADD CONSTRAINT "users_to_households_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "users_to_households" ADD CONSTRAINT "users_to_households_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bill_reminder_bill_month_idx" ON "bill_reminders" USING btree ("bill_id","for_month_d");--> statement-breakpoint
CREATE INDEX "bill_reminder_household_idx" ON "bill_reminders" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "household_idx" ON "bills" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "name_index" ON "households" USING btree ("name");--> statement-breakpoint
CREATE INDEX "owner_id" ON "households" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "updated_at_idx" ON "households" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "to_id_idx" ON "invites" USING btree ("to_id");--> statement-breakpoint
CREATE INDEX "from_id_idx" ON "invites" USING btree ("from_id");--> statement-breakpoint
CREATE INDEX "invites_household_idx" ON "invites" USING btree ("household_id");--> statement-breakpoint
CREATE UNIQUE INDEX "billId_month" ON "payments" USING btree ("bill_id","for_month_d");--> statement-breakpoint
CREATE INDEX "month_idx" ON "payments" USING btree ("for_month_d");--> statement-breakpoint
CREATE UNIQUE INDEX "proof_image_idx" ON "payments" USING btree ("proof_image_id");--> statement-breakpoint
CREATE INDEX "payment_household_idx" ON "payments" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "household_user_id_index" ON "users_to_households" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "household_household_id_index" ON "users_to_households" USING btree ("household_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_id_household_id_index" ON "users_to_households" USING btree ("user_id","household_id");