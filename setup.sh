#!/bin/bash

# Install regular dependencies
npm install next@14.0.0 react@18.2.0 react-dom@18.2.0 typescript@5.0.0 @types/node@20.0.0 @types/react@18.2.0 @types/react-dom@18.2.0 tailwind-merge class-variance-authority clsx next-themes lucide-react @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-aspect-ratio @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-collapsible @radix-ui/react-context-menu @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-hover-card @radix-ui/react-label @radix-ui/react-menubar @radix-ui/react-navigation-menu @radix-ui/react-popover @radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slider @radix-ui/react-slot @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-toggle @radix-ui/react-toggle-group @radix-ui/react-tooltip react-hook-form @hookform/resolvers zod cmdk date-fns react-day-picker sonner embla-carousel-react embla-carousel-autoplay react-resizable-panels

# Install dev dependencies
npm install --save-dev tailwindcss@3.3.0 postcss@8.4.31 autoprefixer@10.4.14 tailwindcss-animate

echo "All dependencies have been installed!"
echo "Run 'npm run dev' to start the development server." 