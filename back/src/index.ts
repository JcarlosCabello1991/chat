import {Server, Socket} from 'socket.io'
import express from 'express'
import http from 'http'
import fetch from 'node-fetch'
import cors from 'cors'

const app = express();
app.use(cors({
  origin:'*'
}))

const server = http.createServer(app);
var usuarios:any = []
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
io.on('connection', function (socket) {
  global.chatSocket = socket;
  /////
  // const usersId = await fetch("http://localhost:5001/users")
  // const ids = await usersId.json();
  // console.log("IDSSSSS",ids);//ids.msg(map)._id
  // ids.msg.map((element: { _id: string | string[]; }) => {
  //   io.socketsJoin(element._id)
  // })
  socket.on('update_list', function( data )
	{
    var user = { idSocket: socket.id, id: data.id, usuario: data.usuario };
			
			// Guardar usuario en el arreglo de las sesiones del chat
			if(typeof usuarios[fnFindUser(data.id)] === 'undefined')
			{
				usuarios.push(user);
			}
			else
			{
				usuarios[fnFindUser(data.id)] = user;
			}
      io.emit('session_update', usuarios.sort(fncompare), socket.id );
  })


  /////
  
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
    console.log("SOCKETS", io.sockets.allSockets())
    console.log("hola", data.to);
    console.log("msg", data.msg);
    console.log("socket", data.socket);
    console.log(data)
    const receiverUserSocket = onlineUsers.get(data.to);
    console.log("receiver",receiverUserSocket);
    
    const senderUserSocket = onlineUsers.get(data.sender);
    console.log("sender",senderUserSocket);
    // if(senderUserSocket)socket.to(receiverUserSocket).emit(`${data.to}`, {msg:data.msg, from: data.sender})//receiverUserSocket
    // const o = io.emit(`${data.to}`, {msg:data.msg, from: data.sender})
    // socket.to(data.socket).emit(`${data.sender}`, {msg:data.msg, from: data.sender})
    socket.broadcast.to(data.to).emit(`${data.receiver}`, {msg:data.msg, from: data.sender})
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
    console.log("MSG",dataResponse);
    
    }
    updateMessages();
  })
})

function fnFindUser(id: any)
{
	for(var i = 0; i < usuarios.length; i++)
	{
		var u = usuarios[i];
		if(u.id == id)
			return i;
	}
	
	return -1;
}

function fncompare(a: { nombre: number; }, b: { nombre: number; }) 
{
  if (a.nombre < b.nombre)
    return -1;
  else if (a.nombre > b.nombre)
    return 1;
  else 
    return 0;
}


server.listen(4000, () => {
  console.log("Server running");
})