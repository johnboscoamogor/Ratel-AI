import React from 'react';
import { useTranslation } from 'react-i18next';
import { Task } from '../types';
import { playSound } from '../services/audioService';
import { ClockIcon } from '../constants';

interface TaskListProps {
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onToggleTask }) => {
  const { t } = useTranslation();

  if (tasks.length === 0) {
    return <p className="mt-4 text-gray-500">{t('tasks.noTasks')}</p>;
  }

  const handleToggle = (taskId: string) => {
    playSound('click');
    onToggleTask(taskId);
  }
  
  const formatReminder = (isoString: string) => {
    try {
        const date = new Date(isoString);
        return date.toLocaleString(undefined, { 
            month: 'short', 
            day: 'numeric', 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    } catch (e) {
        return "Invalid date";
    }
  }

  return (
    <div className="mt-4 border-t border-gray-200/50 -mx-4 px-4 pt-3">
        <ul className="space-y-3">
            {tasks.map(task => (
                <li key={task.id} className="flex items-start">
                    <input
                        id={`task-${task.id}`}
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggle(task.id)}
                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer mt-1"
                    />
                    <div className="ml-3">
                        <label
                            htmlFor={`task-${task.id}`}
                            className={`block text-sm font-medium text-gray-800 cursor-pointer ${
                                task.completed ? 'line-through text-gray-500' : ''
                            }`}
                        >
                            {task.description}
                        </label>
                        {task.reminder && (
                            <div className={`flex items-center gap-1.5 text-xs mt-0.5 ${task.completed ? 'text-gray-400' : 'text-gray-500'}`}>
                                <ClockIcon className="w-3 h-3"/>
                                <span>{formatReminder(task.reminder)}</span>
                            </div>
                        )}
                    </div>
                </li>
            ))}
        </ul>
    </div>
  );
};

export default TaskList;