
import { Product, Client, Sale } from '../../types';

export const getMockProducts = (): Product[] => [
  {
    id: 'p1',
    name: 'Açaí Tradicional 500ml',
    price: 18.50,
    costPrice: 8.00,
    category: 'Açaí',
    description: 'Copo de açaí tradicional sem acompanhamentos',
    stock: 50,
    unit: 'Copo'
  },
  {
    id: 'p2',
    name: 'Açaí com Nutella 500ml',
    price: 25.00,
    costPrice: 12.00,
    category: 'Açaí Especial',
    description: 'Copo de açaí com cobertura generosa de Nutella',
    stock: 30,
    unit: 'Copo'
  },
  {
    id: 'p3',
    name: 'Combo Casal (2x 400ml)',
    price: 40.00,
    costPrice: 15.00,
    category: 'Combos',
    description: 'Dois copos de açaí de 400ml com 3 acompanhamentos cada',
    stock: 20,
    unit: 'Combo'
  },
  {
    id: 'p4',
    name: 'Água Mineral 500ml',
    price: 3.50,
    costPrice: 1.20,
    category: 'Bebidas',
    description: 'Água mineral sem gás',
    stock: 100,
    unit: 'Garrafa'
  }
];

export const getMockClients = (): Client[] => [
  {
    id: 'c1',
    name: 'João Silva',
    phone: '(11) 98765-4321',
    email: 'joao@email.com',
    address: 'Rua das Flores, 123'
  },
  {
    id: 'c2',
    name: 'Maria Oliveira',
    phone: '(11) 91234-5678',
    email: 'maria@email.com',
    address: 'Av. Paulista, 1500'
  },
  {
    id: 'c3',
    name: 'Pedro Santos',
    phone: '(11) 99887-7665',
    email: 'pedro@email.com',
    address: 'Rua Central, 45'
  }
];

export const getMockSales = (products: Product[], clients: Client[]): Sale[] => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  return [
    {
      id: 's1',
      clientId: clients[0].id,
      clientName: clients[0].name,
      items: [
        { ...products[0], quantity: 2, discount: 0 },
        { ...products[1], quantity: 1, discount: 0 }
      ],
      total: 18.50 * 2 + 25.00,
      profit: (18.50 - 8.00) * 2 + (25.00 - 12.00),
      date: today,
      time: '14:30',
      paymentMethod: 'PIX',
      paymentTerms: 'À Vista',
      installments: 1,
      status: 'FINALIZADA',
      isPaid: true,
      deliveryStatus: 'ENTREGUE',
      orderNumber: 1001
    },
    {
      id: 's2',
      clientId: clients[1].id,
      clientName: clients[1].name,
      items: [
        { ...products[2], quantity: 1, discount: 5.00 }
      ],
      total: 35.00,
      profit: 35.00 - 15.00,
      date: today,
      time: '16:45',
      paymentMethod: 'Cartão de Crédito',
      paymentTerms: 'À Vista',
      installments: 1,
      status: 'FINALIZADA',
      isPaid: true,
      deliveryStatus: 'ENTREGUE',
      orderNumber: 1002
    },
    {
      id: 's3',
      clientId: clients[2].id,
      clientName: clients[2].name,
      items: [
        { ...products[0], quantity: 3, discount: 0 }
      ],
      total: 18.50 * 3,
      profit: (18.50 - 8.00) * 3,
      date: yesterday,
      time: '19:15',
      paymentMethod: 'Dinheiro',
      paymentTerms: 'À Vista',
      installments: 1,
      status: 'FINALIZADA',
      isPaid: true,
      deliveryStatus: 'ENTREGUE',
      orderNumber: 1000
    },
    {
      id: 's4',
      clientId: clients[0].id,
      clientName: clients[0].name,
      items: [
        { ...products[1], quantity: 2, discount: 0 }
      ],
      total: 50.00,
      profit: (25.00 - 12.00) * 2,
      date: lastWeek,
      time: '11:00',
      paymentMethod: 'PIX',
      paymentTerms: 'À Vista',
      installments: 1,
      status: 'FINALIZADA',
      isPaid: true,
      deliveryStatus: 'ENTREGUE',
      orderNumber: 999
    },
    {
      id: 's5',
      clientId: clients[1].id,
      clientName: clients[1].name,
      items: [
        { ...products[3], quantity: 10, discount: 0 }
      ],
      total: 35.00,
      profit: (3.50 - 1.20) * 10,
      date: today,
      time: '10:30',
      paymentMethod: 'Dinheiro',
      paymentTerms: 'À Vista',
      installments: 1,
      status: 'FINALIZADA',
      isPaid: false,
      deliveryStatus: 'PENDENTE',
      orderNumber: 1003
    }
  ];
};
