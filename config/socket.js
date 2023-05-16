import { Server } from 'socket.io';
import User from '../models/user.js';
import path from 'path';

async function emitUserCountAndList(io) {
  try {
    const oneMinuteAgo = new Date(new Date().getTime() - 60 * 1000);
    const users = await User.find({ isOnline: true, socketId: { $ne: null }, lastHeartbeat: { $gt: oneMinuteAgo } });
    const usernames = users.map(user => user.username);
    io.emit('userCount', users.length);
    io.emit('userList', usernames);
  } catch (error) {
    console.error('Error emitting user count and list:', error);
  }
}

async function updateUserHeartbeat(socketId) {
  try {
    const user = await User.findOne({ socketId });
    if (user) {
      user.lastHeartbeat = new Date();
      await user.save();
    }
  } catch (error) {
    console.error('Error updating user heartbeat:', error);
  }
}

const setupSockets = async (server, app) => {
  const io = new Server(server, {
    serveClient: true
  });

  app.get('/socket.io/socket.io.js', async (req, res) => {
    res.sendFile(path.join(__dirname, 'node_modules', 'socket.io', 'client-dist', 'socket.io.js'));
  });

  io.on('connection', async (socket) => {

    const { username } = socket.handshake.query;
    if (username) {
      try {
        const user = await User.findOne({ username });
        if (user) {
          user.isOnline = true;
          user.socketId = socket.id;
          await user.save();
        }
      } catch (error) {
        console.error('Error updating user online status:', error);
      }
    }

    await emitUserCountAndList(io);

    socket.on('heartbeat', async () => {
      await updateUserHeartbeat(socket.id);
    });

    socket.on('reload', async () => {
      io.emit('reload');
    });

    socket.on('disconnect', async () => {
      try {
        const user = await User.findOne({ socketId: socket.id });
        if (user) {
          user.isOnline = false;
          user.socketId = null;
          await user.save();
        }
      } catch (error) {
        console.error('Error updating user offline status:', error);
      }

      await emitUserCountAndList(io);
    });

  });
  return io; 
}

export default setupSockets;
