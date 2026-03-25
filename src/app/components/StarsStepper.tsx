import { Minus, Plus } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';

interface StarsStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function StarsStepper({ value, onChange, min = 1, max = 100000 }: StarsStepperProps) {
  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || 0;
    if (newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="secondary"
        size="md"
        onClick={handleDecrement}
        disabled={value <= min}
        className="w-11 h-11 p-0"
      >
        <Minus className="w-5 h-5" />
      </Button>
      
      <div className="flex-1">
        <Input
          type="number"
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          className="text-center"
        />
      </div>
      
      <Button
        variant="secondary"
        size="md"
        onClick={handleIncrement}
        disabled={value >= max}
        className="w-11 h-11 p-0"
      >
        <Plus className="w-5 h-5" />
      </Button>
    </div>
  );
}
