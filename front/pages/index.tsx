import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import { ReactEventHandler, useEffect, useRef, useState } from 'react'
import {io} from 'socket.io-client'

var socketId;
var usuarios = [];
const socket = io(`http://localhost:4000`);//http://localhost:4000
const Home: NextPage = () => {

  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<string[]>(["hola"])
  const [users, setUsers] = useState([]);
  const [currentRoom, setCurrentRoom] = useState<string>("Julio");//Nombre de la persona con la que se habla
  const [id1, setid1] = useState<string>();
  const [id2, setid2] = useState<string>();
  const [inputUser,setInputUser] = useState("");
  const [userName, setUserName] = useState<string>("")
  const [dataMessages, setDataMessages] = useState<{msg:string, from:string}>({msg:"", from:""})
  const [typing, setTyping] = useState<string>("");
  const [dataTyping, setDataTyping] = useState<string>("");
  const [pendingMessages, setPendingMessages] = useState<{id:string, numberMessages:number}[]>([]);

  //Obtenemos los contactos
  useEffect(() => {
    const getUsers = async() => {
      const response = await fetch('http://localhost:5001/users');
      const data1 = await response.json();
      setUsers(data1.msg)  
      if(window.location.host == "localhost:3000"){
        console.log(data1.msg[0].name);//Nombre del usuario(tu nombre)
      setUserName("Juan Carlos")//Here we will set the name of user account
      setid1("633ee940468b79f49c802296")//Here we set the id of user account
      setid2("633ee8ec468b79f49c802292")//This line is in line 62, here this line should be deleted
      setCurrentRoom("Alicia")
      
      }
      //this if bellow will be deleted is only for test
      if(window.location.host == "localhost:3001"){
        setUserName("Alicia")
        setUsers(data1.msg)  
        setid1("633ee8ec468b79f49c802292")
        setid2("633ee940468b79f49c802296")//Prueba
        setCurrentRoom("Juan Carlos")
      }
    }
    getUsers();
  },[])

  //Obtenemos la ultima conversación abierta
  useEffect(() => {
    if(window.location.host == 'localhost:3000'){
      socket.emit('update_list', { id: `${id1}`, usuario: 'Juan Carlos', action: 'login' });
    }else{
      socket.emit('update_list', { id: `${id1}`, usuario: 'Alicia', action: 'login' });
    }
    socket.on('session_update', function(data, socket){
      socketId = socket;
      usuarios = data;
      
      // Lista de usuarios conectados
      console.log(usuarios);
    });
    socket.emit("connected", id1)
    const currentRoom = async () => {
    const responseCurrentRoom = await fetch("http://localhost:5001/currentRoom",{
        method:'POST',
        headers:{
          'Content-Type':'application/json'
        },
        body:JSON.stringify({user:window.location.host == "localhost:3000" ? id1 : id2})
      });
      const room = await responseCurrentRoom.json();
      
      console.log(room);
      console.log(room.name);
      setCurrentRoom(room.name);
      // setid2(room.currentRoom);
      getMessagesOfCurrentRoom(room.currentRoom)
      if(window.location.host == "localhost:3001"){
        setCurrentRoom("Juan Carlos")
      }
    }
    currentRoom();
  },[id1])

  //Cargamos los mensajes de la conversación actual cuando se hayan cargado el id2 y currentRoom del useEffect anterior
  const getMessagesOfCurrentRoom = async (idCurrentRoom:any) => {
    console.log("currentRoom",idCurrentRoom);
    console.log("id1",id1);
    console.log("id2",id2);
    if(currentRoom != undefined){
    const responseOfCurrentRoom = await fetch("http://localhost:5001/getMessages",{
      method:'POST',
      headers:{
        'Content-Type':'application/json'
      },
      body: JSON.stringify({sender:window.location.host == "localhost:3000" ? id1 : id2, receiver:window.location.host == "localhost:3000" ?idCurrentRoom:id1})
    })
    const dataMessages = await responseOfCurrentRoom.json();
    setMessages(dataMessages.msgs)
  }
  } 
 

  //Escuchamos en los clientes para recibir el mensaje enviado y actualizar los mensajes en base de datos
  useEffect(() => {    
    socket.on(`${id1}`, (data:any) => {
      // console.log("currentRoom", currentRoom);
      // console.log("id2", id2);
      // console.log("Mensaje de:", data.from);
      // console.log("Booelan", id2 == data.from || id1 == data.from);  
      console.log(data)
      setDataMessages(data);
    })

    socket.on('typing', (data:any) => {     
      console.log("ME ESCRIBEN"); 
      setTyping(data);
    })
  },[id2])
  
  useEffect(() => {
    if(dataMessages.from == id2 || dataMessages.from == id1) {
      setMessages((prevMessages) => {return [...prevMessages, dataMessages.msg]})
    }else{
      const exist = pendingMessages.find(chat => chat.id == dataMessages.from);
      console.log(exist);
      console.log(pendingMessages);
      
      if(exist != undefined) {
        pendingMessages.map(msg => {
          if(msg.id == dataMessages.from) msg.numberMessages += 1
        })
        
        setPendingMessages(pendingMessages)
      }else{
        if(dataMessages.from != ''){
        const idUser = dataMessages.from;        
        setPendingMessages([{id:idUser, numberMessages:1}])
        
      }
    }
  }
  },[dataMessages])

  useEffect(() => {
    console.log(typing);
    
    setDataTyping(typing);
  }, [typing])

  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    if(messagesEndRef.current != null)
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block:'end' });
    
      const field = document.getElementById("fieldset");
      field && (field.scrollTop = field.scrollHeight);
  };

  useEffect(scrollToBottom, [messages]);

  const handleInput = (value:string) => {
    if(window.location.host == "localhost:3000"){
      console.log("Escribiendo");
      
      setInput(value);
      socket.emit(`typing`, {msg:`${userName} is typing`, to:`${id2}`, sender:`${id1}`, socket:socket.id})
      
    }else{
      setInput(value);
      socket.emit(`typing`, {msg:`${userName} is typing`, to:`${id2}`, sender:`${id1}`, socket:socket.id})
    }
  }

  const submitMessage = async() => {
    console.log(window.location.host);
  
    if(window.location.host == "localhost:3000"){
      // const id = id1;
      // console.log("sender",id1);
      // console.log("receiver", id2);      
      // console.log("name", currentRoom); 

      socket.emit(`send-Message`, {msg:`${userName}:${input}`, to:`${id2}`, sender:`${id1}`, socket:socket.id})
      socket.emit(`typing`, {msg:``, to:`${id2}`, sender:`${id1}`, socket:socket.id})
      // console.log(data);
      console.log(pendingMessages);
      
    }else{
      // const id = id2;
      // console.log(id2);
      console.log(pendingMessages);
      socket.emit(`send-Message`, {msg:`${userName}:${input}`, to:`${id2}`, sender:`${id1}`, socket:socket.id})
    }
    console.log(pendingMessages);
    // console.log(socket.id);
    setInput("");
  }

  //Cargar los mensajes del chat actual
  const handleUser = async(value:any, userId:string) => {
    socket.emit(`typing`, {msg:``, to:`${id2}`, sender:`${id1}`, socket:socket.id})//set to '' message typing
    setInputUser(value);
    setid2(userId)
    setCurrentRoom(value)
    deletePendingMessage(userId)
      
    setMessages([])
    //recogemos los mensajes cada vez que cambiamos de chat
    const response = await fetch("http://localhost:5001/getMessages",{
      method:'POST',
      headers:{
        'Content-Type':'application/json'
      },
      body:JSON.stringify({sender:id1,receiver:userId})
    })
    const msgs = await response.json();
    setMessages(msgs.msgs)
  }

  const deletePendingMessage = (userId:string) => {
    const messagesAllreadyPending = pendingMessages.filter(chat => chat.id != userId);
    setPendingMessages(messagesAllreadyPending);
  }
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <p>sender: {id1}</p>
        <p>receiver: {id2}</p>
        <input type="text" value={inputUser} name="userName" onChange={(e)=>handleUser(e.target.value)}/>
        <button type='submit'>Send</button>
        <p>Soy: {userName}</p>
        <div style={{display:'flex', gap:'3rem'}}>
        <div style={{width:'40rem', minHeight:'25rem', borderRadius:'15px', padding:'0', border:'1px solid white'}}>
          <h2 style={{border:"1px solid white", borderRadius:"15px 15px 0 0", margin:'0px', paddingLeft:'1rem'}}>{currentRoom != "" ? currentRoom : "Abre un chat"} {typing}</h2>
        <fieldset id="fieldset" style={{width:'39.9rem',minHeight:'22.5rem',maxHeight:'22.5rem', borderRadius:'15px', padding:'0 0.5rem 0 0.5rem', border:'0', overflowY:'scroll', display:'flex', alignContent: "flex-start", flexDirection:"column", paddingTop:'0.5rem'}}>
        {
          messages?.length >= 1 && messages.map((msg, index) => {            
            return(
              <>
              { currentRoom == msg.split(':')[0] ?
              <div style={{display:'flex', justifyContent:'flex-start'}}>
                <span key={index} style={{maxWidth:'fit-content',textAlign:'left', border:'1px solid white', borderRadius:'5px', paddingTop:'2px', paddingBottom:'2px', paddingLeft:'5px', paddingRight:'5px', marginBottom:'0.5rem', backgroundColor:'green'}}>
                  {/* comprobar si currentRoom == msg.split(':')[0] el nombre del chat en cuyo caso se pone a la izquierda y se muestra sino a la dcha y mostrando siempre msg.split(':')[1] */}
                  {msg.split(':')[1]}
                </span>
              </div>
              :
              <div style={{display:'flex', justifyContent:'flex-end'}}>
                <span key={index}style={{maxWidth:'fit-content',textAlign:'right', border:'1px solid white', borderRadius:'5px', paddingTop:'2px', paddingBottom:'2px',paddingLeft:'0.5rem', paddingRight:'5px', marginBottom:'0.5rem', backgroundColor:'green'}}>
                  {/* comprobar si currentRoom == msg.split(':')[0] el nombre del chat en cuyo caso se pone a la izquierda y se muestra sino a la dcha y mostrando siempre msg.split(':')[1] */}
                  {msg.split(':')[1]}
                </span>
              </div>
              }
              </>
            )
          })
        }
        <div ref={messagesEndRef} />
        </fieldset>
        <div style={{display:'flex'}}>
          <input name='input' type="text" value={input} onChange={(e) => handleInput(e.target.value)} style={{width:'100%', height:'2.5rem', borderRadius:'0 0 0 15px', border:'0px'}}/>
          <button onClick={submitMessage} style={{width:'10%',height:'2.5rem', borderRadius:'0 0 15px 0', border:'0'}}>Send</button>
        </div>
        </div>
        <div style={{border:'1px solid white', borderRadius:'15px', width:'10rem'}}>
          {
            users.map(user => {
              if(user._id != id1){
                let userMessages:{id:string, numberMessages:number} | undefined = pendingMessages.find(chat => chat.id == user._id)
              return(
                <>
                  
                <p style={{paddingLeft:'1rem'}}key={user._id} onClick={()=>{setCurrentRoom(user.name); setid2(user._id);handleUser(user.name, user._id)}}>
                  {user.name} 
                  {/* {userMessages != undefined && 
                  // (userMessages?.numberMessages)
                  <div style={{maxWidth:'0.5rem', maxHeight:'0.5rem', borderRadius:'50%', backgroundColor:'red'}}>{" "} </div>
                  } */}
                </p>
                {userMessages != undefined && 
                  // (userMessages?.numberMessages)
                  <div style={{width:'0.5rem', height:'0.5rem', borderRadius:'50%', backgroundColor:'red'}}></div>
                  }
                <hr></hr>
                </>
              )
              }
            })
          }
        </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  )
}

export default Home
