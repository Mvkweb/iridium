using System;
using System.Collections.Generic;
using System.Linq;
using SwiftlyS2.Shared;
using SwiftlyS2.Shared.Players;

namespace Iridium.Utils
{
    public static class PlayerUtils
    {
        /// <summary>
        /// Finds a list of players matching the target string.
        /// Supports @all, @me, and partial name matching.
        /// </summary>
        public static List<IPlayer> FindPlayersByTarget(ISwiftlyCore core, IPlayer? sender, string targetString)
        {
            var allPlayers = core.PlayerManager.GetAllPlayers().Where(p => p.IsValid).ToList();
            var results = new List<IPlayer>();

            if (string.Equals(targetString, "@all", StringComparison.OrdinalIgnoreCase))
            {
                results.AddRange(allPlayers);
                return results;
            }

            if (string.Equals(targetString, "@me", StringComparison.OrdinalIgnoreCase))
            {
                if (sender != null)
                {
                    results.Add(sender);
                }
                return results;
            }

            // By exact ID
            if (targetString.StartsWith("#") && int.TryParse(targetString.Substring(1), out int targetId))
            {
                var p = allPlayers.FirstOrDefault(x => x.PlayerID == targetId);
                if (p != null) results.Add(p);
                return results;
            }

            // By name (partial match)
            var exactMatches = allPlayers.Where(p => string.Equals(p.Controller?.PlayerName, targetString, StringComparison.OrdinalIgnoreCase)).ToList();
            if (exactMatches.Count > 0)
            {
                results.AddRange(exactMatches);
                return results;
            }

            var partialMatches = allPlayers.Where(p => p.Controller?.PlayerName?.Contains(targetString, StringComparison.OrdinalIgnoreCase) == true).ToList();
            if (partialMatches.Count > 0)
            {
                results.AddRange(partialMatches);
            }

            return results;
        }

        /// <summary>
        /// Finds exactly one player. Returns null if none or multiple are found.
        /// </summary>
        public static IPlayer? FindSinglePlayerByTarget(ISwiftlyCore core, IPlayer? sender, string targetString)
        {
            var targets = FindPlayersByTarget(core, sender, targetString);
            return targets.Count == 1 ? targets[0] : null;
        }
    }
}
