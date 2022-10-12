import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import { ReactEventHandler, useEffect, useRef, useState } from 'react'
import {io} from 'socket.io-client'
import data from './contacts.json'

const socket = io("http://localhost:4000");
const Home: NextPage = () => {

  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<string[]>(["hola"])
  const [users, setUsers] = useState([]);
  const [currentRoom, setCurrentRoom] = useState<string>("Julio");//Nombre de la persona con la que se habla
  const [id1, setid1] = useState<string>();
  const [id2, setid2] = useState<string>();
  const [inputUser,setInputUser] = useState("");
  const [userName, setUserName] = useState<string>("")

  //Obtenemos los contactos
  useEffect(() => {
    const getUsers = async() => {
      const response = await fetch('http://localhost:5001/users');
      const data1 = await response.json();
      setUsers(data1.msg)  
      if(window.location.host == "localhost:3000"){
        console.log(data1.msg[0].name);//Nombre del usuario(tu nombre)
      setUserName(data1.msg[0].name)
      setid1(data1.msg[0]._id)
      setid2(data1.msg[2]._id)//Prueba
      setCurrentRoom(data1.msg[2].name)
      }
      if(window.location.host == "localhost:3001"){
        setUsers(data1.msg)  
        setid1(data1.msg[0]._id)
        setid2(data1.msg[2]._id)//Prueba
        setCurrentRoom("Alicia")
      }
    }
    getUsers();
  },[])

  //Obtenemos la ultima conversación abierta
  useEffect(() => {
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
      // setid2(room.currentRoom);
      setCurrentRoom(room.name);
      getMessagesOfCurrentRoom(room.currentRoom)
      if(window.location.host == "localhost:3001"){
        setCurrentRoom("Alicia")
      }else{
        setCurrentRoom("Roger")
      }
    }
    currentRoom();
  },[id1])

  //Cargamos los mensajes de la conversación actual cuando se hayan cargado el id2 y currentRoom del useEffect anterior
  const getMessagesOfCurrentRoom = async (currentRoom:any) => {
    console.log("currentRoom",currentRoom);
    console.log("id1",id1);
    console.log("id2",id2);
    
    const responseOfCurrentRoom = await fetch("http://localhost:5001/getMessages",{
      method:'POST',
      headers:{
        'Content-Type':'application/json'
      },
      body: JSON.stringify({sender:window.location.host == "localhost:3000" ? id1 : id2, receiver:window.location.host == "localhost:3000" ?currentRoom:id1})
    })
    const dataMessages = await responseOfCurrentRoom.json();
    console.log(dataMessages.msgs);
    setMessages(dataMessages.msgs)
  } 
 

  //Escuchamos en los clientes para recibir el mensaje enviado y actualizar los mensajes en base de datos
  useEffect(() => {
    // socket.on(`${(socket.id)?.toString()}`, (data:string) => {
    // setMessages((prevMessages)=>{
    //   console.log([...prevMessages, data]);
      
    //   return[...prevMessages,data]
    // })
    // console.log(messages);      
    
    // })

    if(window.location.host == "localhost:3001"){
      
    socket.on(`${id2}`, (data:string) => {
      setMessages((prevMessages)=>{
        console.log([...prevMessages, data]);
        
        return[...prevMessages,data]
      })      
    })
    }else{
      socket.on(`${id1}`, (data:string) => {
        setMessages((prevMessages)=>{
          console.log(data);
          
          // console.log([...prevMessages, data]);
          // updateMessageChat([...prevMessages, data]);
          return[...prevMessages,data]
        })
        console.log(messages);
      })
    }
  },[id2])

  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    if(messagesEndRef.current != null)
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block:'end' });
    
      const field = document.getElementById("fieldset");
      field.scrollTop = field.scrollHeight;
  };

  useEffect(scrollToBottom, [messages]);

  const handleInput = (value:string) => {
    if(window.location.host == "localhost:3000"){
      setInput(value);
    }else{
      setInput(value);
    }
  }

  const submitMessage = async() => {
    console.log(window.location.host);
  
    if(window.location.host == "localhost:3000"){
      const id = id1;
      console.log("sender",id1);
      console.log("receiver", id2);      
      console.log("name", currentRoom);      
      
      socket.emit(`send-Message`, {msg:`${userName}:${input}`, to:`${id2}`, sender:`${id1}`})
      console.log(data);
      
    }else{
      const id = id2;
      console.log(id2);
      
      socket.emit(`send-Message`, {msg:`${currentRoom}:${input}`, to:`${id1}`, sender:`${id2}`})
    }
    console.log(socket.id);
    setInput("");
  }

  //Cargar los mensajes del chat actual
  const handleUser = async(value:any, userId:string) => {
    console.log("Value", value);
    
    setInputUser(value);
    // if(value == "Julio"){
      // setid2(users[0]._id)
      setCurrentRoom(value)
      setMessages("")
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
      console.log(msgs);
      
    // }
    // else{
    //   setMessages([""]);
    // }
  }
  
  console.log(messages);
  
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
        <div style={{display:'flex', gap:'3rem'}}>
        <div style={{width:'40rem', minHeight:'25rem', borderRadius:'15px', padding:'0', border:'1px solid white'}}>
          <h2 style={{border:"1px solid white", borderRadius:"15px 15px 0 0", margin:'0px', paddingLeft:'1rem'}}>{currentRoom != "" ? currentRoom : "Abre un chat"}</h2>
        <fieldset id="fieldset" style={{width:'39.9rem',minHeight:'22.5rem',maxHeight:'22.5rem', borderRadius:'15px', padding:'0 0.5rem 0 0.5rem', border:'0', overflowY:'scroll', display:'flex', alignContent: "flex-start", flexDirection:"column", paddingTop:'0.5rem'}}>
        {
          messages?.length >= 1 && messages.map((msg, index) => {            
            return(
              <>
              { currentRoom == msg.split(':')[0] ?
              <div style={{display:'flex', justifyContent:'flex-start'}}>
                <span key={index} style={{maxWidth:'fit-content',textAlign:'left', border:'1px solid white', borderRadius:'5px', paddingTop:'2px', paddingBottom:'2px', paddingLeft:'5px', paddingRight:'5px', marginBottom:'0.5rem'}}>
                  {/* comprobar si currentRoom == msg.split(':')[0] el nombre del chat en cuyo caso se pone a la izquierda y se muestra sino a la dcha y mostrando siempre msg.split(':')[1] */}
                  {msg.split(':')[1]}
                </span>
              </div>
              :
              <div style={{display:'flex', justifyContent:'flex-end'}}>
                <span key={index}style={{maxWidth:'fit-content',textAlign:'right', border:'1px solid white', borderRadius:'5px', paddingTop:'2px', paddingBottom:'2px',paddingLeft:'0.5rem', paddingRight:'5px', marginBottom:'0.5rem'}}>
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
              return(
                <>
                <p style={{paddingLeft:'1rem'}}key={user._id} onClick={()=>{setCurrentRoom(user.name); setid2(user._id);handleUser(user.name, user._id)}}>
                  {user.name}
                </p>
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
