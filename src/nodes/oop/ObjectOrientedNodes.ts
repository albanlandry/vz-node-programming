import { BaseNode } from '../../core/BaseNode';
import { ExecutionContext, PortId, DataTypes } from '../../types';

/**
 * Object-Oriented Programming Paradigm Examples
 */

/**
 * Calculator class node - demonstrates OOP with state and methods
 */
export class CalculatorNode extends BaseNode {
  private state: Map<string, number> = new Map();

  constructor() {
    super({
      name: 'Calculator',
      description: 'Object-oriented calculator with state management',
      inputs: [
        {
          id: 'operation',
          name: 'Operation',
          dataType: DataTypes.STRING,
          required: true,
          description: 'Operation to perform: add, subtract, multiply, divide, clear'
        },
        {
          id: 'value',
          name: 'Value',
          dataType: DataTypes.NUMBER,
          required: false,
          description: 'Value to use in operation'
        },
        {
          id: 'variable',
          name: 'Variable',
          dataType: DataTypes.STRING,
          required: false,
          description: 'Variable name for storing/retrieving values'
        }
      ],
      outputs: [
        {
          id: 'result',
          name: 'Result',
          dataType: DataTypes.NUMBER,
          description: 'Calculation result'
        },
        {
          id: 'state',
          name: 'State',
          dataType: DataTypes.OBJECT,
          description: 'Current calculator state'
        }
      ]
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, any>> {
    const outputs = new Map<PortId, any>();
    
    const operation = this.getInput<string>(context, 'operation');
    const value = this.getInput<number>(context, 'value');
    const variable = this.getInput<string>(context, 'variable');
    
    let result: number = 0;
    
    switch (operation) {
      case 'add':
        result = this.add(value || 0);
        break;
      case 'subtract':
        result = this.subtract(value || 0);
        break;
      case 'multiply':
        result = this.multiply(value || 1);
        break;
      case 'divide':
        result = this.divide(value || 1);
        break;
      case 'clear':
        this.clear();
        result = 0;
        break;
      case 'store':
        if (variable && value !== undefined) {
          this.store(variable, value);
          result = value;
        }
        break;
      case 'retrieve':
        if (variable) {
          result = this.retrieve(variable);
        }
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
    
    this.setOutput(outputs, 'result', result);
    this.setOutput(outputs, 'state', Object.fromEntries(this.state));
    
    return outputs;
  }

  private add(value: number): number {
    const current = this.state.get('accumulator') || 0;
    const result = current + value;
    this.state.set('accumulator', result);
    return result;
  }

  private subtract(value: number): number {
    const current = this.state.get('accumulator') || 0;
    const result = current - value;
    this.state.set('accumulator', result);
    return result;
  }

  private multiply(value: number): number {
    const current = this.state.get('accumulator') || 1;
    const result = current * value;
    this.state.set('accumulator', result);
    return result;
  }

  private divide(value: number): number {
    if (value === 0) {
      throw new Error('Division by zero');
    }
    const current = this.state.get('accumulator') || 1;
    const result = current / value;
    this.state.set('accumulator', result);
    return result;
  }

  private store(name: string, value: number): void {
    this.state.set(name, value);
  }

  private retrieve(name: string): number {
    return this.state.get(name) || 0;
  }

  private clear(): void {
    this.state.clear();
  }
}

/**
 * Counter class node - demonstrates OOP with encapsulation
 */
export class CounterNode extends BaseNode {
  private count: number = 0;
  private step: number = 1;

  constructor() {
    super({
      name: 'Counter',
      description: 'Object-oriented counter with encapsulation',
      inputs: [
        {
          id: 'action',
          name: 'Action',
          dataType: DataTypes.STRING,
          required: true,
          description: 'Action: increment, decrement, reset, setStep'
        },
        {
          id: 'value',
          name: 'Value',
          dataType: DataTypes.NUMBER,
          required: false,
          description: 'Value for setStep action'
        }
      ],
      outputs: [
        {
          id: 'count',
          name: 'Count',
          dataType: DataTypes.NUMBER,
          description: 'Current count value'
        },
        {
          id: 'step',
          name: 'Step',
          dataType: DataTypes.NUMBER,
          description: 'Current step value'
        }
      ]
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, any>> {
    const outputs = new Map<PortId, any>();
    
    const action = this.getInput<string>(context, 'action');
    const value = this.getInput<number>(context, 'value');
    
    switch (action) {
      case 'increment':
        this.increment();
        break;
      case 'decrement':
        this.decrement();
        break;
      case 'reset':
        this.reset();
        break;
      case 'setStep':
        if (value !== undefined) {
          this.setStep(value);
        }
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    this.setOutput(outputs, 'count', this.count);
    this.setOutput(outputs, 'step', this.step);
    
    return outputs;
  }

  private increment(): void {
    this.count += this.step;
  }

  private decrement(): void {
    this.count -= this.step;
  }

  private reset(): void {
    this.count = 0;
  }

  private setStep(step: number): void {
    this.step = step;
  }
}

/**
 * Bank Account node - demonstrates OOP with complex state management
 */
export class BankAccountNode extends BaseNode {
  private balance: number = 0;
  private transactions: Array<{type: string, amount: number, timestamp: Date}> = [];

  constructor() {
    super({
      name: 'Bank Account',
      description: 'Object-oriented bank account with transaction history',
      inputs: [
        {
          id: 'action',
          name: 'Action',
          dataType: DataTypes.STRING,
          required: true,
          description: 'Action: deposit, withdraw, balance, history'
        },
        {
          id: 'amount',
          name: 'Amount',
          dataType: DataTypes.NUMBER,
          required: false,
          description: 'Amount for deposit/withdraw'
        }
      ],
      outputs: [
        {
          id: 'balance',
          name: 'Balance',
          dataType: DataTypes.NUMBER,
          description: 'Current account balance'
        },
        {
          id: 'transaction',
          name: 'Transaction',
          dataType: DataTypes.OBJECT,
          description: 'Last transaction details'
        },
        {
          id: 'history',
          name: 'History',
          dataType: DataTypes.ARRAY,
          description: 'Transaction history'
        }
      ]
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, any>> {
    const outputs = new Map<PortId, any>();
    
    const action = this.getInput<string>(context, 'action');
    const amount = this.getInput<number>(context, 'amount');
    
    let transaction: any = null;
    
    switch (action) {
      case 'deposit':
        if (amount === undefined || amount <= 0) {
          throw new Error('Deposit amount must be positive');
        }
        transaction = this.deposit(amount);
        break;
      case 'withdraw':
        if (amount === undefined || amount <= 0) {
          throw new Error('Withdrawal amount must be positive');
        }
        transaction = this.withdraw(amount);
        break;
      case 'balance':
        // Just return current balance
        break;
      case 'history':
        // Return transaction history
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    this.setOutput(outputs, 'balance', this.balance);
    this.setOutput(outputs, 'transaction', transaction);
    this.setOutput(outputs, 'history', this.transactions);
    
    return outputs;
  }

  private deposit(amount: number): {type: string, amount: number, timestamp: Date} {
    this.balance += amount;
    const transaction = {
      type: 'deposit',
      amount,
      timestamp: new Date()
    };
    this.transactions.push(transaction);
    return transaction;
  }

  private withdraw(amount: number): {type: string, amount: number, timestamp: Date} {
    if (amount > this.balance) {
      throw new Error('Insufficient funds');
    }
    this.balance -= amount;
    const transaction = {
      type: 'withdraw',
      amount,
      timestamp: new Date()
    };
    this.transactions.push(transaction);
    return transaction;
  }
}