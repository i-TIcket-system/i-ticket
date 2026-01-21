# Server-Sent Events (SSE) Real-Time Updates

## Overview

Implemented Server-Sent Events (SSE) for real-time trip updates in the company admin dashboard. This eliminates the need for manual page refreshes and provides instant visibility when:
- Manual ticketer sells tickets
- Online bookings are made
- Trip slots change
- Booking status changes

## Architecture

### Components

1. **SSE API Route** (`/api/events/company-trips`)
   - Maintains open HTTP connection to client
   - Polls database every 3 seconds for changes
   - Pushes only changed data to client
   - Automatic heartbeat to keep connection alive
   - Per-user connection (filtered by companyId)

2. **React Hook** (`useSSE`)
   - Manages EventSource connection lifecycle
   - Handles automatic reconnection on failure
   - Pauses when browser tab is hidden (saves resources)
   - Resumes when tab becomes visible
   - Provides connection status and error state

3. **Company Dashboard Integration**
   - Real-time trip updates without page refresh
   - Connection status indicator (green badge when connected)
   - Efficient state updates (only changed fields)
   - Stats refresh on trip changes

## How It Works

```
┌─────────────────┐         ┌─────────────────┐         ┌──────────────┐
│  Company Admin  │         │   SSE Route     │         │  PostgreSQL  │
│   Dashboard     │         │  (API Server)   │         │   Database   │
└────────┬────────┘         └────────┬────────┘         └──────┬───────┘
         │                           │                         │
         │ 1. Open EventSource       │                         │
         ├──────────────────────────>│                         │
         │                           │                         │
         │ 2. Connection established │                         │
         │<──────────────────────────┤                         │
         │                           │                         │
         │                           │ 3. Poll DB (every 3s)   │
         │                           ├────────────────────────>│
         │                           │                         │
         │                           │ 4. Compare with last    │
         │                           │    snapshot             │
         │                           │<────────────────────────┤
         │                           │                         │
         │ 5. Push changes (if any)  │                         │
         │<──────────────────────────┤                         │
         │                           │                         │
         │ 6. Update UI instantly    │                         │
         │                           │                         │
```

## Event Types

### 1. Connected Event
```json
{
  "type": "connected",
  "timestamp": 1642518924000
}
```
Sent immediately when SSE connection is established.

### 2. Update Event
```json
{
  "type": "update",
  "changes": [
    {
      "type": "trip-updated",
      "tripId": "cm...",
      "changes": {
        "availableSlots": 45,
        "bookingHalted": false,
        "bookingsCount": 5
      }
    }
  ],
  "timestamp": 1642518927000
}
```
Sent when trip data changes. Only includes fields that actually changed.

### 3. Trip Added/Removed
```json
{
  "type": "update",
  "changes": [
    {
      "type": "trip-added",
      "tripId": "cm..."
    }
  ],
  "timestamp": 1642518930000
}
```
Triggers full data refetch for structural changes.

## Performance Characteristics

### Server-Side
- **Polling Interval**: 3 seconds
- **Memory**: One snapshot per active connection (~1KB per user)
- **CPU**: Minimal (simple array comparison every 3 seconds)
- **Database Load**: 1 query per 3 seconds per connected admin

### Client-Side
- **Connection**: 1 persistent HTTP connection
- **Data Transfer**: Only changed fields (efficient)
- **Reconnection**: Automatic with 5-second backoff
- **Tab Visibility**: Pauses when hidden, resumes when visible

### Scalability
For **local deployment** with typical bus company usage:
- ✅ 1-5 admins: Excellent performance
- ✅ 5-20 admins: Very good performance
- ⚠️ 20-100 admins: Good (consider dedicated WebSocket server)
- ❌ 100+ admins: Use dedicated real-time infrastructure

## Benefits vs Polling

| Feature | SSE (Current) | Polling (Old) |
|---------|---------------|---------------|
| Update Latency | ~3 seconds | Variable (manual refresh) |
| Network Efficiency | High (1 connection) | Low (N requests) |
| Server Load | Low (1 query/3s) | High (N queries) |
| Battery Impact | Low | Medium-High |
| Implementation | Complex | Simple |
| Reliability | High (auto-reconnect) | N/A |

## Fallback Strategy

Built-in fallback mechanism in `useSSE` hook:

