import { useState, useMemo } from 'react';
import { loadMockEvents, convertToMessageGroup } from '../../utils/mockDataLoader';
import type { MapPoint, MessageGroup } from '../../types';
import './ExtractedLocationsTree.css';

interface ExtractedLocationsTreeProps {
  onLocationClick?: (location: MapPoint) => void;
  onLocationGroupToggle?: (messageId: string, visible: boolean) => void;
}

export default function ExtractedLocationsTree({ 
  onLocationClick, 
  onLocationGroupToggle 
}: ExtractedLocationsTreeProps) {
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [visibleGroups, setVisibleGroups] = useState<Set<string>>(new Set());

  // Load and organize mock data by conversations and messages
  const organizedData = useMemo(() => {
    const data = loadMockEvents();
    return data.conversations.map(conversation => ({
      ...conversation,
      messages: conversation.messages.map(convertToMessageGroup)
    }));
  }, []);

  const toggleMessageExpansion = (messageId: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const toggleGroupVisibility = (messageId: string) => {
    setVisibleGroups(prev => {
      const newSet = new Set(prev);
      const isVisible = !newSet.has(messageId);
      if (isVisible) {
        newSet.add(messageId);
      } else {
        newSet.delete(messageId);
      }
      onLocationGroupToggle?.(messageId, isVisible);
      return newSet;
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleLocationClick = (location: MapPoint) => {
    onLocationClick?.(location);
  };

  return (
    <div className="extracted-locations-tree">
      <div className="tree-header">
        <h2>📍 Extracted Locations</h2>
        <button className="toggle-all-btn">[Toggle All]</button>
      </div>
      
      <div className="tree-content">
        {organizedData.slice(0, 3).map((conversation) => (
          <div key={conversation.conversationId} className="conversation-group">
            <div className="conversation-title">
              <span className="conversation-icon">💼</span>
              <span className="conversation-name">{conversation.title}</span>
            </div>
            
            {conversation.messages.map((messageGroup: MessageGroup) => {
              const isExpanded = expandedMessages.has(messageGroup.messageId);
              const isVisible = visibleGroups.has(messageGroup.messageId);
              
              return (
                <div key={messageGroup.messageId} className="message-group">
                  <div className="message-header">
                    <div className="message-controls">
                      <input 
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => toggleGroupVisibility(messageGroup.messageId)}
                        className="visibility-checkbox"
                      />
                      <button 
                        className="expand-button"
                        onClick={() => toggleMessageExpansion(messageGroup.messageId)}
                      >
                        {isExpanded ? '▼' : '▶'}
                      </button>
                    </div>
                    <div className="message-info">
                      <span className="message-time">
                        🕐 {formatDate(messageGroup.timestamp)}
                      </span>
                      <span className="message-summary">{messageGroup.summary}</span>
                      <span className="location-count">
                        ({messageGroup.locations.length} points)
                      </span>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="location-items">
                      {messageGroup.locations.map((location) => (
                        <div 
                          key={location.id} 
                          className={`location-item ${isVisible ? 'visible' : ''}`}
                          onClick={() => handleLocationClick(location)}
                        >
                          <span className="location-icon">📍</span>
                          <div className="location-details">
                            <span className="location-name">{location.label}</span>
                            <span className="location-context">{location.context}</span>
                            {location.timestamp && (
                              <span className="location-time">
                                {new Date(location.timestamp).toLocaleTimeString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}