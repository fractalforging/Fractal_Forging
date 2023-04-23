const socket = io();

socket.on('connect', () => {
console.log('SOCKET.IO - Connected to server');
});

socket.on('disconnect', () => {
console.log('SOCKET.IO - Disconnected from server');
});

socket.on('reload', () => {
  console.log('Reload event received');
  setTimeout(() => location.reload(), 100);
});