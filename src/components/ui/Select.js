'use client';

import * as RadixSelect from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';
import styles from './Select.module.css';

/**
 * Accessible styled Select built on Radix UI (the same primitive shadcn uses).
 *
 * Props mirror a controlled <select>:
 *   value       – current value string
 *   onValueChange – callback(newValue)
 *   placeholder – grey placeholder text shown when nothing is selected
 *   options     – [{ value: string, label: string }]
 *   className   – optional extra class on the trigger
 */
export function Select({ value, onValueChange, placeholder = 'Select…', options = [], className = '' }) {
  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange}>
      <RadixSelect.Trigger className={`${styles.trigger} ${className}`} aria-label={placeholder}>
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon className={styles.icon}>
          <ChevronDown size={16} />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content className={styles.content} position="popper" sideOffset={4}>
          <RadixSelect.Viewport className={styles.viewport}>
            {options.map((opt) => (
              <RadixSelect.Item key={opt.value} value={opt.value} className={styles.item}>
                <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className={styles.itemIndicator}>
                  <Check size={14} />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
