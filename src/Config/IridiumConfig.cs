namespace Iridium.Config;

public class IridiumConfig
{
    public ESPConfig ESP { get; set; } = new();
    public ServerConfig Server { get; set; } = new();
    public MapsConfig MapsOptions { get; set; } = new();
    public RtvConfig Rtv { get; set; } = new();
    public EndOfMapConfig EndOfMap { get; set; } = new();
    public DashboardConfig Dashboard { get; set; } = new();
}

public class DashboardConfig
{
    public bool Enabled { get; set; } = true;
    public string WebSocketHost { get; set; } = "0.0.0.0";
    public int WebSocketPort { get; set; } = 8181;
}

public class ServerConfig
{
    public string RconPermission { get; set; } = "iridium.rcon";
    public string[] BlockedRconCommands { get; set; } = { "quit", "exit", "killserver", "plugin_unload" };
}

public class ESPConfig
{
    public string FullPermission { get; set; } = "iridium.root";
    public string SpectatorPermission { get; set; } = "iridium.esp";
    public GlowColor SlaughterRed { get; set; } = new() { R = 235, G = 52, B = 52, A = 255 };
    public GlowColor DopplerGreen { get; set; } = new() { R = 52, G = 235, B = 113, A = 255 };
}

public class GlowColor
{
    public int R { get; set; } = 255;
    public int G { get; set; } = 255;
    public int B { get; set; } = 255;
    public int A { get; set; } = 255;
}

public class MapsConfig
{
    public string[] Maps { get; set; } = { "de_dust2", "de_mirage", "de_inferno", "de_nuke", "de_vertigo", "de_overpass", "de_ancient", "de_anubis", "de_cache", "cs_office" };
}

public class RtvConfig
{
    public bool Enabled { get; set; } = true;
    public int VotePercentage { get; set; } = 60;
    public int VoteDurationSeconds { get; set; } = 30;
    public int ChangeMapDelaySeconds { get; set; } = 5;
    public bool NominationEnabled { get; set; } = true;
}

public class EndOfMapConfig
{
    public bool Enabled { get; set; } = true;
    public int TriggerRoundsBeforeEnd { get; set; } = 2;
}
