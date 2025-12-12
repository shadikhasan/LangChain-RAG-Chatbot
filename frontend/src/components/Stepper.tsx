import React from "react";

type Props = {
  step: 1 | 2;
  labels: [string, string];
};

const Stepper: React.FC<Props> = ({ step, labels }) => {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
          step >= 1 ? "bg-accent text-white" : "bg-slate-200 text-slate-600"
        }`}
      >
        1
      </div>
      <div className={`h-0.5 w-10 ${step >= 2 ? "bg-accent" : "bg-slate-200"}`} aria-hidden="true" />
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
          step >= 2 ? "bg-accent text-white" : "border border-accent text-accent"
        }`}
      >
        2
      </div>
      <div className="text-xs text-slate-600">
        <span className={step === 1 ? "font-semibold text-slate-900" : ""}>{labels[0]}</span>
        <span className="mx-2 text-slate-400">|</span>
        <span className={step === 2 ? "font-semibold text-slate-900" : ""}>{labels[1]}</span>
      </div>
      <div className="ml-auto text-xs text-slate-500">Step {step} of 2</div>
    </div>
  );
};

export default Stepper;
