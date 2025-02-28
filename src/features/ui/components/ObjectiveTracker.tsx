import { useState, useEffect } from "react";
import { useLevelManager } from "../../levels/LevelManager";

interface Objective {
  id: string;
  description: string;
  completed: boolean;
  optional?: boolean;
  progress?: number;
  total?: number;
}

interface ObjectiveTrackerProps {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  showCompleted?: boolean;
  maxVisible?: number;
}

export function ObjectiveTracker({ 
  position = "top-left", 
  showCompleted = true,
  maxVisible = 5
}: ObjectiveTrackerProps) {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [expandedView, setExpandedView] = useState(false);
  
  const levelObjectives = useLevelManager((state) => state.currentLevelObjectives);
  const ongoingObjectives = useLevelManager((state) => state.ongoingObjectives);
  const completedObjectives = useLevelManager((state) => state.completedObjectives);
  
  // Update objectives list when game objectives change
  useEffect(() => {
    // Combine ongoing and completed objectives
    const allObjectives = [
      ...ongoingObjectives.map(obj => ({ ...obj, completed: false })),
      ...(showCompleted ? completedObjectives.map(obj => ({ ...obj, completed: true })) : [])
    ];
    
    // Sort objectives (incomplete first, then by id)
    const sortedObjectives = allObjectives.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return a.id.localeCompare(b.id);
    });
    
    setObjectives(sortedObjectives);
  }, [ongoingObjectives, completedObjectives, showCompleted]);
  
  // Determine position classes based on the position prop
  const getPositionClasses = () => {
    switch (position) {
      case "top-left":
        return "top-6 left-6";
      case "top-right":
        return "top-6 right-6";
      case "bottom-left":
        return "bottom-6 left-6";
      case "bottom-right":
        return "bottom-6 right-6";
      default:
        return "top-6 left-6";
    }
  };
  
  // Get visible objectives (limit by maxVisible unless expanded)
  const visibleObjectives = expandedView 
    ? objectives 
    : objectives.slice(0, maxVisible);
  
  // Show "more" indicator if there are hidden objectives
  const hasMoreObjectives = objectives.length > maxVisible && !expandedView;

  return (
    <div 
      className={`absolute ${getPositionClasses()} max-w-xs bg-gray-900 bg-opacity-70 rounded p-3 shadow pointer-events-auto`}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-white font-bold">Objectives</h3>
        {objectives.length > maxVisible && (
          <button 
            onClick={() => setExpandedView(!expandedView)}
            className="text-xs text-gray-400 hover:text-white"
          >
            {expandedView ? "Show Less" : "Show All"}
          </button>
        )}
      </div>
      
      <div className="space-y-2">
        {visibleObjectives.map((objective) => (
          <div 
            key={objective.id}
            className={`flex items-start space-x-2 ${objective.completed ? 'opacity-60' : ''}`}
          >
            <div className="flex-shrink-0 mt-1">
              {objective.completed ? (
                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-white">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-yellow-500" />
              )}
            </div>
            
            <div className="flex-1">
              <div className={`text-sm ${objective.completed ? 'text-gray-400 line-through' : 'text-white'}`}>
                {objective.description}
                {objective.optional && (
                  <span className="text-gray-400 text-xs ml-1">(Optional)</span>
                )}
              </div>
              
              {objective.progress !== undefined && objective.total !== undefined && (
                <div className="mt-1">
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-500" 
                      style={{ width: `${(objective.progress / objective.total) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 text-right mt-0.5">
                    {objective.progress}/{objective.total}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {hasMoreObjectives && (
          <div className="text-xs text-gray-400 italic">
            + {objectives.length - maxVisible} more objectives...
          </div>
        )}
        
        {objectives.length === 0 && (
          <div className="text-gray-400 text-sm italic">
            No active objectives
          </div>
        )}
      </div>
    </div>
  );
}
