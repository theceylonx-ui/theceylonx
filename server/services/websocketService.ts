import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import { getAuthenticatedUser } from '../routes';

export interface WebSocketClient {
  ws: WebSocket;
  userId: string;
  isAlive: boolean;
  lastHeartbeat: number;
}

export interface NotificationBroadcast {
  type: 'notification';
  data: {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    category: string;
    priority: string;
    isRead: boolean;
    createdAt: string;
    actionUrl?: string;
    primaryActionLabel?: string;
    primaryActionUrl?: string;
    secondaryActionLabel?: string;
    secondaryActionUrl?: string;
  };
}

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients = new Map<string, WebSocketClient[]>();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  initialize(server: HttpServer): void {
    console.log('🔌 Initializing WebSocket server for real-time notifications...');
    
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      perMessageDeflate: false,
      clientTracking: false
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.startHeartbeat();
    
    console.log('✅ WebSocket server initialized successfully');
  }

  private async handleConnection(ws: WebSocket, req: any): Promise<void> {
    console.log('🔌 New WebSocket connection attempt');
    
    try {
      // Extract token from query parameters or headers
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const token = url.searchParams.get('token') || req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        console.log('❌ WebSocket connection denied: No token provided');
        ws.close(4001, 'Authentication required');
        return;
      }

      // Create a mock request object for authentication
      const mockReq = {
        headers: {
          authorization: `Bearer ${token}`,
          cookie: req.headers.cookie || ''
        },
        cookies: {},
        ip: req.socket.remoteAddress
      };

      // Parse cookies manually if present
      if (req.headers.cookie) {
        const cookies = req.headers.cookie.split(';').reduce((acc: any, cookie: string) => {
          const [key, value] = cookie.trim().split('=');
          if (key && value) {
            acc[key] = decodeURIComponent(value);
          }
          return acc;
        }, {});
        mockReq.cookies = cookies;
      }

      const user = await getAuthenticatedUser(mockReq);
      
      if (!user) {
        console.log('❌ WebSocket connection denied: Invalid authentication');
        ws.close(4001, 'Invalid authentication');
        return;
      }

      console.log(`✅ WebSocket authenticated for user: ${user.id}`);

      // Create client object
      const client: WebSocketClient = {
        ws,
        userId: user.id,
        isAlive: true,
        lastHeartbeat: Date.now()
      };

      // Add client to tracking
      if (!this.clients.has(user.id)) {
        this.clients.set(user.id, []);
      }
      this.clients.get(user.id)!.push(client);

      console.log(`📊 Active WebSocket connections: ${this.getTotalConnections()}`);

      // Handle client messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'ping') {
            client.isAlive = true;
            client.lastHeartbeat = Date.now();
            ws.send(JSON.stringify({ type: 'pong' }));
          }
        } catch (error) {
          console.error('❌ WebSocket message parse error:', error);
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        console.log(`🔌 WebSocket disconnected for user: ${user.id}`);
        this.removeClient(user.id, client);
      });

      // Handle client errors
      ws.on('error', (error) => {
        console.error(`❌ WebSocket error for user ${user.id}:`, error);
        this.removeClient(user.id, client);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'WebSocket connection established',
        timestamp: new Date().toISOString()
      }));

    } catch (error) {
      console.error('❌ WebSocket connection error:', error);
      ws.close(4000, 'Connection setup failed');
    }
  }

  private removeClient(userId: string, clientToRemove: WebSocketClient): void {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const index = userClients.indexOf(clientToRemove);
      if (index !== -1) {
        userClients.splice(index, 1);
        if (userClients.length === 0) {
          this.clients.delete(userId);
        }
      }
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeoutThreshold = 60000; // 1 minute

      for (const [userId, clients] of Array.from(this.clients.entries())) {
        const activeClients = clients.filter((client: WebSocketClient) => {
          if (!client.isAlive || (now - client.lastHeartbeat) > timeoutThreshold) {
            if (client.ws.readyState === WebSocket.OPEN) {
              client.ws.close(4002, 'Heartbeat timeout');
            }
            return false;
          }
          
          // Send ping
          if (client.ws.readyState === WebSocket.OPEN) {
            client.isAlive = false; // Will be set to true when pong is received
            client.ws.send(JSON.stringify({ type: 'ping' }));
          }
          
          return true;
        });

        if (activeClients.length !== clients.length) {
          if (activeClients.length === 0) {
            this.clients.delete(userId);
          } else {
            this.clients.set(userId, activeClients);
          }
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Broadcast a notification to a specific user
   */
  broadcastNotification(notification: NotificationBroadcast): void {
    const targetUserId = notification.data.userId;
    const userClients = this.clients.get(targetUserId);

    if (!userClients || userClients.length === 0) {
      console.log(`📡 No WebSocket connections for user ${targetUserId}`);
      return;
    }

    console.log(`📡 Broadcasting notification to ${userClients.length} connection(s) for user ${targetUserId}`);

    const message = JSON.stringify(notification);
    let successCount = 0;

    userClients.forEach((client, index) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(message);
          successCount++;
        } catch (error) {
          console.error(`❌ Failed to send notification to client ${index}:`, error);
        }
      }
    });

    console.log(`✅ Notification broadcast sent to ${successCount}/${userClients.length} clients for user ${targetUserId}`);
  }

  /**
   * Broadcast to all connected clients
   */
  broadcastToAll(message: any): void {
    const jsonMessage = JSON.stringify(message);
    let totalSent = 0;

    for (const [userId, clients] of Array.from(this.clients.entries())) {
      clients.forEach((client: WebSocketClient) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          try {
            client.ws.send(jsonMessage);
            totalSent++;
          } catch (error) {
            console.error(`❌ Failed to broadcast to user ${userId}:`, error);
          }
        }
      });
    }

    console.log(`📡 Broadcast sent to ${totalSent} total connections`);
  }

  /**
   * Get statistics about connected clients
   */
  getStats(): { totalConnections: number; uniqueUsers: number; connectionsByUser: Record<string, number> } {
    const connectionsByUser: Record<string, number> = {};
    let totalConnections = 0;

    for (const [userId, clients] of Array.from(this.clients.entries())) {
      const activeClients = clients.filter((c: WebSocketClient) => c.ws.readyState === WebSocket.OPEN).length;
      if (activeClients > 0) {
        connectionsByUser[userId] = activeClients;
        totalConnections += activeClients;
      }
    }

    return {
      totalConnections,
      uniqueUsers: Object.keys(connectionsByUser).length,
      connectionsByUser
    };
  }

  /**
   * Get total number of connections
   */
  private getTotalConnections(): number {
    let total = 0;
    for (const clients of Array.from(this.clients.values())) {
      total += clients.filter((c: WebSocketClient) => c.ws.readyState === WebSocket.OPEN).length;
    }
    return total;
  }

  /**
   * Cleanup resources
   */
  shutdown(): void {
    console.log('🔌 Shutting down WebSocket server...');
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Close all client connections
    for (const clients of Array.from(this.clients.values())) {
      clients.forEach((client: WebSocketClient) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.close(4000, 'Server shutting down');
        }
      });
    }

    this.clients.clear();

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    console.log('✅ WebSocket server shut down successfully');
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();