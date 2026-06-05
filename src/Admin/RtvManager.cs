using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Concurrent;
using System.Collections.Generic;
using SwiftlyS2.Shared;
using SwiftlyS2.Shared.Commands;
using SwiftlyS2.Shared.Players;
using SwiftlyS2.Shared.GameEventDefinitions;
using SwiftlyS2.Shared.Events;
using SwiftlyS2.Shared.Misc;
using SwiftlyS2.Core.Menus.OptionsBase;

namespace Iridium.Admin
{
    public class RtvManager
    {
        private readonly ISwiftlyCore _core;
        private readonly Iridium _plugin;

        private readonly ConcurrentDictionary<ulong, bool> _rtvVoters = new();
        private readonly ConcurrentDictionary<string, int> _nominatedMaps = new(StringComparer.OrdinalIgnoreCase);

        private bool _voteInProgress = false;
        private bool _mapDecided = false;
        private string _nextMap = string.Empty;

        // Keep track of votes during the active voting phase
        private readonly ConcurrentDictionary<ulong, string> _activeVotes = new();

        public RtvManager(ISwiftlyCore core, Iridium plugin)
        {
            _core = core;
            _plugin = plugin;

            // Hook natively to the match end scoreboard event to catch BOTH time-based and round-based endings effortlessly!
            _core.GameEvent.HookPre<EventCsWinPanelMatch>(OnMatchEnd);
        }

        [Command("rtv")]
        public async Task OnRtvCommandAsync(ICommandContext context)
        {
            if (!_plugin.Config.Rtv.Enabled) return;

            var player = context.Sender;
            if (player == null) return;

            if (_voteInProgress || _mapDecided)
            {
                await player.SendChatAsync(" \x06Iridium\x01 • A vote is already in progress or the map has already been decided.");
                return;
            }

            if (_rtvVoters.TryAdd(player.SteamID, true))
            {
                int currentVotes = _rtvVoters.Count;
                int activePlayers = _core.PlayerManager.GetAllPlayers().Count(p => p.IsValid && !p.IsFakeClient);
                if (activePlayers == 0) activePlayers = 1; // safeguard

                int requiredVotes = (int)Math.Ceiling((double)activePlayers * _plugin.Config.Rtv.VotePercentage / 100);

                string playerName = player.Controller?.PlayerName ?? "A player";

                foreach (var p in _core.PlayerManager.GetAllPlayers().Where(x => x.IsValid))
                {
                    _ = p.SendChatAsync($" \x06Iridium\x01 • \x04{playerName}\x01 wants to rock the vote. ({currentVotes}/{requiredVotes})");
                }

                if (currentVotes >= requiredVotes)
                {
                    // Delay slightly so the engine renders the chat message reliably before spamming the next ones
                    Task.Run(async () =>
                    {
                        await Task.Delay(1500);
                        _core.Scheduler.NextTick(() => StartVote(isEndOfMap: false));
                    });
                }
            }
            else
            {
                await player.SendChatAsync(" \x06Iridium\x01 • You have already voted to RTV.");
            }
        }

        [Command("unrtv")]
        public async Task OnUnrtvCommandAsync(ICommandContext context)
        {
            if (!_plugin.Config.Rtv.Enabled) return;

            var player = context.Sender;
            if (player == null) return;

            if (_voteInProgress || _mapDecided) return;

            if (_rtvVoters.TryRemove(player.SteamID, out _))
            {
                int currentVotes = _rtvVoters.Count;
                int activePlayers = _core.PlayerManager.GetAllPlayers().Count(p => p.IsValid && !p.IsFakeClient);
                if (activePlayers == 0) activePlayers = 1;
                int requiredVotes = (int)Math.Ceiling((double)activePlayers * _plugin.Config.Rtv.VotePercentage / 100);

                string playerName = player.Controller?.PlayerName ?? "A player";

                foreach (var p in _core.PlayerManager.GetAllPlayers().Where(x => x.IsValid))
                {
                    _ = p.SendChatAsync($" \x06Iridium\x01 • \x04{playerName}\x01 removed their RTV. ({currentVotes}/{requiredVotes})");
                }
            }
            else
            {
                await player.SendChatAsync(" \x06Iridium\x01 • You have not typed !rtv yet.");
            }
        }

