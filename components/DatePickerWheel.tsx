
import React, { useState, useEffect, useRef } from 'react';
import { soundEngine } from '../services/soundService';

interface DatePickerWheelProps {
  value: string; // ISO date string or "YYYY-MM-DD"
  onChange: (value: string) => void;
  volume?: number;
}

const WheelSegment = ({ options, current, onSelect, volume = 0.5 }: { options: string[], current: string, onSelect: (val: string) => void, volume?: number }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastTickRef = useRef<string>(current);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const center = container.scrollTop + container.offsetHeight / 2;
    const items = container.querySelectorAll('[data-val]');
    
    let closestVal = options[0];
    let minDiff = Infinity;

    items.forEach((item) => {
      const el = item as HTMLElement;
      const itemCenter = el.offsetTop + el.offsetHeight / 2;
      const diff = Math.abs(center - itemCenter);
      if (diff < minDiff) {
        minDiff = diff;
        closestVal = el.getAttribute('data-val') || options[0];
      }
    });

    if (closestVal !== current) {
      onSelect(closestVal);
      if (closestVal !== lastTickRef.current) {
        soundEngine.playWheelTick(volume);
        lastTickRef.current = closestVal;
      }
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector(`[data-val="${current}"]`) as HTMLElement;
      if (activeEl) {
        scrollRef.current.scrollTop = activeEl.offsetTop - scrollRef.current.offsetHeight / 2 + activeEl.offsetHeight / 2;
      }
    }
  }, []);

  return (
    <div className="relative h-32 group flex-1">
      <div className="absolute top-1/2 left-0 right-0 h-8 -translate-y-1/2 pointer-events-none border-y border-blue-500/10 z-10 bg-blue-500/5" />
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory py-12"
      >
        {options.map((opt) => (
          <div
            key={opt}
            data-val={opt}
            className={`h-8 flex items-center justify-center font-bold text-xs snap-center transition-all duration-300 ${
              current === opt ? 'text-blue-500 scale-110 opacity-100' : 'opacity-20 scale-90'
            }`}
          >
            {opt}
          </div>
        ))}
      </div>
    </div>
  );
};

const DatePickerWheel: React.FC<DatePickerWheelProps> = ({ value, onChange, volume = 0.5 }) => {
  const dateObj = value ? new Date(value) : new Date();
  
  const [month, setMonth] = useState(dateObj.toLocaleString('default', { month: 'short' }));
  const [day, setDay] = useState(dateObj.getDate().toString().padStart(2, '0'));
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  useEffect(() => {
    const mIdx = months.indexOf(month);
    const newDate = new Date();
    newDate.setMonth(mIdx);
    newDate.setDate(parseInt(day));
    onChange(newDate.toISOString().split('T')[0]);
  }, [month, day]);

  return (
    <div className="card-ui rounded-3xl p-1 flex items-center justify-center overflow-hidden bg-black/5 dark:bg-white/5 border-none shadow-inner mt-2">
      <WheelSegment options={months} current={month} onSelect={setMonth} volume={volume} />
      <WheelSegment options={days} current={day} onSelect={setDay} volume={volume} />
    </div>
  );
};

export default DatePickerWheel;
