
import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import appRoutes from './routes';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

const app = express();
const port = 3000;
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*' }
});

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded());

// parse application/json
app.use(bodyParser.json());

appRoutes(app);

// Socket.io events
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinGroup', (groupId) => {
    socket.join(`group_${groupId}`);
  });

  socket.on('groupMessage', (data) => {
    // data: { groupId, message, senderId, ... }
    io.to(`group_${data.groupId}`).emit('groupMessage', data);
  });

  socket.on('privateMessage', (data) => {
    // data: { groupId, message, senderId, receiverId, ... }
    // For simplicity, emit to all in group, but you can target specific sockets
    io.to(`group_${data.groupId}`).emit('privateMessage', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(port, () => {
  console.info(`[SERVER] started at port ${process.env.PORT || port}`);
});
