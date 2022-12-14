import { model, Schema } from "mongoose";


const userSchame = new Schema({
  name: String,
  chats:[
    {
      receiver: String,
      current: Boolean,
      name: String,
      messages:[{
        type: String,
        default:[]
      }]
    }
  ]
})

const userModel = model("users", userSchame);

export default userModel;