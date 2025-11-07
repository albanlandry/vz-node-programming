/**
 * Unit Tests for Graph Store (Phase 2 Features)
 */

import { useGraphStore } from '../../store/graphStore';
import type { Breakpoint, InputTemplate, ConnectionState } from '../../store/graphStore';

describe('Graph Store - Phase 2 Features', () => {
  beforeEach(() => {
    // Reset store state
    useGraphStore.getState().clearGraph();
    useGraphStore.getState().clearExecutionState();
    useGraphStore.getState().clearInputConfig();
  });

  describe('Input Configuration', () => {
    it('should set input value for a node', () => {
      const nodeId = 'node-1';
      const portId = 'input-1';
      const value = 'test value';

      useGraphStore.getState().setInputValue(nodeId, portId, value);

      const inputConfig = useGraphStore.getState().inputConfig;
      expect(inputConfig[nodeId]).toBeDefined();
      expect(inputConfig[nodeId][portId]).toBe(value);
    });

    it('should clear input configuration', () => {
      useGraphStore.getState().setInputValue('node-1', 'port-1', 'value');
      useGraphStore.getState().clearInputConfig();

      const inputConfig = useGraphStore.getState().inputConfig;
      expect(Object.keys(inputConfig)).toHaveLength(0);
    });

    it('should save input template', () => {
      useGraphStore.getState().setInputValue('node-1', 'port-1', 'value-1');
      useGraphStore.getState().setInputValue('node-2', 'port-2', 'value-2');

      useGraphStore.getState().saveInputTemplate('Test Template');

      const templates = useGraphStore.getState().inputTemplates;
      expect(templates).toHaveLength(1);
      expect(templates[0].name).toBe('Test Template');
      expect(templates[0].inputs).toEqual({
        'node-1': { 'port-1': 'value-1' },
        'node-2': { 'port-2': 'value-2' },
      });
    });

    it('should load input template', () => {
      useGraphStore.getState().setInputValue('node-1', 'port-1', 'value-1');
      useGraphStore.getState().saveInputTemplate('Test Template');
      useGraphStore.getState().clearInputConfig();

      const templates = useGraphStore.getState().inputTemplates;
      useGraphStore.getState().loadInputTemplate(templates[0].id);

      const inputConfig = useGraphStore.getState().inputConfig;
      expect(inputConfig['node-1']['port-1']).toBe('value-1');
    });

    it('should delete input template', () => {
      useGraphStore.getState().saveInputTemplate('Template 1');
      useGraphStore.getState().saveInputTemplate('Template 2');

      const templates = useGraphStore.getState().inputTemplates;
      expect(templates).toHaveLength(2);

      useGraphStore.getState().deleteInputTemplate(templates[0].id);

      const remainingTemplates = useGraphStore.getState().inputTemplates;
      expect(remainingTemplates).toHaveLength(1);
      expect(remainingTemplates[0].name).toBe('Template 2');
    });
  });

  describe('Breakpoints', () => {
    it('should add breakpoint', () => {
      const nodeId = 'node-1';
      useGraphStore.getState().addBreakpoint(nodeId);

      const breakpoints = useGraphStore.getState().breakpoints;
      expect(breakpoints[nodeId]).toBeDefined();
      expect(breakpoints[nodeId].enabled).toBe(true);
    });

    it('should add breakpoint with condition', () => {
      const nodeId = 'node-1';
      const condition = 'value > 10';
      useGraphStore.getState().addBreakpoint(nodeId, condition);

      const breakpoints = useGraphStore.getState().breakpoints;
      expect(breakpoints[nodeId].condition).toBe(condition);
    });

    it('should remove breakpoint', () => {
      useGraphStore.getState().addBreakpoint('node-1');
      useGraphStore.getState().addBreakpoint('node-2');

      useGraphStore.getState().removeBreakpoint('node-1');

      const breakpoints = useGraphStore.getState().breakpoints;
      expect(breakpoints['node-1']).toBeUndefined();
      expect(breakpoints['node-2']).toBeDefined();
    });

    it('should toggle breakpoint', () => {
      useGraphStore.getState().addBreakpoint('node-1');
      
      let breakpoints = useGraphStore.getState().breakpoints;
      expect(breakpoints['node-1'].enabled).toBe(true);

      useGraphStore.getState().toggleBreakpoint('node-1');
      breakpoints = useGraphStore.getState().breakpoints;
      expect(breakpoints['node-1'].enabled).toBe(false);

      useGraphStore.getState().toggleBreakpoint('node-1');
      breakpoints = useGraphStore.getState().breakpoints;
      expect(breakpoints['node-1'].enabled).toBe(true);
    });
  });

  describe('Execution Control', () => {
    it('should pause execution', () => {
      useGraphStore.getState().pauseExecution();
      expect(useGraphStore.getState().isPaused).toBe(true);
    });

    it('should resume execution', () => {
      useGraphStore.getState().pauseExecution();
      useGraphStore.getState().resumeExecution();
      expect(useGraphStore.getState().isPaused).toBe(false);
    });

    it('should enable step mode', () => {
      useGraphStore.getState().stepExecution();
      expect(useGraphStore.getState().stepMode).toBe(true);
      expect(useGraphStore.getState().isPaused).toBe(false);
    });
  });

  describe('Data Flow Visualization', () => {
    it('should update connection state', () => {
      const connectionId = 'conn-1';
      const state: Partial<ConnectionState> = {
        status: 'active',
        data: { value: 42 },
      };

      useGraphStore.getState().updateConnectionState(connectionId, state);

      const connectionStates = useGraphStore.getState().connectionStates;
      expect(connectionStates[connectionId].status).toBe('active');
      expect(connectionStates[connectionId].data).toEqual({ value: 42 });
    });

    it('should toggle data flow visualization', () => {
      expect(useGraphStore.getState().showDataFlow).toBe(false);
      
      useGraphStore.getState().setShowDataFlow(true);
      expect(useGraphStore.getState().showDataFlow).toBe(true);

      useGraphStore.getState().setShowDataFlow(false);
      expect(useGraphStore.getState().showDataFlow).toBe(false);
    });

    it('should toggle connection values display', () => {
      expect(useGraphStore.getState().showConnectionValues).toBe(false);
      
      useGraphStore.getState().setShowConnectionValues(true);
      expect(useGraphStore.getState().showConnectionValues).toBe(true);

      useGraphStore.getState().setShowConnectionValues(false);
      expect(useGraphStore.getState().showConnectionValues).toBe(false);
    });
  });
});

