import {
  faDatabase,
  faHistory,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';

export const menuItems = [
  {
    name: 'schema',
    title: 'Schema Explorer',
    tooltip: 'Schema (Ctrl + 1)',
    icon: faDatabase,
    shortcut: ['ctrl', '1'],
  },
  {
    name: 'history',
    title: 'Query History',
    tooltip: 'History (Ctrl + 2)',
    icon: faHistory,
    shortcut: ['ctrl', '2'],
  },
  {
    name: 'info',
    title: 'Query Help',
    tooltip: 'Information (Ctrl + 3)',
    icon: faInfoCircle,
    shortcut: ['ctrl', '3'],
  },
];
