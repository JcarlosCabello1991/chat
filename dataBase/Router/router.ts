import express, {Router} from 'express'
import { getCurrentRoom, getMessages, getUsers, updateMessages,getPendingMessages, deletePendingMessages } from '../controller/userController';

const userRouter = Router();

userRouter.get('/users', getUsers);
userRouter.post('/messages', updateMessages);
userRouter.post('/getMessages', getMessages);
userRouter.post('/currentRoom', getCurrentRoom);
userRouter.post('/pendingMessages', getPendingMessages)
userRouter.post('/deletePendingMessages', deletePendingMessages);

export default userRouter