import express, {Router} from 'express'
import { getCurrentRoom, getMessages, getUsers, updateMessages } from '../controller/userController';

const userRouter = Router();

userRouter.get('/users', getUsers);
userRouter.post('/messages', updateMessages);
userRouter.post('/getMessages', getMessages);
userRouter.post('/currentRoom', getCurrentRoom);

export default userRouter