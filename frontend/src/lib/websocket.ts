type EventHandler = (data: any) => void;

export class IridiumClient {
  private ws: WebSocket | null = null;
  private url: string;
  private listeners: Map<string, EventHandler[]> = new Map();
  public isAuthenticated: boolean = false;
  public steamId: string | null = null;
  public steamName: string | null = null;
  public steamAvatar: string | null = null;

  constructor() {
    this.url = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8181';
  }

  public connect() {
    if (this.ws) return;

    console.log('Connecting to Iridium WebSocket...');
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('Connected to Iridium Backend!');
      this.authenticate();
    };

    this.ws.onmessage = (event) => {
      try {
        const { type, payload } = JSON.parse(event.data);
        
        if (type === 'plugin_reloaded') {
          console.log('Plugin reloaded, refreshing dashboard...');
          window.location.reload();
          return;
        }

        if (type) {
          this.emit(type, payload);
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket connection closed. Reconnecting in 3s...');
      this.ws = null;
      this.isAuthenticated = false;
      this.emit('disconnected', null);
      setTimeout(() => this.connect(), 3000);
    };

    this.ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      this.ws?.close();
    };
  }

  private authenticate() {
    // 1. Check if we just returned from Steam OpenID
    const params = new URLSearchParams(window.location.search);
    if (params.has('openid.mode')) {
      console.log('Verifying Steam Login...');
      this.send('auth_verify', { query: window.location.search });
      // Remove query string from URL without refreshing
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    // 2. Check if we have a saved token
    const token = localStorage.getItem('iridium_token');
    if (token) {
      console.log('Resuming session...');
      this.send('auth_resume', { token });
      return;
    }

    // 3. Not authenticated
    this.emit('auth_required', null);
  }

  public send(type: string, payload: any = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  public on(event: string, handler: EventHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
  }

  public off(event: string, handler: EventHandler) {
    if (this.listeners.has(event)) {
      const filtered = this.listeners.get(event)!.filter((h) => h !== handler);
      this.listeners.set(event, filtered);
    }
  }

  private emit(event: string, data: any) {
    // Intercept auth events
    if (event === 'auth_success') {
      this.isAuthenticated = true;
      this.steamId = data.steamId;
      if (data.token) localStorage.setItem('iridium_token', data.token);

      // Fetch profile locally via CORS proxy to avoid bloating the C# plugin
      if (this.steamId) {
        fetch(`https://corsproxy.io/?url=https://steamcommunity.com/profiles/${this.steamId}?xml=1`)
          .then(res => res.text())
          .then(xml => {
             const nameMatch = xml.match(/<steamID><!\[CDATA\[(.*?)\]\]><\/steamID>/);
             const avatarMatch = xml.match(/<avatarFull><!\[CDATA\[(.*?)\]\]><\/avatarFull>/);
             if (nameMatch) this.steamName = nameMatch[1];
             if (avatarMatch) this.steamAvatar = avatarMatch[1];
             this.emit('profile_updated', null);
          })
          .catch(console.error);
      }

    } else if (event === 'auth_failed') {
      this.isAuthenticated = false;
      localStorage.removeItem('iridium_token');
    }

    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((h) => h(data));
    }
  }

  public loginWithSteam() {
    const returnUrl = encodeURIComponent(window.location.origin + window.location.pathname);
    const steamUrl = `https://steamcommunity.com/openid/login?openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0&openid.mode=checkid_setup&openid.return_to=${returnUrl}&openid.realm=${returnUrl}&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select`;
    window.location.href = steamUrl;
  }
}

export const iridiumClient = new IridiumClient();
