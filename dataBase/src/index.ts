import userRouter from "../Router/router";
import express,{Express} from 'express'
import db from "../db/connect"
import cors from 'cors'

const app: Express = express();
app.use(cors({
  origin:'*'
}));
app.use(express.json()),
app.use("",userRouter);

db().then(async function onsServerInit() {
  console.log('DB connected')

  app.listen(5001, () => {
      console.log(`Server running at http://localhost:5001`)
  })
})