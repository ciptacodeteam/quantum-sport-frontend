import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function AddOnsCoach() {
  // Keep track of which button is pressed and highlight it
  const [selectedButton, setSelectedButton] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-3 gap-4 px-4">
        <Button
          variant="outline"
          onClick={() => setSelectedButton('coach')}
          className={selectedButton === 'coach' ? 'bg-primary text-white' : ''}
        >
          Coach
        </Button>
        <Button
          variant="outline"
          onClick={() => setSelectedButton('ballboy')}
          className={selectedButton === 'ballboy' ? 'bg-primary text-white' : ''}
        >
          Ballboy
        </Button>
        <Button
          variant="outline"
          onClick={() => setSelectedButton('inventory')}
          className={selectedButton === 'inventory' ? 'bg-primary text-white' : ''}
        >
          Inventory
        </Button>
      </div>
    </>
  );
}
