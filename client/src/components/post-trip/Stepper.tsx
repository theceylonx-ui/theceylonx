import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  title: string;
  description: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
  className?: string;
}

export function Stepper({ steps, currentStep, completedSteps, className }: StepperProps) {
  return (
    <nav className={cn("mb-8", className)} data-testid="trip-wizard-stepper">
      <ol className="flex items-center justify-between w-full">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isAccessible = step.id <= currentStep || isCompleted;
          
          return (
            <li key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                {/* Step circle */}
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                    {
                      "bg-ceylon-green border-ceylon-green text-white": isCompleted,
                      "border-ceylon-blue bg-ceylon-blue text-white": isCurrent && !isCompleted,
                      "border-gray-300 bg-white text-gray-500": !isAccessible && !isCompleted,
                      "border-gray-400 bg-gray-50 text-gray-600": isAccessible && !isCurrent && !isCompleted,
                    }
                  )}
                  data-testid={`step-${step.id}-indicator`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                
                {/* Step labels */}
                <div className="mt-2 text-center">
                  <div
                    className={cn(
                      "text-sm font-medium transition-colors",
                      {
                        "text-ceylon-green": isCompleted,
                        "text-ceylon-blue": isCurrent && !isCompleted,
                        "text-gray-900": isAccessible && !isCurrent && !isCompleted,
                        "text-gray-400": !isAccessible && !isCompleted,
                      }
                    )}
                    data-testid={`step-${step.id}-title`}
                  >
                    {step.title}
                  </div>
                  <div
                    className={cn(
                      "text-xs mt-1 max-w-24 transition-colors",
                      {
                        "text-gray-600": isAccessible || isCompleted,
                        "text-gray-400": !isAccessible,
                      }
                    )}
                  >
                    {step.description}
                  </div>
                </div>
              </div>
              
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-4 transition-colors",
                    {
                      "bg-ceylon-green": completedSteps.includes(steps[index + 1].id),
                      "bg-gray-300": !completedSteps.includes(steps[index + 1].id),
                    }
                  )}
                  data-testid={`step-${step.id}-connector`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}