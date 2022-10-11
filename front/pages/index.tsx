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
  const [currentRoom, setCurrentRoom] = useState<string>("Julio");
  const [id1, setid1] = useState<string>();
  const [id2, setid2] = useState<string>();
  const [inputUser,setInputUser] = useState("");


  //Obtenemos los contactos
  useEffect(() => {
    const getUsers = async() => {
      const response = await fetch('http://localhost:5001/users');
      const data1 = await response.json();
      setUsers(data1.msg)  
      setid1(data1.msg[0]._id)
      // setid2(data1.msg[1]._id)
      
      if(window.location.host == "localhost:3001"){
        setUsers(data1.msg)  
        setid1(data1.msg[1]._id)
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
        body:JSON.stringify({user:id1})
      });
      const room = await responseCurrentRoom.json();
      console.log(room);
      setid2(room.currentRoom);
      setCurrentRoom(room.name);
      getMessagesOfCurrentRoom(room.currentRoom)
      if(window.location.host == "localhost:3001"){
        setCurrentRoom("Alicia")
      }
    }
    currentRoom();
  },[id1])

  //Cargamos los mensajes de la conversación actual cuando se hayan cargado el id2 y currentRoom del useEffect anterior
  const getMessagesOfCurrentRoom = async (currentRoom:any) => {
    const responseOfCurrentRoom = await fetch("http://localhost:5001/getMessages",{
      method:'POST',
      headers:{
        'Content-Type':'application/json'
      },
      body: JSON.stringify({sender:id1, receiver:currentRoom})
    })
    const dataMessages = await responseOfCurrentRoom.json();
    console.log(dataMessages.msgs);
    setMessages(dataMessages.msgs)
  } 
 

  //Escuchamos en los clientes para recibir el mensaje enviado y actualizar los mensajes en base de datos
  // useEffect(() => {
  //   // socket.on(`${(socket.id)?.toString()}`, (data:string) => {
  //   // setMessages((prevMessages)=>{
  //   //   console.log([...prevMessages, data]);
      
  //   //   return[...prevMessages,data]
  //   // })
  //   // console.log(messages);      
    
  //   // })

  //   if(window.location.host == "localhost:3001"){
      
  //   socket.on(`${id2}`, (data:string) => {
  //     setMessages((prevMessages)=>{
  //       console.log([...prevMessages, data]);
        
  //       return[...prevMessages,data]
  //     })      
  //   })
  //   }else{
  //     socket.on(`${id1}`, (data:string) => {
  //       setMessages((prevMessages)=>{
  //         console.log([...prevMessages, data]);
  //         updateMessageChat([...prevMessages, data]);
  //         return[...prevMessages,data]
  //       })
  //       console.log(messages);
  //     })
  //   }
  // },[id2])

  //Almacenamos los nuevos mensajes 
  // const updateMessageChat = async(dataMessage:any) => {
  //   const response = await fetch("http://localhost:5001/messages",{
  //       method:'POST',
  //       headers:{
  //         "Content-Type": "application/json"
  //       },
  //       body: JSON.stringify({sender: id1, receiver: id2, msgs:dataMessage})
  //     })
  //     const data = await response.json()
  // }

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
      
      socket.emit(`send-Message`, {msg:`${currentRoom}:${input}`, to:`${id2}`, sender:`${id1}`})
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
    if(value == "Julio"){
      // setid1(users[0]._id)
      setCurrentRoom(users[1].name)

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
      
    }
    else{
      setMessages([""]);
    }
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
        <p>{id1}</p>
        <p>{id2}</p>
        <input type="text" value={inputUser} name="userName" onChange={(e)=>handleUser(e.target.value)}/>
        <button type='submit'>Send</button>
        <div style={{display:'flex', gap:'3rem'}}>
        <div style={{width:'40rem', minHeight:'25rem', borderRadius:'15px', padding:'0', border:'1px solid white'}}>
          <h2 style={{border:"1px solid white", borderRadius:"15px 15px 0 0", margin:'0px', paddingLeft:'1rem'}}>{currentRoom != "" ? currentRoom : "Abre un chat"}</h2>
        <fieldset id="fieldset" style={{width:'40rem',minHeight:'22.5rem',maxHeight:'22.5rem', borderRadius:'15px', padding:'0', border:'0', overflowY:'scroll', display:'flex', alignContent: "flex-start", flexDirection:"column"}}>
        {
          messages?.length >= 1 && messages.map((msg, index) => {            
            return(
              <p key={index}>
                {msg}
              </p>
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
