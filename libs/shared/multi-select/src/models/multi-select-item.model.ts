export interface MultiSelectItem {
  id: string | number;
  label?: string;
  name?: string;
  disabled?: boolean;
  description?: string;
  [key: string]: unknown;
}
