import React from 'react';

export default function CediSign({ className, size, style, ...props }) {
  const computedStyle = { ...style };
  if (size) computedStyle.fontSize = size;
  return (
    <span className={className} style={computedStyle} {...props}>
      ₵
    </span>
  );
}
