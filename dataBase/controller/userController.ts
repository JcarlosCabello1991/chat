import { NextFunction, Request, Response } from "express";
import { Error } from "mongoose";
import db from "../db/connect";
import userModel from "../userModel/user";

export const getUsers = async(_req:Request, res:Response, _next:NextFunction) => {
  console.log("hola", db);
  
  try{
    const users = await userModel.find({}).lean().exec();
    console.log(users);
    
    res.status(200).send({ok:true, msg:users})
  }catch(error){
    res.status(400).send({ok:false, msg:"error.message"})
  }
  
}

export const updateMessages = async(req:Request, res:Response, _next:NextFunction) => {
  const {sender, receiver, msgs} = req.body;
  console.log("Actualizando mensaje en BD",msgs);
  console.log("Emisor", sender);
  console.log("Receptor", receiver);
  
  
  try{
    let user = await userModel.findById(sender).lean().exec();
    console.log(user?.chats);
    
    console.log(receiver, sender);

    const exists = user?.chats.find(chat => chat.receiver == receiver);
    console.log("Usuario", user);
    
    console.log("Existe", exists);
    //Si el usuario tiene una conversación existente con el receptor se actualiza el array de mensajes
    //Sino se rellena el array de mensajes
    if(exists == undefined){
      user?.chats?.push({receiver:receiver, messages: [msgs]})
      const updateMessagesUser = await userModel.findByIdAndUpdate(sender, {chats:{receiver:receiver,messages:msgs, current:true}},{new:true}).lean().exec();
    }else{
      //Actualizamos los mensajes de la conversación actual
      exists.messages.push(msgs);  
      const messagesUpdated = exists.messages;    
      console.log("Emisor", user?.chats);

      //Actualizamos la conversación en la base de datos
      const updateMessagesUser = await userModel.findByIdAndUpdate(sender, {chats:{receiver:receiver,messages:messagesUpdated, current:true}},{new:true}).lean().exec();      
    }

    //Hacemos lo mismo que antes pero con el usuario receptor
    let userReceiver = await userModel.findById(receiver).lean().exec();
    const existsMessagesOnReceiver = userReceiver?.chats.find(chat => chat.receiver == sender);
    console.log("Usuario receptor", user);    
    console.log("Existe conversacion", existsMessagesOnReceiver);

    if(existsMessagesOnReceiver == undefined){
      userReceiver?.chats?.push({receiver:receiver, messages: [msgs]})
      const updateMessagesUser = await userModel.findByIdAndUpdate(receiver, {chats:{receiver:sender,messages:msgs}},{new:true}).lean().exec();
      console.log(updateMessagesUser);
    }else{
      existsMessagesOnReceiver.messages.push(msgs);
      const messagesUpdated = existsMessagesOnReceiver.messages;
      console.log("Receptor", userReceiver?.chats);

      const updateMessagesUser = await userModel.findByIdAndUpdate(receiver, {chats:{receiver:sender,messages:messagesUpdated}},{new:true}).lean().exec();
      console.log(updateMessagesUser);
      
    }
    
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
  console.log(currentRoom);
  
  const room = currentRoom?.chats.find(cRoom => cRoom.current == true);

  res.status(200).send({ok:true, currentRoom: room?.receiver, name: room?.name})
  
}