import {Server, Socket} from 'socket.io'
import express from 'express'
import http from 'http'
import fetch from 'node-fetch'

const app = express();
const server = http.createServer(app);

console.log("hola");

const io = new Server(server,{
  cors:{
    origin:'*',
    methods:["GET", "POST"]
  }
}); 

declare global{
  var chatSocket: Socket;
  var onlineUsers: any;
}

global.onlineUsers = new Map();
io.on('connection', (socket) => {
  global.chatSocket = socket;
  
  console.log(`hola, ${socket}`);
  socket.on('connected', (userId) => {
  console.log(userId, socket.id);
  onlineUsers.set(userId, socket.id);
  console.log("conectado");
  // console.log(data.post.msg, data.post.to);
  // io.emit((data.post.to).toString(), "Recibido")//Primer parametro el nombre o id de la persona a quien va dirigido
  })

  socket.on('typing', (data) => {
    console.log(data);
    
    const receiverUserSocket = onlineUsers.get(data.to);
    if(receiverUserSocket)socket.to(receiverUserSocket).emit(`typing`, data.msg)
  })

  socket.on("send-Message", (data) => {
    console.log("hola", data.to);
    console.log("msg", data.msg);
    console.log("socket", data.socket);
    const receiverUserSocket = onlineUsers.get(data.to);
    console.log(receiverUserSocket);
    
    const senderUserSocket = onlineUsers.get(data.sender);
    console.log(senderUserSocket);
    if(senderUserSocket)socket.to(receiverUserSocket).emit(`${data.to}`, {msg:data.msg, from: data.sender})
    // const o = io.emit(`${data.to}`, {msg:data.msg, from: data.sender})
    // socket.to(data.socket).emit(`${data.sender}`, {msg:data.msg, from: data.sender})
    io.emit(`${data.sender}`, {msg:data.msg, from: data.sender})

    const updateMessages = async () => {
    const response = await fetch("http://localhost:5001/messages",{
        method:'POST',
        headers:{
          "Content-Type": "application/json"
        },
        body: JSON.stringify({sender: data.sender, receiver: data.to, msgs:data.msg, name:data.msg.split(':')[0]})
      })
    const dataResponse = await response.json()
    console.log(dataResponse);
    
    }
    updateMessages();
  })
})


server.listen(4000, () => {
  console.log("Server running");
})