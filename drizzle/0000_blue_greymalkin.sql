CREATE TABLE `user_sync` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sync_code` text NOT NULL,
	`pin_hash` text NOT NULL,
	`data` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_sync_sync_code_unique` ON `user_sync` (`sync_code`);