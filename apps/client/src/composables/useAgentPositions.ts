/**
 * Agent Positions Composable
 * Manages agent positioning for the logo visualization section
 */

import { ref, reactive, computed } from 'vue';
import type { Agent, AgentPosition } from '../types/dashboard.types';

export function useAgentPositions() {
  const agentPositions = reactive<Map<string, AgentPosition>>(new Map());
  const containerDimensions = ref({ width: 1200, height: 600 });

  // Auto-arrangement algorithms
  const arrangementTypes = {
    grid: 'grid',
    circle: 'circle',
    force: 'force-directed',
    hierarchy: 'hierarchical'
  } as const;

  const currentArrangement = ref<keyof typeof arrangementTypes>('grid');

  /**
   * Update positions for all agents based on layout mode
   */
  const updatePositions = (agents: Agent[], layoutMode: 'grid' | 'list') => {
    switch (currentArrangement.value) {
      case 'grid':
        arrangeInGrid(agents, layoutMode);
        break;
      case 'circle':
        arrangeInCircle(agents);
        break;
      case 'force':
        arrangeWithForceDirected(agents);
        break;
      case 'hierarchy':
        arrangeHierarchically(agents);
        break;
    }
  };

  /**
   * Grid arrangement - distributes agents in a regular grid
   */
  const arrangeInGrid = (agents: Agent[], layoutMode: 'grid' | 'list') => {
    const padding = 80;
    const agentSize = 60;
    
    if (layoutMode === 'list') {
      // Vertical list arrangement
      agents.forEach((agent, index) => {
        agentPositions.set(agent.id, {
          agentId: agent.id,
          x: padding,
          y: padding + (index * (agentSize + 20))
        });
      });
    } else {
      // Grid arrangement
      const cols = Math.ceil(Math.sqrt(agents.length));
      const rows = Math.ceil(agents.length / cols);
      
      const availableWidth = containerDimensions.value.width - (2 * padding);
      const availableHeight = containerDimensions.value.height - (2 * padding);
      
      const cellWidth = availableWidth / cols;
      const cellHeight = availableHeight / rows;

      agents.forEach((agent, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        
        agentPositions.set(agent.id, {
          agentId: agent.id,
          x: padding + (col * cellWidth) + (cellWidth / 2),
          y: padding + (row * cellHeight) + (cellHeight / 2)
        });
      });
    }
  };

  /**
   * Circular arrangement - places agents in a circle
   */
  const arrangeInCircle = (agents: Agent[]) => {
    const centerX = containerDimensions.value.width / 2;
    const centerY = containerDimensions.value.height / 2;
    const radius = Math.min(centerX, centerY) - 100;
    
    agents.forEach((agent, index) => {
      const angle = (index / agents.length) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      agentPositions.set(agent.id, {
        agentId: agent.id,
        x,
        y
      });
    });
  };

  /**
   * Force-directed arrangement - simulates physical forces
   */
  const arrangeWithForceDirected = (agents: Agent[]) => {
    // Initialize random positions if not already set
    agents.forEach(agent => {
      if (!agentPositions.has(agent.id)) {
        agentPositions.set(agent.id, {
          agentId: agent.id,
          x: Math.random() * (containerDimensions.value.width - 100) + 50,
          y: Math.random() * (containerDimensions.value.height - 100) + 50
        });
      }
    });

    // Simple force-directed algorithm
    const iterations = 100;
    const repulsionForce = 1000;
    const attractionForce = 0.01;
    const damping = 0.9;

    for (let iter = 0; iter < iterations; iter++) {
      const forces = new Map<string, { x: number; y: number }>();

      // Initialize forces
      agents.forEach(agent => {
        forces.set(agent.id, { x: 0, y: 0 });
      });

      // Calculate repulsion forces
      agents.forEach(agent1 => {
        agents.forEach(agent2 => {
          if (agent1.id === agent2.id) return;

          const pos1 = agentPositions.get(agent1.id)!;
          const pos2 = agentPositions.get(agent2.id)!;
          
          const dx = pos1.x - pos2.x;
          const dy = pos1.y - pos2.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          
          const force = repulsionForce / (distance * distance);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          const currentForce = forces.get(agent1.id)!;
          forces.set(agent1.id, {
            x: currentForce.x + fx,
            y: currentForce.y + fy
          });
        });
      });

      // Apply forces and update positions
      agents.forEach(agent => {
        const force = forces.get(agent.id)!;
        const currentPos = agentPositions.get(agent.id)!;
        
        const newX = currentPos.x + force.x * damping;
        const newY = currentPos.y + force.y * damping;
        
        // Keep within bounds
        const boundedX = Math.max(50, Math.min(containerDimensions.value.width - 50, newX));
        const boundedY = Math.max(50, Math.min(containerDimensions.value.height - 50, newY));
        
        agentPositions.set(agent.id, {
          agentId: agent.id,
          x: boundedX,
          y: boundedY
        });
      });
    }
  };

  /**
   * Hierarchical arrangement - groups by agent type
   */
  const arrangeHierarchically = (agents: Agent[]) => {
    const agentsByType = agents.reduce((acc, agent) => {
      if (!acc[agent.type]) acc[agent.type] = [];
      acc[agent.type].push(agent);
      return acc;
    }, {} as Record<string, Agent[]>);

    const types = Object.keys(agentsByType);
    const padding = 80;
    const sectionHeight = (containerDimensions.value.height - (2 * padding)) / types.length;

    types.forEach((type, typeIndex) => {
      const typeAgents = agentsByType[type];
      const sectionY = padding + (typeIndex * sectionHeight);
      const sectionCenterY = sectionY + (sectionHeight / 2);
      
      // Arrange agents within each type section
      const cols = Math.ceil(Math.sqrt(typeAgents.length));
      const cellWidth = (containerDimensions.value.width - (2 * padding)) / cols;
      
      typeAgents.forEach((agent, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        
        agentPositions.set(agent.id, {
          agentId: agent.id,
          x: padding + (col * cellWidth) + (cellWidth / 2),
          y: sectionCenterY + (row * 40) - ((Math.ceil(typeAgents.length / cols) - 1) * 20)
        });
      });
    });
  };

  /**
   * Get position for a specific agent
   */
  const getAgentPosition = (agentId: string): { x: number; y: number } => {
    const position = agentPositions.get(agentId);
    return position ? { x: position.x, y: position.y } : { x: 0, y: 0 };
  };

  /**
   * Set position for a specific agent (for manual positioning)
   */
  const setAgentPosition = (agentId: string, x: number, y: number) => {
    agentPositions.set(agentId, { agentId, x, y });
  };

  /**
   * Update container dimensions
   */
  const updateContainerDimensions = (width: number, height: number) => {
    containerDimensions.value = { width, height };
  };

  /**
   * Change arrangement type
   */
  const setArrangementType = (type: keyof typeof arrangementTypes) => {
    currentArrangement.value = type;
  };

  /**
   * Calculate optimal spacing based on agent count
   */
  const calculateOptimalSpacing = (agentCount: number) => {
    const area = containerDimensions.value.width * containerDimensions.value.height;
    const agentArea = area / agentCount;
    const optimalSpacing = Math.sqrt(agentArea) * 0.7;
    return Math.max(60, Math.min(150, optimalSpacing));
  };

  /**
   * Animate position changes
   */
  const animateToPosition = (agentId: string, targetX: number, targetY: number, duration = 1000) => {
    const currentPos = agentPositions.get(agentId);
    if (!currentPos) return;

    const startX = currentPos.x;
    const startY = currentPos.y;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-in-out)
      const eased = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const currentX = startX + (targetX - startX) * eased;
      const currentY = startY + (targetY - startY) * eased;

      agentPositions.set(agentId, { agentId, x: currentX, y: currentY });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  /**
   * Get all positions as a computed property
   */
  const allPositions = computed(() => {
    return Array.from(agentPositions.values());
  });

  /**
   * Clear all positions
   */
  const clearPositions = () => {
    agentPositions.clear();
  };

  /**
   * Get positions for specific agent types
   */
  const getPositionsByType = (agentType: string) => {
    return Array.from(agentPositions.values()).filter(pos => {
      // This would need agent type information
      return true; // Simplified for now
    });
  };

  return {
    // State
    agentPositions: readonly(agentPositions),
    containerDimensions: readonly(containerDimensions),
    currentArrangement: readonly(currentArrangement),
    allPositions,

    // Methods
    updatePositions,
    getAgentPosition,
    setAgentPosition,
    updateContainerDimensions,
    setArrangementType,
    calculateOptimalSpacing,
    animateToPosition,
    clearPositions,
    getPositionsByType,

    // Arrangement methods
    arrangeInGrid,
    arrangeInCircle,
    arrangeWithForceDirected,
    arrangeHierarchically
  };
}