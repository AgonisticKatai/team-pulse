import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'

/**
 * Button Component Stories
 *
 * The Button component is the foundation of interactive elements in the design system.
 * Built with class-variance-authority for type-safe variants and Radix UI for accessibility.
 *
 * ## Features
 * - Multiple variants (default, destructive, outline, secondary, ghost, link)
 * - Size options (sm, default, lg, icon variants)
 * - Full keyboard navigation support
 * - ARIA attributes for screen readers
 * - Focus visible states
 * - Disabled states with proper semantics
 */
const meta = {
  argTypes: {
    asChild: {
      control: 'boolean',
      description: 'Render as a different element (using Radix UI Slot)',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    size: {
      control: 'select',
      description: 'The size of the button',
      options: ['sm', 'default', 'lg', 'icon', 'icon-sm', 'icon-lg'],
      table: {
        defaultValue: { summary: 'default' },
      },
    },
    variant: {
      control: 'select',
      description: 'The visual style variant of the button',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      table: {
        defaultValue: { summary: 'default' },
      },
    },
  },
  component: Button,
  parameters: {
    docs: {
      description: {
        component: 'A versatile button component with multiple variants and sizes, built with accessibility in mind.',
      },
    },
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'UI/Button',
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default button - Primary action
 */
export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'default',
  },
}

/**
 * Destructive button - For dangerous actions (delete, remove, etc.)
 */
export const Destructive: Story = {
  args: {
    children: 'Delete',
    variant: 'destructive',
  },
}

/**
 * Outline button - Secondary actions
 */
export const Outline: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
  },
}

/**
 * Secondary button - Alternative actions
 */
export const Secondary: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
  },
}

/**
 * Ghost button - Subtle actions
 */
export const Ghost: Story = {
  args: {
    children: 'Ghost',
    variant: 'ghost',
  },
}

/**
 * Link button - Navigation or external links
 */
export const Link: Story = {
  args: {
    children: 'Link',
    variant: 'link',
  },
}

/**
 * Small button
 */
export const Small: Story = {
  args: {
    children: 'Small',
    size: 'sm',
  },
}

/**
 * Large button
 */
export const Large: Story = {
  args: {
    children: 'Large',
    size: 'lg',
  },
}

/**
 * Icon button - Square button for icons
 */
export const Icon: Story = {
  args: {
    'aria-label': 'Launch',
    children: '🚀',
    size: 'icon',
  },
}

/**
 * Disabled state - All interactions disabled
 */
export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
}

/**
 * With Icon - Button with leading icon
 */
export const WithIcon: Story = {
  args: {
    children: (
      <>
        <svg
          aria-hidden="true"
          fill="none"
          height="16"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Arrow right icon</title>
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
        Continue
      </>
    ),
  },
}

/**
 * All Variants - Visual comparison of all variants
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button variant="default">Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
    </div>
  ),
}

/**
 * All Sizes - Visual comparison of all sizes
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">🚀</Button>
    </div>
  ),
}
