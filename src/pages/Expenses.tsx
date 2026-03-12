import React, { useState } from 'react';
import { useDriverStore } from '../store';
import { formatCurrency } from '../utils';
import { Card, CardContent, Button, Input, Select } from '../components/UI';
import { Plus, Receipt, Calendar, Tag, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ExpenseCategory } from '../types';

const categories: ExpenseCategory[] = [
  'combustível', 'manutenção', 'seguro', 'alimentação', 'lavagem', 'aluguel/parcela', 'IPVA', 'outros'
];

export const Expenses = () => {
  const { expenses, addExpense } = useDriverStore();
  const [isAdding, setIsAdding] = useState(false);

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    category: 'alimentação' as ExpenseCategory,
    description: '',
    value: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addExpense({
      date: formData.date,
      category: formData.category,
      description: formData.description,
      value: Number(formData.value),
    });
    setIsAdding(false);
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      category: 'alimentação',
      description: '',
      value: '',
    });
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Despesas</h1>
          <p className="text-zinc-500">Controle seus gastos</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} variant="outline">
          {isAdding ? 'Cancelar' : <><Plus size={20} /> Nova Despesa</>}
        </Button>
      </header>

      {isAdding && (
        <Card className="border-red-500">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Data</label>
                  <Input 
                    type="date" 
                    value={formData.date} 
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Categoria</label>
                  <Select 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value as ExpenseCategory})}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Descrição</label>
                <Input 
                  placeholder="Ex: Almoço no posto"
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Valor (R$)</label>
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="0,00"
                  value={formData.value} 
                  onChange={e => setFormData({...formData, value: e.target.value})}
                  required
                />
              </div>

              <Button type="submit" variant="danger" className="w-full h-12">Salvar Despesa</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {expenses.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <Receipt size={48} className="mx-auto mb-4 opacity-20" />
            <p>Nenhuma despesa cadastrada ainda.</p>
          </div>
        ) : (
          expenses.sort((a, b) => b.date.localeCompare(a.date)).map((expense) => (
            <Card key={expense.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold">{expense.description}</h3>
                    <div className="flex gap-2 items-center">
                      <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full font-bold uppercase text-zinc-500">
                        {expense.category}
                      </span>
                      <span className="text-xs text-zinc-500 flex items-center gap-1">
                        <Calendar size={12} /> {format(parseISO(expense.date), 'dd/MM/yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-500">
                    -{formatCurrency(expense.value)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
