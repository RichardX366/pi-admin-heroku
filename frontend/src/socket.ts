import { createState } from '@hookstate/core';
import { Persistence } from '@hookstate/persistence';
import { io } from 'socket.io-client';
import { error } from './components/Notification';

export const socket = io();

socket.on('connect', () => {
  if (globalSecret.value)
    socket.emit('init', { secret: globalSecret.value, mode: 'users' });
});

socket.on('error', error);

export const globalLoggedIn = createState(false);

export const globalTasks = createState<string[]>([]);
socket.on('tasks', globalTasks.set);

export const globalInitialized = createState(false);
socket.on('initialized', globalInitialized.set);

export const globalSecret = createState('');
globalSecret.attach(Persistence('secret'));

export const globalTerminalHistory = createState<
  { type: 'command' | 'output' | 'error'; content: string }[]
>([]);
socket.on('output', (output) =>
  globalTerminalHistory.merge([{ type: 'output', content: output }]),
);
socket.on('command', (command) =>
  globalTerminalHistory.merge([{ type: 'command', content: command }]),
);
socket.on('err', (error) =>
  globalTerminalHistory.merge([{ type: 'error', content: error }]),
);
socket.on('clearTerminal', () => globalTerminalHistory.set([]));

socket.on('init', (data) => {
  if (data === 'denied') error('Incorrect password');
  else {
    globalTasks.set(data.currentTasks);
    console.log(data.history);
    globalTerminalHistory.set(data.history);
    globalLoggedIn.set(true);
  }
});
