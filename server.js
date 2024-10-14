const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

const rooms = {};

wss.on('connection', (ws) => {
    console.log('New client connected.');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            const { type, user, room, content } = data;

            switch (type) {
                case 'join':
                    // Handle joining a room
                    if (!rooms[room]) {
                        rooms[room] = new Set();
                    }
                    rooms[room].add(ws);
                    broadcastToRoom(room, {
                        type: 'system',
                        content: `${user} has joined the room.`,
                    }, ws);
                    break;

                case 'message':
                    // Broadcast message to the specified room
                    broadcastToRoom(room, {
                        type: 'message',
                        sender: user,
                        content: content,
                    }, ws);
                    break;

                default:
                    console.log('Unknown message type:', type);
            }
        } catch (error) {
            console.error('Failed to process message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected.');
        // Clean up user from all rooms
        for (const room in rooms) {
            rooms[room].delete(ws);
        }
    });
});

function broadcastToRoom(room, message, sender) {
    if (rooms[room]) {
        rooms[room].forEach((client) => {
            if (client !== sender && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }
}

console.log('WebSocket server is running on ws://localhost:8080');
