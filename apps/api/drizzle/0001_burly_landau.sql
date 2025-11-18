CREATE INDEX "refresh_tokens_user_id_expires_at_idx" ON "refresh_tokens" USING btree ("user_id","expires_at");--> statement-breakpoint
CREATE INDEX "teams_created_at_idx" ON "teams" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "users_role_created_at_idx" ON "users" USING btree ("role","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at" DESC NULLS LAST);