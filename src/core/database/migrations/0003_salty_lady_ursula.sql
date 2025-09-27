CREATE TABLE "developer_entities" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"table_name" text NOT NULL,
	"description" text,
	"fields" jsonb NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "developer_entities_table_name_unique" UNIQUE("table_name")
);
--> statement-breakpoint
CREATE TABLE "developer_entity_data" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_id" text NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "developer_entity_data" ADD CONSTRAINT "developer_entity_data_entity_id_developer_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."developer_entities"("id") ON DELETE cascade ON UPDATE no action;