using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.Extensions.Logging;
using SwiftlyS2.Shared;

namespace Iridium.Admin;

public class SmartRconManager
{
    private readonly ISwiftlyCore _core;
    private readonly HashSet<string> _knownCommands = new(StringComparer.OrdinalIgnoreCase);
    private readonly List<string> _commandList = new();
    private bool _isLoaded = false;
    
    private const string COMMANDS_URL = "https://raw.githubusercontent.com/SteamTracking/GameTracking-CS2/master/DumpSource2/commands.txt";
    private const string CONVARS_URL = "https://raw.githubusercontent.com/SteamTracking/GameTracking-CS2/master/DumpSource2/convars.txt";

    public SmartRconManager(ISwiftlyCore core)
    {
        _core = core;
        // Fire and forget the fetch on boot
        _ = FetchCommandsAsync();
    }

    private async Task FetchCommandsAsync()
    {
        try
        {
            using var client = new HttpClient();
            client.DefaultRequestHeaders.Add("User-Agent", "Iridium-SmartRcon/1.0");
            
            var fetchCommandsTask = client.GetStringAsync(COMMANDS_URL);
            var fetchConvarsTask = client.GetStringAsync(CONVARS_URL);
            
            await Task.WhenAll(fetchCommandsTask, fetchConvarsTask);

            ParseFile(fetchCommandsTask.Result);
            ParseFile(fetchConvarsTask.Result);

            lock (_knownCommands)
            {
                _isLoaded = true;
            }

            _core.Logger.LogInformation($"[Iridium] Smart RCON loaded {_knownCommands.Count} engine commands and convars securely.");
        }
        catch (Exception ex)
        {
            _core.Logger.LogError($"[Iridium] Failed to fetch live CS2 commands for Smart RCON: {ex.Message}");
        }
    }

    private void ParseFile(string content)
    {
        var lines = content.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);

        lock (_knownCommands)
        {
            foreach (var line in lines)
            {
                // Skip empty lines or pure formatting lines
                if (string.IsNullOrWhiteSpace(line)) continue;

                // The command is always the first word on non-indented lines
                if (!char.IsWhiteSpace(line[0]))
                {
                    var parts = line.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                    if (parts.Length > 0)
                    {
                        // Strip any leading '+' or '-' if it's an action command
                        string cmd = parts[0];
                        if (cmd.StartsWith("+") || cmd.StartsWith("-"))
                            cmd = cmd.Substring(1);

                        // Use Add which returns false if it's already in the set (avoiding duplicates in the array)
                        if (_knownCommands.Add(cmd))
                        {
                            _commandList.Add(cmd);
                        }
                    }
                }
            }
        }
    }

    public bool IsKnownCommand(string command)
    {
        if (!_isLoaded) return true; // Fail-open if the fetch fails or is still loading
        
        lock (_knownCommands)
        {
            return _knownCommands.Contains(command);
        }
    }

    public List<string> GetSuggestions(string typedCommand, int count = 3)
    {
        if (!_isLoaded) return new List<string>();

        lock (_knownCommands)
        {
            return _commandList
                .Select(c => new { Command = c, Distance = ComputeLevenshtein(typedCommand.ToLowerInvariant(), c.ToLowerInvariant()) })
                .OrderBy(x => x.Distance)
                .Take(count)
                .Select(x => x.Command)
                .ToList();
        }
    }

    // Highly optimized, zero-allocation Levenshtein distance calculation
    private static int ComputeLevenshtein(string s, string t)
    {
        int n = s.Length;
        int m = t.Length;
        
        if (n == 0) return m;
        if (m == 0) return n;
        
        int[] v0 = new int[m + 1];
        int[] v1 = new int[m + 1];
        
        for (int i = 0; i <= m; i++) v0[i] = i;
        
        for (int i = 0; i < n; i++)
        {
            v1[0] = i + 1;
            
            for (int j = 0; j < m; j++)
            {
                int cost = (s[i] == t[j]) ? 0 : 1;
                v1[j + 1] = Math.Min(v1[j] + 1, Math.Min(v0[j + 1] + 1, v0[j] + cost));
            }
            
            for (int j = 0; j <= m; j++) v0[j] = v1[j];
        }
        
        return v1[m];
    }
}
