import React from 'react';
import { Switch } from '@headlessui/react';
import classNames from 'classnames';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  big?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  big,
}) => (
  <Switch
    checked={checked}
    onChange={onChange}
    className={classNames(
      checked ? 'bg-cyan-500' : 'bg-gray-400',
      'relative inline-flex flex-shrink-0 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus-visible:ring-2  focus-visible:ring-white focus-visible:ring-opacity-75',
      big ? 'h-7 w-14' : 'h-4 w-8',
    )}
  >
    <span className='sr-only'>Use setting</span>
    <span
      aria-hidden='true'
      className={classNames(
        checked ? (big ? 'translate-x-7' : 'translate-x-4') : 'translate-x-0',
        big ? 'h-6 w-6' : 'h-3 w-3',
        'pointer-events-none inline-block rounded-full bg-white shadow-lg transform ring-0 transition ease-in-out duration-200',
      )}
    />
  </Switch>
);

export default ToggleSwitch;
