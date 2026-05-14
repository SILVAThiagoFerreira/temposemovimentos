import { initialShifts } from './initialShifts';

const defaultShift = initialShifts[0];

export const initialUsers = [
  {
    id: 'usr-paulo',
    name: 'Paulo',
    registration: '',
    role: 'OPERADOR',
    password: '1234',
    shiftId: defaultShift?.id || null,
    shiftName: defaultShift?.name || '',
    active: true,
  },
  {
    id: 'usr-deyvis',
    name: 'Deyvis',
    registration: '',
    role: 'OPERADOR',
    password: '1234',
    shiftId: defaultShift?.id || null,
    shiftName: defaultShift?.name || '',
    active: true,
  },
  {
    id: 'usr-gilmar',
    name: 'Gilmar',
    registration: '',
    role: 'OPERADOR',
    password: '1234',
    shiftId: defaultShift?.id || null,
    shiftName: defaultShift?.name || '',
    active: true,
  },
  {
    id: 'usr-thiago-gama',
    name: 'Thiago Gama',
    registration: '',
    role: 'OPERADOR',
    password: '1234',
    shiftId: defaultShift?.id || null,
    shiftName: defaultShift?.name || '',
    active: true,
  },
  {
    id: 'usr-jose-wilkinson',
    name: 'Jose Wilkinson',
    registration: '',
    role: 'GERENTE',
    password: '1234',
    shiftId: null,
    shiftName: '',
    active: true,
  },
];
