import type { Usuario } from '../types/user';

export const mockCurrentUser: Usuario = {
  id: 1,
  nome: 'João Silva',
  username: 'joao.silva',
  email: 'joao.silva@techcorp.com',
  isActive: true,
};

export const mockUsers: Usuario[] = [
  mockCurrentUser,
  { id: 2, nome: 'Ana Lima', username: 'ana.lima', email: 'ana.lima@techcorp.com', isActive: true },
  { id: 3, nome: 'Pedro Costa', username: 'pedro.costa', email: 'pedro.costa@techcorp.com', isActive: true },
  { id: 4, nome: 'Maria Souza', username: 'maria.souza', email: 'maria.souza@startup.com', isActive: true },
  { id: 5, nome: 'Carlos Mendes', username: 'carlos.mendes', email: 'carlos@startup.com', isActive: false },
];
