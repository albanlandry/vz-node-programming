/**
 * Unit Tests for Enhanced Debugger
 */

import { Debugger, BreakpointType, DebugEventType } from '../../src/debugging';
import { ExecutionContext, NodeError, DataTypes } from '../../src/types';

describe('Debugger', () => {
  let dbg: Debugger;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    dbg = new Debugger({
      enabled: true,
      createSnapshots: true,
      evaluateWatches: true,
    });

    mockContext = {
      executionId: 'exec-1',
      inputs: new Map([['input', 'test-value']]),
      outputs: new Map(),
      metadata: new Map(),
    };
  });

  describe('Basic Functionality', () => {
    it('should create debugger with default options', () => {
      const debuggerInstance = new Debugger();
      expect(debuggerInstance.isEnabled()).toBe(false);
    });

    it('should enable/disable debugging', () => {
      dbg.setEnabled(false);
      expect(dbg.isEnabled()).toBe(false);

      dbg.setEnabled(true);
      expect(dbg.isEnabled()).toBe(true);
    });

    it('should pause and resume execution', () => {
      expect(dbg.isPaused()).toBe(false);

      dbg.pause();
      expect(dbg.isPaused()).toBe(true);

      dbg.resume();
      expect(dbg.isPaused()).toBe(false);
    });
  });

  describe('Breakpoints', () => {
    it('should add and remove breakpoints', () => {
      const breakpoint = {
        id: 'bp-1',
        nodeId: 'node-1',
        type: BreakpointType.BEFORE_EXECUTE,
        enabled: true,
      };

      dbg.addBreakpoint(breakpoint);
      expect(dbg.getBreakpoints()).toHaveLength(1);

      dbg.removeBreakpoint('bp-1');
      expect(dbg.getBreakpoints()).toHaveLength(0);
    });

    it('should check breakpoint before execution', async () => {
      const breakpoint = {
        id: 'bp-1',
        nodeId: 'node-1',
        type: BreakpointType.BEFORE_EXECUTE,
        enabled: true,
      };

      dbg.addBreakpoint(breakpoint);

      const shouldBreak = await dbg.checkBreakpointBefore('node-1', mockContext);
      expect(shouldBreak).toBe(true);
      expect(dbg.isPaused()).toBe(true);
    });

    it('should check breakpoint after execution', async () => {
      const breakpoint = {
        id: 'bp-1',
        nodeId: 'node-1',
        type: BreakpointType.AFTER_EXECUTE,
        enabled: true,
      };

      dbg.addBreakpoint(breakpoint);

      const result = {
        success: true,
        outputs: new Map(),
        executionTime: 10,
      };

      const shouldBreak = await dbg.checkBreakpointAfter('node-1', mockContext, result);
      expect(shouldBreak).toBe(true);
    });

    it('should check breakpoint on error', async () => {
      const breakpoint = {
        id: 'bp-1',
        nodeId: 'node-1',
        type: BreakpointType.ON_ERROR,
        enabled: true,
      };

      dbg.addBreakpoint(breakpoint);

      const error = new NodeError('Test error', 'node-1');
      const shouldBreak = await dbg.checkBreakpointOnError('node-1', mockContext, error);
      expect(shouldBreak).toBe(true);
    });

    it('should not break if breakpoint is disabled', async () => {
      const breakpoint = {
        id: 'bp-1',
        nodeId: 'node-1',
        type: BreakpointType.BEFORE_EXECUTE,
        enabled: false,
      };

      dbg.addBreakpoint(breakpoint);

      const shouldBreak = await dbg.checkBreakpointBefore('node-1', mockContext);
      expect(shouldBreak).toBe(false);
    });
  });

  describe('Watch Expressions', () => {
    it('should add and remove watch expressions', () => {
      const watch = {
        id: 'watch-1',
        expression: 'inputs.get("input")',
        label: 'Input value',
      };

      dbg.addWatchExpression(watch);
      expect(dbg.getWatchExpressions()).toHaveLength(1);

      dbg.removeWatchExpression('watch-1');
      expect(dbg.getWatchExpressions()).toHaveLength(0);
    });

    it('should evaluate watch expressions', async () => {
      const watch = {
        id: 'watch-1',
        expression: 'inputs.get("input")',
      };

      dbg.addWatchExpression(watch);

      const results = await dbg.evaluateWatches(mockContext);
      expect(results.has('watch-1')).toBe(true);
      expect(results.get('watch-1')?.value).toBe('test-value');
    });
  });

  describe('Variable Inspection', () => {
    it('should inspect variables', () => {
      const snapshot = dbg.inspectVariables('node-1', mockContext);
      
      expect(snapshot.nodeId).toBe('node-1');
      expect(snapshot.executionId).toBe('exec-1');
      expect(snapshot.inputs.get('input')).toBe('test-value');
    });
  });

  describe('Snapshots and Time-Travel', () => {
    it('should create snapshots', () => {
      const nodeStates = new Map();
      const variableSnapshots = new Map();
      const results = new Map();

      const snapshot = dbg.createSnapshot(
        'exec-1',
        nodeStates,
        variableSnapshots,
        results,
        'node-1',
        0,
      );

      expect(snapshot).toBeDefined();
      expect(snapshot?.executionId).toBe('exec-1');
      expect(snapshot?.stepNumber).toBe(0);
    });

    it('should navigate snapshots', () => {
      const nodeStates = new Map();
      const variableSnapshots = new Map();
      const results = new Map();

      // Create multiple snapshots
      const snapshot1 = dbg.createSnapshot('exec-1', nodeStates, variableSnapshots, results, 'node-1', 0);
      const snapshot2 = dbg.createSnapshot('exec-1', nodeStates, variableSnapshots, results, 'node-2', 1);
      const snapshot3 = dbg.createSnapshot('exec-1', nodeStates, variableSnapshots, results, 'node-3', 2);

      expect(snapshot1).toBeDefined();
      expect(snapshot2).toBeDefined();
      expect(snapshot3).toBeDefined();

      // Navigate
      const current = dbg.getCurrentSnapshot();
      expect(current?.stepNumber).toBe(2);

      const prev = dbg.stepBackward();
      expect(prev?.stepNumber).toBe(1);

      const next = dbg.stepForward();
      expect(next?.stepNumber).toBe(2);
    });

    it('should navigate to specific step', () => {
      const nodeStates = new Map();
      const variableSnapshots = new Map();
      const results = new Map();

      dbg.createSnapshot('exec-1', nodeStates, variableSnapshots, results, 'node-1', 0);
      dbg.createSnapshot('exec-1', nodeStates, variableSnapshots, results, 'node-2', 1);
      dbg.createSnapshot('exec-1', nodeStates, variableSnapshots, results, 'node-3', 2);

      const snapshot = dbg.navigateToStep('exec-1', 1);
      expect(snapshot?.stepNumber).toBe(1);
    });
  });

  describe('Events', () => {
    it('should emit debug events', (done) => {
      dbg.on('debugEvent', (event) => {
        expect(event.type).toBe(DebugEventType.EXECUTION_PAUSED);
        done();
      });

      dbg.pause();
    });
  });

  describe('Clear', () => {
    it('should clear all debugging data', () => {
      dbg.addBreakpoint({
        id: 'bp-1',
        nodeId: 'node-1',
        type: BreakpointType.BEFORE_EXECUTE,
        enabled: true,
      });

      dbg.addWatchExpression({
        id: 'watch-1',
        expression: 'inputs.get("input")',
      });

      expect(dbg.getBreakpoints()).toHaveLength(1);
      expect(dbg.getWatchExpressions()).toHaveLength(1);

      dbg.clear();

      expect(dbg.getBreakpoints()).toHaveLength(0);
      expect(dbg.getWatchExpressions()).toHaveLength(0);
    });
  });
});

