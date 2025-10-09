import React from 'react';
import { useTranslation } from 'react-i18next';
import { Task } from '../types';
import { playSound } from '../services/audioService';

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

  return (
    <div className="mt-4 border-t border-gray-200/50 -mx-4 px-4 pt-3">
        <ul className="space-y-2">
            {tasks.map(task => (
                <li key={task.id} className="flex items-center">
                    <input
                        id={`task-${task.id}`}
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggle(task.id)}
                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                    />
                    <label
                        htmlFor={`task-${task.id}`}
                        className={`ml-3 block text-sm font-medium text-gray-800 cursor-pointer ${
                            task.completed ? 'line-through text-gray-500' : ''
                        }`}
                    >
                        {task.description}
                    </label>
                </li>
            ))}
        </ul>
    </div>
  );
};

export default TaskList;
