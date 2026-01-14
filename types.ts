
export enum AILevel {
  SOFT = 'SOFT',
  NORMAL = 'NORMAL',
  BRUTAL = 'BRUTAL'
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  duration: number; 
  startTime?: string; 
  date?: string;
  completed: boolean;
  category: 'work' | 'personal' | 'health' | 'growth';
  isBoss: boolean;
  subTasks: SubTask[];
  recurring?: 'daily' | 'weekly' | 'none';
  difficulty: 1 | 2 | 3 | 4 | 5;
  isRoutineInstance?: boolean;
}

export interface RoutineBlueprint {
  id: string;
  title: string;
  startTime: string;
  duration: number;
  category: 'work' | 'personal' | 'health' | 'growth';
  difficulty: 1 | 2 | 3 | 4 | 5;
  isActive: boolean;
}

export interface UserStats {
  focus: number;
  discipline: number;
  consistency: number;
  creativity: number;
  xp: number;
  level: number;
  streak: number;
  focusMinutes: number;
  sessionsCompleted: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  timestamp: number;
  preview: string;
  messages: ChatMessage[];
}

export interface ChronoState {
  isActive: boolean;
  type: 'focus' | 'break' | 'long-break';
  startTime: number | null;
  endTime: number | null;
  remainingAtLastPause: number | null;
}

export interface AppState {
  tasks: Task[];
  routines: RoutineBlueprint[];
  lastRoutineReset?: string; // YYYY-MM-DD
  stats: UserStats;
  history: Record<string, number>; 
  aiMode: AILevel;
  apiKey: string | null;
  energyLevel: 'morning' | 'afternoon' | 'night';
  onboarded: boolean;
  profile: {
    name: string;
    motto: string;
  };
  theme: 'light' | 'glass' | 'midnight';
  accentColor: string;
  glassStyle: 'pure' | 'deep' | 'prism' | 'fusion';
  rituals: {
    pomodoroLength: number;
    breakLength: number;
    longBreakLength: number;
    hapticIntensity: 'off' | 'low' | 'high';
    soundEnabled: boolean;
    soundVolume: number;
    autoStartBreaks: boolean;
    autoStartFocus: boolean;
  };
  chats: ChatMessage[];
  archivedChats: ChatSession[];
  chrono: ChronoState;
  sortPreference: 'difficulty' | 'time' | 'category';
  recentlyDeletedTask?: Task | null;
}
