type InlineErrorProps = {
  message: string;
  className?: string;
};

export default function InlineError({ message, className = "" }: InlineErrorProps) {
  if (!message) return null;

  return (
    <p className={`text-red-400 text-xs mt-1 ${className}`}>
      {message}
    </p>
  );
}

