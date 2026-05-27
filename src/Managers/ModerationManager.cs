using System;
using System.Threading.Tasks;
using Dapper;
using SwiftlyS2.Shared;

namespace Iridium.Managers
{
    public class ModerationManager
    {
        private readonly ISwiftlyCore _core;

        public ModerationManager(ISwiftlyCore core)
        {
            _core = core;
        }

        public async Task AddMuteAsync(ulong steamId, ulong adminSteamId, string reason, int durationMinutes)
        {
            using var connection = _core.Database.GetConnection("iridium");

            var expiresAt = durationMinutes == 0
                ? (DateTime?)null
                : DateTime.UtcNow.AddMinutes(durationMinutes);

            var query = @"
                INSERT INTO `iridium_mutes` (`steam_id`, `admin_steam_id`, `reason`, `duration`, `expires_at`, `is_active`)
                VALUES (@SteamId, @AdminSteamId, @Reason, @Duration, @ExpiresAt, TRUE);";

            await connection.ExecuteAsync(query, new {
                SteamId = steamId.ToString(),
                AdminSteamId = adminSteamId.ToString(),
                Reason = reason,
                Duration = durationMinutes,
                ExpiresAt = expiresAt
            });
        }

        public async Task<bool> UnmuteAsync(ulong steamId)
        {
            using var connection = _core.Database.GetConnection("iridium");
            var query = @"
                UPDATE `iridium_mutes`
                SET `is_active` = FALSE
                WHERE `steam_id` = @SteamId AND `is_active` = TRUE;";

            var affected = await connection.ExecuteAsync(query, new { SteamId = steamId.ToString() });
            return affected > 0;
        }

        public async Task<bool> IsPlayerMutedAsync(ulong steamId)
        {
            using var connection = _core.Database.GetConnection("iridium");
            var query = @"
                SELECT 1 FROM `iridium_mutes`
                WHERE `steam_id` = @SteamId
                  AND `is_active` = TRUE
                  AND (`expires_at` IS NULL OR `expires_at` > UTC_TIMESTAMP())
                LIMIT 1;";

            var result = await connection.ExecuteScalarAsync<int?>(query, new { SteamId = steamId.ToString() });
            return result.HasValue;
        }

        public async Task AddBanAsync(ulong steamId, ulong adminSteamId, string reason, int durationMinutes)
        {
            using var connection = _core.Database.GetConnection("iridium");

            var expiresAt = durationMinutes == 0
                ? (DateTime?)null
                : DateTime.UtcNow.AddMinutes(durationMinutes);

            var query = @"
                INSERT INTO `iridium_bans` (`steam_id`, `admin_steam_id`, `reason`, `duration`, `expires_at`, `is_active`)
                VALUES (@SteamId, @AdminSteamId, @Reason, @Duration, @ExpiresAt, TRUE);";

            await connection.ExecuteAsync(query, new {
                SteamId = steamId.ToString(),
                AdminSteamId = adminSteamId.ToString(),
                Reason = reason,
                Duration = durationMinutes,
                ExpiresAt = expiresAt
            });
        }

        public async Task<bool> UnbanAsync(ulong steamId)
        {
            using var connection = _core.Database.GetConnection("iridium");
            var query = @"
                UPDATE `iridium_bans`
                SET `is_active` = FALSE
                WHERE `steam_id` = @SteamId AND `is_active` = TRUE;";

            var affected = await connection.ExecuteAsync(query, new { SteamId = steamId.ToString() });
            return affected > 0;
        }

        public async Task<bool> IsPlayerBannedAsync(ulong steamId)
        {
            using var connection = _core.Database.GetConnection("iridium");
            var query = @"
                SELECT 1 FROM `iridium_bans`
                WHERE `steam_id` = @SteamId
                  AND `is_active` = TRUE
                  AND (`expires_at` IS NULL OR `expires_at` > UTC_TIMESTAMP())
                LIMIT 1;";

            var result = await connection.ExecuteScalarAsync<int?>(query, new { SteamId = steamId.ToString() });
            return result.HasValue;
        }
    }
}