        [Command("nominate")]
        [CommandAlias("nom")]
        public async Task OnNominateCommandAsync(ICommandContext context)
        {
            if (!_plugin.Config.Rtv.Enabled || !_plugin.Config.Rtv.NominationEnabled) return;

            var player = context.Sender;
            if (player == null) return;

            if (context.Args.Length < 1)
            {
                await player.SendChatAsync(" \x06Iridium\x01 • Usage: !nominate <map>");
                return;
            }

            string requestedMap = context.Args[0].ToLowerInvariant();

            // Check if map exists in config
            var allMaps = _plugin.Config.MapsOptions.Maps;
            string? matchedMap = allMaps.FirstOrDefault(m =>
                m.Equals(requestedMap, StringComparison.OrdinalIgnoreCase) ||
                (m.StartsWith("ws:") && m.Substring(3).Equals(requestedMap, StringComparison.OrdinalIgnoreCase)));

            if (matchedMap == null)
            {
                await player.SendChatAsync($" \x06Iridium\x01 • Map \x04{requestedMap}\x01 is not in the server's map pool.");
                return;
            }

            if (_nominatedMaps.Count >= 5)
            {
                await player.SendChatAsync(" \x06Iridium\x01 • The nomination list is currently full.");
                return;
            }

            if (_nominatedMaps.TryAdd(matchedMap, 1))
            {
                string displayMap = matchedMap.StartsWith("ws:") ? $"[WS] {matchedMap.Substring(3)}" : matchedMap;
                string playerName = player.Controller?.PlayerName ?? "A player";

                foreach (var p in _core.PlayerManager.GetAllPlayers().Where(x => x.IsValid))
                {
                    _ = p.SendChatAsync($" \x06Iridium\x01 • \x04{playerName}\x01 nominated \x04{displayMap}\x01.");
                }
            }
            else
            {
                await player.SendChatAsync(" \x06Iridium\x01 • That map has already been nominated.");
            }
        }

        private HookResult OnMatchEnd(EventCsWinPanelMatch @event)
        {
            if (!_plugin.Config.EndOfMap.Enabled) return HookResult.Continue;
            if (_voteInProgress || _mapDecided) return HookResult.Continue;

            // Trigger the automated end of map vote dynamically
            _core.Scheduler.NextTick(() => StartVote(isEndOfMap: true));

            return HookResult.Continue;
        }

