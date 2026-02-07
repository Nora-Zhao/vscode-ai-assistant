import React, { useState } from 'react';
import { Provider, AVAILABLE_MODELS } from '../../types/shared';

interface ModelSwitcherProps {
  currentProvider: Provider;
  currentModel: string;
  onModelChange: (provider: Provider, model: string) => void;
}

export default function ModelSwitcher({
  currentProvider,
  currentModel,
  onModelChange,
}: ModelSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentModelInfo = AVAILABLE_MODELS[currentProvider]?.find((m) => m.id === currentModel);

  return (
    <div className="model-switcher">
      <button className="model-btn" onClick={() => setIsOpen(!isOpen)}>
        <span className="model-name">{currentModelInfo?.name || currentModel}</span>
        <span className="model-provider">{currentProvider}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="model-dropdown">
          {Object.entries(AVAILABLE_MODELS).map(([provider, models]) => (
            <div key={provider} className="provider-group">
              <div className="provider-name">{provider.toUpperCase()}</div>
              {models.map((model) => (
                <div
                  key={model.id}
                  className={`model-option ${
                    provider === currentProvider && model.id === currentModel ? 'active' : ''
                  }`}
                  onClick={() => {
                    onModelChange(provider as Provider, model.id);
                    setIsOpen(false);
                  }}
                >
                  <span className="model-option-name">{model.name}</span>
                  {model.supportVision && <span className="vision-badge">👁</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
