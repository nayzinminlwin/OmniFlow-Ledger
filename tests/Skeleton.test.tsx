import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Skeleton } from '../src/components/Skeleton';

describe('Skeleton Component', () => {
  it('should render correctly with default classes', () => {
    const { container } = render(<Skeleton />);
    const skeletonElement = container.firstChild as HTMLElement;
    
    expect(skeletonElement).toBeInTheDocument();
    expect(skeletonElement).toHaveClass('animate-pulse');
    expect(skeletonElement).toHaveClass('bg-black/5');
    expect(skeletonElement).toHaveClass('rounded-lg');
  });

  it('should append custom className correctly', () => {
    const { container } = render(<Skeleton className="w-10 h-10 custom-class" />);
    const skeletonElement = container.firstChild as HTMLElement;
    
    expect(skeletonElement).toHaveClass('w-10');
    expect(skeletonElement).toHaveClass('h-10');
    expect(skeletonElement).toHaveClass('custom-class');
    // It should still have the default classes
    expect(skeletonElement).toHaveClass('animate-pulse');
  });
});