        private void StartVote(bool isEndOfMap)
        {
            if (_voteInProgress || _mapDecided) return;
            _voteInProgress = true;
            _activeVotes.Clear();

            // Announce
            foreach (var p in _core.PlayerManager.GetAllPlayers().Where(x => x.IsValid))
            {
                _ = p.SendChatAsync(" ");
                _ = p.SendChatAsync(" \x06Iridium\x01 • A map vote has started!");
                _ = p.SendChatAsync($" \x01  • Check your screen menu to vote.");
            }

            // Build map list
            var options = new List<string>();

            // 1. Add nominations
            foreach (var nom in _nominatedMaps.Keys)
            {
                if (options.Count < 5) options.Add(nom);
            }

            // 2. Fill the rest randomly from config (up to 5 options + 1 "Keep Current")
            var random = new Random();
            var shuffledMaps = _plugin.Config.MapsOptions.Maps.OrderBy(x => random.Next()).ToList();
            var currentMap = _core.Engine.GlobalVars.MapName.ToString();

            foreach (var m in shuffledMaps)
            {
                if (options.Count >= 5) break;
                if (!options.Contains(m) && !m.Equals(currentMap, StringComparison.OrdinalIgnoreCase))
                {
                    options.Add(m);
                }
            }

            // Dispatch menus to players
            foreach (var p in _core.PlayerManager.GetAllPlayers().Where(x => x.IsValid && !x.IsFakeClient))
            {
                var builder = _core.MenusAPI.CreateBuilder();
                builder.Design.SetMenuTitle($"<span color='#FFD700'>Vote for Next Map</span>");
                builder.Design.SetMenuFooterVisible(false);

                foreach (var map in options)
                {
                    string displayMap = map.StartsWith("ws:") ? $"[WS] {map.Substring(3)}" : map;
                    var btn = new ButtonMenuOption(displayMap) { CloseAfterClick = true };

                    // Capture 'map' iteration variable locally
                    string capturedMap = map;

                    btn.Click += (_, args) =>
                    {
                        var player = args.Player;
                        _activeVotes[player.SteamID] = capturedMap;
                        _ = player.SendChatAsync($" \x06Iridium\x01 • You voted for \x04{displayMap}\x01.");
                        return ValueTask.CompletedTask;
                    };
                    builder.AddOption(btn);
                }

                _core.MenusAPI.OpenMenuForPlayer(p, builder.Build());
            }

            // Wait and tally
            int duration = isEndOfMap ? 12 : _plugin.Config.Rtv.VoteDurationSeconds; // If end of map, keep it short to fit within the win panel (15s)

            Task.Run(async () =>
            {
                await Task.Delay(duration * 1000);

                _core.Scheduler.NextTick(() => TallyVotesAndChangeMap(options, isEndOfMap));
            });
        }

        private void TallyVotesAndChangeMap(List<string> options, bool isEndOfMap)
        {
            _voteInProgress = false;
            _mapDecided = true;
            _rtvVoters.Clear();
            _nominatedMaps.Clear();

            // Count votes
            var voteCounts = new Dictionary<string, int>();
            foreach (var map in options) voteCounts[map] = 0;

            foreach (var vote in _activeVotes.Values)
            {
                if (voteCounts.ContainsKey(vote))
                {
                    voteCounts[vote]++;
                }
            }

            // Find winner
            var winner = options.OrderByDescending(x => voteCounts[x]).FirstOrDefault();

            if (winner == null)
            {
                // Fallback to random map if no votes cast
                var random = new Random();
                winner = options.OrderBy(x => random.Next()).First();
            }

            _nextMap = winner;
            string displayWinner = winner.StartsWith("ws:") ? $"[WS] {winner.Substring(3)}" : winner;
            int winnerVotes = voteCounts.ContainsKey(winner) ? voteCounts[winner] : 0;
            int totalVotes = _activeVotes.Count;

            foreach (var p in _core.PlayerManager.GetAllPlayers().Where(x => x.IsValid))
            {
                // Close menus safely
                if (!p.IsFakeClient) _core.MenusAPI.CloseActiveMenu(p);

                _ = p.SendChatAsync(" ");
                _ = p.SendChatAsync($" \x06Iridium\x01 • Vote for the next map finished!");
                _ = p.SendChatAsync($" \x01  • \x04{displayWinner}\x01 won with {winnerVotes}/{totalVotes} votes.");
            }

            int delaySeconds = isEndOfMap ? 2 : _plugin.Config.Rtv.ChangeMapDelaySeconds;

            Task.Run(async () =>
            {
                await Task.Delay(delaySeconds * 1000);
                _core.Scheduler.NextTick(() =>
                {
                    if (winner.StartsWith("ws:"))
                    {
                        _core.Engine.ExecuteCommandWithBuffer($"host_workshop_map {winner.Substring(3)}", _ => { });
                    }
                    else
                    {
                        _core.Engine.ExecuteCommandWithBuffer($"nextlevel {winner}", _ => { });
                        _core.Engine.ExecuteCommandWithBuffer($"changelevel {winner}", _ => { });
                    }
                });
            });
        }
    }
}
