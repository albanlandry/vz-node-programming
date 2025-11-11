/**
 * Template Service
 * 
 * Manages UI templates for quick creation
 * Phase 8: UI Templates
 */

import type { UIDefinition } from '../src/types/uiDefinition';

/**
 * Template metadata
 */
export interface TemplateMetadata {
  /**
   * Template ID
   */
  id: string;
  
  /**
   * Template name
   */
  name: string;
  
  /**
   * Template description
   */
  description: string;
  
  /**
   * Template category
   */
  category: 'form' | 'survey' | 'contact' | 'login' | 'registration' | 'custom';
  
  /**
   * Template tags
   */
  tags: string[];
  
  /**
   * Preview image URL (optional)
   */
  previewImage?: string;
  
  /**
   * Author
   */
  author?: string;
}

/**
 * UI Template
 */
export interface UITemplate {
  /**
   * Template metadata
   */
  metadata: TemplateMetadata;
  
  /**
   * UI Definition
   */
  definition: UIDefinition;
}

/**
 * Pre-built templates
 */
const builtInTemplates: UITemplate[] = [
  {
    metadata: {
      id: 'contact-form',
      name: 'Contact Form',
      description: 'A simple contact form with name, email, and message fields',
      category: 'contact',
      tags: ['contact', 'form', 'email'],
    },
    definition: {
      id: 'template-contact-form',
      name: 'Contact Form',
      description: 'A simple contact form',
      version: '1.0.0',
      components: [
        {
          id: 'name-input',
          type: 'input',
          name: 'name',
          label: 'Name',
          placeholder: 'Enter your name',
          required: true,
        },
        {
          id: 'email-input',
          type: 'input',
          name: 'email',
          label: 'Email',
          placeholder: 'Enter your email',
          inputType: 'email',
          required: true,
        },
        {
          id: 'message-textarea',
          type: 'textarea',
          name: 'message',
          label: 'Message',
          placeholder: 'Enter your message',
          required: true,
        },
        {
          id: 'submit-button',
          type: 'button',
          name: 'submit',
          text: 'Submit',
          buttonType: 'submit',
        },
      ],
      layout: {
        direction: 'column',
        gap: 16,
        padding: 16,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  {
    metadata: {
      id: 'login-form',
      name: 'Login Form',
      description: 'A login form with email and password fields',
      category: 'login',
      tags: ['login', 'authentication', 'form'],
    },
    definition: {
      id: 'template-login-form',
      name: 'Login Form',
      description: 'A login form',
      version: '1.0.0',
      components: [
        {
          id: 'email-input',
          type: 'input',
          name: 'email',
          label: 'Email',
          placeholder: 'Enter your email',
          inputType: 'email',
          required: true,
        },
        {
          id: 'password-input',
          type: 'input',
          name: 'password',
          label: 'Password',
          placeholder: 'Enter your password',
          inputType: 'password',
          required: true,
        },
        {
          id: 'submit-button',
          type: 'button',
          name: 'submit',
          text: 'Login',
          buttonType: 'submit',
        },
      ],
      layout: {
        direction: 'column',
        gap: 16,
        padding: 16,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  {
    metadata: {
      id: 'registration-form',
      name: 'Registration Form',
      description: 'A registration form with multiple fields',
      category: 'registration',
      tags: ['registration', 'signup', 'form'],
    },
    definition: {
      id: 'template-registration-form',
      name: 'Registration Form',
      description: 'A registration form',
      version: '1.0.0',
      components: [
        {
          id: 'name-input',
          type: 'input',
          name: 'name',
          label: 'Full Name',
          placeholder: 'Enter your full name',
          required: true,
        },
        {
          id: 'email-input',
          type: 'input',
          name: 'email',
          label: 'Email',
          placeholder: 'Enter your email',
          inputType: 'email',
          required: true,
        },
        {
          id: 'password-input',
          type: 'input',
          name: 'password',
          label: 'Password',
          placeholder: 'Enter your password',
          inputType: 'password',
          required: true,
        },
        {
          id: 'confirm-password-input',
          type: 'input',
          name: 'confirmPassword',
          label: 'Confirm Password',
          placeholder: 'Confirm your password',
          inputType: 'password',
          required: true,
        },
        {
          id: 'submit-button',
          type: 'button',
          name: 'submit',
          text: 'Register',
          buttonType: 'submit',
        },
      ],
      layout: {
        direction: 'column',
        gap: 16,
        padding: 16,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
];

/**
 * Get all templates
 */
export function getAllTemplates(): UITemplate[] {
  return builtInTemplates;
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: TemplateMetadata['category']): UITemplate[] {
  return builtInTemplates.filter((t) => t.metadata.category === category);
}

/**
 * Get template by ID
 */
export function getTemplate(id: string): UITemplate | undefined {
  return builtInTemplates.find((t) => t.metadata.id === id);
}

/**
 * Generate a unique ID (browser-compatible)
 */
function generateId(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Create UI definition from template
 */
export function createFromTemplate(templateId: string, name?: string): UIDefinition | null {
  const template = getTemplate(templateId);
  if (!template) return null;

  const newDefinition: UIDefinition = {
    ...template.definition,
    id: generateId(),
    name: name || template.definition.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Generate new IDs for all components
  newDefinition.components = newDefinition.components.map((comp) => ({
    ...comp,
    id: generateId(),
  }));

  return newDefinition;
}

