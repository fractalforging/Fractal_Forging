const http = require('http');
const path = require("path");
const socketIO = require('socket.io');

module.exports = function(app) {
  const server = http.createServer(app);
  const io = new socketIO.Server(server, {
    serveClient: true
  });

  app.get('/socket.io/socket.io.js', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'node_modules', 'socket.io', 'client-dist', 'socket.io.js'));
  });

  io.on('connection', (socket) => {
    socket.on('reload', () => {
      io.emit('reload');
    });
    socket.on('disconnect', () => {});
  });

  return io;
};