import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import handleSocket from './handleSocket';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
const server = createServer(app);
export const io = new Server(server);

let base = __dirname.split('/');
base.pop();
const path = base.join('/');

app.use(express.json());
app.use(express.static(`${path}/frontend/build`));

app.get('*', (_, res) => res.sendFile(`${path}/frontend/build/index.html`));

handleSocket(io);

server.listen(process.env.PORT || 80, () =>
  console.log('App is now initialized and ready for requests.'),
);
