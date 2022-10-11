import {Server} from 'socket.io'
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

io.on('connection', (socket) => {
  
  
  console.log(`hola, ${socket}`);
  socket.on('connected', (data) => {
  console.log(socket);
  console.log("conectado");
  console.log(data.post.msg, data.post.to);
  io.emit((data.post.to).toString(), "Recibido")//Primer parametro el nombre o id de la persona a quien va dirigido
  })

  socket.on("send-Message", (data) => {
    console.log("hola", data.to);
    console.log("msg", data.msg);
    
    // io.to(data.to).emit(data.msg);
    // io.to(data.sender).emit(data.msg);
    const o = io.emit(data.to, data.msg)
    
    io.emit(data.sender, data.msg)

    const updateMessages = async () => {
    const response = await fetch("http://localhost:5001/messages",{
        method:'POST',
        headers:{
          "Content-Type": "application/json"
        },
        body: JSON.stringify({sender: data.sender, receiver: data.to, msgs:data.msg})
      })
    const dataResponse = await response.json()
    }
    updateMessages();
  })
})


server.listen(4000, () => {
  console.log("Server running");
})