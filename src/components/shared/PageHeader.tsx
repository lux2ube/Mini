interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-4 md:mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold md:text-2xl">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
}
