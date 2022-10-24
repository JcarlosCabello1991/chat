import { NextFunction, Request, Response } from "express";
import { Error } from "mongoose";
import db from "../db/connect";
import userModel from "../userModel/user";

export const getUsers = async(_req:Request, res:Response, _next:NextFunction) => {  
  try{
    const users = await userModel.find({}).lean().exec();
    res.status(200).send({ok:true, msg:users})
  }catch(error){
    res.status(400).send({ok:false, msg:"error.message"})
  }
  
}

const updatePendingMessages = async(sender: string | undefined, receiver: string,users: {id:string, idSocket:string, usuario:string}[]) => {
  //First we need to check if the receiver user is connected
  //to do that we make a find on users thats contains an users connected array
  const isConnected = users.find((user:{id:string, idSocket:string, usuario:string}) => user.id == receiver);
  if(isConnected == undefined){
    //First we need to check if exist a conversation with sender user and put the pendding messages on to +1
    //If not we have to create a new conversation with pendingMessagesProperty to 1
    const userReceiver = await userModel.findById(receiver)//We catch the receiver user with all his chats
    const existsChatWithSender = userReceiver?.chats.find(chat => chat.receiver == sender)
    if(existsChatWithSender){
      existsChatWithSender.pendingMessages +=1;
    }
    const updateReceiver = await userModel.findByIdAndUpdate(receiver, {chats:userReceiver?.chats},{new:true}).lean().exec();
    return updateReceiver;
  }
}

export const updateMessages = async(req:Request, res:Response, _next:NextFunction) => {
  const {sender, receiver, msgs, name, users} = req.body;  
  
  try{
    let user = await userModel.findById(sender).lean().exec();

    const exists = user?.chats.find(chat => chat.receiver == receiver);
    
    console.log("Existe", exists);
    //Si el usuario tiene una conversación existente con el receptor se actualiza el array de mensajes
    //Sino se rellena el array de mensajes
    if(exists == undefined){
      const chats = user?.chats?.push({receiver:receiver, messages: [msgs], current:true, name: name, pendingMessages:0})
      user?.chats.map(chat => {
        if(chat.receiver != receiver) chat.current = false;
      })
      console.log("CHATS ACTUALIZADOS", user?.chats);
      
      const updateMessagesUser = await userModel.findByIdAndUpdate(sender, {chats:user?.chats},{new:true}).lean().exec();
    }else{
      //Actualizamos los mensajes de la conversación actual
      exists.messages.push(msgs);  
      const messagesUpdated = exists.messages;
      exists.current = true;
      user?.chats.map(chat => {
        if(chat.receiver != receiver) chat.current = false;
      }) 

      //Actualizamos la conversación en la base de datos
      try {
        const updateMessagesUser = await userModel.findByIdAndUpdate(sender, {chats:user?.chats},{new:true}).lean().exec(); 
      } catch (error) {
        console.log(error)
      }
           
    }

    //Hacemos lo mismo que antes pero con el usuario receptor
    let userReceiver = await userModel.findById(receiver).lean().exec();
    const existsMessagesOnReceiver = userReceiver?.chats.find(chat => chat.receiver == sender);
    console.log("Usuario receptor", userReceiver);    
    console.log("Existe conversacion", existsMessagesOnReceiver);

    if(existsMessagesOnReceiver == undefined){
      const findUser = await userModel.findById(sender);//receiver
      userReceiver?.chats?.push({receiver:sender, messages: [msgs], current:false, name:findUser?.name, pendingMessages:0})
      const updateMessagesUser = await userModel.findByIdAndUpdate(receiver, {chats:userReceiver?.chats},{new:true}).lean().exec();
    }else{
      existsMessagesOnReceiver.messages.push(msgs);
      const messagesUpdated = existsMessagesOnReceiver.messages;
      const updateMessagesUser = await userModel.findByIdAndUpdate(receiver, {chats:userReceiver?.chats},{new:true}).lean().exec();      
    }
    const resp = await updatePendingMessages(sender, receiver, users);
    console.log("RESPONDIENDO YAAAA",resp)
    res.status(200).send({ok:true, msg:user})
  }catch(error){
    res.status(400).send({ok:false, msg:Error.messages})
  }
}

export const getMessages = async (req: Request, res: Response)=>{
  console.log("Leyendo mensajes", req.body.sender, req.body.receiver);
  
  let user = await userModel.findById(req.body.sender);

  console.log("Chats del usuario",user?.chats);
  
  let chatsList = user?.chats;

  let messages = chatsList?.find(chat => chat.receiver == req.body.receiver);
  console.log("Mensajes",messages);
  
  res.status(200).send({ok:true, msgs: messages?.messages});
}

export const getCurrentRoom = async (req:Request, res: Response) => {
  console.log("Buscando ultima conversación...");
  const userId = req.body.user;

  let currentRoom = await userModel.findById(userId)
  console.log("CurrentROM",currentRoom);
  
  const room = currentRoom?.chats.find(cRoom => cRoom.current == true);

  res.status(200).send({ok:true, currentRoom: room?.receiver, name: room?.name})  
}

export const getPendingMessages = async (req: Request, res:Response) => {
  console.log("Updating messages at not connected user");
  const userId = req.body.user;
  const userReceiver = req.body.receiver;
  let user = await userModel.findById(userId);
  res.status(200).send({ok:true, msg:user})
}

export const deletePendingMessages = async (req:Request, res: Response) => {
  console.log("Deleting pending messages from user")
  const userId = req.body.user;
  const receiver = req.body.receiver;
  
  console.log("USERID",userId)
  console.log("receiver",receiver)
  const user = await userModel.findById(userId);
  console.log("USER",user)

  const chat = user?.chats.find(element => element.receiver == receiver);
  user?.chats.map(chat =>{
    if(chat.receiver == receiver) chat.pendingMessages = 0;
  })
  console.log("CHAT", chat)

  if(chat != undefined){
    const updated = await userModel.findByIdAndUpdate(userId,{chats:user?.chats},{new:true}).lean().exec();
    console.log("UPDATED",updated)
    res.status(200).send({ok:true, msg:updated})
  }
}