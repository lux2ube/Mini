interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-4 md:mb-6">
      <h1 className="text-lg font-semibold md:text-2xl">{title}</h1>
      {description && <p className="text-muted-foreground">{description}</p>}
    </div>
  );
}
