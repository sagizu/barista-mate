import { cn } from "@/lib/utils";

export const LungoIcon = ({ className }: { className?: string }) => (
<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn(className)}>
  <path d="M18 8C18 8 20 5 20 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  <path d="M24 8C24 8 26 5 26 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  <path d="M30 8C30 8 32 5 32 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  <path d="M12 14H36C37.1046 14 38 14.8954 38 16V24C38 30.6274 32.6274 36 26 36H22C15.3726 36 10 30.6274 10 24V16C10 14.8954 10.8954 14 12 14Z" stroke="currentColor" strokeWidth="2"/>
  <path d="M38 18H41C43.2091 18 45 19.7909 45 22V26C45 28.2091 43.2091 30 41 30H38" stroke="currentColor" strokeWidth="2"/>
  <path d="M12 17H36V24C36 29.5228 31.5228 34 26 34H22C16.4772 34 12 29.5228 12 24V17Z" fill="#6F4E37"/>
</svg>
);
