import { Server } from 'socket.io';

interface Tasks {
  [key: string]: string[];
}

const tasks: Tasks = {
  stepper: ['Robotics'],
  cardboardCNCTest: ['Robotics'],
};

let currentTasks: string[] = [];
let history: { type: 'command' | 'output' | 'error'; content: string }[] = [];
let initialized = false;

const handleAuth =
  (func: (...v: any) => void) =>
  (secret: string, ...args: any[]) => {
    if (secret === process.env.SECRET) {
      func(...args);
    }
  };

export default function handleSocket(io: Server) {
  const newTask = (newTask: string, args: string[]) => {
    const conflictingTask = currentTasks.findIndex((task) =>
      tasks[task].find((tag) => tasks[newTask].includes(tag)),
    );
    io.to('pi').emit('task', {
      name: newTask,
      kill: conflictingTask !== -1 && currentTasks[conflictingTask],
      args,
    });
    if (conflictingTask !== -1) {
      currentTasks.splice(conflictingTask, 1);
    }
    currentTasks.push(newTask);
    io.to('users').emit('tasks', currentTasks);
  };
  const killTask = (task: string) => {
    io.to('pi').emit('killTask', task);
    currentTasks.splice(currentTasks.indexOf(task), 1);
    io.to('users').emit('tasks', currentTasks);
  };
  const newTerminalCommand = (cmd: string) => {
    while (cmd[0] === ';') cmd = cmd.replace(';', '');
    history.push({ content: cmd, type: 'command' });
    io.to('pi').emit('command', cmd + '\n');
    io.to('users').emit('command', cmd);
  };
  const newTerminalOutput = (data: string) => {
    io.to('users').emit('output', data);
    history.push({ content: data, type: 'output' });
  };
  const newTerminalError = (data: string) => {
    io.to('users').emit('err', data);
    history.push({ content: data, type: 'error' });
  };
  const setInitialized = (v: boolean) => {
    initialized = v;
    io.to('users').emit('initialized', v);
  };

  io.on('connection', (socket) => {
    socket.emit('initialized', initialized);
    socket.on('init', ({ secret, mode }) => {
      if (process.env.SECRET === secret) {
        socket.join(mode);
        if (mode === 'users') {
          socket.emit('init', { currentTasks, history });
          socket.on(
            'terminal',
            handleAuth((cmd) => {
              if (typeof cmd === 'string') newTerminalCommand(cmd);
            }),
          );
          socket.on(
            'task',
            handleAuth((task, args) => {
              if (Object.keys(tasks).includes(task)) newTask(task, args);
            }),
          );
          socket.on(
            'killTask',
            handleAuth((task) => {
              if (currentTasks.includes(task)) killTask(task);
            }),
          );
          socket.on(
            'kill',
            handleAuth(() => io.to('pi').emit('kill')),
          );
          socket.on(
            'clearTerminal',
            handleAuth(() => {
              history = [];
              io.to('users').emit('clearTerminal');
            }),
          );
        } else {
          setInitialized(true);
          socket.on('disconnect', () => {
            setInitialized(false);
            currentTasks = [];
            history = [];
            io.to('users').emit('init', { currentTasks, history });
          });
          socket.on('output', newTerminalOutput);
          socket.on('err', newTerminalError);
        }
      } else {
        socket.emit('init', 'denied');
      }
    });
  });
}
