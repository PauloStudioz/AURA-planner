
import React, { useMemo } from 'react';
import TaskItem from '../TaskItem';
import StatsWidget from '../StatsWidget';
import { Task } from '../../types';

interface TaskListViewProps {
  tasks: Task[];
  stats: any;
  history?: Record<string, number>;
  sortPreference?: 'difficulty' | 'time' | 'category';
  onSortChange?: (pref: 'difficulty' | 'time' | 'category') => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onLongPress?: (task: Task) => void;
}

export const TaskListView: React.FC<TaskListViewProps> = ({ 
  tasks, 
  stats, 
  history,
  sortPreference = 'time', 
  onSortChange, 
  onToggle, 
  onDelete, 
  onToggleSubtask,
  onLongPress
}) => {
  
  const sortedTasks = useMemo(() => {
    const list = [...tasks];
    if (sortPreference === 'difficulty') {
      return list.sort((a, b) => b.difficulty - a.difficulty);
    }
    if (sortPreference === 'category') {
      return list.sort((a, b) => a.category.localeCompare(b.category));
    }
    if (sortPreference === 'time') {
      return list.sort((a, b) => (a.startTime || '99:99').localeCompare(b.startTime || '99:99'));
    }
    return list;
  }, [tasks, sortPreference]);

  return (
    <div className="animate-view-enter pb-64 pt-4">
      <StatsWidget stats={stats} tasks={tasks} history={history} />
      
      <div className="flex items-center justify-between mb-8 px-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-main opacity-40">Today's Focus</h3>
        <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl">
          {[
            { id: 'time', label: 'Time' },
            { id: 'difficulty', label: 'Lvl' },
            { id: 'category', label: 'Type' }
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => onSortChange?.(opt.id as any)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase transition-all ${
                sortPreference === opt.id 
                  ? 'bg-white text-main shadow-sm' 
                  : 'opacity-40 hover:opacity-60'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-24 opacity-20">
            <p className="text-[11px] font-semibold uppercase tracking-widest">Everything is clear</p>
          </div>
        ) : (
          sortedTasks.map((t) => (
            <TaskItem 
              key={t.id} 
              task={t} 
              onToggle={onToggle} 
              onDelete={onDelete} 
              onToggleSubtask={onToggleSubtask} 
              onLongPress={(task) => onLongPress?.(task)} 
            />
          ))
        )}
      </div>
    </div>
  );
};
