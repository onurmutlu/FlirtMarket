CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"regular_user_id" integer NOT NULL,
	"performer_id" integer NOT NULL,
	"last_message_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"recipient_id" integer NOT NULL,
	"content" text NOT NULL,
	"cost" integer,
	"read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"amount" integer NOT NULL,
	"description" text,
	"related_user_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"telegram_id" text NOT NULL,
	"username" text,
	"first_name" text NOT NULL,
	"last_name" text,
	"type" text DEFAULT 'regular' NOT NULL,
	"coins" integer DEFAULT 0 NOT NULL,
	"profile_photo" text,
	"bio" text,
	"location" text,
	"interests" jsonb DEFAULT '[]'::jsonb,
	"age" integer,
	"rating" real DEFAULT 0,
	"referral_code" text,
	"referred_by" text,
	"message_price" integer,
	"response_rate" real,
	"response_time" integer,
	"created_at" timestamp DEFAULT now(),
	"last_active" timestamp DEFAULT now(),
	CONSTRAINT "users_telegram_id_unique" UNIQUE("telegram_id"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
