import io from 'socket.io-client'

let socketInitializer = async() => {
  await fetch('/api/socket')
  socket = io();

  socket.on('connected', () => {
    console.log("connected");
    
  })
}

export default socketInitializer