1. **Primary**: SSE connection
2. **On Error**: Auto-reconnect after 5 seconds
3. **Tab Hidden**: Disconnect, reconnect on visible
4. **Network Loss**: Auto-reconnect when online

No manual polling fallback needed - SSE is reliable for local deployment.

## Browser Compatibility

✅ **Supported:**
- Chrome/Edge 80+
- Firefox 70+
- Safari 14+
- All modern browsers

❌ **Not Supported:**
- IE11 (deprecated)

For unsupported browsers, page refresh still works as before.

## Configuration

### SSE Route Settings
```typescript
// Poll interval (src/app/api/events/company-trips/route.ts)
const POLL_INTERVAL = 3000 // milliseconds
```

### Hook Settings
```typescript
// Reconnection delay (src/hooks/useSSE.ts)
const RECONNECT_INTERVAL = 5000 // milliseconds
```

## Monitoring & Debugging

### Client-Side
```javascript
// Browser console will show:
// - "SSE connected at [timestamp]" on connection
// - "Attempting to reconnect SSE..." on disconnect
// - "SSE error: [error]" on errors
```

### Server-Side
```javascript
// API logs will show:
// - "SSE update check error: [error]" if DB query fails
// - Connection count visible in server metrics
```

### Connection Status
- Green "Real-time" badge: Connected ✅
- Gray "Connecting..." badge: Connecting/Reconnecting ⏳

## Testing

### Manual Test Steps

1. **Open Company Dashboard** in browser
2. **Verify**: Green "Real-time" badge appears
3. **Open Cashier Portal** in another tab/browser
4. **Sell Ticket** from cashier portal
5. **Verify**: Company dashboard updates within 3 seconds (no refresh)

### Expected Results
- Seat count decreases automatically
- Stats update automatically
- No page refresh needed
- Connection badge stays green

### Test Disconnection
1. Stop dev server briefly
2. **Verify**: Badge turns gray "Connecting..."
3. Restart server
4. **Verify**: Auto-reconnects, badge turns green

## Troubleshooting

### Connection Won't Establish
**Symptom**: Gray "Connecting..." badge persists

**Solutions**:
1. Check browser console for errors
2. Verify `/api/events/company-trips` is accessible
3. Check authentication (must be logged in)
4. Check firewall/proxy settings (SSE uses HTTP)

### Updates Not Showing
**Symptom**: Badge is green but changes not appearing

**Solutions**:
1. Check server logs for DB query errors
2. Verify trip belongs to correct company
3. Check browser console for message parsing errors
4. Try manual refresh to confirm data exists

### High CPU Usage
**Symptom**: Server CPU high

**Solutions**:
1. Reduce POLL_INTERVAL (but increases latency)
2. Optimize database query (add indexes)
3. Limit active connections (add rate limiting)

### Connection Drops Frequently
**Symptom**: Constant reconnections

**Solutions**:
1. Check network stability
2. Increase RECONNECT_INTERVAL
3. Check reverse proxy timeout settings (nginx, etc.)

## Future Enhancements

### Potential Improvements
1. **WebSocket Upgrade**: For 100+ concurrent admins
2. **Redis Pub/Sub**: For multi-server deployments
3. **Selective Subscriptions**: Only subscribe to specific trips
4. **Compression**: Gzip SSE stream for large updates
5. **Push Triggers**: Trigger SSE from booking API directly

### Not Recommended
- ❌ Shorter polling interval (<2s): Unnecessary load
- ❌ Browser polling fallback: SSE is reliable enough
- ❌ Third-party services (Pusher, Ably): Adds cost/complexity

## Security Considerations

✅ **Implemented:**
- Authentication required (NextAuth session)
- Company segregation (companyId filtering)
- No sensitive data in events (only IDs and counts)
- Automatic connection cleanup on disconnect

⚠️ **Future Considerations:**
- Rate limiting per user (prevent abuse)
- Connection count limits (per company)
- Event payload size limits

## Production Deployment

### Local/VPS Deployment
✅ Works perfectly as-is (tested configuration)

### Serverless (Vercel, Netlify)
⚠️ SSE connections may timeout after 30-60 seconds
**Solution**: Consider WebSocket-specific service or polling fallback

### Docker/K8s
✅ Works well with sticky sessions
**Note**: Configure load balancer for long-lived connections

---

**Implementation Date**: January 21, 2026
**Status**: Production Ready (Local Deployment)
**Maintenance**: Minimal (no external dependencies)
