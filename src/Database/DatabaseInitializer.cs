using System.Threading.Tasks;
using Dapper;
using SwiftlyS2.Shared;

namespace Iridium.Database
{
    public static class DatabaseInitializer
    {
        public static async Task InitializeAsync(ISwiftlyCore core)
        {
            var dbService = core.Database;

            // Using the "iridium" connection if available, otherwise falls back to default
            using var connection = dbService.GetConnection("iridium");

            // Open connection explicitly if necessary
            // In Dapper/ADO.NET, it's often opened implicitly by ExecuteAsync or we should open it manually if required
            // Let's just execute the table creation queries directly.

            var createMutesTable = @"
                CREATE TABLE IF NOT EXISTS `iridium_mutes` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `steam_id` VARCHAR(32) NOT NULL,
                    `admin_steam_id` VARCHAR(32) NOT NULL,
                    `reason` VARCHAR(255) NOT NULL,
                    `duration` INT NOT NULL,
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    `expires_at` TIMESTAMP NULL,
                    `is_active` BOOLEAN DEFAULT TRUE,
                    INDEX (`steam_id`),
                    INDEX (`is_active`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

            var createBansTable = @"
                CREATE TABLE IF NOT EXISTS `iridium_bans` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `steam_id` VARCHAR(32) NOT NULL,
                    `admin_steam_id` VARCHAR(32) NOT NULL,
                    `reason` VARCHAR(255) NOT NULL,
                    `duration` INT NOT NULL,
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    `expires_at` TIMESTAMP NULL,
                    `is_active` BOOLEAN DEFAULT TRUE,
                    INDEX (`steam_id`),
                    INDEX (`is_active`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

            var createDashboardSessionsTable = @"
                CREATE TABLE IF NOT EXISTS `iridium_dashboard_sessions` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `steam_id` VARCHAR(32) NOT NULL,
                    `token` VARCHAR(128) NOT NULL,
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    `expires_at` TIMESTAMP NULL,
                    `is_active` BOOLEAN DEFAULT TRUE,
                    INDEX (`steam_id`),
                    INDEX (`token`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

            await connection.ExecuteAsync(createMutesTable);
            await connection.ExecuteAsync(createBansTable);
            await connection.ExecuteAsync(createDashboardSessionsTable);
        }
    }
}
