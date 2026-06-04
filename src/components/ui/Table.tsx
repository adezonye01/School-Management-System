import React from 'react';
import clsx from 'clsx';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className }) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className={clsx('min-w-full divide-y divide-gray-200 dark:divide-gray-700', className)}>
        {children}
      </table>
    </div>
  );
};

export const TableHead: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <thead className="bg-gray-50 dark:bg-gray-800">
      {children}
    </thead>
  );
};

export const TableBody: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
      {children}
    </tbody>
  );
};

export const TableRow: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => {
  return (
    <tr className={clsx('hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors', className)}>
      {children}
    </tr>
  );
};

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  isHeader?: boolean;
  className?: string;
}

export const TableCell: React.FC<TableCellProps> = ({ 
  children, 
  isHeader = false,
  className,
  ...props
}) => {
  const Component = isHeader ? 'th' : 'td';
  
  return (
    <Component
      className={clsx(
        'px-4 py-3 text-sm',
        isHeader
          ? 'font-semibold text-gray-700 dark:text-gray-300 text-start'
          : 'text-gray-900 dark:text-gray-100',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};
