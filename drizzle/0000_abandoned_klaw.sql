CREATE TABLE `projects` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`url` text,
	`short_url` text,
	`status` text,
	`country` text,
	`category_id` integer,
	`min_budget` real DEFAULT 0,
	`max_budget` real DEFAULT 0,
	`budget` real DEFAULT 0,
	`duration` integer DEFAULT 0,
	`rating` real DEFAULT 0,
	`rating_count` integer DEFAULT 0,
	`bids` integer DEFAULT 0,
	`urgent` integer DEFAULT 0,
	`fulltime` integer DEFAULT 0,
	`onsite` integer DEFAULT 0,
	`highlight` integer DEFAULT 0,
	`ladder` integer DEFAULT 0,
	`pin` integer DEFAULT 0,
	`multi` integer DEFAULT 0,
	`low_hire` integer DEFAULT 0,
	`expired` integer DEFAULT 0,
	`success_rate` real DEFAULT 0,
	`skills` text,
	`past_time` text,
	`user_id` integer,
	`token` integer,
	`fetched_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
