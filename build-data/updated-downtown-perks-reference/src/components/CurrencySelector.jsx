import React from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DollarSign } from 'lucide-react';
import { useCurrency } from '@/components/CurrencyContext';

export default function CurrencySelector() {
  const { currency, changeCurrency, currencies, currentCurrency } = useCurrency();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <DollarSign className="w-4 h-4" />
          <span>{currentCurrency.symbol} {currency}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(currencies).map(([code, curr]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => changeCurrency(code)}
            className={currency === code ? 'bg-slate-100' : ''}
          >
            <span className="w-8">{curr.symbol}</span>
            <span className="font-medium">{curr.code}</span>
            <span className="text-slate-500 ml-2">- {curr.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}