/**
 * UI Definition Types
 * 
 * Types for WYSIWYG UI Builder - Phase 1
 * Defines the schema for HTML-based UI/forms that can be used by interactive nodes
 */

/**
 * Supported UI component types
 */
export type UIComponentType = 'input' | 'button' | 'label' | 'textarea' | 'select' | 'checkbox' | 'radio';

/**
 * Base properties for all UI components
 */
export interface UIComponentBase {
  id: string;
  type: UIComponentType;
  name: string; // Field name for form data collection
  label?: string; // Display label
  required?: boolean;
  placeholder?: string;
}

/**
 * Text input component
 */
export interface TextInputComponent extends UIComponentBase {
  type: 'input';
  inputType?: 'text' | 'email' | 'number' | 'password' | 'tel' | 'url';
  defaultValue?: string;
}

/**
 * Textarea component
 */
export interface TextareaComponent extends UIComponentBase {
  type: 'textarea';
  rows?: number;
  defaultValue?: string;
}

/**
 * Button component
 */
export interface ButtonComponent extends UIComponentBase {
  type: 'button';
  buttonType?: 'button' | 'submit' | 'reset';
  text: string;
  onClick?: string; // Optional action identifier
}

/**
 * Label component
 */
export interface LabelComponent extends UIComponentBase {
  type: 'label';
  text: string;
  htmlFor?: string; // ID of associated input
}

/**
 * Select/Dropdown component
 */
export interface SelectComponent extends UIComponentBase {
  type: 'select';
  options: Array<{ value: string; label: string }>;
  defaultValue?: string;
}

/**
 * Checkbox component
 */
export interface CheckboxComponent extends UIComponentBase {
  type: 'checkbox';
  checked?: boolean;
  value?: string;
}

/**
 * Radio button component
 */
export interface RadioComponent extends UIComponentBase {
  type: 'radio';
  value: string;
  checked?: boolean;
  groupName: string; // Radio buttons with same groupName are grouped
}

/**
 * Union type for all UI components
 */
export type UIComponent =
  | TextInputComponent
  | TextareaComponent
  | ButtonComponent
  | LabelComponent
  | SelectComponent
  | CheckboxComponent
  | RadioComponent;

/**
 * Layout configuration (simple for Phase 1)
 */
export interface LayoutConfig {
  direction?: 'column' | 'row'; // Default: column
  gap?: number; // Spacing between components in pixels
  padding?: number; // Container padding in pixels
}

/**
 * UI Definition
 * Complete definition of a UI form that can be rendered and used by interactive nodes
 */
export interface UIDefinition {
  id: string;
  name: string;
  description?: string;
  version: string;
  components: UIComponent[];
  layout?: LayoutConfig;
  createdAt: string;
  updatedAt: string;
}

/**
 * Form data collected from UI
 * Maps component names to their values
 */
export type FormData = Record<string, unknown>;

/**
 * UI Renderer props
 */
export interface UIRendererProps {
  definition: UIDefinition;
  onSubmit?: (data: FormData) => void;
  onChange?: (data: FormData) => void;
  initialData?: FormData;
  disabled?: boolean;
}

