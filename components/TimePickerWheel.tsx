
import React, { useState, useEffect, useRef } from 'react';
import { soundEngine } from '../services/soundService';

interface TimePickerWheelProps {
  value: string;
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
        // Use the Wheel-specific tick sound
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
    <div className="relative h-40 group flex-1">
      <div className="absolute top-1/2 left-0 right-0 h-10 -translate-y-1/2 pointer-events-none border-y border-blue-500/20 z-10 bg-blue-500/5" />
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory py-16"
      >
        {options.map((opt) => (
          <div
            key={opt}
            data-val={opt}
            className={`h-10 flex items-center justify-center font-black text-sm snap-center transition-all duration-300 ${
              current === opt ? 'text-blue-500 scale-125 opacity-100' : 'opacity-20 scale-90'
            }`}
          >
            {opt}
          </div>
        ))}
      </div>
    </div>
  );
};

const TimePickerWheel: React.FC<TimePickerWheelProps> & { volume?: number } = ({ value, onChange, volume = 0.5 }) => {
  const [hour, setHour] = useState(value.split(':')[0] || '09');
  const [minute, setMinute] = useState(value.split(':')[1] || '00');
  
  const h24 = parseInt(hour);
  const initialH12 = (h24 % 12 || 12).toString().padStart(2, '0');
  const initialAMPM = h24 >= 12 ? 'PM' : 'AM';

  const [h12, setH12] = useState(initialH12);
  const [min, setMin] = useState(minute);
  const [ampm, setAmpm] = useState(initialAMPM);

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
  const periods = ['AM', 'PM'];

  useEffect(() => {
    let finalHour = parseInt(h12);
    if (ampm === 'PM' && finalHour < 12) finalHour += 12;
    if (ampm === 'AM' && finalHour === 12) finalHour = 0;
    
    const formattedTime = `${finalHour.toString().padStart(2, '0')}:${min}`;
    if (formattedTime !== value) {
      onChange(formattedTime);
    }
  }, [h12, min, ampm]);

  return (
    <div className="card-ui rounded-3xl p-2 flex items-center justify-center overflow-hidden bg-black/5 dark:bg-white/5 border-none shadow-inner">
      <WheelSegment options={hours} current={h12} onSelect={setH12} volume={volume} />
      <div className="font-black text-blue-500 opacity-30 self-center pb-1">:</div>
      <WheelSegment options={minutes} current={min} onSelect={setMin} volume={volume} />
      <WheelSegment options={periods} current={ampm} onSelect={setAmpm} volume={volume} />
    </div>
  );
};

export default TimePickerWheel;
