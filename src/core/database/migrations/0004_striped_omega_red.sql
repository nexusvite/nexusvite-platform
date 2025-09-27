CREATE TABLE "api_key_usage" (
	"id" text PRIMARY KEY DEFAULT 'gen_random_uuid()' NOT NULL,
	"api_key_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"method" text NOT NULL,
	"status_code" text,
	"ip_address" text,
	"user_agent" text,
	"request_id" text,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" text PRIMARY KEY DEFAULT 'gen_random_uuid()' NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"key" text NOT NULL,
	"hashed_key" text,
	"prefix" text NOT NULL,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"active" boolean DEFAULT true,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "api_keys_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "webhook_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"webhook_id" text NOT NULL,
	"event" text NOT NULL,
	"status" text NOT NULL,
	"status_code" text,
	"request" jsonb NOT NULL,
	"response" jsonb,
	"error" text,
	"duration" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhooks" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"url" text NOT NULL,
	"secret" text,
	"events" jsonb NOT NULL,
	"headers" jsonb,
	"active" boolean DEFAULT true,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration_logs" (
	"id" text PRIMARY KEY DEFAULT 'gen_random_uuid()' NOT NULL,
	"integration_id" text NOT NULL,
	"event" text NOT NULL,
	"status" text NOT NULL,
	"message" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "integration_providers" (
	"id" text PRIMARY KEY DEFAULT 'gen_random_uuid()' NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"logo" text,
	"auth_type" text NOT NULL,
	"config_schema" jsonb NOT NULL,
	"features" jsonb DEFAULT '[]'::jsonb,
	"documentation" text,
	"available" boolean DEFAULT true,
	"beta" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "integration_providers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" text PRIMARY KEY DEFAULT 'gen_random_uuid()' NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"provider" text NOT NULL,
	"category" text NOT NULL,
	"logo" text,
	"status" text DEFAULT 'disconnected' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"credentials" jsonb DEFAULT '{}'::jsonb,
	"webhook_url" text,
	"last_sync_at" timestamp,
	"active" boolean DEFAULT true,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "node_templates" (
	"id" text PRIMARY KEY DEFAULT 'gen_random_uuid()' NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"sub_type" text NOT NULL,
	"icon" text,
	"default_config" jsonb DEFAULT '{}'::jsonb,
	"input_schema" jsonb DEFAULT '{}'::jsonb,
	"output_schema" jsonb DEFAULT '{}'::jsonb,
	"category" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workflow_connections" (
	"id" text PRIMARY KEY DEFAULT 'gen_random_uuid()' NOT NULL,
	"workflow_id" text NOT NULL,
	"connection_id" text NOT NULL,
	"source_node_id" text NOT NULL,
	"target_node_id" text NOT NULL,
	"source_handle" text,
	"target_handle" text,
	"label" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workflow_executions" (
	"id" text PRIMARY KEY DEFAULT 'gen_random_uuid()' NOT NULL,
	"workflow_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"trigger_data" jsonb DEFAULT '{}'::jsonb,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"duration" integer,
	"error" text,
	"logs" jsonb DEFAULT '[]'::jsonb,
	"node_executions" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "workflow_nodes" (
	"id" text PRIMARY KEY DEFAULT 'gen_random_uuid()' NOT NULL,
	"workflow_id" text NOT NULL,
	"node_id" text NOT NULL,
	"type" text NOT NULL,
	"sub_type" text NOT NULL,
	"label" text NOT NULL,
	"position_x" integer NOT NULL,
	"position_y" integer NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"inputs" jsonb DEFAULT '{}'::jsonb,
	"outputs" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workflow_templates" (
	"id" text PRIMARY KEY DEFAULT 'gen_random_uuid()' NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"icon" text,
	"template_data" jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"featured" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workflows" (
	"id" text PRIMARY KEY DEFAULT 'gen_random_uuid()' NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"canvas_state" jsonb DEFAULT '{}'::jsonb,
	"active" boolean DEFAULT false,
	"trigger_type" text,
	"schedule" text,
	"webhook_path" text,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "api_key_usage" ADD CONSTRAINT "api_key_usage_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_logs" ADD CONSTRAINT "webhook_logs_webhook_id_webhooks_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."webhooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_logs" ADD CONSTRAINT "integration_logs_integration_id_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_connections" ADD CONSTRAINT "workflow_connections_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_nodes" ADD CONSTRAINT "workflow_nodes_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;