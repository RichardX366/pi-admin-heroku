import { TrashIcon } from '@heroicons/react/outline';
import { useHookstate } from '@hookstate/core';
import React, { useEffect, useRef, useState } from 'react';
import Input from './components/Input';
import Notification from './components/Notification';
import ToggleSwitch from './components/ToggleSwitch';
import {
  globalInitialized,
  globalLoggedIn,
  globalSecret,
  globalTasks,
  globalTerminalHistory,
  socket,
} from './socket';

const tasks: {
  [category: string]: {
    [task: string]: {
      name: string;
      args: { [arg: string]: 'boolean' | 'string' };
    };
  };
} = {
  Robotics: {
    stepper: { name: 'Stepper', args: { buildArduino: 'boolean' } },
    cardboardCNCTest: {
      name: 'Cardboard CNC Test',
      args: { buildArduino: 'boolean' },
    },
  },
};

const authEmit = (event: string, ...args: any[]) => {
  socket.emit(event, globalSecret.value, ...args);
};

const App: React.FC = () => {
  const loggedIn = useHookstate(globalLoggedIn);
  const initialized = useHookstate(globalInitialized);
  const currentTasks = useHookstate(globalTasks);
  const secret = useHookstate(globalSecret);
  const terminalHistory = useHookstate(globalTerminalHistory);
  const [command, setCommand] = useState('');
  const terminal = useRef<HTMLDivElement>(null);
  const args = useHookstate<{
    [task: string]: { [arg: string]: boolean | string };
  }>({
    stepper: {
      buildArduino: false,
    },
    cardboardCNCTest: {
      buildArduino: false,
    },
  });
  useEffect(() => {
    terminal.current?.scroll({ top: terminal.current?.clientHeight });
  }, [terminalHistory.value]);
  return (
    <>
      <Notification />
      {initialized.value ? (
        loggedIn.value ? (
          <div className='grid grid-cols-1 grid-rows-2 sm:grid-rows-1 sm:grid-cols-2 gap-6 w-full absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-500 h-full py-6 px-6'>
            <div className='bg-white p-5 rounded-lg flex flex-col overflow-y-auto'>
              <div className='flex justify-between text-2xl font-medium'>
                Tasks:
                <button
                  onClick={() => authEmit('kill')}
                  className='inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                >
                  <TrashIcon
                    className='-ml-1 mr-3 h-5 w-5'
                    aria-hidden='true'
                  />
                  Kill App
                </button>
              </div>
              {Object.entries(tasks).map(([category, content]) => (
                <div>
                  <p className='text-xl'>{category}</p>
                  <ul className='list-disc pl-4'>
                    {Object.entries(content).map(([id, data]) => (
                      <li>
                        {data.name}
                        <span className='mx-1' />
                        <ToggleSwitch
                          checked={currentTasks.value.includes(id)}
                          onChange={(checked) => {
                            if (checked) {
                              authEmit(
                                'task',
                                id,
                                Object.entries(args[id].value)
                                  .map(([arg, value]) => {
                                    switch (typeof value) {
                                      case 'string':
                                        return `${arg}=${value}`;
                                      case 'boolean':
                                        return value && arg;
                                      default:
                                        return undefined;
                                    }
                                  })
                                  .filter(Boolean),
                              );
                            } else {
                              authEmit('killTask', id);
                            }
                          }}
                        />
                        <br />
                        <div className='flex gap-2'>
                          {Object.entries(data.args).map(([arg, type]) => {
                            switch (type) {
                              case 'boolean':
                                return (
                                  <div className='text-gray-700 text-sm font-medium flex flex-col gap-2'>
                                    {arg}
                                    <ToggleSwitch
                                      checked={args[id][arg].value as boolean}
                                      onChange={args[id][arg].set}
                                      big
                                    />
                                  </div>
                                );
                              case 'string':
                                return (
                                  <Input
                                    value={args[id][arg].value as string}
                                    onChange={args[id][arg].set}
                                    label={arg}
                                  />
                                );
                              default:
                                return <></>;
                            }
                          })}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className='bg-gray-800 p-4 rounded-lg relative pb-16'>
              <div className='overflow-y-scroll h-full' ref={terminal}>
                {terminalHistory.value.map((line, i) => (
                  <p
                    className={
                      {
                        command: 'text-blue-200',
                        output: 'text-green-200',
                        error: 'text-red-200',
                      }[line.type]
                    }
                    key={i}
                  >
                    {line.content}
                  </p>
                ))}
              </div>
              <div className='absolute bottom-4 inset-x-4'>
                <Input
                  value={command}
                  onChange={setCommand}
                  placeholder='Insert your command here:'
                  onEnter={() => {
                    authEmit('terminal', command);
                    setCommand('');
                  }}
                  padding
                />
                <TrashIcon
                  className='absolute right-1 top-2 h-8 cursor-pointer text-red-700'
                  onClick={() => {
                    terminalHistory.set([]);
                    authEmit('clearTerminal');
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className='w-full absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-500 h-full py-12 sm:py-24 px-12 sm:px-32'>
            <div className='bg-white p-5 rounded-lg grid gap-4'>
              <div className='grid grid-cols-1 justify-center items-center'>
                <Input
                  label='Secret'
                  type='password'
                  value={secret.value}
                  onChange={secret.set}
                  onEnter={() => {
                    socket.emit('init', {
                      secret: secret.value,
                      mode: 'users',
                    });
                  }}
                />
              </div>
            </div>
          </div>
        )
      ) : (
        <div className='w-full absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-500 h-full py-12 sm:py-24 px-12 sm:px-32'>
          <div className='bg-white p-5 rounded-lg grid gap-4'>
            <div className='flex flex-col items-center gap-2 text-lg text-center'>
              <h1 className='text-3xl'>The Raspberry Pi is Currently Off</h1>
              Feel free to check in later
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
