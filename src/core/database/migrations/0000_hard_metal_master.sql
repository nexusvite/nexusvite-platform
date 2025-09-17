CREATE TYPE "public"."app_status" AS ENUM('active', 'inactive', 'pending', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'developer', 'user');--> statement-breakpoint
CREATE TYPE "public"."installation_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "api_routes" (
	"id" text PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"method" text NOT NULL,
	"app_id" text NOT NULL,
	"handler" text NOT NULL,
	"middleware" jsonb DEFAULT '[]' NOT NULL,
	"rate_limit_requests" integer,
	"rate_limit_window_ms" integer,
	"rate_limit_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_categories_name_unique" UNIQUE("name"),
	CONSTRAINT "app_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "app_category_mappings" (
	"id" text PRIMARY KEY NOT NULL,
	"app_id" text NOT NULL,
	"category_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"app_id" text NOT NULL,
	"version" text NOT NULL,
	"manifest" jsonb NOT NULL,
	"changelog" text,
	"download_url" text,
	"file_size" text,
	"checksum" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "apps" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"version" text NOT NULL,
	"description" text NOT NULL,
	"author" text NOT NULL,
	"developer_id" text NOT NULL,
	"manifest" jsonb NOT NULL,
	"status" "app_status" DEFAULT 'pending' NOT NULL,
	"permissions" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "developers" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"company_name" text,
	"website" text,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" timestamp,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"session_token" text NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"name" text NOT NULL,
	"avatar" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "installations" (
	"id" text PRIMARY KEY NOT NULL,
	"app_id" text NOT NULL,
	"user_id" text NOT NULL,
	"settings" jsonb DEFAULT '{}' NOT NULL,
	"status" "installation_status" DEFAULT 'active' NOT NULL,
	"installed_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_providers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"client_id" text NOT NULL,
	"client_secret" text NOT NULL,
	"redirect_uri" text NOT NULL,
	"scopes" jsonb DEFAULT '[]' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_providers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "api_routes" ADD CONSTRAINT "api_routes_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_category_mappings" ADD CONSTRAINT "app_category_mappings_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_category_mappings" ADD CONSTRAINT "app_category_mappings_category_id_app_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."app_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_versions" ADD CONSTRAINT "app_versions_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "developers" ADD CONSTRAINT "developers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installations" ADD CONSTRAINT "installations_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installations" ADD CONSTRAINT "installations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;