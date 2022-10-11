import mongoose, { Mongoose } from "mongoose";

function db() : Promise<Mongoose> {
  return mongoose.connect('mongodb+srv://juancarlos:123456qazwsx@cluster0.oashwyz.mongodb.net/?retryWrites=true&w=majority');
}

export default db