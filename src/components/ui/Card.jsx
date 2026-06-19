export default function Card({ 
  children, 
  className = '', 
  hoverable = true,
  onClick 
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-[24px] border-[3px] border-brand-primary bg-white p-6 transition-all duration-200 shadow-[4px_4px_0_0_#6D001F] ${
        hoverable ? 'hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#6D001F]' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
