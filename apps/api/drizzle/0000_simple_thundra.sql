CREATE TABLE `teams` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`city` text NOT NULL,
	`founded_year` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
